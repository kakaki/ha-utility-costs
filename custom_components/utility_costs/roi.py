"""Return-on-investment engine (pure functions, unit tested).

A *project* (PV, heat pump, insulation...) groups investment expenses
(collection "investments", linked by project_id) and a list of saving
rules. Rules are generic, so a heat pump can be modelled as "avoided gas"
plus "added electricity":

  {"type": "qty", "effect": "avoid"|"add", "medium", "zone",
   "sources": [{"from", "ids": [statistic ids], "factor"}],
   "estimate_per_year": qty}     # used for days without statistics
  {"type": "fixed", "effect": ..., "medium"}   # fixed fees avoided / added
  {"type": "money", "effect": ..., "amount_per_year", "from"?, "to"?}
  {"type": "heatpump", ...}   # gas boiler heat moved to heat pumps, see heatpump.py

Quantities from statistics are multiplied by the source factor to get the
medium's unit (e.g. heat kWh / (10.5 kWh/m3 * 0.9) = gas m3) and priced
with the medium's tariff valid on that day.
"""

from __future__ import annotations

import copy
from datetime import date
from typing import Any

from . import heatpump as hp
from .calc import days, days_in_month, price_for, tariff_on, to_date

TOT_KEYS = ("qty", "saved", "est_qty", "el", "gas_saved", "el_cost", "temp_est_days")


def _nearest_tariff(tariffs: list[dict], medium: str, d: date) -> dict | None:
    cands = [t for t in tariffs if t.get("medium") == medium]
    if not cands:
        return None
    return min(cands, key=lambda t: abs(((to_date(t.get("valid_from")) or d) - d).days))


def unit_price(tariffs: list[dict], medium: str, zone: str, d: date) -> tuple[float, bool]:
    """Variable price of one unit on a day; (price, estimated)."""
    t = tariff_on(tariffs, medium, d)
    est = False
    if t is None:
        t, est = _nearest_tariff(tariffs, medium, d), True
    if t is None:
        return 0.0, True
    factor = float(t.get("kwh_per_unit") or 1) if t.get("price_basis") == "kwh" else 1.0
    p = price_for(t, zone) * factor
    for extra in t.get("extras") or []:
        if extra.get("per") == "unit":
            p += float(extra.get("amount") or 0) * factor
    return p, est


def el_unit_price(tariffs: list[dict], rule: dict, d: date) -> tuple[float, bool]:
    """Average electricity price of a heat pump rule over its tariff zones."""
    medium = rule.get("el_medium")
    zones = hp.el_zones(rule)
    if zones == [("all", 1.0)]:
        t = tariff_on(tariffs, medium, d) or _nearest_tariff(tariffs, medium, d)
        prices = (t or {}).get("prices") or {}
        if t and "all" not in prices and prices:
            zones = [(z, 1 / len(prices)) for z in prices]
    total, est = 0.0, False
    for zone, frac in zones:
        p, e = unit_price(tariffs, medium, zone, d)
        total += p * frac
        est |= e
    return total, est


def _hp_month(rr: dict, tariffs: list[dict], rule: dict, d: date, gas: float, temp: float,
              from_norm: bool, full: dict[str, float]) -> None:
    """Month inputs of a heat pump rule for the what-if view in the panel.

    Values at 100 % share, 100 % COP and no losses, so the panel can scale them
    (share, COP, boiler efficiency, tariff zones) without asking the server:
    base / base_cost  heating gas and its cost without pumps,
    g100 / gp100      gas the pumps could replace and its cost,
    e100, "ez:<zone>" pump electricity and its cost in each tariff zone,
    tsum / tdays / tn temperature sum, days, days from typical temperatures,
    max_heat          highest daily heat (kWh) the pumps would give.
    """
    pg, _ = unit_price(tariffs, rule.get("medium"), rule.get("zone") or "all", d)
    add = {"base": gas, "base_cost": gas * pg, "g100": full["gas"], "gp100": full["gas"] * pg,
           "e100": full["el"], "tsum": temp, "tdays": 1.0, "tn": 1.0 if from_norm else 0.0}
    medium = rule.get("el_medium")
    t = tariff_on(tariffs, medium, d) or _nearest_tariff(tariffs, medium, d)
    for zone in ((t or {}).get("prices") or {"all": 0}):
        add[f"ez:{zone}"] = full["el"] * unit_price(tariffs, medium, zone, d)[0]
    for k, v in add.items():
        rr[k] = rr.get(k, 0.0) + v
    rr["max_heat"] = max(rr.get("max_heat", 0.0), full["heat"])


