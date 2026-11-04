"""Config flow for Utility Costs (single instance)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class UtilityCostsConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            user_input["currency"] = str(user_input["currency"]).strip().upper()[:3]
            return self.async_create_entry(title="Utility Costs", data=user_input)
        default = self.hass.config.currency or "EUR"
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required("currency", default=default): str}),
        )
