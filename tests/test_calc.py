import copy
import sys
from datetime import date

calc = sys.modules["uc.calc"]
sc = sys.modules["uc.summary_cache"]

MEDIA = [
    {"id": "electricity", "unit": "kWh", "zones": [{"id": "day"}, {"id": "night"}], "statistics": {}},
    {"id": "gas", "unit": "m³", "zones": [{"id": "all"}], "statistics": {}},
]
DATA = {
    "settings": {"currency": "EUR", "media": MEDIA},
    "tariffs": [
        {"id": "e1", "medium": "electricity", "valid_from": "2025-01-01", "prices": {"day": 1.0, "night": 0.5}, "fixed_monthly": 30},
        {"id": "g1", "medium": "gas", "valid_from": "2025-01-01", "valid_to": "2025-06-30", "prices": {"all": 4.0}, "fixed_monthly": 10},
        {"id": "g2", "medium": "gas", "valid_from": "2025-07-01", "prices": {"all": 3.0}, "fixed_monthly": 10},
    ],
    "invoices": [
        {"id": "i1", "medium": "gas", "period_from": "2025-01-01", "period_to": "2025-01-31", "quantities": {"all": 100}, "amount": 410, "balance": -20},
    ],
    "corrections": [{"id": "c1", "medium": "gas", "month": "2025-02", "zone": "all", "qty": 28}],
    "installments": [],
}
TODAY = date(2025, 12, 31)


def daily():
    d = {"electricity": {"day": {}, "night": {}}, "gas": {"all": {}}}
    for x in calc.days(date(2025, 1, 1), TODAY):
        k = x.isoformat()
        d["electricity"]["day"][k] = 5
        d["electricity"]["night"][k] = 2
        d["gas"]["all"][k] = 3
    return d


def test_summary_costs():
    s = calc.summary(DATA, daily(), 2025, TODAY)
    jan = s["months"][0]["media"]
    assert abs(jan["electricity"]["cost"] - (31 * (5 * 1.0 + 2 * 0.5) + 30)) < 0.01
    assert abs(jan["gas"]["cost"] - (31 * 3 * 4.0 + 10)) < 0.01
    feb = s["months"][1]["media"]["gas"]
    assert abs(feb["qty_total"] - (28 * 3 + 28)) < 1e-6  # correction +1/day
    jul = s["months"][6]["media"]["gas"]
    assert abs(jul["cost"] - (31 * 3 * 3.0 + 10)) < 0.01  # tariff switch
    assert s["invoice_total"] == 410
    chk = s["checks"]["i1"]
    assert abs(chk["ha_total"] - 93) < 1e-6 and chk["deviation_pct"] == round((100 - 93) / 93 * 100, 1)


def test_fingerprint_isolated():
    f24, f25 = sc.fingerprint(DATA, 2024), sc.fingerprint(DATA, 2025)
    d2 = copy.deepcopy(DATA)
    d2["invoices"].append({"id": "i2", "medium": "gas", "period_from": "2025-11-01", "period_to": "2025-11-30", "amount": 1, "quantities": {"all": 1}})
    assert sc.fingerprint(d2, 2024) == f24
    assert sc.fingerprint(d2, 2025) != f25