def fixed_per_day(tariffs: list[dict], medium: str, d: date) -> tuple[float, bool]:
    t = tariff_on(tariffs, medium, d)
    est = False
    if t is None:
        t, est = _nearest_tariff(tariffs, medium, d), True
    if t is None:
        return 0.0, True
    monthly = float(t.get("fixed_monthly") or 0)
    monthly += sum(float(e.get("amount") or 0) for e in t.get("extras") or [] if e.get("per") != "unit")
    return monthly / days_in_month(d), est


def _month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def _shares(series: dict[str, float], months_days: dict[str, tuple[int, int]]) -> list[float]:
    """Seasonal profile (12 shares summing to 1) from fully measured months."""
    sums = [0.0] * 12
    cnt = [0] * 12
    for mk, (data_days, all_days) in months_days.items():
        if data_days == all_days and all_days:
            m = int(mk[5:7]) - 1
            sums[m] += series.get(mk, 0.0)
            cnt[m] += 1
    avg = [sums[i] / cnt[i] if cnt[i] else None for i in range(12)]
    known = [a for a in avg if a is not None]
    if len(known) < 3 or sum(known) <= 0:
        return [1 / 12] * 12
    fill = sum(known) / len(known)
    avg = [a if a is not None else fill for a in avg]
    tot = sum(avg)
    return [a / tot for a in avg]


def project_investments(data: dict, project: dict) -> list[dict]:
    """Expenses of a project; unassigned ones belong to the first project."""
    projects = data.get("projects") or []
    first = projects[0]["id"] if projects else None
    return [
        i for i in data.get("investments") or []
        if i.get("project_id") == project["id"] or (not i.get("project_id") and project["id"] == first)
    ]


def project_start(project: dict, investments: list[dict], today: date) -> date:
    start = to_date(project.get("start_date"))
    if start is None:
        start = min((to_date(i["date"]) for i in investments if to_date(i.get("date"))), default=today)
    return start


def _rules(project: dict) -> list[dict]:
    return [r for r in project.get("rules") or [] if r.get("id")]


def profiles_for(project: dict, daily: dict, start: date, end: date) -> dict[str, list[float]]:
    """Per-rule seasonal profile used to estimate days without statistics."""
    profiles: dict[str, list[float]] = {}
    for r in _rules(project):
        if r.get("type") == "heatpump":
            sw = hp.switch_date(r)
            if sw:
                dd = (daily.get(r["id"]) or {})
                fit_days = [d for d in days(min(start, sw), end) if d < sw]
                profiles[r["id"]] = hp.fit_k(r, dd.get("all") or {}, dd.get("temp") or {}, fit_days)
            continue
        if r.get("type", "qty") != "qty":
            continue
        series = (daily.get(r["id"]) or {}).get("all") or {}
        per_month: dict[str, float] = {}
        md: dict[str, list[int]] = {}
        for d in days(start, end):
            mk = _month_key(d)
            md.setdefault(mk, [0, 0])
            md[mk][1] += 1
            v = series.get(d.isoformat())
            if v is not None:
                md[mk][0] += 1
                per_month[mk] = per_month.get(mk, 0.0) + v
        profiles[r["id"]] = _shares(per_month, {k: (a, b) for k, (a, b) in md.items()})
    return profiles


def empty_history(project: dict) -> dict[str, Any]:
    return {
        "months": {},
        "rule_tot": {r["id"]: {k: 0.0 for k in TOT_KEYS} for r in _rules(project)},
        "price_est": False,
    }


