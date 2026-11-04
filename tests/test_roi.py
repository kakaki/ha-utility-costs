import sys
from datetime import date, timedelta
roi = sys.modules["uc.roi"]

TAR = [{"medium": "electricity", "valid_from": "2024-01-01", "prices": {"day": 1.0, "night": 0.5}, "fixed_monthly": 30},
       {"medium": "gas", "valid_from": "2024-01-01", "prices": {"all": 4.0}, "fixed_monthly": 20}]

def series(start, end, q):
    out = {}; d = start
    while d <= end:
        out[d.isoformat()] = q; d += timedelta(days=1)
    return out

def test_pv_payback():
    today = date(2025, 12, 31)
    proj = {"start_date": "2024-01-01", "rules": [{"id": "r1", "type": "qty", "effect": "avoid", "medium": "electricity", "zone": "day"}]}
    daily = {"r1": {"all": series(date(2024, 1, 1), today, 10.0)}}
    r = roi.roi(proj, [{"date": "2024-01-01", "amount": 10000}], TAR, daily, today)
    assert abs(r["saved"] - 7310) < 0.01  # 731 days * 10 kWh * 1.0
    assert r["payback"]["month"] == "2026-09" and r["payback"]["projected"]

def test_heat_pump_net():
    today = date(2024, 1, 31)
    proj = {"start_date": "2024-01-01", "rules": [
        {"id": "g", "type": "qty", "effect": "avoid", "medium": "gas"},
        {"id": "e", "type": "qty", "effect": "add", "medium": "electricity", "zone": "night"},
        {"id": "f", "type": "fixed", "effect": "avoid", "medium": "gas"}]}
    daily = {"g": {"all": series(date(2024, 1, 1), today, 2.0)}, "e": {"all": series(date(2024, 1, 1), today, 6.0)}}
    r = roi.roi(proj, [], TAR, daily, today)
    # 31*(2*4 - 6*0.5) + 20 = 155 + 20
    assert abs(r["saved"] - 175) < 0.01

def test_estimate_and_price_fallback():
    today = date(2024, 1, 31)
    proj = {"start_date": "2023-12-01", "rules": [{"id": "r", "type": "qty", "medium": "electricity", "zone": "day", "estimate_per_year": 1200}]}
    daily = {"r": {"all": series(date(2024, 1, 1), today, 1.0)}}
    r = roi.roi(proj, [], TAR, daily, today)
    assert r["price_estimated"]
    assert abs(r["estimated"] - 100) < 0.01  # Dec estimated 1200/12 at fallback price 1.0
