"""Invoice attachments (PDF / photos) and AI extraction via ai_task.

Files live in the local media folder (/media/utility_costs/) so the
ai_task integration can read them as media-source attachments. The
original file name is kept in the invoice record only.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import timedelta
from pathlib import Path
from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

MAX_SIZE = 20 * 1024 * 1024
TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
}
ID_RE = re.compile(r"^[0-9a-f]{32}\.(pdf|jpg|jpeg|png|webp|heic)$")
SUBDIR = "utility_costs"


def files_dir(hass: HomeAssistant) -> Path:
    base = (hass.config.media_dirs or {}).get("local") or hass.config.path("media")
    return Path(base) / SUBDIR


def file_path(hass: HomeAssistant, file_id: str) -> Path:
    if not ID_RE.match(file_id or ""):
        raise HomeAssistantError("bad_file_id")
    return files_dir(hass) / file_id


def media_source_id(file_id: str) -> str:
    return f"media-source://media_source/local/{SUBDIR}/{file_id}"


class UploadView(HomeAssistantView):
    url = f"/api/{DOMAIN}/upload"
    name = f"api:{DOMAIN}:upload"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        user = request["hass_user"]
        if not user.is_admin:
            return self.json_message("admin only", 403)
        reader = await request.multipart()
        field = await reader.next()
        if field is None or field.name != "file":
            return self.json_message("no file", 400)
        name = Path(field.filename or "file").name
        ext = Path(name).suffix.lower()
        if ext not in TYPES:
            return self.json_message("unsupported type", 400)
        file_id = f"{uuid.uuid4().hex}{ext}"
        target = file_path(hass, file_id)
        chunks: list[bytes] = []
        size = 0
        while chunk := await field.read_chunk(256 * 1024):
            size += len(chunk)
            if size > MAX_SIZE:
                return self.json_message("file too large", 413)
            chunks.append(chunk)

        def _write() -> None:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(b"".join(chunks))

        await hass.async_add_executor_job(_write)
        return self.json({"id": file_id, "name": name, "size": size, "type": TYPES[ext]})


class FileView(HomeAssistantView):
    url = f"/api/{DOMAIN}/file/{{file_id}}"
    name = f"api:{DOMAIN}:file"
    requires_auth = True

    async def get(self, request: web.Request, file_id: str) -> web.StreamResponse:
        hass: HomeAssistant = request.app["hass"]
        try:
            path = file_path(hass, file_id)
        except HomeAssistantError:
            return self.json_message("bad id", 400)
        if not await hass.async_add_executor_job(path.is_file):
            return self.json_message("not found", 404)
        return web.FileResponse(path, headers={"Content-Type": TYPES[path.suffix.lower()]})


def signed_url(hass: HomeAssistant, file_id: str) -> str:
    file_path(hass, file_id)
    return async_sign_path(hass, f"/api/{DOMAIN}/file/{file_id}", timedelta(minutes=10))


async def async_delete(hass: HomeAssistant, file_id: str) -> bool:
    path = file_path(hass, file_id)

    def _rm() -> bool:
        if path.is_file():
            path.unlink()
            return True
        return False

    return await hass.async_add_executor_job(_rm)


def _pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader  # optional, used when installed
    except ImportError:
        return ""
    try:
        reader = PdfReader(str(path))
        return "\n".join((p.extract_text() or "") for p in reader.pages[:6])[:20000]
    except Exception:  # noqa: BLE001 - broken PDFs fall back to the attachment
        return ""


def _structure(media: list[dict], suppliers: list[dict]) -> dict[str, Any]:
    zones = sorted({z["id"] for m in media for z in (m.get("zones") or [{"id": "all"}])})
    s: dict[str, Any] = {
        "medium": {"description": "Medium id: " + ", ".join(m["id"] for m in media), "required": True,
                   "selector": {"select": {"options": [m["id"] for m in media]}}},
        "supplier_name": {"description": "Seller / supplier name", "selector": {"text": {}}},
        "number": {"description": "Invoice number", "selector": {"text": {}}},
        "kind": {"description": "settlement (rozliczeniowa), periodic (okresowa), forecast (prognozowa) or correction (korekta)",
                 "selector": {"select": {"options": ["settlement", "periodic", "forecast", "correction"]}}},
        "issue_date": {"description": "Issue date YYYY-MM-DD", "selector": {"text": {}}},
        "due_date": {"description": "Payment due date YYYY-MM-DD", "selector": {"text": {}}},
        "period_from": {"description": "Billing period start YYYY-MM-DD", "required": True, "selector": {"text": {}}},
        "period_to": {"description": "Billing period end YYYY-MM-DD", "required": True, "selector": {"text": {}}},
        "amount": {"description": "Gross value of the consumption in the period (total gross invoice value before deducting prepayments)", "required": True,
                   "selector": {"number": {"mode": "box", "step": 0.01}}},
        "balance": {"description": "Settlement result: positive = overpayment (nadpłata), negative = amount still to pay (niedopłata); empty if none",
                    "selector": {"number": {"mode": "box", "step": 0.01}}},
        "reading_start": {"description": "Meter reading at period start", "selector": {"number": {"mode": "box", "step": 0.001}}},
        "reading_end": {"description": "Meter reading at period end", "selector": {"number": {"mode": "box", "step": 0.001}}},
        "estimated": {"description": "True if readings are estimated (szacunkowe)", "selector": {"boolean": {}}},
        "note": {"description": "Short note: anything unusual (corrections, estimates, several periods)", "selector": {"text": {}}},
    }
    for z in zones:
        s[f"qty_{z}"] = {"description": f"Consumed quantity in zone '{z}' in the medium unit (day/night for electricity tariffs like G12, 'all' for single zone)",
                         "selector": {"number": {"mode": "box", "step": 0.001}}}
    return s


async def async_extract(hass: HomeAssistant, store, file_id: str, medium_hint: str | None) -> dict[str, Any]:
    path = file_path(hass, file_id)
    if not await hass.async_add_executor_job(path.is_file):
        raise HomeAssistantError("file_not_found")
    settings = store.data["settings"]
    if "ai_entity" in settings and not settings.get("ai_entity"):
        raise HomeAssistantError("ai_disabled")
    entity = settings.get("ai_entity") or next(iter(sorted(hass.states.async_entity_ids("ai_task"))), None)
    if not entity:
        raise HomeAssistantError("no_ai_task")
    media = settings.get("media", [])
    text = await hass.async_add_executor_job(_pdf_text, path) if path.suffix.lower() == ".pdf" else ""
    media_desc = "; ".join(
        f"{m['id']} (unit {m.get('unit','')}, zones {', '.join(z['id'] for z in m.get('zones') or [{'id': 'all'}])})"
        for m in media)
    sup_desc = "; ".join(f"{s.get('name')} → {s.get('medium')}" for s in store.data.get("suppliers", []))
    instructions = (
        "Extract the data of this utility invoice (electricity, gas, water, heat, fuel…; the invoice may be in any language, e.g. Polish, German or English). "
        f"Known media: {media_desc}. Known suppliers: {sup_desc}. "
        "Dates must be ISO YYYY-MM-DD. Numbers use a dot as decimal separator, no currency symbols. "
        "For electricity with a day/night (G12) tariff put the consumption into qty_day and qty_night. "
        "If gas is given in kWh and m³, give m³. Leave fields empty when not present."
        + (f" Preferred medium: {medium_hint}." if medium_hint else "")
        + (f"\n\nText layer of the PDF:\n{text}" if text else "")
    )
    data: dict[str, Any] = {
        "task_name": "utility_costs invoice",
        "entity_id": entity,
        "instructions": instructions,
        "structure": _structure(media, store.data.get("suppliers", [])),
        "attachments": [{"media_content_id": media_source_id(file_id), "media_content_type": TYPES[path.suffix.lower()]}],
    }
    resp = await hass.services.async_call("ai_task", "generate_data", data, blocking=True, return_response=True)
    out = dict((resp or {}).get("data") or {})
    # map supplier name to a known supplier id
    name = str(out.pop("supplier_name", "") or "").lower()
    for s in store.data.get("suppliers", []):
        sn = str(s.get("name", "")).lower()
        if sn and name and (sn in name or name in sn) and (not out.get("medium") or s.get("medium") == out.get("medium")):
            out["supplier_id"] = s["id"]
            break
    qty = {k[4:]: v for k, v in list(out.items()) if k.startswith("qty_") and v not in (None, "")}
    for k in [k for k in out if k.startswith("qty_")]:
        out.pop(k)
    medium = next((m for m in media if m["id"] == out.get("medium")), None)
    if medium and qty:
        zone_ids = [z["id"] for z in medium.get("zones") or [{"id": "all"}]]
        out["quantities"] = {z: float(v) for z, v in qty.items() if z in zone_ids} or {zone_ids[0]: float(sum(float(v) for v in qty.values()))}
    out["_source"] = {"entity": entity, "pdf_text": bool(text)}
    return {k: v for k, v in out.items() if v not in (None, "")}
