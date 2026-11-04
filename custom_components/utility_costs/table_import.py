"""Import of invoices, instalments, tariffs and investment expenses from
Excel (.xlsx) or CSV files.

The first row holds column names. Names are matched case-insensitively and
may be given in English, Polish or German (see FIELDS). Dates may be
YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY or Excel dates; numbers may use a decimal
comma, spaces and a currency suffix ("1 234,56 zł").

Everything except parse()/xlsx reading is pure and unit tested.
"""

from __future__ import annotations

import csv
import io
import re
import unicodedata
import uuid
import zipfile
from datetime import date, timedelta
from typing import Any
from xml.etree import ElementTree as ET

# key, required, kind, aliases (pl/en/de), example values
FIELDS: dict[str, list[tuple[str, bool, str, list[str], list[Any]]]] = {
    "invoices": [
        ("medium", True, "medium", ["medium", "media", "rodzaj medium", "medien", "typ"], ["electricity", "gas"]),
        ("period_from", True, "date", ["period_from", "okres od", "od", "from", "von", "zeitraum von"], ["2026-02-20", "2025-07-12"]),
        ("period_to", True, "date", ["period_to", "okres do", "do", "to", "bis", "zeitraum bis"], ["2026-08-04", "2026-07-09"]),
        ("amount", True, "number", ["amount", "kwota", "kwota brutto", "brutto", "betrag", "suma", "total"], [105.90, 1060.40]),
        ("quantity", False, "number", ["quantity", "ilosc", "zuzycie", "menge", "verbrauch", "qty"], [163, 915]),
        ("qty_day", False, "number", ["qty_day", "ilosc dzien", "dzien", "day", "tag"], [None, None]),
        ("qty_night", False, "number", ["qty_night", "ilosc noc", "noc", "night", "nacht"], [None, None]),
        ("supplier", False, "text", ["supplier", "dostawca", "sprzedawca", "anbieter", "lieferant"], ["Northgrid Energy", "BlueFlame Gas"]),
        ("number", False, "text", ["number", "numer", "nr", "numer faktury", "rechnungsnummer", "nummer"], ["NE-2026-0123", "BF-2026-0077"]),
        ("kind", False, "kind", ["kind", "rodzaj", "typ faktury", "art"], ["settlement", "settlement"]),
        ("issue_date", False, "date", ["issue_date", "data wystawienia", "wystawiona", "rechnungsdatum"], ["2026-08-10", "2026-07-15"]),
        ("due_date", False, "date", ["due_date", "termin platnosci", "termin", "fallig am", "faellig"], ["2026-08-24", "2026-07-29"]),
        ("balance", False, "number", ["balance", "saldo", "nadplata/niedoplata", "nadplata"], [25.10, -142.60]),
        ("note", False, "text", ["note", "uwagi", "opis", "notiz", "comment", "komentarz"], ["", ""]),
    ],
    "installments": [
        ("medium", True, "medium", ["medium", "media", "medien", "typ"], ["electricity", "gas"]),
        ("amount", True, "number", ["amount", "kwota", "betrag", "rata"], [44, 76]),
        ("due_date", True, "date", ["due_date", "termin platnosci", "termin", "fallig am", "faellig", "data"], ["2026-10-15", "2026-11-20"]),
        ("period_from", False, "date", ["period_from", "okres od", "od", "from", "von"], ["2026-09-01", "2026-10-01"]),
        ("period_to", False, "date", ["period_to", "okres do", "do", "to", "bis"], ["2026-09-30", "2026-11-30"]),
        ("supplier", False, "text", ["supplier", "dostawca", "anbieter"], ["Northgrid Energy", "BlueFlame Gas"]),
        ("paid", False, "bool", ["paid", "zaplacona", "oplacona", "bezahlt"], ["no", "no"]),
        ("note", False, "text", ["note", "uwagi", "notiz"], ["", ""]),
    ],
    "tariffs": [
        ("medium", True, "medium", ["medium", "media", "medien", "typ"], ["electricity", "water"]),
        ("valid_from", True, "date", ["valid_from", "od", "obowiazuje od", "gultig ab", "from"], ["2026-01-01", "2026-01-01"]),
        ("valid_to", False, "date", ["valid_to", "do", "obowiazuje do", "gultig bis", "to"], ["", ""]),
        ("price", False, "number", ["price", "cena", "preis", "cena jednostkowa"], [None, 3.41]),
        ("price_day", False, "number", ["price_day", "cena dzien", "preis tag"], [0.286, None]),
        ("price_night", False, "number", ["price_night", "cena noc", "preis nacht"], [0.145, None]),
        ("fixed_monthly", False, "number", ["fixed_monthly", "oplata stala", "oplata stala mies", "grundgebuhr"], [13.90, 0.71]),
        ("name", False, "text", ["name", "nazwa", "taryfa", "tarif"], ["G12", "Water & sewage"]),
        ("supplier", False, "text", ["supplier", "dostawca", "anbieter"], ["Northgrid Energy", "Clearwater"]),
        ("note", False, "text", ["note", "uwagi", "notiz"], ["", ""]),
    ],
    "investments": [
        ("date", True, "date", ["date", "data", "datum", "data zakupu"], ["2022-03-14", "2023-11-02"]),
        ("amount", True, "number", ["amount", "kwota", "cena", "koszt", "betrag", "preis"], [6200, 2400]),
        ("description", True, "text", ["description", "opis", "nazwa", "produkt", "beschreibung", "name"], ["Solar panels 10 kWp", "Battery storage"]),
        ("category", False, "category", ["category", "kategoria", "kategorie"], ["panels", "batteries"]),
        ("project", False, "text", ["project", "projekt", "inwestycja"], ["", ""]),
        ("comment", False, "text", ["comment", "komentarz", "uwagi", "notiz", "note"], ["", ""]),
    ],
}

