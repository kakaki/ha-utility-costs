"""Utility Costs: a register of utility invoices, tariffs and instalments.

Compares invoices with Home Assistant meter statistics and computes monthly
costs from tariffs valid on each day.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.helpers.event import async_track_time_change, async_track_time_interval
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from . import calc, export, files, websocket
from .import_path import BadImportPath, read_import_file
from .const import DOMAIN, PANEL_COMPONENT, PANEL_URL, SIGNAL_SUMMARY, SIGNAL_UPDATED, STATIC_URL, SUMMARY_CACHE_SECONDS
from .notifier import Notifier
from .roi_cache import RoiCache
from .stats import DailyStats
from .summary_cache import SummaryCache
from .store import CostStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

PANEL_TITLES = {
    "pl": "Koszty mediów",
    "en": "Utility costs",
    "de": "Nebenkosten",
}


@dataclass
class RuntimeData:
    store: CostStore
    stats: DailyStats
    summaries: SummaryCache
    rois: RoiCache
    notifier: Notifier


type UtilityCostsConfigEntry = ConfigEntry[RuntimeData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    websocket.async_register(hass)
    _register_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: UtilityCostsConfigEntry) -> bool:
    store = CostStore(hass)
    await store.async_load(entry.data.get("currency") or hass.config.currency or "EUR")
    stats = DailyStats(hass, SUMMARY_CACHE_SECONDS)
    summaries = SummaryCache(hass, store, stats)
    await summaries.async_load()
    rois = RoiCache(hass, store, stats)
    await rois.async_load()
    notifier = Notifier(hass, store)
    await notifier.async_load()
    entry.runtime_data = RuntimeData(store=store, stats=stats, summaries=summaries, rois=rois, notifier=notifier)

    integration = await async_get_integration(hass, DOMAIN)
    version = str(integration.version or "0")
    frontend_dir = Path(__file__).parent / "frontend"
    flags = hass.data.setdefault(DOMAIN, {})
    if not flags.get("static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(frontend_dir), cache_headers=False)]
        )
        flags["static"] = True
    if not flags.get("views"):
        hass.http.register_view(files.UploadView())
        hass.http.register_view(files.FileView())
        hass.http.register_view(export.ExportView())
        hass.http.register_view(export.TemplateView())
        hass.http.register_view(export.ImportTableView())
        flags["views"] = True
    card_url = f"{STATIC_URL}/utility-costs-card.js?v={version}"
    if flags.get("card") != card_url:
        frontend.add_extra_js_url(hass, card_url)
        flags["card"] = card_url
    lang = (hass.config.language or "en").split("-")[0]
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_COMPONENT,
        frontend_url_path=PANEL_URL,
        sidebar_title=PANEL_TITLES.get(lang, PANEL_TITLES["en"]),
        sidebar_icon="mdi:cash-multiple",
        module_url=f"{STATIC_URL}/utility-costs-panel.js?v={version}",
        require_admin=False,
        config={"version": version},
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    @callback
    def _sync(*_: Any) -> None:
        hass.async_create_task(_async_sync_helpers(hass, store))

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATED, _sync))
    entry.async_on_unload(async_track_time_change(hass, _sync, hour=0, minute=0, second=30))
    _sync()

    # Year summaries: recompute affected years after changes, keep the
    # current year fresh (hourly + after midnight), warm it after start.
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATED, summaries.schedule_changed))
    entry.async_on_unload(async_track_time_interval(hass, summaries.async_refresh_current, timedelta(hours=1)))
    entry.async_on_unload(async_track_time_change(hass, summaries.async_refresh_current, hour=0, minute=5, second=0))
    hass.loop.call_later(60, summaries.schedule_changed)

    # Investment payback: recompute changed projects, current month hourly.
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATED, rois.schedule_changed))
    entry.async_on_unload(async_track_time_interval(hass, rois.async_refresh_all, timedelta(hours=1)))
    hass.loop.call_later(90, rois.schedule_changed)

    # Notifications: instalments every morning and after changes,
    # invoice deviations whenever a year summary was recalculated.
    @callback
    def _summary_done(year: int) -> None:
        if year >= dt_util.now().year - 1:
            hass.async_create_task(notifier.async_check_summary(summaries.cached(year)))

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_SUMMARY, _summary_done))

    @callback
    def _changed(*_: Any) -> None:
        hass.async_create_task(notifier.async_check_installments())

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATED, _changed))
    entry.async_on_unload(async_track_time_change(hass, notifier.async_check_installments, hour=9, minute=0, second=0))
    hass.loop.call_later(120, _changed)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: UtilityCostsConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_URL)
    card = hass.data.get(DOMAIN, {}).pop("card", None)
    if card:
        frontend.remove_extra_js_url(hass, card)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


def current_values(store: CostStore) -> dict[str, float]:
    """Current tariff values keyed 'medium.zone' and 'medium.fixed'."""
    today = dt_util.now().date()
    out: dict[str, float] = {}
    for medium in store.media:
        tariff = calc.tariff_on(store.data["tariffs"], medium["id"], today)
        if tariff is None:
            continue
        for zone in calc.zone_ids(medium):
            out[f"{medium['id']}.{zone}"] = calc.price_for(tariff, zone)
        fixed = float(tariff.get("fixed_monthly") or 0)
        fixed += sum(float(e.get("amount") or 0) for e in tariff.get("extras") or [] if e.get("per") != "unit")
        out[f"{medium['id']}.fixed"] = round(fixed, 4)
    return out


async def _async_sync_helpers(hass: HomeAssistant, store: CostStore) -> None:
    """Keep legacy input_number helpers equal to the current tariff."""
    mapping: dict[str, str] = store.data["settings"].get("sync") or {}
    if not mapping:
        return
    values = current_values(store)
    for key, entity_id in mapping.items():
        if key not in values or not entity_id:
            continue
        state = hass.states.get(entity_id)
        if state is None:
            continue
        try:
            if abs(float(state.state) - values[key]) < 1e-9:
                continue
        except ValueError:
            pass
        domain = entity_id.split(".")[0]
        if domain not in ("input_number", "number"):
            continue
        await hass.services.async_call(
            domain, "set_value", {"entity_id": entity_id, "value": values[key]}, blocking=False
        )


def _rt(hass: HomeAssistant) -> RuntimeData:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_loaded")
    return entries[0].runtime_data


def _register_services(hass: HomeAssistant) -> None:
    async def import_file(call: ServiceCall) -> ServiceResponse:
        rt = _rt(hass)
        rel = call.data["path"]
        try:
            payload = await hass.async_add_executor_job(read_import_file, hass.config.config_dir, rel)
        except BadImportPath as err:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="bad_path") from err
        except (OSError, ValueError) as err:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="bad_file", translation_placeholders={"error": str(err)}
            ) from err
        counts = await rt.store.async_import(payload, call.data["mode"])
        rt.stats.invalidate()
        return {"imported": counts}

    async def export(call: ServiceCall) -> ServiceResponse:
        return _rt(hass).store.data

    async def add_invoice(call: ServiceCall) -> ServiceResponse:
        rt = _rt(hass)
        item = dict(call.data)
        if rt.store.medium(item["medium"]) is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="unknown_medium")
        for key in ("period_from", "period_to", "issue_date", "due_date"):
            if item.get(key):
                item[key] = str(item[key])
        item.setdefault("kind", "settlement")
        item.setdefault("source", "service")
        saved = await rt.store.async_upsert("invoices", item)
        return {"id": saved["id"]}

    # every service reads or changes the whole register: admin users (and automations) only
    async_register_admin_service(
        hass,
        DOMAIN,
        "import_file",
        import_file,
        schema=vol.Schema({
            vol.Required("path"): cv.string,
            vol.Optional("mode", default="merge"): vol.In(["merge", "replace"]),
        }),
        supports_response=SupportsResponse.OPTIONAL,
    )
    async_register_admin_service(hass, DOMAIN, "export", export, supports_response=SupportsResponse.ONLY)
    async_register_admin_service(
        hass,
        DOMAIN,
        "add_invoice",
        add_invoice,
        schema=vol.Schema({
            vol.Required("medium"): cv.string,
            vol.Required("period_from"): cv.date,
            vol.Required("period_to"): cv.date,
            vol.Required("amount"): vol.Coerce(float),
            vol.Optional("quantities", default={}): {cv.string: vol.Coerce(float)},
            vol.Optional("balance"): vol.Coerce(float),
            vol.Optional("supplier_id"): cv.string,
            vol.Optional("number"): cv.string,
            vol.Optional("issue_date"): cv.date,
            vol.Optional("due_date"): cv.date,
            vol.Optional("kind"): vol.In(["settlement", "forecast", "correction", "periodic"]),
            vol.Optional("note"): cv.string,
        }),
        supports_response=SupportsResponse.OPTIONAL,
    )
