"""Notifications: upcoming instalments and invoices that differ from meters.

Settings (settings.notifications):
  enabled          bool, default True
  installment_days days before the due date, default 3
  deviation_pct    |invoice − meters| in %, default 10
  service          optional notify service, e.g. "notify.mobile_app_phone"

Every event is sent once (keys kept in .storage/utility_costs.notified).
On the very first run existing invoices are only marked as seen, so turning
the feature on does not flood you with old deviations.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import calc
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

TEXTS = {
    "pl": {
        "inst_t": "Zbliża się rata: {medium}",
        "inst_m": "Rata {amount} {cur} – termin płatności {due}{sup}.",
        "dev_t": "Faktura odbiega od liczników: {medium}",
        "dev_m": "Faktura {number}za okres {a} – {b}: {inv} {unit} na fakturze, {ha} {unit} z liczników ({dev:+.1f}%).",
        "media": {"electricity": "prąd", "gas": "gaz", "water": "woda", "fuel": "paliwo"},
    },
    "en": {
        "inst_t": "Instalment due soon: {medium}",
        "inst_m": "Instalment of {amount} {cur} is due on {due}{sup}.",
        "dev_t": "Invoice differs from meters: {medium}",
        "dev_m": "Invoice {number}for {a} – {b}: {inv} {unit} invoiced, {ha} {unit} measured ({dev:+.1f}%).",
        "media": {"electricity": "electricity", "gas": "gas", "water": "water", "fuel": "fuel"},
    },
    "de": {
        "inst_t": "Abschlag bald fällig: {medium}",
        "inst_m": "Abschlag {amount} {cur} fällig am {due}{sup}.",
        "dev_t": "Rechnung weicht von den Zählern ab: {medium}",
        "dev_m": "Rechnung {number}für {a} – {b}: {inv} {unit} berechnet, {ha} {unit} gemessen ({dev:+.1f}%).",
        "media": {"electricity": "Strom", "gas": "Gas", "water": "Wasser", "fuel": "Kraftstoff"},
    },
}


def settings_of(data: dict) -> dict[str, Any]:
    n = (data.get("settings") or {}).get("notifications") or {}
    return {
        "enabled": n.get("enabled", True) is not False,
        "installment_days": int(n.get("installment_days") or 3),
        "deviation_pct": float(n.get("deviation_pct") or 10),
        "service": (n.get("service") or "").strip(),
    }


def due_installments(data: dict, today, days: int) -> list[dict]:
    end = today + timedelta(days=days)
    out = []
    for i in data.get("installments") or []:
        due = calc.to_date(i.get("due_date"))
        if due and not i.get("paid") and today <= due <= end:
            out.append(i)
    return out


def deviations(summary: dict, threshold: float) -> list[tuple[dict, dict]]:
    out = []
    for inv in summary.get("invoices") or []:
        c = (summary.get("checks") or {}).get(inv.get("id")) or {}
        dev = c.get("deviation_pct")
        if dev is None or (c.get("coverage") or 0) < 0.9:
            continue
        if abs(float(dev)) >= threshold:
            out.append((inv, c))
    return out


class Notifier:
    def __init__(self, hass: HomeAssistant, store) -> None:
        self.hass = hass
        self.store = store
        self._file: Store[dict[str, Any]] = Store(hass, 1, f"{DOMAIN}.notified")
        self._sent: set[str] = set()

    async def async_load(self) -> None:
        stored = await self._file.async_load()
        self._sent = set((stored or {}).get("sent", []))
        if stored is None:
            # first run: existing invoices count as seen, only new ones alert
            self._sent = {f"dev_{i.get('id')}" for i in self.store.data.get("invoices") or []}
            self._save()

    def _save(self) -> None:
        self._file.async_delay_save(lambda: {"sent": sorted(self._sent)}, 5)

    def _t(self) -> dict:
        lang = (self.hass.config.language or "en").split("-")[0]
        return TEXTS.get(lang, TEXTS["en"])

    def _medium(self, mid: str) -> str:
        m = self.store.medium(mid) or {}
        return m.get("name") or self._t()["media"].get(mid, mid)

    def _supplier(self, sid: str | None) -> str:
        s = next((x for x in self.store.data.get("suppliers") or [] if x.get("id") == sid), None)
        return s.get("name", "") if s else ""

    async def _send(self, key: str, title: str, message: str) -> None:
        cfg = settings_of(self.store.data)
        persistent_notification.async_create(self.hass, message, title, f"{DOMAIN}_{key}")
        svc = cfg["service"]
        if svc:
            domain, _, name = svc.partition(".")
            if not name:
                domain, name = "notify", domain
            try:
                await self.hass.services.async_call(domain, name, {"title": title, "message": message}, blocking=False)
            except Exception:  # noqa: BLE001 - a broken notify service must not stop the rest
                _LOGGER.warning("Notify service %s failed", svc)
        self._sent.add(key)
        self._save()

    async def async_check_installments(self, *_: Any) -> None:
        cfg = settings_of(self.store.data)
        today = dt_util.now().date()
        # dismiss notifications of instalments that were paid meanwhile
        for i in self.store.data.get("installments") or []:
            if i.get("paid"):
                persistent_notification.async_dismiss(self.hass, f"{DOMAIN}_inst_{i.get('id')}_{i.get('due_date')}")
        if not cfg["enabled"]:
            return
        t = self._t()
        cur = self.store.data["settings"].get("currency") or ""
        for i in due_installments(self.store.data, today, cfg["installment_days"]):
            key = f"inst_{i['id']}_{i.get('due_date')}"
            if key in self._sent:
                continue
            sup = self._supplier(i.get("supplier_id"))
            await self._send(
                key,
                t["inst_t"].format(medium=self._medium(i.get("medium"))),
                t["inst_m"].format(amount=f"{float(i.get('amount') or 0):.2f}", cur=cur,
                                   due=i.get("due_date"), sup=f" ({sup})" if sup else ""),
            )

    async def async_check_summary(self, summary: dict | None) -> None:
        if not summary:
            return
        cfg = settings_of(self.store.data)
        found = deviations(summary, cfg["deviation_pct"])
        if not cfg["enabled"]:
            return
        t = self._t()
        for inv, c in found:
            key = f"dev_{inv['id']}"
            if key in self._sent:
                continue
            iq = sum(float(v or 0) for v in (inv.get("quantities") or {}).values())
            unit = (self.store.medium(inv.get("medium")) or {}).get("unit") or ""
            await self._send(
                key,
                t["dev_t"].format(medium=self._medium(inv.get("medium"))),
                t["dev_m"].format(number=f"{inv['number']} " if inv.get("number") else "",
                                  a=inv.get("period_from"), b=inv.get("period_to"),
                                  inv=f"{iq:.1f}", ha=f"{float(c.get('ha_total') or 0):.1f}",
                                  unit=unit, dev=float(c.get("deviation_pct") or 0)),
            )
