"""Heat pump / air conditioner simulation (pure functions, unit tested).

A "heatpump" saving rule answers the question: what if part of the heat now
made by a gas boiler came from heat pumps (e.g. split air conditioners)?

  {"type": "heatpump",
   "medium": gas medium id, "zone": "all",
   "sources": [...],            # statistics of gas used for space heating
   "estimate_per_year": m3,     # heating gas for days without statistics
   "temp_ids": [statistic id],  # outdoor temperature (daily mean)
   "temp_normals": [12 x degC], # monthly means for days without temperature
   "share_pct": 85,             # part of the heating load moved to the pumps
   "kwh_per_unit": 11, "boiler_eff_pct": 90, "cop_pct": 100,
   "devices": [{"name", "kw", "scop", "min_temp"}],
   "el_medium": electricity medium id,
   "el_zones": {zone: pct},     # how the pump energy splits over tariff zones
   "losses_pct": 0}             # e.g. battery round-trip losses

For every day the boiler's heat (gas x kWh/unit x efficiency) is computed,
`share_pct` of it is offered to the devices in proportion to their power,
limited by each device's power over 24 h and its lowest working temperature.
Electricity = heat / COP(T); the gas no longer burnt is the heat covered
divided by kWh/unit x efficiency.
"""

from __future__ import annotations

from datetime import date
from typing import Any

# Typical monthly mean outdoor temperature in central Europe (southern Poland,
# 1991-2020 climate normals, rounded). Used only when no measured temperature
# exists for a day and the rule has no own table.
DEFAULT_NORMALS = [-1.5, 0.0, 3.8, 9.3, 14.1, 17.6, 19.4, 18.9, 14.0, 8.9, 4.0, -0.3]

# Real-life COP of an air-to-air unit with SCOP 4.2 vs outdoor temperature;
# already includes defrost cycles and part-load losses (shifted by -1.5 K).
COP_CURVE = [(-15.0, 2.0), (-7.0, 2.6), (2.0, 3.5), (7.0, 4.3), (12.0, 5.0), (20.0, 5.6)]
COP_REF_SCOP = 4.2
COP_SHIFT = -1.5
HEATING_BASE = 15.0  # degC, heating degree days base


def _num(v: Any, default: float) -> float:
    try:
        return float(v) if v is not None and v != "" else default
    except (TypeError, ValueError):
        return default


def cop_at(temp: float, scop: float = COP_REF_SCOP, pct: float = 100.0) -> float:
    """COP of a device at an outdoor temperature (linear on the curve)."""
    x = temp + COP_SHIFT
    pts = COP_CURVE
    if x <= pts[0][0]:
        base = pts[0][1]
    elif x >= pts[-1][0]:
        base = pts[-1][1]
    else:
        base = pts[-1][1]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if x0 <= x <= x1:
                base = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
                break
    return max(1.0, base * (scop / COP_REF_SCOP) * pct / 100)


def normals(rule: dict) -> list[float]:
    tab = rule.get("temp_normals")
    if isinstance(tab, list) and len(tab) == 12:
        return [_num(v, DEFAULT_NORMALS[i]) for i, v in enumerate(tab)]
    return list(DEFAULT_NORMALS)


def day_temp(rule: dict, temps: dict[str, float], d: date) -> tuple[float, bool]:
    """Mean outdoor temperature of a day; (value, from_normals)."""
    v = temps.get(d.isoformat())
    if v is not None:
        return float(v), False
    return normals(rule)[d.month - 1], True


def hdd(temp: float) -> float:
    return max(0.0, HEATING_BASE - temp)


def year_hdd(rule: dict) -> float:
    """Heating degree days of a normal (non-leap) year."""
    lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return sum(n * hdd(t) for n, t in zip(lengths, normals(rule)))


def estimate_gas(rule: dict, temp: float) -> float:
    """Heating gas of a day without statistics, from the yearly estimate by degree days."""
    per_year = _num(rule.get("estimate_per_year"), 0.0)
    tot = year_hdd(rule)
    if per_year <= 0 or tot <= 0:
        return 0.0
    return per_year * hdd(temp) / tot


