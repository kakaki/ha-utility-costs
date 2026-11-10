"""Persistent, fingerprinted cache of year summaries.

Every year summary is stored in .storage/utility_costs.summary together
with a fingerprint of the data it depends on (invoices, tariffs,
corrections and instalments touching that year, media settings).

* Unchanged fingerprint -> the stored result is returned instantly.
* Store changes -> affected years are recomputed in the background.
* Current year -> refreshed in the background every hour (meters keep
  counting), so the current month stays up to date.
* force=True (panel button) -> recomputed from scratch.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import calc
from .const import DOMAIN, SIGNAL_SUMMARY
from .overview import overview

_LOGGER = logging.getLogger(__name__)

CACHE_KEY = f"{DOMAIN}.summary"
CACHE_VERSION = 1
CALC_VERSION = 2  # bump when calc.summary changes its output
CURRENT_MAX_AGE = timedelta(hours=1)


def _overlaps(a: date | None, b: date | None, start: date, end: date) -> bool:
    a = a or date.min
    b = b or date.max
    return a <= end and b >= start


def year_range(data: dict, year: int) -> tuple[date, date]:
    """Full range of days a year summary looks at (not cut at today)."""
    start, end = date(year, 1, 1), date(year, 12, 31)
    for inv in data.get("invoices", []):
        if calc.invoice_year(inv) == year:
            a, b = calc.to_date(inv.get("period_from")), calc.to_date(inv.get("period_to"))
            if a and a < start:
                start = a
            if b and b > end:
                end = b
    return start, end


def fingerprint(data: dict, year: int) -> str:
    start, end = year_range(data, year)
    settings = data.get("settings", {})
    rel = {
        "v": CALC_VERSION,
        "media": settings.get("media", []),
        "tariffs": [t for t in data.get("tariffs", [])
                    if _overlaps(calc.to_date(t.get("valid_from")), calc.to_date(t.get("valid_to")), start, end)],
        "invoices": [i for i in data.get("invoices", [])
                     if calc.invoice_year(i) == year
                     or _overlaps(calc.to_date(i.get("period_from")), calc.to_date(i.get("period_to")), start, end)],
        "corrections": [c for c in data.get("corrections", [])
                        if str(c.get("month", ""))[:7] >= start.isoformat()[:7]
                        and str(c.get("month", ""))[:7] <= end.isoformat()[:7]],
        "installments": [i for i in data.get("installments", [])
                         if year in {d.year for d in (calc.to_date(i.get("period_from")),
                                                       calc.to_date(i.get("period_to")),
                                                       calc.to_date(i.get("due_date"))) if d}],
    }
    raw = json.dumps(rel, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha1(raw.encode()).hexdigest()


class SummaryCache:
    def __init__(self, hass: HomeAssistant, store, stats) -> None:
        self.hass = hass
        self.store = store
        self.stats = stats
        self._file: Store[dict[str, Any]] = Store(hass, CACHE_VERSION, CACHE_KEY)
        self._years: dict[str, dict[str, Any]] = {}
        self._locks: dict[int, asyncio.Lock] = {}
        self._pending: asyncio.TimerHandle | None = None

    async def async_load(self) -> None:
        stored = await self._file.async_load() or {}
        self._years = stored.get("years", {})

    def _save(self) -> None:
        self._file.async_delay_save(lambda: {"years": self._years}, 5)

    def _lock(self, year: int) -> asyncio.Lock:
        return self._locks.setdefault(year, asyncio.Lock())

    async def _compute(self, year: int, fp: str) -> dict[str, Any]:
        data = self.store.data
        today = dt_util.now().date()
        start, end = calc.data_range(data, year, today)
        daily = await self.stats.async_daily(self.store.media, start, end)
        result = await self.hass.async_add_executor_job(calc.summary, data, daily, year, today)
        self._years[str(year)] = {"fp": fp, "at": dt_util.utcnow().isoformat(), "result": result}
        self._save()
        async_dispatcher_send(self.hass, SIGNAL_SUMMARY, year)
        return result

    def cached(self, year: int) -> dict[str, Any] | None:
        return (self._years.get(str(year)) or {}).get("result")

    def overview(self) -> dict[str, Any] | None:
        today = dt_util.now().date()
        res = overview(self.cached(today.year), self.cached(today.year - 1), today)
        if res is not None:
            res["computed_at"] = (self._years.get(str(today.year)) or {}).get("at")
        return res

    def _meta(self, year: int, cached: bool) -> dict[str, Any]:
        entry = self._years.get(str(year)) or {}
        return {"computed_at": entry.get("at"), "cached": cached}

    def _stale(self, year: int) -> bool:
        if year != dt_util.now().year:
            return False
        at = (self._years.get(str(year)) or {}).get("at")
        if not at:
            return True
        return dt_util.utcnow() - datetime.fromisoformat(at) > CURRENT_MAX_AGE

    async def async_get(self, year: int, force: bool = False) -> dict[str, Any]:
        fp = fingerprint(self.store.data, year)
        entry = self._years.get(str(year))
        if not force and entry and entry.get("fp") == fp:
            if self._stale(year):
                self.hass.async_create_background_task(self.async_refresh(year), f"{DOMAIN}_refresh_{year}")
            return {**entry["result"], "_meta": self._meta(year, True)}
        async with self._lock(year):
            if force:
                self.stats.invalidate()
            else:
                entry = self._years.get(str(year))
                if entry and entry.get("fp") == fp:  # computed while we waited
                    return {**entry["result"], "_meta": self._meta(year, True)}
            result = await self._compute(year, fp)
        return {**result, "_meta": self._meta(year, False)}

    async def async_refresh(self, year: int) -> None:
        lock = self._lock(year)
        if lock.locked():
            return
        async with lock:
            try:
                await self._compute(year, fingerprint(self.store.data, year))
            except Exception:  # noqa: BLE001 - background job must not crash
                _LOGGER.exception("Summary refresh for %s failed", year)

    async def async_refresh_changed(self) -> None:
        """Recompute cached years whose inputs changed, plus the current year."""
        now = dt_util.now().year
        years = {int(y) for y in self._years} | {now, now - 1}
        for year in sorted(years):
            entry = self._years.get(str(year))
            if not entry or entry.get("fp") != fingerprint(self.store.data, year):
                await self.async_refresh(year)

    @callback
    def schedule_changed(self) -> None:
        """Debounced background refresh after store changes."""
        if self._pending:
            self._pending.cancel()

        def _run() -> None:
            self._pending = None
            self.hass.async_create_background_task(self.async_refresh_changed(), f"{DOMAIN}_refresh_changed")

        self._pending = self.hass.loop.call_later(3, _run)

    async def async_refresh_current(self, *_: Any) -> None:
        self.stats.invalidate()
        await self.async_refresh(dt_util.now().year)
