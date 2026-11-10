"""Persistent cache of investment payback (ROI) results.

For every project .storage/utility_costs.roi keeps:

* fp      – fingerprint of the inputs (project, its expenses, tariffs of the
            media its rules use, current month),
* closed  – unrounded history of all finished months,
* profiles – seasonal profiles used for estimates,
* result  – the last full result shown in the panel.

Opening the tab returns the stored result immediately. While the fingerprint
is unchanged only the current month is recalculated (in the background, at
most once an hour, statistics fetched for the current month only). A change
of the project, its expenses or tariffs – or the start of a new month –
triggers one full recalculation.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import roi
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CACHE_KEY = f"{DOMAIN}.roi"
CACHE_VERSION = 1
CALC_VERSION = 3  # bump when roi.* changes its output
CURRENT_MAX_AGE = timedelta(hours=1)


def fingerprint(data: dict, project: dict, today: date) -> str:
    media = {r.get("medium") for r in project.get("rules") or []}
    media |= {r.get("el_medium") for r in project.get("rules") or [] if r.get("el_medium")}
    rel = {
        "v": CALC_VERSION,
        "month": f"{today.year:04d}-{today.month:02d}",
        "project": project,
        "investments": roi.project_investments(data, project),
        "tariffs": [t for t in data.get("tariffs", []) if t.get("medium") in media],
    }
    raw = json.dumps(rel, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha1(raw.encode()).hexdigest()


def _pseudo_media(project: dict) -> list[dict]:
    """Rules with meters in the shape DailyStats expects for media."""
    return [
        {"id": r["id"], "statistics": {"all": r.get("sources") or []}}
        for r in project.get("rules") or []
        if r.get("type", "qty") in ("qty", "heatpump") and r.get("sources") and r.get("id")
    ]


class RoiCache:
    def __init__(self, hass: HomeAssistant, store, stats) -> None:
        self.hass = hass
        self.store = store
        self.stats = stats
        self._file: Store[dict[str, Any]] = Store(hass, CACHE_VERSION, CACHE_KEY)
        self._p: dict[str, dict[str, Any]] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._pending: asyncio.TimerHandle | None = None

    async def async_load(self) -> None:
        stored = await self._file.async_load() or {}
        self._p = stored.get("projects", {})

    def _save(self) -> None:
        self._file.async_delay_save(lambda: {"projects": self._p}, 5)

    def _lock(self, pid: str) -> asyncio.Lock:
        return self._locks.setdefault(pid, asyncio.Lock())

    def _project(self, pid: str) -> dict | None:
        return next((p for p in self.store.data.get("projects") or [] if p.get("id") == pid), None)

    def _meta(self, pid: str, cached: bool) -> dict[str, Any]:
        return {"computed_at": (self._p.get(pid) or {}).get("at"), "cached": cached}

    def _stale(self, pid: str) -> bool:
        at = (self._p.get(pid) or {}).get("at")
        return not at or dt_util.utcnow() - datetime.fromisoformat(at) > CURRENT_MAX_AGE

    async def _daily(self, project: dict, start: date, end: date) -> dict:
        if start > end:
            return {}
        pseudo = _pseudo_media(project)
        daily = dict(await self.stats.async_daily(pseudo, start, end)) if pseudo else {}
        for r in project.get("rules") or []:
            if r.get("type") == "heatpump" and r.get("id") and r.get("temp_ids"):
                temps = await self.stats.async_daily_mean(list(r["temp_ids"]), start, end)
                daily[r["id"]] = {**(daily.get(r["id"]) or {}), "temp": temps}
        return daily

    async def _full(self, project: dict, fp: str) -> dict[str, Any]:
        data = self.store.data
        today = dt_util.now().date()
        invs = roi.project_investments(data, project)
        start = roi.project_start(project, invs, today)
        first = today.replace(day=1)
        daily = await self._daily(project, start, today)

        def work() -> tuple[dict, dict, dict]:
            profiles = roi.profiles_for(project, daily, start, today)
            closed_end = first - timedelta(days=1)
            closed = (roi.history(project, data["tariffs"], daily, start, closed_end, profiles)
                      if start <= closed_end else roi.empty_history(project))
            cur = roi.history(project, data["tariffs"], daily, max(start, first), today, profiles)
            result = roi.finalize(project, invs, roi.merge_history(closed, cur), today)
            return profiles, closed, result

        profiles, closed, result = await self.hass.async_add_executor_job(work)
        self._p[project["id"]] = {"fp": fp, "at": dt_util.utcnow().isoformat(), "closed": closed,
                                  "profiles": profiles, "result": result}
        self._save()
        return result

    async def _current(self, project: dict, entry: dict) -> dict[str, Any]:
        """Recalculate only the current month on top of the stored history."""
        data = self.store.data
        today = dt_util.now().date()
        invs = roi.project_investments(data, project)
        start = max(roi.project_start(project, invs, today), today.replace(day=1))
        self.stats.invalidate()
        daily = await self._daily(project, start, today)

        def work() -> dict:
            cur = roi.history(project, data["tariffs"], daily, start, today, entry["profiles"])
            return roi.finalize(project, invs, roi.merge_history(entry["closed"], cur), today)

        result = await self.hass.async_add_executor_job(work)
        entry.update(at=dt_util.utcnow().isoformat(), result=result)
        self._save()
        return result

    async def async_get(self, pid: str, force: bool = False) -> dict[str, Any] | None:
        project = self._project(pid)
        if project is None:
            return None
        fp = fingerprint(self.store.data, project, dt_util.now().date())
        entry = self._p.get(pid)
        if not force and entry and entry.get("fp") == fp:
            if self._stale(pid):
                self.hass.async_create_background_task(self.async_refresh(pid), f"{DOMAIN}_roi_{pid}")
            return {**entry["result"], "_meta": self._meta(pid, True)}
        async with self._lock(pid):
            entry = self._p.get(pid)
            if not force and entry and entry.get("fp") == fp:
                return {**entry["result"], "_meta": self._meta(pid, True)}
            if force:
                self.stats.invalidate()
            result = await self._full(project, fp)
        return {**result, "_meta": self._meta(pid, False)}

    async def async_refresh(self, pid: str) -> None:
        project = self._project(pid)
        lock = self._lock(pid)
        if project is None or lock.locked():
            return
        async with lock:
            try:
                fp = fingerprint(self.store.data, project, dt_util.now().date())
                entry = self._p.get(pid)
                if entry and entry.get("fp") == fp and "closed" in entry:
                    await self._current(project, entry)
                else:
                    await self._full(project, fp)
            except Exception:  # noqa: BLE001 - background job must not crash
                _LOGGER.exception("ROI refresh for %s failed", pid)

    async def async_refresh_all(self, *_: Any) -> None:
        ids = {p.get("id") for p in self.store.data.get("projects") or [] if p.get("id")}
        for pid in [k for k in self._p if k not in ids]:
            self._p.pop(pid, None)
            self._save()
        for pid in sorted(ids):
            await self.async_refresh(pid)

    async def async_refresh_changed(self) -> None:
        today = dt_util.now().date()
        for project in self.store.data.get("projects") or []:
            pid = project.get("id")
            if not pid:
                continue
            entry = self._p.get(pid)
            if not entry or entry.get("fp") != fingerprint(self.store.data, project, today):
                await self.async_refresh(pid)

    @callback
    def schedule_changed(self, *_: Any) -> None:
        if self._pending:
            self._pending.cancel()

        def _run() -> None:
            self._pending = None
            self.hass.async_create_background_task(self.async_refresh_changed(), f"{DOMAIN}_roi_changed")

        self._pending = self.hass.loop.call_later(4, _run)
