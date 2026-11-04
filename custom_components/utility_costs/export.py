"""Export of a year to Excel (.xlsx) or CSV.

GET /api/utility_costs/export?year=2026&format=xlsx
GET /api/utility_costs/export?year=2026&format=csv&sheet=summary|invoices|installments|tariffs

The .xlsx file is written with the standard library only (zip + XML), so no
extra requirement is needed.
"""

from __future__ import annotations

import csv
import io
import zipfile
from typing import Any
from xml.sax.saxutils import escape

from aiohttp import web

from homeassistant.components.http import KEY_HASS, HomeAssistantView

from . import calc, table_import
from .const import DOMAIN

H = {
    "pl": {
        "summary": "Podsumowanie", "invoices": "Faktury", "installments": "Raty", "tariffs": "Taryfy",
        "month": "Miesiąc", "qty": "ilość", "cost": "koszt", "total": "Razem", "medium": "Medium",
        "supplier": "Dostawca", "number": "Numer", "kind": "Rodzaj", "issue": "Data wystawienia",
        "due": "Termin płatności", "from": "Od", "to": "Do", "amount": "Kwota", "balance": "Saldo",
        "ha": "Z liczników", "dev": "Odchylenie %", "note": "Uwagi", "paid": "Zapłacona", "name": "Nazwa",
        "fixed": "Opłata stała / mies.", "price": "Cena", "unit": "Jednostka", "yes": "tak", "no": "nie",
        "meter_total": "Koszt z liczników", "invoice_total": "Zafakturowano",
        "media": {"electricity": "Prąd", "gas": "Gaz", "water": "Woda", "fuel": "Paliwo"},
    },
    "en": {
        "summary": "Summary", "invoices": "Invoices", "installments": "Instalments", "tariffs": "Tariffs",
        "month": "Month", "qty": "quantity", "cost": "cost", "total": "Total", "medium": "Medium",
        "supplier": "Supplier", "number": "Number", "kind": "Type", "issue": "Issue date",
        "due": "Due date", "from": "From", "to": "To", "amount": "Amount", "balance": "Balance",
        "ha": "From meters", "dev": "Deviation %", "note": "Note", "paid": "Paid", "name": "Name",
        "fixed": "Fixed fee / month", "price": "Price", "unit": "Unit", "yes": "yes", "no": "no",
        "meter_total": "Cost from meters", "invoice_total": "Invoiced",
        "media": {"electricity": "Electricity", "gas": "Gas", "water": "Water", "fuel": "Fuel"},
    },
    "de": {
        "summary": "Übersicht", "invoices": "Rechnungen", "installments": "Abschläge", "tariffs": "Tarife",
        "month": "Monat", "qty": "Menge", "cost": "Kosten", "total": "Summe", "medium": "Medium",
        "supplier": "Anbieter", "number": "Nummer", "kind": "Art", "issue": "Rechnungsdatum",
        "due": "Fällig am", "from": "Von", "to": "Bis", "amount": "Betrag", "balance": "Saldo",
        "ha": "Laut Zähler", "dev": "Abweichung %", "note": "Notiz", "paid": "Bezahlt", "name": "Name",
        "fixed": "Grundgebühr / Monat", "price": "Preis", "unit": "Einheit", "yes": "ja", "no": "nein",
        "meter_total": "Kosten laut Zähler", "invoice_total": "Berechnet",
        "media": {"electricity": "Strom", "gas": "Gas", "water": "Wasser", "fuel": "Kraftstoff"},
    },
}
SHEETS = ("summary", "invoices", "installments", "tariffs")


def _r(v: Any, n: int = 2) -> float | None:
    try:
        return round(float(v), n)
    except (TypeError, ValueError):
        return None


