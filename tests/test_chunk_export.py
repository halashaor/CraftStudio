import base64, gzip, json, unittest
import test_workspace_chunks as fixtures
from backend.nbt import loads


class CheckpointExportTests(unittest.TestCase):
    setUp = fixtures.WorkspaceChunkTests.setUp
    tearDown = fixtures.WorkspaceChunkTests.tearDown
    save = fixtures.WorkspaceChunkTests.save

    def export(self, format="craftlite", revision=1, assets=None):
        return self.lib.call("workspaceExport", ["ws", revision, format, assets])

    def test_portable_project_preserves_baseline_delta_design_and_assets(self):
        self.save(1)
        assets = {"images": {"stone": "data:image/png;base64,AA=="}, "models": {}}
        result = self.export(assets=assets)
        package = json.loads(gzip.decompress(base64.b64decode(result["bytes"]["$bytes"])))
        self.assertEqual(package["site"]["base"], self.base)
        self.assertEqual(package["site"]["design"], self.snapshot["design"])
        self.assertEqual(package["site"]["overlay"], self.snapshot["overlay"])
        self.assertEqual(package["assets"], assets)
        self.assertLessEqual(result["stats"]["maxChunkRecords"], 4096)

    def test_chunk_batch_serialization_preserves_unicode_escaping_and_typed_nbt(self):
        self.snapshot["design"] = {"objects": [], "name": '屋顶\n"形态"'}
        self.snapshot["overlay"][1]["nbt"] = {
            "t": 10,
            "v": {"Text": {"t": 8, "v": '半砖 · "朝向"\n第二行'}},
        }
        self.save(1)
        package = json.loads(gzip.decompress(base64.b64decode(self.export()["bytes"]["$bytes"])))
        self.assertEqual(package["site"]["base"], self.base)
        self.assertEqual(package["site"]["overlay"], self.snapshot["overlay"])
        self.assertEqual(package["site"]["design"], self.snapshot["design"])

    def test_nbt_merges_changes_preserves_long_nbt_and_size(self):
        self.save(1)
        root = loads(base64.b64decode(self.export("nbt")["bytes"]["$bytes"])).value
        blocks = root["blocks"].value[1]
        bypos = {tuple(b["pos"].value[1]): b for b in blocks}
        self.assertEqual(set(bypos), {(33, 1, 1), (34, 1, 1), (70, 1, 1)})
        self.assertEqual(bypos[(33, 1, 1)]["nbt"].value["Counter"].value, 9223372036854775807)
        self.assertEqual(root["size"].value[1], [80, 8, 8])

    def test_rejects_stale_export_and_unknown_format(self):
        self.save(1)
        with self.assertRaises(ValueError):
            self.export(revision=2)
        with self.assertRaises(ValueError):
            self.export("obj")

    def test_empty_chunk_masks_entities_and_unknown_root_tags(self):
        self.base["metadata"] = {
            "placementMask": {"size": [48, 8, 8], "skipRuns": [[20, 1]], "eraseRuns": [[21, 1]]},
            "nativeExtra": {"CustomLong": {"t": 4, "v": "9223372036854775807"}},
        }
        self.base["entities"] = [{"t": 10, "v": {"CustomName": {"t": 8, "v": "test"}}}]
        data = {
            "$bytes": base64.b64encode(
                gzip.compress(json.dumps(self.base).encode(), mtime=0)
            ).decode()
        }
        self.lib.call("baselineManifest", ["masked", data])
        snap = dict(self.snapshot, size=[48, 8, 8], overlay=[])
        self.lib.call(
            "workspaceCheckpoint",
            [{"workspaceId": "mask", "baseKey": "masked", "revision": 1, "snapshot": snap}, None],
        )
        result = self.lib.call("workspaceExport", ["mask", 1, "nbt"])
        root = loads(base64.b64decode(result["bytes"]["$bytes"])).value
        palette = root["palette"].value[1]
        bypos = {
            tuple(b["pos"].value[1]): palette[b["state"].value]["Name"].value
            for b in root["blocks"].value[1]
        }
        self.assertEqual(bypos[(20, 0, 0)], "minecraft:structure_void")
        self.assertEqual(bypos[(21, 0, 0)], "minecraft:air")
        self.assertEqual(root["CustomLong"].value, 9223372036854775807)
        self.assertEqual(root["entities"].value[1][0]["CustomName"].value, "test")
