"""Sensors: current tariff prices, fixed fees, settlement balance, next instalment."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from . import calc
from .const import DOMAIN, SIGNAL_SUMMARY, SIGNAL_UPDATED

NAMES = {
    "pl": {"electricity": "Prąd", "gas": "Gaz", "water": "Woda", "day": "dzień", "night": "noc", "all": ""},
    "en": {"electricity": "Electricity", "gas": "Gas", "water": "Water", "day": "day", "night": "night", "all": ""},
    "de": {"electricity": "Strom", "gas": "Gas", "water": "Wasser", "day": "Tag", "night": "Nacht", "all": ""},
}


def _label(hass: HomeAssistant, key: str, given: str | None) -> str:
    if given:
        return given
    lang = (hass.config.language or "en").split("-")[0]
    return NAMES.get(lang, NAMES["en"]).get(key, key)


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    store = entry.runtime_data.store
    currency = store.data["settings"].get("currency") or hass.config.currency
    entities: list[SensorEntity] = []
    for medium in store.media:
        mname = _label(hass, medium["id"], medium.get("name"))
        for zone in medium.get("zones") or [{"id": "all"}]:
            zname = _label(hass, zone["id"], zone.get("name"))
            entities.append(PriceSensor(entry, store, medium, zone["id"], mname, zname, currency))
        entities.append(FixedSensor(entry, store, medium, mname, currency))
        entities.append(BalanceSensor(entry, store, medium, mname, currency))
        entities.append(InstallmentSensor(entry, store, medium, mname, currency))
    summaries = entry.runtime_data.summaries
    lang = (hass.config.language or "en").split("-")[0]
    entities.append(OverviewSensor(entry, summaries, "month_cost", currency, lang))
    entities.append(OverviewSensor(entry, summaries, "year_forecast", currency, lang))
    async_add_entities(entities)


class _Base(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry, store, medium: dict[str, Any], key: str, mname: str) -> None:
        self._store = store
        self._medium_id = medium["id"]
        self._attr_unique_id = f"{entry.entry_id}_{medium['id']}_{key}"
        self._attr_translation_placeholders = {"medium": mname}
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_{medium['id']}")},
            name=mname,
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def medium(self) -> dict[str, Any] | None:
        return self._store.medium(self._medium_id)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATED, self._refresh))
        self._refresh()

    @callback
    def _refresh(self) -> None:
        self._update()
        if self.hass:
            self.async_write_ha_state()

    def _update(self) -> None:
        raise NotImplementedError

    def _tariff(self):
        return calc.tariff_on(self._store.data["tariffs"], self._medium_id, dt_util.now().date())


class PriceSensor(_Base):
    _attr_translation_key = "price"
    _attr_suggested_display_precision = 4

    def __init__(self, entry, store, medium, zone: str, mname: str, zname: str, currency: str) -> None:
        super().__init__(entry, store, medium, f"price_{zone}", mname)
        self._zone = zone
        self._attr_translation_placeholders = {"medium": mname, "zone": f" {zname}" if zname else ""}
        self._attr_native_unit_of_measurement = f"{currency}/{medium.get('unit') or 'unit'}"

    def _update(self) -> None:
        t = self._tariff()
        self._attr_native_value = calc.price_for(t, self._zone) if t else None
        self._attr_extra_state_attributes = {
            "valid_from": t.get("valid_from") if t else None,
            "tariff": t.get("name") if t else None,
        }


class FixedSensor(_Base):
    _attr_translation_key = "fixed_fee"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_suggested_display_precision = 2

    def __init__(self, entry, store, medium, mname, currency) -> None:
        super().__init__(entry, store, medium, "fixed_fee", mname)
        self._attr_native_unit_of_measurement = currency

    def _update(self) -> None:
        t = self._tariff()
        if t is None:
            self._attr_native_value = None
            return
        value = float(t.get("fixed_monthly") or 0)
        value += sum(float(e.get("amount") or 0) for e in t.get("extras") or [] if e.get("per") != "unit")
        self._attr_native_value = round(value, 2)


class BalanceSensor(_Base):
    _attr_translation_key = "last_balance"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_suggested_display_precision = 2

    def __init__(self, entry, store, medium, mname, currency) -> None:
        super().__init__(entry, store, medium, "last_balance", mname)
        self._attr_native_unit_of_measurement = currency

    def _update(self) -> None:
        invs = [
            i for i in self._store.data["invoices"]
            if i.get("medium") == self._medium_id and i.get("balance") not in (None, "")
        ]
        invs.sort(key=lambda i: str(i.get("issue_date") or i.get("period_to") or ""))
        last = invs[-1] if invs else None
        self._attr_native_value = float(last["balance"]) if last else None
        self._attr_extra_state_attributes = {
            "period_from": last.get("period_from") if last else None,
            "period_to": last.get("period_to") if last else None,
            "number": last.get("number") if last else None,
        }


class InstallmentSensor(_Base):
    _attr_translation_key = "next_installment"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_suggested_display_precision = 2

    def __init__(self, entry, store, medium, mname, currency) -> None:
        super().__init__(entry, store, medium, "next_installment", mname)
        self._attr_native_unit_of_measurement = currency

    def _update(self) -> None:
        today = dt_util.now().date().isoformat()
        items = [
            i for i in self._store.data["installments"]
            if i.get("medium") == self._medium_id and not i.get("paid")
            and str(i.get("due_date") or i.get("period_to") or "9999") >= today
        ]
        items.sort(key=lambda i: str(i.get("due_date") or i.get("period_to") or ""))
        nxt = items[0] if items else None
        self._attr_native_value = float(nxt.get("amount") or 0) if nxt else None
        self._attr_extra_state_attributes = {
            "due_date": nxt.get("due_date") if nxt else None,
            "period_from": nxt.get("period_from") if nxt else None,
            "period_to": nxt.get("period_to") if nxt else None,
            "unpaid_count": len(items),
        }


class OverviewSensor(SensorEntity):
    """Total cost of the current month / forecast of the whole year."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_suggested_display_precision = 2

    def __init__(self, entry, summaries, key: str, currency: str, lang: str = "en") -> None:
        self._summaries = summaries
        self._key = key
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_native_unit_of_measurement = currency
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_overview")},
            name={"pl": "Koszty mediów", "de": "Nebenkosten"}.get(lang, "Utility costs"),
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_SUMMARY, self._refresh))
        self._refresh()

    @callback
    def _refresh(self, *_: Any) -> None:
        ov = self._summaries.overview()
        if not ov:
            self._attr_native_value = None
        elif self._key == "month_cost":
            self._attr_native_value = ov["month_cost"]
            self._attr_extra_state_attributes = {
                "month": ov["month"], "forecast": ov["month_forecast"],
                "media": {k: v["month_cost"] for k, v in ov["media"].items()},
            }
        else:
            self._attr_native_value = ov["year_forecast"]
            self._attr_extra_state_attributes = {
                "year": ov["year"], "year_to_date": ov["ytd"], "previous_year": ov["prev_year_total"],
                "previous_year_to_date": ov["prev_ytd"],
                "media": {k: v["year_forecast"] for k, v in ov["media"].items()},
            }
        if self.hass:
            self.async_write_ha_state()
