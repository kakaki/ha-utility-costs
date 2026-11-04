"""Daily consumption from the recorder's long-term statistics."""

from __future__ import annotations

import time as _time
from datetime import date, datetime, time, timedelta
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.statistics import statistics_during_period
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .calc import to_date


def _sources(medium: dict[str, Any], zone: str) -> list[dict[str, Any]]:
    """Sources of a zone, sorted by their start date.

    A zone maps to a list of {"from": date|None, "ids": [statistic ids],
    "factor": number}; the source with the latest "from" not after a day
    is used for that day, so a meter can be replaced without losing history.
    """
    raw = (medium.get("statistics") or {}).get(zone) or []
    if isinstance(raw, dict):
        raw = [raw]
    out = []
    for src in raw:
        ids = src.get("ids") or []
        if isinstance(ids, str):
            ids = [ids]
        out.append({
            "from": to_date(src.get("from")) or date.min,
            "ids": list(ids),
            "factor": float(src.get("factor") or 1),
        })
    return sorted(out, key=lambda s: s["from"])


class DailyStats:
    """Fetches and caches per-day statistics for configured media."""

    def __init__(self, hass: HomeAssistant, ttl: int) -> None:
        self.hass = hass
        self.ttl = ttl
        self._cache: dict[tuple, tuple[float, dict]] = {}

    def invalidate(self) -> None:
        self._cache.clear()

    async def async_daily(self, media: list[dict[str, Any]], start: date, end: date) -> dict:
        key = (start, end, repr([(m["id"], m.get("statistics")) for m in media]))
        hit = self._cache.get(key)
        if hit and _time.monotonic() - hit[0] < self.ttl:
            return hit[1]
        result = await self._fetch(media, start, end)
        self._cache[key] = (_time.monotonic(), result)
        return result

    async def _fetch(self, media: list[dict[str, Any]], start: date, end: date) -> dict:
        ids: set[str] = set()
        for medium in media:
            for zone in (medium.get("statistics") or {}):
                for src in _sources(medium, zone):
                    ids.update(src["ids"])
        if not ids:
            return {}
        tz = dt_util.get_default_time_zone()
        start_dt = datetime.combine(start, time.min, tz)
        end_dt = datetime.combine(end + timedelta(days=1), time.min, tz)
        stats = await get_instance(self.hass).async_add_executor_job(
            statistics_during_period,
            self.hass,
            start_dt,
            end_dt,
            ids,
            "day",
            None,
            {"change"},
        )
        per_id: dict[str, dict[str, float]] = {}
        for sid, rows in stats.items():
            bucket = per_id.setdefault(sid, {})
            for row in rows:
                st = row.get("start")
                if isinstance(st, (int, float)):
                    moment = dt_util.utc_from_timestamp(st)
                else:
                    moment = st
                day = dt_util.as_local(moment).date().isoformat()
                bucket[day] = bucket.get(day, 0.0) + float(row.get("change") or 0)

        daily: dict[str, dict[str, dict[str, float]]] = {}
        for medium in media:
            for zone in (medium.get("statistics") or {}):
                sources = _sources(medium, zone)
                if not sources:
                    continue
                out = daily.setdefault(medium["id"], {}).setdefault(zone, {})
                all_days = set()
                for src in sources:
                    for sid in src["ids"]:
                        all_days.update(per_id.get(sid, {}).keys())
                for day in all_days:
                    d = date.fromisoformat(day)
                    active = None
                    for src in sources:
                        if src["from"] <= d:
                            active = src
                    if active is None:
                        continue
                    vals = [per_id[sid][day] for sid in active["ids"] if day in per_id.get(sid, {})]
                    if vals:
                        out[day] = sum(vals) * active["factor"]
        return daily
