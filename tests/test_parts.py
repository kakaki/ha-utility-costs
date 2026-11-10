"""Usage parts of a medium (e.g. gas for heating / hot water)."""
from datetime import date

from uc import calc
from uc.stats import _keys, _sources

GAS = {"id": "gas", "zones": [{"id": "all"}], "statistics": {"all": [{"ids": ["sensor.gas"]}]},
       "parts": [{"id": "co", "name": "Ogrzewanie", "statistics": [{"ids": ["sensor.co"]}]},
                 {"id": "cwu", "name": "Ciepła woda", "statistics": [{"from": "2026-01-05", "ids": ["sensor.cwu"], "factor": 2}]}]}
TARIFF = [{"medium": "gas", "valid_from": "2026-01-01", "prices": {"all": 3.0}, "fixed_monthly": 31}]


def _daily(gas, co, cwu):
    return {"gas": {"all": gas, "part:co": co, "part:cwu": cwu}}


def test_keys_and_sources_include_parts():
    assert _keys(GAS) == ["all", "part:co", "part:cwu"]
    src = _sources(GAS, "part:cwu")
    assert src[0]["ids"] == ["sensor.cwu"] and src[0]["factor"] == 2.0
    assert _sources(GAS, "part:missing") == []


def test_month_split_and_rest():
    d = {f"2026-01-0{i}": 10.0 for i in range(1, 4)}          # 30 m³ in three days
    co = {"2026-01-02": 6.0, "2026-01-03": 7.0}               # parts known from the 2nd
    cwu = {"2026-01-02": 3.0, "2026-01-03": 3.0}
    months = calc.month_summary([GAS], TARIFF, _daily(d, co, cwu), [], 2026, date(2026, 1, 3))
    p = months[0]["media"]["gas"]["parts"]
    assert p["co"] == {"qty": 13.0, "cost": 39.0}
    assert p["cwu"] == {"qty": 6.0, "cost": 18.0}
    assert p["rest"] == {"qty": 11.0, "cost": 33.0}            # day 1 has no split


def test_parts_larger_than_total_are_scaled():
    d = {"2026-01-01": 10.0}
    months = calc.month_summary([GAS], TARIFF, _daily(d, {"2026-01-01": 8.0}, {"2026-01-01": 4.0}), [], 2026, date(2026, 1, 1))
    p = months[0]["media"]["gas"]["parts"]
    assert round(p["co"]["qty"] + p["cwu"]["qty"], 3) == 10.0 and p["rest"]["qty"] == 0


def test_no_parts_no_key():
    m = dict(GAS); m.pop("parts")
    months = calc.month_summary([m], TARIFF, {"gas": {"all": {"2026-01-01": 1.0}}}, [], 2026, date(2026, 1, 1))
    assert "parts" not in months[0]["media"]["gas"]


def test_year_totals_sum_parts():
    data = {"settings": {"media": [GAS]}, "tariffs": TARIFF}
    s = calc.summary(data, _daily({"2026-01-01": 5.0}, {"2026-01-01": 4.0}, {"2026-01-01": 1.0}), 2026, date(2026, 1, 1))
    assert s["totals"]["gas"]["parts"]["co"]["qty"] == 4.0
