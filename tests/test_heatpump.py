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


def test_whatif_inputs_scale_to_result():
    today = date(2024, 2, 29)
    days = {(date(2024, 1, 1) + timedelta(i)).isoformat(): 8.0 + (i % 5) for i in range(60)}
    temps = {k: -3.0 + (i % 9) for i, k in enumerate(days)}
    r0 = rule(share_pct=85, cop_pct=90, losses_pct=6)
    res = roi.roi({"start_date": "2024-01-01", "rules": [r0]}, [], TAR, {"h": {"all": days, "temp": temps}}, today)
    for m in res["months"]:
        v = m["rules"]["h"]
        assert abs(v["g100"] * 0.85 - v["qty"]) < 0.01
        assert abs(v["gp100"] * 0.85 - v["gas_saved"]) < 0.05
        scale = 0.85 / 0.9 * 1.06
        assert abs(v["e100"] * scale - v["el"]) < 0.05
        assert abs((0.9 * v["ez:night"] + 0.1 * v["ez:day"]) * scale - v["el_cost"]) < 0.05
        assert v["base"] >= v["g100"] and v["tdays"] == (31 if m["month"] == "2024-01" else 29)
        assert v["max_heat"] > 0


def test_fit_k_and_measured_period():
    start = date(2024, 1, 1)
    days_ = [start + timedelta(i) for i in range(40)]
    temps = {d.isoformat(): -2.0 + (i % 8) for i, d in enumerate(days_)}
    k_true = 0.6
    gas = {}
    for i, d in enumerate(days_):
        h = max(0.0, 15 - temps[d.isoformat()])
        gas[d.isoformat()] = k_true * h if i < 30 else k_true * h * 0.2   # from day 30 pumps take 80 %
    sw = days_[30]
    r = rule(switch_date=sw.isoformat(), losses_pct=0)
    m = hp.fit_k(r, gas, temps, [d for d in days_ if d < sw])
    assert abs(m["k"] - k_true) < 1e-9 and m["measured"] == 1.0
    res = roi.roi({"start_date": "2024-01-01", "rules": [r]}, [], TAR, {"h": {"all": gas, "temp": temps}}, days_[-1] + timedelta(1))
    feb = [x for x in res["months"] if x["month"] == "2024-02"][0]["rules"]["h"]
    # Feb 1..9 are all measured: avoided gas = 80 % of the baseline
    assert feb["m_days"] == 9
    assert abs(feb["qty"] - 0.8 * feb["m_base"]) < 0.01
    assert abs(feb["m_actual"] - 0.2 * feb["m_base"]) < 0.01
    assert feb["el"] > 0 and abs(feb["saved"] - (feb["gas_saved"] - feb["el_cost"])) < 0.02
    assert "base" not in feb                           # no what-if inputs on measured days
    assert abs(res["models"]["h"]["k"] - k_true) < 1e-4


def test_fit_k_fallbacks():
    r = rule(estimate_per_year=1000)
    m = hp.fit_k(r, {}, {}, [date(2024, 1, 1)])
    assert m["n"] == 0 and abs(m["k"] - 1000 / hp.year_hdd(r)) < 1e-9
    d0 = date(2024, 1, 1)
    gas = {(d0 + timedelta(i)).isoformat(): 5.0 for i in range(20)}
    m2 = hp.fit_k(r, gas, {}, [d0 + timedelta(i) for i in range(20)])  # no sensor → typical temperatures
    assert m2["measured"] == 0.0 and m2["k"] > 0


def test_meter_electricity_after_switch():
    start = date(2024, 1, 1)
    days_ = [start + timedelta(i) for i in range(30)]
    temps = {d.isoformat(): 0.0 for d in days_}
    gas = {d.isoformat(): (6.0 if i < 20 else 2.0) for i, d in enumerate(days_)}
    house = {d.isoformat(): (17.0 if i < 20 else 37.0) for i, d in enumerate(days_)}
    exclude = {days_[25].isoformat(): 10.0}          # EV charged 10 kWh on day 25
    run = {d.isoformat(): (0.0 if i == 27 else 8.0) for i, d in enumerate(days_) if i >= 20}
    sw = days_[20]
    r = rule(switch_date=sw.isoformat(), losses_pct=0, el_base_days=14)
    res = roi.roi({"start_date": "2024-01-01", "rules": [r]}, [], TAR,
                  {"h": {"all": gas, "temp": temps, "house": house, "exclude": exclude, "run": run}}, days_[-1] + timedelta(1))
    v = res["months"][0]["rules"]["h"]
    assert abs(res["models"]["h"]["el_base"] - 17.0) < 1e-9
    # 10 measured days: 20 kWh extra each, minus 10 kWh EV on day 25, day 27 no unit heating → 0
    assert v["m_meter_days"] == 10
    assert abs(v["m_el"] - (20 * 10 - 10 - 20)) < 0.01
    assert v["m_el_model"] > 0 and abs(v["m_run_h"] - 8 * 9) < 1e-9