def tables(data: dict, summary: dict, year: int, lang: str) -> dict[str, list[list[Any]]]:
    h = H.get(lang, H["en"])
    media = data.get("settings", {}).get("media", [])
    mname = {m["id"]: m.get("name") or h["media"].get(m["id"], m["id"]) for m in media}
    munit = {m["id"]: m.get("unit") or "" for m in media}
    sup = {s.get("id"): s.get("name", "") for s in data.get("suppliers") or []}

    head = [h["month"]]
    for m in media:
        head += [f"{mname[m['id']]} – {h['qty']} ({munit[m['id']]})", f"{mname[m['id']]} – {h['cost']}"]
    head.append(h["total"])
    rows: list[list[Any]] = [head]
    for mo in summary.get("months") or []:
        row: list[Any] = [mo["month"]]
        tot = 0.0
        for m in media:
            x = (mo.get("media") or {}).get(m["id"]) or {}
            row += [_r(x.get("qty_total"), 3), _r(x.get("cost"))]
            tot += float(x.get("cost") or 0)
        row.append(round(tot, 2))
        rows.append(row)
    totals = summary.get("totals") or {}
    rows.append([])
    rows.append([h["meter_total"], *sum(([None, _r((totals.get(m["id"]) or {}).get("meter_cost"))] for m in media), []),
                 _r(summary.get("meter_total"))])
    rows.append([h["invoice_total"], *sum(([_r((totals.get(m["id"]) or {}).get("invoice_qty"), 3),
                                            _r((totals.get(m["id"]) or {}).get("invoice_amount"))] for m in media), []),
                 _r(summary.get("invoice_total"))])

    checks = summary.get("checks") or {}
    inv_rows: list[list[Any]] = [[h["medium"], h["supplier"], h["number"], h["kind"], h["issue"], h["due"], h["from"],
                                  h["to"], h["qty"], h["unit"], h["ha"], h["dev"], h["amount"], h["balance"], h["note"]]]
    invs = [i for i in data.get("invoices") or [] if calc.invoice_year(i) == year]
    for i in sorted(invs, key=lambda x: (str(x.get("medium")), str(x.get("period_from")))):
        c = checks.get(i.get("id")) or {}
        inv_rows.append([
            mname.get(i.get("medium"), i.get("medium")), sup.get(i.get("supplier_id"), ""), i.get("number") or "",
            i.get("kind") or "", i.get("issue_date") or "", i.get("due_date") or "", i.get("period_from") or "",
            i.get("period_to") or "", _r(sum(float(v or 0) for v in (i.get("quantities") or {}).values()), 3),
            munit.get(i.get("medium"), ""), _r(c.get("ha_total"), 3), _r(c.get("deviation_pct"), 1),
            _r(i.get("amount")), _r(i.get("balance")), i.get("note") or "",
        ])

    inst_rows: list[list[Any]] = [[h["medium"], h["supplier"], h["from"], h["to"], h["due"], h["amount"], h["paid"], h["note"]]]
    for i in sorted(summary.get("installments") or [], key=lambda x: str(x.get("due_date") or x.get("period_from"))):
        inst_rows.append([mname.get(i.get("medium"), i.get("medium")), sup.get(i.get("supplier_id"), ""),
                          i.get("period_from") or "", i.get("period_to") or "", i.get("due_date") or "",
                          _r(i.get("amount")), h["yes"] if i.get("paid") else h["no"], i.get("note") or ""])

    tar_rows: list[list[Any]] = [[h["medium"], h["supplier"], h["name"], h["from"], h["to"], h["price"], h["unit"], h["fixed"], h["note"]]]
    for t in sorted(data.get("tariffs") or [], key=lambda x: (str(x.get("medium")), str(x.get("valid_from")))):
        prices = t.get("prices") or {}
        price = "; ".join(f"{z}: {v}" for z, v in prices.items()) if len(prices) > 1 else _r(next(iter(prices.values()), None), 4)
        tar_rows.append([mname.get(t.get("medium"), t.get("medium")), sup.get(t.get("supplier_id"), ""), t.get("name") or "",
                         t.get("valid_from") or "", t.get("valid_to") or "", price, munit.get(t.get("medium"), ""),
                         _r(t.get("fixed_monthly")), t.get("note") or ""])

    return {h["summary"]: rows, h["invoices"]: inv_rows, h["installments"]: inst_rows, h["tariffs"]: tar_rows}