MEDIUM_ALIASES = {
    "electricity": ["prad", "energia", "energia elektryczna", "strom", "electricity", "power"],
    "gas": ["gaz", "gas", "erdgas"],
    "water": ["woda", "woda i scieki", "wasser", "water"],
    "fuel": ["paliwo", "benzyna", "olej napedowy", "diesel", "kraftstoff", "fuel"],
}
KIND_ALIASES = {
    "settlement": ["settlement", "rozliczenie", "rozliczeniowa", "abrechnung"],
    "forecast": ["forecast", "prognoza", "prognozowa", "abschlag"],
    "correction": ["correction", "korekta", "korrektur"],
    "periodic": ["periodic", "okresowa", "zwykla", "standard", "rechnung"],
}
CATEGORIES = ["panels", "inverters", "batteries", "mounting", "cabling", "other"]
CAT_ALIASES = {
    "panels": ["panele", "moduly", "module", "panels"], "inverters": ["falownik", "falowniki", "wechselrichter", "inverter"],
    "batteries": ["bateria", "baterie", "magazyn", "batterien", "battery"], "mounting": ["montaz", "montage", "konstrukcja"],
    "cabling": ["okablowanie", "kable", "verkabelung"], "other": ["inne", "sonstiges", "other"],
}
TRUE = {"1", "true", "yes", "tak", "ja", "x", "y", "t"}


def norm(s: Any) -> str:
    s = str(s or "").replace("ł", "l").replace("Ł", "L").replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def to_number(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r"[^\d,.\-]", "", str(v).replace("−", "-"))
    if not s or s in "-,.":
        raise ValueError("number")
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    return float(s)


def to_iso(v: Any) -> str | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)) or re.fullmatch(r"\d{4,5}(\.0+)?", str(v).strip()):
        return (date(1899, 12, 30) + timedelta(days=int(float(v)))).isoformat()
    s = str(v).strip()[:10]
    m = re.fullmatch(r"(\d{4})[-./](\d{1,2})[-./](\d{1,2})", s)
    if m:
        return date(int(m[1]), int(m[2]), int(m[3])).isoformat()
    m = re.fullmatch(r"(\d{1,2})[-./](\d{1,2})[-./](\d{4})", s)
    if m:
        return date(int(m[3]), int(m[2]), int(m[1])).isoformat()
    raise ValueError("date")


# ---------- reading files ----------

