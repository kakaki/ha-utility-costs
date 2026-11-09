"""The import_file service may only read JSON files inside the configuration folder."""
import json

import pytest

from uc.import_path import BadImportPath, read_import_file


@pytest.fixture
def layout(tmp_path):
    config = tmp_path / "config"
    (config / "sub").mkdir(parents=True)
    (config / "sub" / "data.json").write_text(json.dumps({"invoices": []}), "utf-8")
    sibling = tmp_path / "config_backup"
    sibling.mkdir()
    (sibling / "secret.json").write_text(json.dumps({"x": 1}), "utf-8")
    return config, sibling


def test_reads_file_inside_config(layout):
    config, _ = layout
    assert read_import_file(str(config), "sub/data.json") == {"invoices": []}


@pytest.mark.parametrize("rel", ["../config_backup/secret.json", "/etc/passwd", "sub/../../config_backup/secret.json"])
def test_rejects_paths_outside_config(layout, rel):
    config, _ = layout
    with pytest.raises(BadImportPath):
        read_import_file(str(config), rel)


def test_rejects_sibling_with_same_prefix(layout):
    config, sibling = layout
    # the old startswith() check accepted this one
    with pytest.raises(BadImportPath):
        read_import_file(str(config), str(sibling / "secret.json"))


def test_rejects_symlink_leaving_config(layout):
    config, sibling = layout
    (config / "link.json").symlink_to(sibling / "secret.json")
    with pytest.raises(BadImportPath):
        read_import_file(str(config), "link.json")


def test_bad_json_raises_value_error(layout):
    config, _ = layout
    (config / "broken.json").write_text("{nope", "utf-8")
    with pytest.raises(ValueError):
        read_import_file(str(config), "broken.json")
