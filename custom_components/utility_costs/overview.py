"""Current month / year-to-date / year forecast from cached summaries (pure)."""

from __future__ import annotations

from datetime import date
from typing import Any

from .calc import days_in_month


def _cost(month: dict, medium: str | None = None) -> float:
    media = month.get("media") or {}
    if medium is not None:
        return float((media.get(medium) or {}).get("cost") or 0)
    return sum(float(x.get("cost") or 0) for x in media.values())


def _complete(month: dict) -> bool:
    media = [x for x in (month.get("media") or {}).values() if x.get("days")]
    return bool(media) and all(x.get("data_days", 0) >= x.get("days", 0) for x in media)


def overview(cur: dict | None, prev: dict | None, today: date) -> dict[str, Any] | None:
    """Cost of the current month, year to date and a forecast to year end.

    The current month is extrapolated from the days elapsed. Each remaining
    month uses the same month of the previous year when it is known, else the
    average of this year's complete months.
    """
    if not cur:
        return None
    mk = f"{today.year:04d}-{today.month:02d}"
    months = {m["month"]: m for m in cur.get("months") or []}
    prev_months = {m["month"][5:]: m for m in (prev or {}).get("months") or []}
    media_ids = sorted({k for m in months.values() for k in (m.get("media") or {})})
    keys: list[str | None] = [None, *media_ids]

    def calc(medium: str | None) -> dict[str, float]:
        cur_month = months.get(mk)
        month_cost = _cost(cur_month, medium) if cur_month else 0.0
        elapsed = today.day
        month_fc = month_cost * days_in_month(today) / elapsed if elapsed else month_cost
        done = [m for k, m in months.items() if k < mk]
        ytd_closed = sum(_cost(m, medium) for m in done)
        full = [_cost(m, medium) for m in done if _complete(m)]
        avg = sum(full) / len(full) if full else month_fc
        rest = 0.0
        for mo in range(today.month + 1, 13):
            pm = prev_months.get(f"{mo:02d}")
            rest += _cost(pm, medium) if pm and _complete(pm) else avg
        prev_ytd = sum(_cost(m, medium) for k, m in prev_months.items() if k < mk[5:])
        prev_ytd += _cost(prev_months[mk[5:]], medium) * elapsed / days_in_month(today) if mk[5:] in prev_months else 0
        prev_total = sum(_cost(m, medium) for m in prev_months.values()) if prev else None
        return {
            "month_cost": round(month_cost, 2),
            "month_forecast": round(month_fc, 2),
            "ytd": round(ytd_closed + month_cost, 2),
            "year_forecast": round(ytd_closed + month_fc + rest, 2),
            "prev_ytd": round(prev_ytd, 2) if prev else None,
            "prev_year_total": round(prev_total, 2) if prev_total is not None else None,
        }

    total = calc(None)
    return {
        "month": mk,
        "year": today.year,
        **total,
        "media": {m: calc(m) for m in keys if m},
    }
