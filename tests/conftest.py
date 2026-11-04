"""Load the pure modules without Home Assistant."""
import importlib.util
import pathlib
import sys
import types

BASE = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "utility_costs"

for m in ["homeassistant", "homeassistant.core", "homeassistant.helpers", "homeassistant.helpers.storage", "homeassistant.helpers.dispatcher",
          "homeassistant.components", "homeassistant.components.http", "aiohttp",
          "homeassistant.util", "homeassistant.util.dt"]:
    sys.modules.setdefault(m, types.ModuleType(m))
sys.modules["homeassistant.core"].HomeAssistant = object
sys.modules["homeassistant.core"].callback = lambda f: f
sys.modules["homeassistant.helpers.storage"].Store = object
sys.modules["homeassistant.helpers.dispatcher"].async_dispatcher_send = lambda *a: None
sys.modules["homeassistant.components.http"].KEY_HASS = "hass"
sys.modules["homeassistant.components.http"].HomeAssistantView = object
sys.modules["aiohttp"].web = types.SimpleNamespace(Request=object, Response=object)
sys.modules["homeassistant.util"].dt = sys.modules["homeassistant.util.dt"]

pkg = types.ModuleType("uc")
pkg.__path__ = [str(BASE)]
sys.modules["uc"] = pkg
for name in ("const", "calc", "roi", "overview", "table_import", "summary_cache", "export"):
    spec = importlib.util.spec_from_file_location(f"uc.{name}", BASE / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"uc.{name}"] = mod
    spec.loader.exec_module(mod)
