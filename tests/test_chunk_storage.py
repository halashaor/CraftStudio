import base64, gzip, json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from backend.designer_storage import DesignerLibrary


class ChunkStorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.lib = DesignerLibrary(Path(self.temp.name) / "chunks.sqlite3")
        self.project = {
            "schema": 1,
            "name": "Chunk fixture",
            "size": [48, 32, 48],
            "origin": [-20, 64, 50],
            "palette": [
                {"Name": "minecraft:stone"},
                {"Name": "future_mod:machine", "Properties": {"facing": "west"}},
            ],
            "blocks": [
                {"pos": [2, 1, 2], "state": 0},
                {
                    "pos": [33, 17, 33],
                    "state": 1,
                    "nbt": {"t": 10, "v": {"Counter": {"t": 4, "v": "9223372036854775807"}}},
                },
            ],
            "entities": [{"t": 10, "v": {"id": {"t": 8, "v": "minecraft:item"}}}],
            "metadata": {"placementMask": {"skipRuns": [[0, 1]]}, "custom": {"preserve": True}},
        }
        self.data = {
            "$bytes": base64.b64encode(
                gzip.compress(json.dumps(self.project).encode(), mtime=0)
            ).decode()
        }
        self.lib.call(
            "draft",
            [{"baseKey": "base", "baseline": self.data, "payload": {"$bytes": "AA=="}}, None],
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_manifest_and_exact_chunks_preserve_palette_origin_entities_and_typed_nbt(self):
        m = self.lib.call("baselineManifest", ["base"])
        self.assertEqual(m["blockCount"], 2)
        self.assertEqual(len(m["chunks"]), 2)
        self.assertEqual(m["project"]["palette"], self.project["palette"])
        self.assertEqual(m["project"]["metadata"], self.project["metadata"])
        self.assertEqual(m["project"]["entities"], self.project["entities"])
        self.assertNotIn("blocks", m["project"])
        r = self.lib.call("baselineChunks", ["base", ["2,1,2", "1,0,1", "3,0,0"]])
        self.assertEqual(r["items"][1]["status"], "empty-records")
        self.assertEqual(r["items"][2]["status"], "outside")
        blocks = json.loads(gzip.decompress(base64.b64decode(r["items"][0]["bytes"]["$bytes"])))
        self.assertEqual(blocks, [self.project["blocks"][1]])

    def test_cached_read_never_reinflates_original_baseline_and_reopen_keeps_index(self):
        expected = self.lib.call("baselineManifest", ["base"])
        reopened = DesignerLibrary(self.lib.path)
        with patch.object(
            reopened, "get", side_effect=AssertionError("original portable baseline accessed")
        ):
            self.assertEqual(reopened.call("baselineManifest", ["base"]), expected)
            self.assertEqual(
                reopened.call("baselineChunks", ["base", ["0,0,0"]])["items"][0]["blocks"], 1
            )

    def test_backup_restore_rebuilds_derived_cache_without_loss(self):
        self.lib.call("baselineManifest", ["base"])
        backup = self.lib.call("backup", [])
        other = DesignerLibrary(Path(self.temp.name) / "restored.sqlite3")
        other.call("restore", [backup])
        self.assertEqual(
            other.call("baselineManifest", ["base"])["project"],
            {k: v for k, v in self.project.items() if k != "blocks"},
        )
        self.assertEqual(other.call("baselineChunks", ["base", ["0,0,0"]])["items"][0]["blocks"], 1)

    def test_malformed_baseline_rolls_back_index_and_invalid_keys_do_not_query(self):
        bad = dict(self.project, blocks=self.project["blocks"] + [self.project["blocks"][0]])
        data = {"$bytes": base64.b64encode(gzip.compress(json.dumps(bad).encode())).decode()}
        self.lib.call(
            "draft", [{"baseKey": "bad", "baseline": data, "payload": {"$bytes": "AA=="}}, None]
        )
        with self.assertRaises(ValueError):
            self.lib.call("baselineManifest", ["bad"])
        with self.lib.connection() as conn:
            self.assertEqual(
                conn.execute(
                    "SELECT COUNT(*) FROM designer_chunk_manifests WHERE base_key=?", ("bad",)
                ).fetchone()[0],
                0,
            )
            self.assertEqual(
                conn.execute(
                    "SELECT COUNT(*) FROM designer_baseline_chunks WHERE base_key=?", ("bad",)
                ).fetchone()[0],
                0,
            )
        self.lib.call("baselineManifest", ["base"])
        with self.assertRaises(ValueError):
            self.lib.call("baselineChunks", ["base", ["0,0,0 OR 1=1"]])


if __name__ == "__main__":
    unittest.main()
