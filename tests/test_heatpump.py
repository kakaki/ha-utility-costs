import sys
from datetime import date, timedelta

hp = sys.modules["uc.heatpump"]
roi = sys.modules["uc.roi"]
stats = sys.modules["uc.stats"]

TAR = [{"medium": "electricity", "valid_from": "2024-01-01", "prices": {"day": 1.2, "night": 0.6}},
       {"medium": "gas", "valid_from": "2024-01-01", "prices": {"all": 3.6}, "fixed_monthly": 20}]
DEV = [{"name": "A", "kw": 3, "scop": 4.2, "min_temp": -25}, {"name": "B", "kw": 5, "scop": 4.0, "min_temp": -15}]


def rule(**kw):
    r = {"id": "h", "type": "heatpump", "medium": "gas", "zone": "all", "share_pct": 100,
         "kwh_per_unit": 11, "boiler_eff_pct": 90, "devices": DEV,
         "el_medium": "electricity", "el_zones": {"night": 90, "day": 10}}
    r.update(kw)
    return r


def test_cop_curve():
    assert abs(hp.cop_at(3.5) - 3.5) < 1e-9          # 3.5 - 1.5 shift = 2 degC point
    assert hp.cop_at(-40) == 2.0 and hp.cop_at(40) == 5.6
    assert abs(hp.cop_at(3.5, scop=2.1) - 1.75) < 1e-9
    assert hp.cop_at(-40, pct=10) == 1.0              # never below 1


def test_simulate_split_and_limits():
    r = rule()
    s = hp.simulate_day(r, 10.0, 3.5)                 # 10 m3 * 11 * 0.9 = 99 kWh heat
    assert abs(s["heat"] - 99) < 1e-9
    assert abs(s["gas"] - 10) < 1e-9
    assert abs(s["el"] - (99 * 3 / 8 / 3.5 + 99 * 5 / 8 / (3.5 * 4 / 4.2))) < 1e-9
    cold = hp.simulate_day(r, 10.0, -20)              # B stops below -15: only A's 3/8 moved
    assert abs(cold["gas"] - 10 * 3 / 8) < 1e-9
    big = hp.simulate_day(rule(devices=[{"kw": 1, "min_temp": -25}]), 50.0, 0)  # capped at 24 kWh
    assert abs(big["heat"] - 24) < 1e-9
    assert hp.simulate_day(rule(share_pct=0), 10, 0)["gas"] == 0
    half = hp.simulate_day(rule(share_pct=50, losses_pct=10), 10.0, 3.5)
    assert abs(half["gas"] - 5) < 1e-9 and abs(half["el"] - s["el"] / 2 * 1.1) < 1e-9


def test_estimate_by_degree_days():
    r = rule(estimate_per_year=1000)
    year = sum(hp.estimate_gas(r, hp.normals(r)[m - 1]) * n
               for m, n in enumerate([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], 1))
    assert abs(year - 1000) < 1e-6
    assert hp.estimate_gas(r, 20) == 0


def test_roi_heatpump_rule():
    today = date(2024, 1, 10)
    days = {(date(2024, 1, 1) + timedelta(i)).isoformat(): 10.0 for i in range(10)}
    temps = {k: 3.5 for k in days}
    temps.pop("2024-01-10")                          # one day from normals
    proj = {"start_date": "2024-01-01", "rules": [rule()]}
    r = roi.roi(proj, [{"date": "2024-01-01", "amount": 0}], TAR, {"h": {"all": days, "temp": temps}}, today)
    tot = r["rules"][0]
    assert abs(tot["qty"] - 100) < 0.01
    assert abs(tot["gas_saved"] - 360) < 0.01
    price = 0.9 * 0.6 + 0.1 * 1.2
    assert abs(tot["el_cost"] - tot["el"] * price) < 0.02
    assert abs(r["saved"] - (tot["gas_saved"] - tot["el_cost"])) < 0.02
    assert tot["temp_est_days"] == 1
    m = r["months"][0]["rules"]["h"]
    assert m["el"] > 0 and m["gas_saved"] > 0


def test_roi_heatpump_estimates_and_zone_fallback():
    today = date(2024, 1, 31)
    proj = {"start_date": "2024-01-01", "rules": [rule(estimate_per_year=1000, el_zones={})]}
    r = roi.roi(proj, [], TAR, {}, today)
    tot = r["rules"][0]
    assert tot["est_qty"] > 0 and abs(tot["est_qty"] - tot["qty"]) < 0.01
    assert r["estimated"] == r["saved"]
    assert abs(tot["el_cost"] - tot["el"] * 0.9) < 0.02  # average of day/night prices


def test_merge_keeps_extra_keys():
    proj = {"start_date": "2024-01-01", "rules": [rule()]}
    d = {"h": {"all": {"2024-01-01": 5.0, "2024-01-02": 5.0}}}
    a = roi.history(proj, TAR, d, date(2024, 1, 1), date(2024, 1, 1), {})
    b = roi.history(proj, TAR, d, date(2024, 1, 2), date(2024, 1, 2), {})
    full = roi.history(proj, TAR, d, date(2024, 1, 1), date(2024, 1, 2), {})
    m = roi.merge_history(a, b)
    assert abs(m["months"]["2024-01"]["rules"]["h"]["el"] - full["months"]["2024-01"]["rules"]["h"]["el"]) < 1e-9
    assert abs(m["rule_tot"]["h"]["el_cost"] - full["rule_tot"]["h"]["el_cost"]) < 1e-9


def test_daily_means(monkeypatch):
    from datetime import datetime, timezone
    monkeypatch.setattr(stats.dt_util, "as_local", lambda x: x, raising=False)
    rows = {"a": [{"start": datetime(2024, 1, 1, 12, tzinfo=timezone.utc), "mean": 2.0}],
            "b": [{"start": datetime(2024, 1, 1, 12, tzinfo=timezone.utc), "mean": 4.0},
                  {"start": datetime(2024, 1, 2, 12, tzinfo=timezone.utc), "mean": None}]}
    assert stats.daily_means(rows) == {"2024-01-01": 3.0}