def history(project: dict, tariffs: list[dict], daily: dict, start: date, end: date,
            profiles: dict[str, list[float]]) -> dict[str, Any]:
    """Savings per month for the days start..end (unrounded, mergeable)."""
    rules = _rules(project)
    hist = empty_history(project)
    month_rows = hist["months"]
    rule_tot = hist["rule_tot"]
    price_est = False
    for d in days(start, end):
        mk = _month_key(d)
        row = month_rows.setdefault(mk, {"month": mk, "saved": 0.0, "estimated": 0.0, "rules": {}})
        for r in rules:
            sign = -1.0 if r.get("effect") == "add" else 1.0
            typ = r.get("type", "qty")
            val = 0.0
            est_val = 0.0
            qty = None
            if typ == "qty":
                series = (daily.get(r["id"]) or {}).get("all") or {}
                q = series.get(d.isoformat())
                estimated = False
                if q is None and r.get("estimate_per_year"):
                    prof = profiles.get(r["id"]) or [1 / 12] * 12
                    q = float(r["estimate_per_year"]) * prof[d.month - 1] / days_in_month(d)
                    estimated = True
                if q is None:
                    continue
                p, pe = unit_price(tariffs, r.get("medium"), r.get("zone") or "all", d)
                price_est |= pe
                qty = q
                val = q * p
                if estimated:
                    est_val = val
                    rule_tot[r["id"]]["est_qty"] += q
                rule_tot[r["id"]]["qty"] += q
            elif typ == "heatpump" and hp.switch_date(r) and d >= hp.switch_date(r):
                gas_series = (daily.get(r["id"]) or {}).get("all") or {}
                temp, from_norm = hp.day_temp(r, (daily.get(r["id"]) or {}).get("temp") or {}, d)
                actual = gas_series.get(d.isoformat())
                model = profiles.get(r["id"])
                if actual is None or not isinstance(model, dict):
                    continue
                m = hp.measured_day(r, actual, temp, model["k"])
                pg, pe1 = unit_price(tariffs, r.get("medium"), r.get("zone") or "all", d)
                pel, pe2 = el_unit_price(tariffs, r, d)
                price_est |= pe1 or pe2
                gas_saved, el_cost = m["gas"] * pg, m["el"] * pel
                qty = m["gas"]
                val = gas_saved - el_cost
                tot = rule_tot[r["id"]]
                for k, v in (("qty", qty), ("el", m["el"]), ("gas_saved", gas_saved), ("el_cost", el_cost)):
                    tot[k] += v
                rr = row["rules"].setdefault(r["id"], {"qty": 0.0, "saved": 0.0})
                for k, v in (("el", m["el"]), ("gas_saved", gas_saved), ("el_cost", el_cost),
                             ("m_days", 1.0), ("m_base", m["base"]), ("m_base_cost", m["base"] * pg),
                             ("m_actual", actual), ("m_actual_cost", actual * pg), ("m_el", m["el"]),
                             ("m_el_cost", el_cost), ("tsum", temp), ("tdays", 1.0), ("tn", 1.0 if from_norm else 0.0)):
                    rr[k] = rr.get(k, 0.0) + v
                rr["max_mheat"] = max(rr.get("max_mheat", 0.0), m["heat"])
                sign = 1.0
            elif typ == "heatpump":
                gas_series = (daily.get(r["id"]) or {}).get("all") or {}
                temp, from_norm = hp.day_temp(r, (daily.get(r["id"]) or {}).get("temp") or {}, d)
                gas = gas_series.get(d.isoformat())
                estimated = gas is None
                if estimated:
                    gas = hp.estimate_gas(r, temp)
                sim = hp.simulate_day(r, gas, temp)
                full = hp.simulate_day({**r, "share_pct": 100, "cop_pct": 100, "losses_pct": 0}, gas, temp)
                rr = row["rules"].setdefault(r["id"], {"qty": 0.0, "saved": 0.0})
                _hp_month(rr, tariffs, r, d, gas, temp, from_norm, full)
                if estimated:
                    rr["est_days"] = rr.get("est_days", 0.0) + 1
                if not sim["gas"] and not sim["el"]:
                    continue
                pg, pe1 = unit_price(tariffs, r.get("medium"), r.get("zone") or "all", d)
                pel, pe2 = el_unit_price(tariffs, r, d)
                price_est |= pe1 or pe2
                gas_saved, el_cost = sim["gas"] * pg, sim["el"] * pel
                qty = sim["gas"]
                val = gas_saved - el_cost
                tot = rule_tot[r["id"]]
                tot["qty"] += qty
                tot["el"] += sim["el"]
                tot["gas_saved"] += gas_saved
                tot["el_cost"] += el_cost
                if from_norm:
                    tot["temp_est_days"] += 1
                if estimated:
                    est_val = val
                    tot["est_qty"] += qty
                for k, v in (("el", sim["el"]), ("gas_saved", gas_saved), ("el_cost", el_cost)):
                    rr[k] = rr.get(k, 0.0) + v
                sign = 1.0  # the rule carries its own sign (gas saved - electricity)
            elif typ == "fixed":
                f, pe = fixed_per_day(tariffs, r.get("medium"), d)
                price_est |= pe
                val = f
            elif typ == "money":
                rf, rt = to_date(r.get("from")) or date.min, to_date(r.get("to")) or date.max
                if not rf <= d <= rt:
                    continue
                val = float(r.get("amount_per_year") or 0) / 365
            val *= sign
            est_val *= sign
            rule_tot[r["id"]]["saved"] += val
            rr = row["rules"].setdefault(r["id"], {"qty": 0.0, "saved": 0.0})
            if qty is not None:
                rr["qty"] += qty
            rr["saved"] += val
            row["saved"] += val
            row["estimated"] += est_val
    hist["price_est"] = price_est
    hist["models"] = {rid: v for rid, v in profiles.items() if isinstance(v, dict)}
    return hist


