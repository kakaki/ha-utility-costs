"""WebSocket API used by the panel and dashboard cards."""

from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

from . import calc, files
from .const import COLLECTIONS, DOMAIN


def _runtime(hass: HomeAssistant):
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        raise HomeAssistantError("utility_costs is not set up")
    return entries[0].runtime_data


def _validate_item(rt, collection: str, item: dict[str, Any]) -> None:
    """Minimal validation; raises ValueError with a translatable code."""
    medium = item.get("medium")
    if collection in ("tariffs", "invoices", "installments", "readings", "corrections", "suppliers"):
        if not medium or rt.store.medium(medium) is None:
            raise ValueError("unknown_medium")
    for key in ("valid_from", "valid_to", "period_from", "period_to", "issue_date", "due_date", "date"):
        if item.get(key):
            calc.to_date(item[key])
    if collection == "invoices":
        a, b = calc.to_date(item.get("period_from")), calc.to_date(item.get("period_to"))
        if not a or not b or b < a:
            raise ValueError("bad_period")
    if collection == "tariffs" and not item.get("valid_from"):
        raise ValueError("missing_valid_from")
    if collection == "investments":
        if not item.get("date") or item.get("amount") in (None, ""):
            raise ValueError("missing_fields")
    if collection == "projects":
        if not item.get("name"):
            raise ValueError("missing_fields")
        rules = item.get("rules") or []
        if not isinstance(rules, list):
            raise ValueError("bad_rules")
        for r in rules:
            if not isinstance(r, dict) or not r.get("id"):
                raise ValueError("bad_rules")
            if r.get("type", "qty") in ("qty", "fixed") and rt.store.medium(r.get("medium")) is None:
                raise ValueError("unknown_medium")
    if collection == "corrections":
        y, m = str(item.get("month", ""))[:7].split("-")
        date(int(y), int(m), 1)


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (ws_get_all, ws_save, ws_delete, ws_settings, ws_summary, ws_ha_quantity, ws_import, ws_roi, ws_overview, ws_file_url, ws_file_delete, ws_extract):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get_all"})
@callback
def ws_get_all(hass, connection, msg):
    rt = _runtime(hass)
    connection.send_result(msg["id"], rt.store.data)


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/save",
    vol.Required("collection"): vol.In(COLLECTIONS),
    vol.Required("item"): dict,
})
@websocket_api.async_response
async def ws_save(hass, connection, msg):
    rt = _runtime(hass)
    try:
        _validate_item(rt, msg["collection"], msg["item"])
    except (ValueError, TypeError) as err:
        connection.send_error(msg["id"], "invalid", str(err) or "invalid")
        return
    item = await rt.store.async_upsert(msg["collection"], msg["item"])
    connection.send_result(msg["id"], item)


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/delete",
    vol.Required("collection"): vol.In(COLLECTIONS),
    vol.Required("item_id"): str,
})
@websocket_api.async_response
async def ws_delete(hass, connection, msg):
    rt = _runtime(hass)
    item = next((i for i in rt.store.data.get(msg["collection"], []) if i.get("id") == msg["item_id"]), None)
    ok = await rt.store.async_delete(msg["collection"], msg["item_id"])
    for att in (item or {}).get("attachments") or []:
        try:
            await files.async_delete(hass, att.get("id"))
        except HomeAssistantError:
            pass
    connection.send_result(msg["id"], {"deleted": ok})


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/settings",
    vol.Required("settings"): dict,
})
@websocket_api.async_response
async def ws_settings(hass, connection, msg):
    rt = _runtime(hass)
    settings = msg["settings"]
    media = settings.get("media")
    if not isinstance(media, list) or not all(isinstance(m, dict) and m.get("id") for m in media):
        connection.send_error(msg["id"], "invalid", "bad_media")
        return
    await rt.store.async_set_settings(settings)
    rt.stats.invalidate()
    connection.send_result(msg["id"], rt.store.data["settings"])


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/summary",
    vol.Required("year"): int,
    vol.Optional("force", default=False): bool,
})
@websocket_api.async_response
async def ws_summary(hass, connection, msg):
    rt = _runtime(hass)
    result = await rt.summaries.async_get(msg["year"], force=msg["force"])
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/ha_quantity",
    vol.Required("medium"): str,
    vol.Required("period_from"): str,
    vol.Required("period_to"): str,
})
@websocket_api.async_response
async def ws_ha_quantity(hass, connection, msg):
    rt = _runtime(hass)
    medium = rt.store.medium(msg["medium"])
    start, end = calc.to_date(msg["period_from"]), calc.to_date(msg["period_to"])
    if medium is None or not start or not end or end < start:
        connection.send_error(msg["id"], "invalid", "bad_period")
        return
    end = min(end, dt_util.now().date())
    daily = await rt.stats.async_daily(rt.store.media, start, end)
    connection.send_result(
        msg["id"], calc.ha_quantity(medium, daily, rt.store.data["corrections"], start, end)
    )


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/import",
    vol.Required("data"): dict,
    vol.Optional("mode", default="merge"): vol.In(["merge", "replace"]),
})
@websocket_api.async_response
async def ws_import(hass, connection, msg):
    rt = _runtime(hass)
    counts = await rt.store.async_import(msg["data"], msg["mode"])
    rt.stats.invalidate()
    connection.send_result(msg["id"], counts)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/roi",
    vol.Required("project_id"): str,
    vol.Optional("force", default=False): bool,
})
@websocket_api.async_response
async def ws_roi(hass, connection, msg):
    rt = _runtime(hass)
    result = await rt.rois.async_get(msg["project_id"], force=msg["force"])
    if result is None:
        connection.send_error(msg["id"], "not_found", "project")
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/overview"})
@websocket_api.async_response
async def ws_overview(hass, connection, msg):
    """Current month, year to date and forecast (dashboard card)."""
    rt = _runtime(hass)
    year = dt_util.now().year
    if rt.summaries.cached(year) is None:
        await rt.summaries.async_get(year)
    if rt.summaries.cached(year - 1) is None:
        await rt.summaries.async_get(year - 1)
    res = rt.summaries.overview() or {}
    res["currency"] = rt.store.data["settings"].get("currency") or hass.config.currency
    res["media_info"] = [{"id": m["id"], "name": m.get("name") or "", "unit": m.get("unit") or ""} for m in rt.store.media]
    connection.send_result(msg["id"], res)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/file_url", vol.Required("file_id"): str})
@callback
def ws_file_url(hass, connection, msg):
    try:
        connection.send_result(msg["id"], {"url": files.signed_url(hass, msg["file_id"])})
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/file_delete", vol.Required("file_id"): str})
@websocket_api.async_response
async def ws_file_delete(hass, connection, msg):
    try:
        connection.send_result(msg["id"], {"deleted": await files.async_delete(hass, msg["file_id"])})
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/extract",
    vol.Required("file_id"): str,
    vol.Optional("medium"): vol.Any(str, None),
})
@websocket_api.async_response
async def ws_extract(hass, connection, msg):
    rt = _runtime(hass)
    try:
        result = await files.async_extract(hass, rt.store, msg["file_id"], msg.get("medium"))
    except Exception as err:  # noqa: BLE001 - report AI / file errors to the panel
        connection.send_error(msg["id"], "extract_failed", str(err) or type(err).__name__)
        return
    connection.send_result(msg["id"], result)