def _xlsx_rows(raw: bytes) -> list[list[Any]]:
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", ns):
                shared.append("".join(t.text or "" for t in si.iter(f"{{{ns['m']}}}t")))
        sheet = next((n for n in sorted(z.namelist()) if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n)), None)
        if sheet is None:
            return []
        root = ET.fromstring(z.read(sheet))
    rows: list[list[Any]] = []
    for r in root.iter(f"{{{ns['m']}}}row"):
        row: dict[int, Any] = {}
        for c in r.findall("m:c", ns):
            ref = re.match(r"([A-Z]+)", c.get("r", "A"))[1]
            col = 0
            for ch in ref:
                col = col * 26 + ord(ch) - 64
            t = c.get("t")
            v = c.find("m:v", ns)
            if t == "s" and v is not None:
                val: Any = shared[int(v.text)]
            elif t == "inlineStr":
                val = "".join(x.text or "" for x in c.iter(f"{{{ns['m']}}}t"))
            elif t in ("str", "e"):
                val = v.text if v is not None else ""
            elif t == "b":
                val = v is not None and v.text == "1"
            else:
                val = None if v is None else (float(v.text) if re.fullmatch(r"-?\d+(\.\d+)?(E-?\d+)?", v.text or "") else v.text)
                if isinstance(val, float) and val.is_integer():
                    val = int(val)
            row[col - 1] = val
        if row:
            rows.append([row.get(i) for i in range(max(row) + 1)])
    return rows