def simulate_day(rule: dict, gas: float, temp: float) -> dict[str, float]:
    """Gas avoided, electricity added and heat moved on one day."""
    kwh_unit = _num(rule.get("kwh_per_unit"), 11.0)
    eff = _num(rule.get("boiler_eff_pct"), 90.0) / 100
    share = min(max(_num(rule.get("share_pct"), 0.0), 0.0), 100.0) / 100
    cop_pct = _num(rule.get("cop_pct"), 100.0)
    out = {"gas": 0.0, "el": 0.0, "heat": 0.0}
    if gas <= 0 or share <= 0 or kwh_unit <= 0 or eff <= 0:
        return out
    target = gas * kwh_unit * eff * share
    devices = [d for d in rule.get("devices") or [] if _num(d.get("kw"), 0) > 0]
    total_kw = sum(_num(d.get("kw"), 0) for d in devices)
    if not devices or total_kw <= 0:
        return out
    for dev in devices:
        kw = _num(dev.get("kw"), 0)
        if temp < _num(dev.get("min_temp"), -15.0):
            continue  # this room stays on gas today
        heat = min(target * kw / total_kw, kw * 24)
        out["heat"] += heat
        out["el"] += heat / cop_at(temp, _num(dev.get("scop"), COP_REF_SCOP), cop_pct)
    out["gas"] = out["heat"] / (kwh_unit * eff)
    out["el"] *= 1 + _num(rule.get("losses_pct"), 0.0) / 100
    return out


def el_zones(rule: dict) -> list[tuple[str, float]]:
    """Tariff zones of the pump electricity as (zone, fraction)."""
    raw = rule.get("el_zones") or {}
    items = [(z, _num(p, 0.0)) for z, p in raw.items() if _num(p, 0.0) > 0] if isinstance(raw, dict) else []
    tot = sum(p for _, p in items)
    if not items or tot <= 0:
        return [("all", 1.0)]
    return [(z, p / tot) for z, p in items]


# ---------------------------------------------------------------------------
# Measured period: after "switch_date" the pumps really heat, so the heating gas
# meter already shows the reduced use. The gas the house would have needed is
# then taken from a degree-day model fitted on the days before the switch:
#     gas_per_day = k * max(0, 15 degC - T)
# and the saving is that baseline minus the gas actually burnt.

def switch_date(rule: dict) -> date | None:
    raw = rule.get("switch_date")
    try:
        return date.fromisoformat(str(raw)[:10]) if raw else None
    except ValueError:
        return None


def fit_k(rule: dict, gas: dict[str, float], temps: dict[str, float], days: list[date]) -> dict[str, float]:
    """Least-squares k (gas units per degree day) from days with gas data.

    Days with a measured temperature are preferred; typical temperatures are
    used only when there are fewer than 14 measured heating days. Without any
    data the yearly estimate is spread over a normal year's degree days.
    """
    def collect(measured_only: bool) -> tuple[float, float, int]:
        sxy = sxx = 0.0
        n = 0
        for d in days:
            g = gas.get(d.isoformat())
            if g is None:
                continue
            t, from_norm = day_temp(rule, temps, d)
            if measured_only and from_norm:
                continue
            h = hdd(t)
            if h <= 0:
                continue
            sxy += g * h
            sxx += h * h
            n += 1
        return sxy, sxx, n

    sxy, sxx, n = collect(True)
    source = "measured"
    if n < 14:
        sxy, sxx, n = collect(False)
        source = "typical"
    if n and sxx > 0:
        return {"k": sxy / sxx, "n": float(n), "measured": 1.0 if source == "measured" else 0.0}
    tot = year_hdd(rule)
    per_year = _num(rule.get("estimate_per_year"), 0.0)
    return {"k": per_year / tot if tot > 0 else 0.0, "n": 0.0, "measured": 0.0}


def measured_day(rule: dict, actual: float, temp: float, k: float) -> dict[str, float]:
    """Baseline gas, gas avoided and pump electricity on a measured day."""
    kwh_unit = _num(rule.get("kwh_per_unit"), 11.0)
    eff = _num(rule.get("boiler_eff_pct"), 90.0) / 100
    base = k * hdd(temp)
    avoided = max(0.0, base - max(actual, 0.0))
    heat = avoided * kwh_unit * eff
    el = 0.0
    if heat > 0:
        probe = simulate_day({**rule, "share_pct": 100, "losses_pct": 0}, avoided, temp)
        el = probe["el"] / probe["heat"] * heat if probe["heat"] > 0 else heat / cop_at(temp, COP_REF_SCOP, _num(rule.get("cop_pct"), 100.0))
        el *= 1 + _num(rule.get("losses_pct"), 0.0) / 100
    return {"base": base, "gas": avoided, "heat": heat, "el": el}
