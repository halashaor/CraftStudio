import unittest, tempfile
from pathlib import Path
from backend.designer_storage import DesignerLibrary


class DesignerStorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "library.sqlite3"
        self.lib = DesignerLibrary(self.path)

    def tearDown(self):
        self.temp.cleanup()

    def test_snapshots_versions_conflicts_and_reopen(self):
        data = {"$bytes": "AQIDBA=="}
        info = {"title": "真实场地", "blocks": 520227, "size": [130, 59, 158]}
        first = self.lib.call("save", [data, info])
        self.assertEqual(first["head"], 1)
        second = self.lib.call("save", [data, dict(info, id=first["id"], head=1)])
        self.assertEqual(second["head"], 2)
        with self.assertRaises(ValueError):
            self.lib.call("save", [data, dict(info, id=first["id"], head=1)])
        reopened = DesignerLibrary(self.path)
        self.assertEqual(reopened.call("get", [first["id"], 1])["entry"]["bytes"], data)
        self.assertEqual(len(reopened.call("versions", [first["id"]])), 2)

    def test_draft_assets_preferences_backup_and_restore(self):
        b = {"$bytes": "AQID"}
        d = {"baseKey": "base", "baseline": b, "assetKey": "assets", "assetBytes": b, "payload": b}
        self.lib.call("draft", [d, None])
        self.assertEqual(self.lib.call("resume", [])["baseline"], b)
        self.lib.call("preference", ["types", {"categories": ["木制"]}])
        self.assertEqual(self.lib.call("preference", ["types"]), {"categories": ["木制"]})
        item = self.lib.call("save", [b, {"title": "窗户", "kind": "component"}])
        backup = self.lib.call("backup", [])
        result = self.lib.call("restore", [backup])
        self.assertNotEqual(result["mapping"][item["id"]], item["id"])
        self.assertEqual(len(self.lib.call("list", [])), 2)
        self.lib.call("update", [item["id"], {"deleted": True}])
        self.assertEqual(len(self.lib.call("list", [{"deleted": True}])), 1)

    def test_incomplete_restore_is_atomic(self):
        bad = {
            "schema": "craftstudio-lite-library/1",
            "projects": [{"id": "one", "title": "one"}],
            "versions": [{"projectId": "missing", "number": 1, "bytes": {"$bytes": "AA=="}}],
        }
        with self.assertRaises(ValueError):
            self.lib.call("restore", [bad])
        self.assertEqual(self.lib.call("list", []), [])


if __name__ == "__main__":
    unittest.main()