def _csv_rows(raw: bytes) -> list[list[Any]]:
    for enc in ("utf-8-sig", "cp1250", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    first = text.splitlines()[0] if text else ""
    delim = max([";", ",", "\t"], key=first.count)
    return [row for row in csv.reader(io.StringIO(text), delimiter=delim)]


def parse(raw: bytes, filename: str) -> list[list[Any]]:
    if raw[:2] == b"PK" or filename.lower().endswith(".xlsx"):
        return _xlsx_rows(raw)
    return _csv_rows(raw)


# ---------- mapping ----------

def _lookup(value: str, aliases: dict[str, list[str]]) -> str | None:
    n = norm(value)
    for key, al in aliases.items():
        if n == key or n in al:
            return key
    return None


def _medium(data: dict, value: Any) -> str | None:
    n = norm(value)
    for m in data.get("settings", {}).get("media", []):
        if n in (norm(m["id"]), norm(m.get("name"))):
            return m["id"]
    mid = _lookup(value, MEDIUM_ALIASES)
    ids = {m["id"] for m in data.get("settings", {}).get("media", [])}
    return mid if mid in ids else None


def columns(collection: str, header: list[Any]) -> dict[int, str]:
    fields = FIELDS[collection]
    out: dict[int, str] = {}
    for i, h in enumerate(header):
        n = norm(h)
        for key, _req, _kind, aliases, _ex in fields:
            if n == key.replace("_", " ") or n == key or n in [norm(a) for a in aliases]:
                if key not in out.values():
                    out[i] = key
                break
    return out


def _dup_key(collection: str, item: dict) -> tuple | None:
    if collection == "invoices":
        if item.get("number"):
            return ("n", item.get("medium"), norm(item["number"]))
        return ("p", item.get("medium"), item.get("period_from"), item.get("period_to"), round(float(item.get("amount") or 0), 2))
    if collection == "installments":
        return (item.get("medium"), item.get("due_date"), round(float(item.get("amount") or 0), 2))
    if collection == "tariffs":
        return (item.get("medium"), item.get("valid_from"), norm(item.get("name")))
    if collection == "investments":
        return (item.get("date"), round(float(item.get("amount") or 0), 2), norm(item.get("description")), item.get("project_id"))
    return None


def convert(collection: str, rows: list[list[Any]], data: dict, project_id: str | None = None) -> dict[str, Any]:
    """Map table rows to store items.

    Returns {"items", "errors": [{"row", "error", "field"}], "duplicates",
    "new_suppliers": [supplier items], "missing": [required columns],
    "columns": {key: header}}.
    """
    if collection not in FIELDS:
        raise ValueError("collection")
    rows = [r for r in rows if any(v not in (None, "") for v in r)]
    if not rows:
        return {"items": [], "errors": [], "duplicates": 0, "new_suppliers": [], "missing": [], "columns": {}}
    header, body = rows[0], rows[1:]
    cols = columns(collection, header)
    fields = {f[0]: f for f in FIELDS[collection]}
    missing = [k for k, f in fields.items() if f[1] and k not in cols.values()]
    res: dict[str, Any] = {"items": [], "errors": [], "duplicates": 0, "new_suppliers": [], "missing": missing,
                           "columns": {k: str(header[i]) for i, k in cols.items()}}
    if missing:
        return res
    sup_by_name = {norm(s.get("name")): s for s in data.get("suppliers") or []}
    projects = data.get("projects") or []
    existing = {_dup_key(collection, i) for i in data.get(collection) or []}
    seen: set = set()
    for n, row in enumerate(body, start=2):
        raw = {key: (row[i] if i < len(row) else None) for i, key in cols.items()}
        item: dict[str, Any] = {}
        try:
            for key, value in raw.items():
                kind = fields[key][2]
                if isinstance(value, str):
                    value = value.strip()
                if value in (None, ""):
                    if fields[key][1]:
                        raise ValueError(f"missing:{key}")
                    continue
                if kind == "date":
                    item[key] = to_iso(value)
                elif kind == "number":
                    item[key] = to_number(value)
                elif kind == "bool":
                    item[key] = value is True or norm(value) in TRUE
                elif kind == "medium":
                    mid = _medium(data, value)
                    if not mid:
                        raise ValueError(f"medium:{value}")
                    item[key] = mid
                elif kind == "kind":
                    item[key] = _lookup(value, KIND_ALIASES) or "settlement"
                elif kind == "category":
                    item[key] = _lookup(value, CAT_ALIASES) or "other"
                else:
                    item[key] = str(value)
        except (ValueError, TypeError) as err:
            msg = str(err)
            field = msg.split(":", 1)[1] if ":" in msg else None
            res["errors"].append({"row": n, "error": msg.split(":")[0] if ":" in msg else msg, "field": field})
            continue
        # collection specific shaping
        if collection == "invoices":
            if item["period_to"] < item["period_from"]:
                res["errors"].append({"row": n, "error": "bad_period", "field": None})
                continue
            q: dict[str, float] = {}
            if item.get("qty_day") is not None or item.get("qty_night") is not None:
                q = {k[4:]: item[k] for k in ("qty_day", "qty_night") if item.get(k) is not None}
            elif item.get("quantity") is not None:
                medium = next((m for m in data["settings"]["media"] if m["id"] == item["medium"]), {})
                zones = [z["id"] for z in medium.get("zones") or [{"id": "all"}]]
                q = {zones[0] if len(zones) == 1 else "total": item["quantity"]}
            for k in ("quantity", "qty_day", "qty_night"):
                item.pop(k, None)
            item["quantities"] = q
            item.setdefault("kind", "settlement")
            item["source"] = "import"
        if collection == "tariffs":
            prices = {k[6:]: item.pop(k) for k in ("price_day", "price_night") if item.get(k) is not None}
            if item.get("price") is not None:
                prices.setdefault("all", item["price"])
            item.pop("price", None)
            if not prices and item.get("fixed_monthly") is None:
                res["errors"].append({"row": n, "error": "missing", "field": "price"})
                continue
            item["prices"] = prices
        if collection == "investments":
            name = item.pop("project", None)
            p = None
            if name:
                p = next((x for x in projects if norm(x.get("name")) == norm(name) or x.get("id") == name), None)
            item["project_id"] = (p or {}).get("id") or project_id or (projects[0]["id"] if projects else None)
            if not item["project_id"]:
                item.pop("project_id")
            item.setdefault("category", "other")
        sup = item.pop("supplier", None)
        if sup and collection != "investments":
            s = sup_by_name.get(norm(sup))
            if s is None:
                s = {"id": uuid.uuid4().hex, "name": sup, "medium": item.get("medium")}
                sup_by_name[norm(sup)] = s
                res["new_suppliers"].append(s)
            item["supplier_id"] = s["id"]
        key = _dup_key(collection, item)
        if key in existing or key in seen:
            res["duplicates"] += 1
            continue
        seen.add(key)
        item["id"] = uuid.uuid4().hex
        res["items"].append(item)
    return res


def template(collection: str) -> list[list[Any]]:
    """Header + two example rows for the import window / template download."""
    fields = FIELDS[collection]
    rows = [[f[0] for f in fields]]
    for i in range(2):
        rows.append([f[4][i] if i < len(f[4]) else None for f in fields])
    return rows
