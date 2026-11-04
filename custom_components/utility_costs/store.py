"""Persistent storage for Utility Costs (.storage/utility_costs)."""

from __future__ import annotations

import copy
import uuid
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import COLLECTIONS, DEFAULT_MEDIA, SIGNAL_UPDATED, STORAGE_KEY, STORAGE_VERSION


def empty_data(currency: str = "EUR") -> dict[str, Any]:
    data: dict[str, Any] = {
        "settings": {"currency": currency, "media": copy.deepcopy(DEFAULT_MEDIA), "sync": {}},
    }
    for col in COLLECTIONS:
        data[col] = []
    return data


class CostStore:
    """In-memory copy of the stored data with save + change signal."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data: dict[str, Any] = empty_data()

    async def async_load(self, currency: str) -> None:
        stored = await self._store.async_load()
        self.data = stored or empty_data(currency)
        self._normalize()

    def _normalize(self) -> None:
        self.data.setdefault("settings", {})
        self.data["settings"].setdefault("media", copy.deepcopy(DEFAULT_MEDIA))
        self.data["settings"].setdefault("sync", {})
        self.data["settings"].setdefault("currency", "EUR")
        for col in COLLECTIONS:
            self.data.setdefault(col, [])
            for item in self.data[col]:
                item.setdefault("id", uuid.uuid4().hex)

    async def async_save(self) -> None:
        await self._store.async_save(self.data)
        async_dispatcher_send(self.hass, SIGNAL_UPDATED)

    @property
    def media(self) -> list[dict[str, Any]]:
        return self.data["settings"]["media"]

    def medium(self, medium_id: str) -> dict[str, Any] | None:
        return next((m for m in self.media if m["id"] == medium_id), None)

    async def async_upsert(self, collection: str, item: dict[str, Any]) -> dict[str, Any]:
        items = self.data[collection]
        item = dict(item)
        if not item.get("id"):
            item["id"] = uuid.uuid4().hex
            items.append(item)
        else:
            for idx, old in enumerate(items):
                if old["id"] == item["id"]:
                    items[idx] = item
                    break
            else:
                items.append(item)
        await self.async_save()
        return item

    async def async_delete(self, collection: str, item_id: str) -> bool:
        items = self.data[collection]
        before = len(items)
        self.data[collection] = [i for i in items if i.get("id") != item_id]
        if len(self.data[collection]) != before:
            await self.async_save()
            return True
        return False

    async def async_set_settings(self, settings: dict[str, Any]) -> None:
        self.data["settings"] = settings
        self._normalize()
        await self.async_save()

    async def async_import(self, payload: dict[str, Any], mode: str) -> dict[str, int]:
        """Import data; mode 'replace' swaps everything, 'merge' upserts by id."""
        counts: dict[str, int] = {}
        if mode == "replace":
            currency = self.data["settings"].get("currency", "EUR")
            new = empty_data(currency)
            if "settings" in payload:
                new["settings"] = payload["settings"]
            for col in COLLECTIONS:
                new[col] = [dict(i) for i in payload.get(col, [])]
                counts[col] = len(new[col])
            self.data = new
        else:
            if "settings" in payload:
                self.data["settings"].update(payload["settings"])
            for col in COLLECTIONS:
                existing = {i["id"]: n for n, i in enumerate(self.data[col]) if i.get("id")}
                for item in payload.get(col, []):
                    item = dict(item)
                    if item.get("id") in existing:
                        self.data[col][existing[item["id"]]] = item
                    else:
                        self.data[col].append(item)
                counts[col] = len(payload.get(col, []))
        self._normalize()
        await self.async_save()
        return counts