def to_csv(rows: list[list[Any]], lang: str) -> bytes:
    """CSV that opens directly in Excel: ';' and decimal comma for pl/de."""
    local = lang in ("pl", "de")
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";" if local else ",", lineterminator="\r\n")
    for row in rows:
        w.writerow(["" if v is None else (str(v).replace(".", ",") if local and isinstance(v, float) else v) for v in row])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def _col(n: int) -> str:
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def _sheet_xml(rows: list[list[Any]]) -> str:
    widths = {}
    for row in rows:
        for j, v in enumerate(row):
            widths[j] = min(max(widths.get(j, 8), len(str(v if v is not None else "")) + 2), 60)
    cols = "".join(f'<col min="{j + 1}" max="{j + 1}" width="{w}" customWidth="1"/>' for j, w in sorted(widths.items()))
    out = []
    for i, row in enumerate(rows):
        cells = []
        for j, v in enumerate(row):
            ref = f"{_col(j)}{i + 1}"
            style = ' s="1"' if i == 0 else ""
            if v is None or v == "":
                continue
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                cells.append(f'<c r="{ref}"{style}><v>{v}</v></c>')
            else:
                cells.append(f'<c r="{ref}" t="inlineStr"{style}><is><t xml:space="preserve">{escape(str(v))}</t></is></c>')
        out.append(f'<row r="{i + 1}">{"".join(cells)}</row>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            f'<cols>{cols}</cols><sheetData>{"".join(out)}</sheetData></worksheet>')


def to_xlsx(sheets: dict[str, list[list[Any]]]) -> bytes:
    names = list(sheets)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                   '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                   + "".join(f'<Override PartName="/xl/worksheets/sheet{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(len(names)))
                   + "</Types>")
        z.writestr("_rels/.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                   "</Relationships>")
        z.writestr("xl/workbook.xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                   'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                   + "".join(f'<sheet name="{escape(n[:31])}" sheetId="{i + 1}" r:id="rId{i + 1}"/>' for i, n in enumerate(names))
                   + "</sheets></workbook>")
        z.writestr("xl/_rels/workbook.xml.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + "".join(f'<Relationship Id="rId{i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i + 1}.xml"/>' for i in range(len(names)))
                   + f'<Relationship Id="rId{len(names) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                   "</Relationships>")
        z.writestr("xl/styles.xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                   '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
                   '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
                   '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
                   '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
                   '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
                   '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
                   "</styleSheet>")
        for i, n in enumerate(names):
            z.writestr(f"xl/worksheets/sheet{i + 1}.xml", _sheet_xml(sheets[n]))
    return buf.getvalue()


class ExportView(HomeAssistantView):
    url = f"/api/{DOMAIN}/export"
    name = f"api:{DOMAIN}:export"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        entries = hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries:
            return web.Response(status=503)
        rt = entries[0].runtime_data
        try:
            year = int(request.query.get("year", ""))
        except ValueError:
            return web.Response(status=400, text="year")
        fmt = request.query.get("format", "xlsx")
        lang = (hass.config.language or "en").split("-")[0]
        summary = await rt.summaries.async_get(year)
        sheets = await hass.async_add_executor_job(tables, rt.store.data, summary, year, lang)
        if fmt == "csv":
            idx = SHEETS.index(request.query.get("sheet", "summary")) if request.query.get("sheet", "summary") in SHEETS else 0
            name, rows = list(sheets.items())[idx]
            body = to_csv(rows, lang)
            return web.Response(body=body, content_type="text/csv", charset="utf-8",
                                headers={"Content-Disposition": f'attachment; filename="utility_costs_{year}_{SHEETS[idx]}.csv"'})
        body = await hass.async_add_executor_job(to_xlsx, sheets)
        return web.Response(
            body=body,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="utility_costs_{year}.xlsx"'},
        )


class TemplateView(HomeAssistantView):
    """Example file for the import window."""

    url = f"/api/{DOMAIN}/import_template"
    name = f"api:{DOMAIN}:import_template"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        col = request.query.get("collection", "invoices")
        if col not in table_import.FIELDS:
            return web.Response(status=400, text="collection")
        rows = table_import.template(col)
        lang = (hass.config.language or "en").split("-")[0]
        if request.query.get("format") == "csv":
            return web.Response(body=to_csv(rows, lang), content_type="text/csv", charset="utf-8",
                                headers={"Content-Disposition": f'attachment; filename="import_{col}.csv"'})
        body = await hass.async_add_executor_job(to_xlsx, {col: rows})
        return web.Response(body=body, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            headers={"Content-Disposition": f'attachment; filename="import_{col}.xlsx"'})


class ImportTableView(HomeAssistantView):
    """Upload an .xlsx/.csv file; commit=0 returns a preview, commit=1 saves."""

    url = f"/api/{DOMAIN}/import_table"
    name = f"api:{DOMAIN}:import_table"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        if not request["hass_user"].is_admin:
            return self.json_message("admin only", 403)
        entries = hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries:
            return self.json_message("not loaded", 503)
        rt = entries[0].runtime_data
        fields: dict[str, Any] = {}
        raw = b""
        name = ""
        reader = await request.multipart()
        while (part := await reader.next()) is not None:
            if part.name == "file":
                name = part.filename or ""
                raw = await part.read(decode=False)
                if len(raw) > 10 * 1024 * 1024:
                    return self.json_message("file too large", 413)
            else:
                fields[part.name] = (await part.text()).strip()
        col = fields.get("collection", "")
        if col not in table_import.FIELDS or not raw:
            return self.json_message("bad request", 400)
        try:
            rows = await hass.async_add_executor_job(table_import.parse, raw, name)
            res = table_import.convert(col, rows, rt.store.data, fields.get("project_id") or None)
        except Exception as err:  # noqa: BLE001 - report unreadable files to the panel
            return self.json_message(f"unreadable file: {err}", 400)
        if fields.get("commit") == "1" and res["items"]:
            payload: dict[str, list] = {col: res["items"]}
            if res["new_suppliers"]:
                payload["suppliers"] = res["new_suppliers"]
            await rt.store.async_import(payload, "merge")
            res["saved"] = len(res["items"])
        res["total"] = len(res["items"])
        res["items"] = res["items"][:100]
        return self.json(res)
