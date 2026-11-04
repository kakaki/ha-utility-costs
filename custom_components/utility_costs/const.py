"""Constants for the Utility Costs integration."""

from __future__ import annotations

DOMAIN = "utility_costs"
STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1

PANEL_URL = "utility-costs"
PANEL_COMPONENT = "utility-costs-panel"
STATIC_URL = "/utility_costs_static"

SIGNAL_UPDATED = f"{DOMAIN}_updated"
SIGNAL_SUMMARY = f"{DOMAIN}_summary"

COLLECTIONS = (
    "suppliers",
    "tariffs",
    "invoices",
    "installments",
    "readings",
    "corrections",
    "investments",
    "projects",
)

INVOICE_KINDS = ("settlement", "forecast", "correction", "periodic")

# Default media created on first setup. Names are translated in the panel
# by id; custom media can be added in settings with any id and name.
DEFAULT_MEDIA = [
    {
        "id": "electricity",
        "name": "",
        "unit": "kWh",
        "zones": [{"id": "day", "name": ""}, {"id": "night", "name": ""}],
        "statistics": {},
    },
    {
        "id": "gas",
        "name": "",
        "unit": "m³",
        "zones": [{"id": "all", "name": ""}],
        "statistics": {},
    },
    {
        "id": "water",
        "name": "",
        "unit": "m³",
        "zones": [{"id": "all", "name": ""}],
        "statistics": {},
    },
]

SUMMARY_CACHE_SECONDS = 600
