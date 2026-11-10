"""Cost engine for Utility Costs.

Pure functions without Home Assistant imports, so they can be unit tested.
Everything is computed per day and only then summed to months and years:
that is the only way to compare an invoice for 20.08-19.02 with meter
statistics and to apply the tariff valid on a given day.

Data shapes
-----------
daily:        {medium_id: {zone_id: {"YYYY-MM-DD": quantity}}}
corrections:  [{"medium", "month": "YYYY-MM", "zone", "qty", "reason"}]
tariffs:      [{"medium", "valid_from", "valid_to"?, "prices": {zone: price},
                "fixed_monthly", "extras": [{"name", "amount", "per": "month"|"unit"}],
                "price_basis": "unit"|"kwh", "kwh_per_unit"}]
invoices:     [{"medium", "period_from", "period_to", "issue_date"?,
                "quantities": {zone: qty}, "amount", "balance"?}]
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any


def to_date(value: str | date | None) -> date | None:
    """Parse an ISO date (or pass a date through)."""
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def days(start: date, end: date):
    """Iterate dates from start to end inclusive."""
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def days_in_month(d: date) -> int:
    return calendar.monthrange(d.year, d.month)[1]


def zone_ids(medium: dict) -> list[str]:
    zones = medium.get("zones") or [{"id": "all"}]
    return [z["id"] for z in zones]


def tariff_on(tariffs: list[dict], medium_id: str, d: date) -> dict | None:
    """Return the tariff of a medium valid on a day (latest valid_from wins)."""
    best = None
    best_from = None
    for t in tariffs:
        if t.get("medium") != medium_id:
            continue
        vf = to_date(t.get("valid_from")) or date.min
        vt = to_date(t.get("valid_to")) or date.max
        if vf <= d <= vt and (best_from is None or vf > best_from):
            best, best_from = t, vf
    return best


def price_for(tariff: dict, zone: str) -> float:
    prices = tariff.get("prices") or {}
    if zone in prices:
        return float(prices[zone] or 0)
    if "all" in prices:
        return float(prices["all"] or 0)
    return 0.0


def day_cost(tariff: dict | None, qty: dict[str, float], d: date) -> tuple[float, float]:
    """Return (variable, fixed) cost of one day."""
    if tariff is None:
        return 0.0, 0.0
    factor = 1.0
    if tariff.get("price_basis") == "kwh":
        factor = float(tariff.get("kwh_per_unit") or 1)
    variable = 0.0
    total_qty = 0.0
    for zone, q in qty.items():
        variable += q * factor * price_for(tariff, zone)
        total_qty += q
    monthly = float(tariff.get("fixed_monthly") or 0)
    for extra in tariff.get("extras") or []:
        amount = float(extra.get("amount") or 0)
        if extra.get("per") == "unit":
            variable += amount * total_qty * factor
        else:
            monthly += amount
    return variable, monthly / days_in_month(d)


def correction_per_day(corrections: list[dict]) -> dict[str, dict[str, dict[str, float]]]:
    """Spread monthly corrections evenly over the days of their month."""
    out: dict[str, dict[str, dict[str, float]]] = {}
    for c in corrections:
        try:
            y, m = (int(x) for x in str(c["month"])[:7].split("-"))
        except (KeyError, ValueError):
            continue
        n = calendar.monthrange(y, m)[1]
        per = float(c.get("qty") or 0) / n
        zone = c.get("zone") or "all"
        bucket = out.setdefault(c.get("medium", ""), {}).setdefault(zone, {})
        for day in range(1, n + 1):
            key = date(y, m, day).isoformat()
            bucket[key] = bucket.get(key, 0.0) + per
    return out


def qty_on(medium: dict, daily: dict, corr: dict, d: date) -> dict[str, float]:
    key = d.isoformat()
    mid = medium["id"]
    out = {}
    for zone in zone_ids(medium):
        q = daily.get(mid, {}).get(zone, {}).get(key, 0.0)
        q += corr.get(mid, {}).get(zone, {}).get(key, 0.0)
        out[zone] = q
    return out


def has_data(medium: dict, daily: dict, d: date) -> bool:
    key = d.isoformat()
    return any(key in daily.get(medium["id"], {}).get(z, {}) for z in zone_ids(medium))


def year_months(year: int, today: date) -> list[tuple[date, date]]:
    """Months of a year up to today (current year) or all 12 (past years)."""
    out = []
    for m in range(1, 13):
        start = date(year, m, 1)
        if start > today:
            break
        end = date(year, m, calendar.monthrange(year, m)[1])
        out.append((start, min(end, today)))
    return out


def month_summary(
    media: list[dict],
    tariffs: list[dict],
    daily: dict,
    corrections: list[dict],
    year: int,
    today: date,
) -> list[dict[str, Any]]:
    """Consumption and cost by meters, per month and medium."""
    corr = correction_per_day(corrections)
    months = []
    for start, end in year_months(year, today):
        row: dict[str, Any] = {"month": start.strftime("%Y-%m"), "media": {}}
        for medium in media:
            qty = {z: 0.0 for z in zone_ids(medium)}
            var = fix = 0.0
            data_days = 0
            for d in days(start, end):
                q = qty_on(medium, daily, corr, d)
                v, f = day_cost(tariff_on(tariffs, medium["id"], d), q, d)
                var += v
                fix += f
                for z, val in q.items():
                    qty[z] += val
                if has_data(medium, daily, d):
                    data_days += 1
            row["media"][medium["id"]] = {
                **_parts_month(medium, daily, start, end, sum(qty.values()), var),
                "qty": {z: round(v, 3) for z, v in qty.items()},
                "qty_total": round(sum(qty.values()), 3),
                "cost_variable": round(var, 2),
                "cost_fixed": round(fix, 2),
                "cost": round(var + fix, 2),
                "data_days": data_days,
                "days": (end - start).days + 1,
            }
        months.append(row)
    return months


def _parts_month(medium: dict, daily: dict, start: date, end: date, total: float, var_cost: float) -> dict:
    """Split a month of a medium into its usage parts (e.g. gas: heating / hot water).

    Parts are informational: they do not change the cost. The variable cost is
    shared in proportion to quantity; what the parts do not cover (days before
    their meters existed, corrections, other use) is reported as "rest".
    """
    parts = [p for p in medium.get("parts") or [] if p.get("id")]
    if not parts:
        return {}
    mid = medium["id"]
    out: dict[str, dict[str, float]] = {}
    covered = 0.0
    for p in parts:
        series = daily.get(mid, {}).get(f"part:{p['id']}", {})
        q = sum(max(0.0, series.get(d.isoformat(), 0.0)) for d in days(start, end))
        covered += q
        out[p["id"]] = {"qty": q}
    scale = total / covered if covered > total > 0 else 1.0
    unit_cost = var_cost / total if total > 0 else 0.0
    for v in out.values():
        v["qty"] = round(v["qty"] * scale, 3)
        v["cost"] = round(v["qty"] * unit_cost, 2)
    rest = max(0.0, total - sum(v["qty"] for v in out.values()))
    out["rest"] = {"qty": round(rest, 3), "cost": round(rest * unit_cost, 2)}
    return {"parts": out}


def invoice_year(inv: dict) -> int | None:
    d = to_date(inv.get("issue_date")) or to_date(inv.get("period_to"))
    return d.year if d else None


def invoice_check(inv: dict, media_by_id: dict, daily: dict, corr: dict, today: date) -> dict:
    """Compare an invoice with meter statistics over exactly its period."""
    medium = media_by_id.get(inv.get("medium"))
    start = to_date(inv.get("period_from"))
    end = to_date(inv.get("period_to"))
    result: dict[str, Any] = {"id": inv.get("id"), "ha_qty": {}, "ha_total": None,
                              "deviation_pct": None, "coverage": 0.0}
    if medium is None or start is None or end is None or end < start:
        return result
    end_cut = min(end, today)
    qty = {z: 0.0 for z in zone_ids(medium)}
    covered = 0
    total_days = (end - start).days + 1
    for d in days(start, end_cut):
        for z, v in qty_on(medium, daily, corr, d).items():
            qty[z] += v
        if has_data(medium, daily, d):
            covered += 1
    ha_total = sum(qty.values())
    inv_total = sum(float(v or 0) for v in (inv.get("quantities") or {}).values())
    result["ha_qty"] = {z: round(v, 3) for z, v in qty.items()}
    result["ha_total"] = round(ha_total, 3)
    result["coverage"] = round(covered / total_days, 3) if total_days else 0.0
    if ha_total > 0 and inv_total > 0:
        result["deviation_pct"] = round((inv_total - ha_total) / ha_total * 100, 1)
    return result


def ha_quantity(medium: dict, daily: dict, corrections: list[dict], start: date, end: date) -> dict:
    """Quantities by zone over a period (form hint)."""
    corr = correction_per_day(corrections)
    qty = {z: 0.0 for z in zone_ids(medium)}
    covered = 0
    for d in days(start, end):
        for z, v in qty_on(medium, daily, corr, d).items():
            qty[z] += v
        if has_data(medium, daily, d):
            covered += 1
    n = (end - start).days + 1
    return {"qty": {z: round(v, 3) for z, v in qty.items()},
            "coverage": round(covered / n, 3) if n else 0.0}


def summary(data: dict, daily: dict, year: int, today: date) -> dict[str, Any]:
    """Full year summary for the panel and cards."""
    media = data.get("settings", {}).get("media", [])
    media_by_id = {m["id"]: m for m in media}
    tariffs = data.get("tariffs", [])
    corrections = data.get("corrections", [])
    corr = correction_per_day(corrections)
    months = month_summary(media, tariffs, daily, corrections, year, today)

    invoices = [i for i in data.get("invoices", []) if invoice_year(i) == year]
    checks = [invoice_check(i, media_by_id, daily, corr, today) for i in invoices]

    totals: dict[str, dict[str, float]] = {}
    for medium in media:
        mid = medium["id"]
        meter_cost = sum(m["media"][mid]["cost"] for m in months)
        inv = [i for i in invoices if i.get("medium") == mid]
        part_totals: dict[str, dict[str, float]] = {}
        for m in months:
            for pid, v in (m["media"][mid].get("parts") or {}).items():
                acc = part_totals.setdefault(pid, {"qty": 0.0, "cost": 0.0})
                acc["qty"] = round(acc["qty"] + v["qty"], 3)
                acc["cost"] = round(acc["cost"] + v["cost"], 2)
        totals[mid] = {
            **({"parts": part_totals} if part_totals else {}),
            "meter_cost": round(meter_cost, 2),
            "invoice_amount": round(sum(float(i.get("amount") or 0) for i in inv), 2),
            "invoice_qty": round(sum(sum(float(v or 0) for v in (i.get("quantities") or {}).values()) for i in inv), 3),
            "balance": round(sum(float(i.get("balance") or 0) for i in inv), 2),
        }

    installments = []
    for inst in data.get("installments", []):
        a = to_date(inst.get("period_from"))
        b = to_date(inst.get("period_to")) or a
        due = to_date(inst.get("due_date"))
        years = {x.year for x in (a, b, due) if x}
        if year in years:
            installments.append(inst)

    return {
        "year": year,
        "months": months,
        "invoices": invoices,
        "checks": {c["id"]: c for c in checks},
        "totals": totals,
        "installments": installments,
        "invoice_total": round(sum(t["invoice_amount"] for t in totals.values()), 2),
        "meter_total": round(sum(t["meter_cost"] for t in totals.values()), 2),
    }


def data_range(data: dict, year: int, today: date) -> tuple[date, date]:
    """Date range of statistics needed for a year summary."""
    start = date(year, 1, 1)
    end = min(date(year, 12, 31), today)
    for inv in data.get("invoices", []):
        if invoice_year(inv) == year:
            a = to_date(inv.get("period_from"))
            b = to_date(inv.get("period_to"))
            if a and a < start:
                start = a
            if b and b > end:
                end = min(b, today)
    return start, end