def test_meter_groups_per_floor():
    start = date(2024, 1, 1)
    days_ = [start + timedelta(i) for i in range(30)]
    temps = {d.isoformat(): 0.0 for d in days_}
    gas = {d.isoformat(): (6.0 if i < 20 else 2.0) for i, d in enumerate(days_)}
    up = {d.isoformat(): (6.0 if i < 20 else 4.0 if i % 2 else 14.0) for i, d in enumerate(days_)}    # noisy floor
    down = {d.isoformat(): (10.0 if i < 20 else 22.0) for i, d in enumerate(days_)}
    run_up = {d.isoformat(): (0.0 if i % 2 else 5.0) for i, d in enumerate(days_) if i >= 20}
    r = rule(switch_date=days_[20].isoformat(), losses_pct=0,
             el_meters=[{"name": "Piętro", "house_ids": ["a"], "run_ids": ["x"]}, {"name": "Parter", "house_ids": ["b"]}])
    assert len(hp.meter_groups(r)) == 2
    groups = [{"house": up, "exclude": {}, "run": run_up}, {"house": down, "exclude": {}}]
    res = roi.roi({"start_date": "2024-01-01", "rules": [r]}, [], TAR,
                  {"h": {"all": gas, "temp": temps, "groups": groups}}, days_[-1] + timedelta(1))
    v = res["months"][0]["rules"]["h"]
    # upstairs: 5 heating days × 8 kWh (odd days have 0 run hours → 0), downstairs: 10 days × 12 kWh
    assert abs(v["m_el_g0"] - 40) < 0.01 and abs(v["m_el_g1"] - 120) < 0.01
    assert abs(v["m_el"] - 160) < 0.01
    assert len(res["models"]["h"]["groups"]) == 2


def test_pv_covers_part_of_pump_electricity():
    d0 = date(2025, 3, 1)
    days_ = [d0 + timedelta(i) for i in range(10)]
    temps = {d.isoformat(): 5.0 for d in days_}
    gas = {d.isoformat(): 4.0 for d in days_}
    # PV only last year: this year's days fall back to the same date a year earlier
    pv_ly = {(d.replace(year=2024)).isoformat(): 20.0 for d in days_}
    groups = [{"house": {d.isoformat(): 12.0 for d in days_}, "exclude": {}}]
    r = rule(pv_ids=["pv"], losses_pct=0, share_pct=100, el_meters=[{"name": "", "house_ids": ["h"]}])
    base = roi.roi({"start_date": d0.isoformat(), "rules": [{**r, "pv_ids": []}]}, [], TAR,
                   {"h": {"all": gas, "temp": temps, "groups": groups}}, days_[-1])
    res = roi.roi({"start_date": d0.isoformat(), "rules": [r]}, [], TAR,
                  {"h": {"all": gas, "temp": temps, "groups": groups, "pv": pv_ly}}, days_[-1])
    v = res["months"][0]["rules"]["h"]
    assert v["pv"] == 200 and v["pv_ly_days"] == 10
    el_day = v["el"] / 10
    cov_day = min(el_day, 20 - 12)
    assert abs(v["pv_cov"] - cov_day * 10) < 0.01
    assert res["saved"] > base["saved"]
    assert abs(v["pvc:5"] - v["pv_cov"]) < 0.05        # grid point k=1.0 equals the actual case
    assert hp.pv_available({}, 5.0, None, {"house_avg": 7.0}) == 0.0
    assert hp.pv_available({"house_kwh_day": 3}, 5.0, None, None) == 2.0


def test_current_day_not_measured():
    d0 = date(2024, 1, 1)
    days_ = [d0 + timedelta(i) for i in range(25)]
    temps = {d.isoformat(): 0.0 for d in days_}
    gas = {d.isoformat(): 9.0 for d in days_}
    r = rule(switch_date=days_[20].isoformat())
    res = roi.roi({"start_date": d0.isoformat(), "rules": [r]}, [], TAR, {"h": {"all": gas, "temp": temps}}, days_[-1])
    v = res["months"][0]["rules"]["h"]
    assert v["m_days"] == 4          # days 20..23; day 24 is today, still running


def test_real_only_day():
    r = {"switch_date": "2026-11-11"}
    assert hp.real_only_day(r, date(2026, 9, 1))
    assert hp.real_only_day(r, date(2026, 11, 10))
    assert not hp.real_only_day(r, date(2026, 8, 31))
    assert not hp.real_only_day({**r, "sim_real_only": False}, date(2026, 10, 1))
    assert not hp.real_only_day({}, date(2026, 10, 1))
    assert hp.real_only_day({"switch_date": "2027-02-01"}, date(2026, 9, 1))