def merge_history(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """Join two histories over disjoint day ranges."""
    out = {"months": {**a["months"]}, "rule_tot": {}, "price_est": bool(a["price_est"] or b["price_est"]),
           "models": {**(a.get("models") or {}), **(b.get("models") or {})}}
    for mk, row in b["months"].items():
        if mk in out["months"]:
            x = out["months"][mk]
            rules = {k: dict(v) for k, v in x["rules"].items()}
            for rid, rr in row["rules"].items():
                t = rules.setdefault(rid, {"qty": 0.0, "saved": 0.0})
                for k, v in rr.items():
                    t[k] = max(t.get(k, 0.0), v) if k.startswith("max") else t.get(k, 0.0) + v
            out["months"][mk] = {"month": mk, "saved": x["saved"] + row["saved"],
                                 "estimated": x["estimated"] + row["estimated"], "rules": rules}
        else:
            out["months"][mk] = row
    for rid in dict.fromkeys([*a["rule_tot"], *b["rule_tot"]]):
        x, y = a["rule_tot"].get(rid, {}), b["rule_tot"].get(rid, {})
        out["rule_tot"][rid] = {k: x.get(k, 0.0) + y.get(k, 0.0) for k in TOT_KEYS}
    return out


def roi(project: dict, investments: list[dict], tariffs: list[dict],
        daily: dict, today: date) -> dict[str, Any]:
    """Compute history, projection and payback of a project.

    daily: {rule_id: {"all": {"YYYY-MM-DD": qty}}} from the statistics.
    """
    start = project_start(project, investments, today)
    profiles = profiles_for(project, daily, start, today)
    return finalize(project, investments, history(project, tariffs, daily, start, today, profiles), today)


def finalize(project: dict, investments: list[dict], hist: dict[str, Any], today: date) -> dict[str, Any]:
    """Rounded result with yearly timeline, projection and payback."""
    exp = [i for i in investments if to_date(i.get("date"))]
    start = project_start(project, investments, today)
    horizon = int(project.get("horizon_years") or 25)
    growth = float(project.get("growth_pct") or 0) / 100
    month_rows = copy.deepcopy(hist["months"])
    rule_tot = hist["rule_tot"]
    price_est = hist["price_est"]

    months = [month_rows[k] for k in sorted(month_rows)]
    for m in months:
        m["saved"] = round(m["saved"], 2)
        m["estimated"] = round(m["estimated"], 2)
        for rr in m["rules"].values():
            for k in rr:
                rr[k] = round(rr[k], 3 if k in ("qty", "el") else 2)

    # investment cash flow by month
    inv_by_month: dict[str, float] = {}
    for i in exp:
        mk = _month_key(to_date(i["date"]))
        inv_by_month[mk] = inv_by_month.get(mk, 0.0) + float(i.get("amount") or 0)
    invested = sum(inv_by_month.values())

    # baseline for projection: last 12 months by calendar month
    last12 = months[-13:-1] if len(months) > 12 else months[:-1] if len(months) > 1 else months
    base = [0.0] * 12
    seen = [False] * 12
    for m in last12:
        idx = int(m["month"][5:7]) - 1
        base[idx] = m["saved"]
        seen[idx] = True
    if not all(seen) and any(seen):
        # fill gaps with mean of known months
        known = [b for b, s in zip(base, seen) if s]
        mean = sum(known) / len(known)
        base = [b if s else mean for b, s in zip(base, seen)]
    avg_year = round(sum(base), 2)

    # timeline (actual + projected) by month
    cum_saved = 0.0
    cum_inv = 0.0
    payback = None
    years: dict[int, dict[str, Any]] = {}
    for m in months:
        y = int(m["month"][:4])
        cum_saved += m["saved"]
        cum_inv += inv_by_month.get(m["month"], 0.0)
        yr = years.setdefault(y, {"year": y, "saved": 0.0, "invested": 0.0, "estimated": 0.0, "projected": False})
        yr["saved"] += m["saved"]
        yr["estimated"] += m["estimated"]
        yr["invested"] += inv_by_month.get(m["month"], 0.0)
        yr["cum_saved"], yr["cum_invested"] = cum_saved, cum_inv
        if payback is None and cum_inv > 0 and cum_saved >= cum_inv:
            payback = {"month": m["month"], "projected": False}
    saved_to_date = cum_saved
    # add future expenses (dated after today)
    y0, m0 = today.year, today.month
    last_year = start.year + horizon
    k = 0
    if avg_year > 0 or any(b != 0 for b in base):
        while True:
            m0 += 1
            if m0 > 12:
                m0, y0 = 1, y0 + 1
            if y0 > last_year:
                break
            k += 1
            mk = f"{y0:04d}-{m0:02d}"
            val = base[m0 - 1] * ((1 + growth) ** ((k - 1) // 12 + 1))
            cum_saved += val
            cum_inv += inv_by_month.get(mk, 0.0)
            yr = years.setdefault(y0, {"year": y0, "saved": 0.0, "invested": 0.0, "estimated": 0.0, "projected": True})
            yr["saved"] += val
            yr["invested"] += inv_by_month.get(mk, 0.0)
            yr["cum_saved"], yr["cum_invested"] = cum_saved, cum_inv
            if yr["year"] > today.year:
                yr["projected"] = True
            if payback is None and cum_inv > 0 and cum_saved >= cum_inv:
                payback = {"month": mk, "projected": True}
    year_list = []
    for y in sorted(years):
        yr = years[y]
        if y == today.year:
            yr["partial"] = True
        for key in ("saved", "invested", "estimated", "cum_saved", "cum_invested"):
            yr[key] = round(yr.get(key, 0.0), 2)
        year_list.append(yr)

    payback_years = None
    if payback:
        py, pm = int(payback["month"][:4]), int(payback["month"][5:7])
        first_inv = min((to_date(i["date"]) for i in exp), default=start)
        payback_years = round((py - first_inv.year) + (pm - first_inv.month) / 12, 1)

    return {
        "start": start.isoformat(),
        "invested": round(invested, 2),
        "saved": round(saved_to_date, 2),
        "estimated": round(sum(m["estimated"] for m in months), 2),
        "net": round(saved_to_date - invested, 2),
        "progress_pct": round(saved_to_date / invested * 100, 1) if invested else None,
        "avg_year": avg_year,
        "payback": payback,
        "payback_years": payback_years,
        "price_estimated": price_est,
        "lifetime_saved": round(cum_saved, 2),
        "years": year_list,
        "months": months,
        "rules": [{"id": rid, **{k: round(v, 2) for k, v in t.items()}} for rid, t in rule_tot.items()],
        "models": {rid: {k: round(v, 5) for k, v in m.items()} for rid, m in (hist.get("models") or {}).items()},
    }
