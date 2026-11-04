import io
import sys
import zipfile
from datetime import date, timedelta

roi = sys.modules["uc.roi"]
ov = sys.modules["uc.overview"]
ti = sys.modules["uc.table_import"]
ex = sys.modules["uc.export"]

TAR = [{"medium": "electricity", "valid_from": "2024-01-01", "prices": {"day": 1.0}, "fixed_monthly": 30},
       {"medium": "electricity", "valid_from": "2025-06-15", "prices": {"day": 1.2}, "fixed_monthly": 30}]


def test_split_history_equals_full():
    today = date(2025, 11, 4)
    proj = {"id": "p", "start_date": "2024-03-10", "rules": [
        {"id": "r", "type": "qty", "medium": "electricity", "zone": "day", "estimate_per_year": 3000},
        {"id": "m", "type": "money", "amount_per_year": 365}]}
    series = {}
    d = date(2024, 5, 1)
    while d <= today:
        series[d.isoformat()] = 5.0 + d.month
        d += timedelta(days=1)
    daily = {"r": {"all": series}}
    inv = [{"date": "2024-03-10", "amount": 20000}]
    full = roi.roi(proj, inv, TAR, daily, today)
    start = roi.project_start(proj, inv, today)
    prof = roi.profiles_for(proj, daily, start, today)
    first = today.replace(day=1)
    closed = roi.history(proj, TAR, daily, start, first - timedelta(days=1), prof)
    cur = roi.history(proj, TAR, {"r": {"all": {k: v for k, v in series.items() if k >= first.isoformat()}}}, first, today, prof)
    split = roi.finalize(proj, inv, roi.merge_history(closed, cur), today)
    assert split == full


def _month(mk, cost, dd, days):
    return {"month": mk, "media": {"e": {"cost": cost, "data_days": dd, "days": days}}}


def test_overview_forecast():
    cur = {"months": [_month("2026-01", 100, 31, 31), _month("2026-02", 80, 28, 28), _month("2026-03", 15, 3, 3)]}
    prev = {"months": [_month(f"2025-{m:02d}", 50, 30, 30) for m in range(1, 13)]}
    r = ov.overview(cur, prev, date(2026, 3, 3))
    assert r["month_cost"] == 15 and r["ytd"] == 195
    assert r["month_forecast"] == 155.0  # 15 / 3 * 31
    assert r["year_forecast"] == round(180 + 155 + 9 * 50, 2)
    assert r["prev_year_total"] == 600
    assert r["media"]["e"]["ytd"] == 195


DATA = {"settings": {"media": [{"id": "electricity", "zones": [{"id": "day"}, {"id": "night"}]},
                               {"id": "gas", "name": "Gaz ziemny", "zones": [{"id": "all"}]}]},
        "suppliers": [{"id": "t", "name": "Northgrid Energy"}], "invoices": [{"id": "x", "medium": "gas", "number": "BF-1"}],
        "projects": [{"id": "pv", "name": "Instalacja PV"}], "investments": []}


def test_import_csv_polish():
    raw = ("Medium;Okres od;Okres do;Kwota brutto;Ilość;Dostawca;Numer\n"
           "Prąd;20.02.2026;04.08.2026;1 105,90 €;163;Northgrid Energy;NE-1\n"
           "Gaz ziemny;2025-07-12;2026-07-09;1060,40;915;BlueFlame Gas;BF-1\n"
           "prąd;2026-08-05;2026-08-01;10;1;;\n"
           "woda;2026-08-05;2026-09-01;10;1;;\n").encode("cp1250")
    r = ti.convert("invoices", ti.parse(raw, "f.csv"), DATA)
    assert len(r["items"]) == 1 and r["duplicates"] == 1
    it = r["items"][0]
    assert it["amount"] == 1105.90 and it["quantities"] == {"total": 163.0} and it["supplier_id"] == "t"
    assert [e["error"] for e in r["errors"]] == ["bad_period", "medium"]


def test_import_missing_column():
    r = ti.convert("invoices", [["medium", "kwota"], ["gas", 1]], DATA)
    assert set(r["missing"]) == {"period_from", "period_to"}


def test_xlsx_roundtrip_and_investments():
    rows = [["Data", "Kwota", "Opis", "Kategoria", "Projekt"], [44634, 6200, "Panele", "panele", "Instalacja PV"],
            ["02.11.2023", "2 400,00", "Magazyn", "magazyn", ""]]
    raw = ex.to_xlsx({"x": rows})
    assert zipfile.ZipFile(io.BytesIO(raw)).testzip() is None
    back = ti.parse(raw, "a.xlsx")
    r = ti.convert("investments", back, DATA)
    assert [(i["date"], i["amount"], i["category"], i["project_id"]) for i in r["items"]] == [
        ("2022-03-14", 6200.0, "panels", "pv"), ("2023-11-02", 2400.0, "batteries", "pv")]


def test_templates_import_cleanly():
    for col in ti.FIELDS:
        rows = ti.template(col)
        data = {**DATA, "settings": {"media": DATA["settings"]["media"] + [{"id": "water", "zones": [{"id": "all"}]}]}, "invoices": []}
        r = ti.convert(col, rows, data)
        assert not r["missing"] and not r["errors"], (col, r)
        assert len(r["items"]) == 2


def test_csv_export_locale():
    assert ex.to_csv([["a", 1.5]], "pl").decode("utf-8-sig") == "a;1,5\r\n"
    assert ex.to_csv([["a", 1.5]], "en").decode("utf-8-sig") == "a,1.5\r\n"
