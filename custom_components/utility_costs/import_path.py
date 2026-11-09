"""Safe reading of JSON import files for the utility_costs.import_file service."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class BadImportPath(Exception):
    """The import path points outside the configuration folder."""


def read_import_file(config_dir: str, rel: str) -> Any:
    """Read a JSON file inside the configuration folder.

    Blocking (resolve() and the read touch the filesystem), so call it in the
    executor. Symlinks and ".." are resolved first, and the result must stay
    inside the configuration folder itself – a sibling such as /config_backup
    is rejected.
    """
    base = Path(config_dir).resolve()
    path = (base / rel).resolve()
    if not path.is_relative_to(base):
        raise BadImportPath(rel)
    return json.loads(path.read_text("utf-8"))
