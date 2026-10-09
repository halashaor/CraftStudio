import copy, unittest, hashlib
from backend.chunk_storage import encode
import test_workspace_chunks as fixtures


class WorkspaceDeltaTests(unittest.TestCase):
    setUp = fixtures.WorkspaceChunkTests.setUp
    tearDown = fixtures.WorkspaceChunkTests.tearDown
    save = fixtures.WorkspaceChunkTests.save
    blocks = fixtures.WorkspaceChunkTests.blocks

    def packet(self, revision=2, start=1, chunks=None, header=None):
        return {
            "workspaceId": "ws",
            "baseKey": "base",
            "revision": revision,
            "mode": "chunks",
            "baseRevision": start,
            "snapshot": header
            or {k: copy.deepcopy(v) for k, v in self.snapshot.items() if k != "overlay"},
            "chunks": chunks if chunks is not None else [{"key": "0,0,0", "blocks": []}],
        }

    def test_patch_preserves_untouched_nbt_and_clears_only_explicit_chunk(self):
        self.save(1)
        before = self.blocks(1, "2,0,0")
        packet = self.packet()
        head = self.lib.call("workspaceCheckpoint", [packet, 1])
        self.assertEqual(head["removedChunks"], ["0,0,0"])
        self.assertEqual(head["changedChunks"], [])
        self.assertEqual(self.blocks(2, "2,0,0"), before)
        self.assertEqual(self.blocks(2, "0,0,0"), self.base["blocks"][:1])
        self.assertTrue(self.lib.call("workspaceCheckpoint", [packet, 2])["replayed"])
        self.assertEqual(self.lib.call("workspaceHead", ["ws"])["revision"], 2)

    def test_complete_and_chunk_representation_share_digest_and_metadata_only_update(self):
        self.save(1)
        head = self.lib.call("workspaceCheckpoint", [self.packet(), 1])
        full = dict(self.snapshot, overlay=self.snapshot["overlay"][1:])
        self.assertEqual(self.save(2, full, 2)["digest"], head["digest"])
        header = dict(head["snapshot"], title="Changed title")
        updated = self.lib.call("workspaceCheckpoint", [self.packet(3, 2, [], header), 2])
        self.assertEqual(updated["snapshot"]["title"], "Changed title")
        self.assertEqual(updated["changedChunks"], [])
        self.assertEqual(updated["removedChunks"], [])

    def test_stale_wrong_chunk_duplicate_and_malformed_patches_are_atomic(self):
        self.save(1)
        before = self.lib.call("workspaceHead", ["ws"])
        packets = [
            self.packet(start=0),
            self.packet(chunks=[{"key": "1,0,0", "blocks": self.snapshot["overlay"][1:2]}]),
            self.packet(chunks=[{"key": "0,0,0", "blocks": []}, {"key": "0,0,0", "blocks": []}]),
            self.packet(
                chunks=[
                    {
                        "key": "0,0,0",
                        "blocks": [{"pos": [1, 1, 1], "state": {"Name": "unknown:block"}}],
                    }
                ]
            ),
        ]
        for packet in packets:
            with self.assertRaises(ValueError):
                self.lib.call("workspaceCheckpoint", [packet, 1])
            self.assertEqual(self.lib.call("workspaceHead", ["ws"]), before)

    def test_shrink_and_palette_removal_validate_untouched_chunks(self):
        self.save(1)
        header = {k: copy.deepcopy(v) for k, v in self.snapshot.items() if k != "overlay"}
        header["size"] = [48, 8, 8]
        with self.assertRaises(ValueError):
            self.lib.call("workspaceCheckpoint", [self.packet(chunks=[], header=header), 1])
        head = self.lib.call(
            "workspaceCheckpoint",
            [self.packet(chunks=[{"key": "4,0,0", "blocks": []}], header=header), 1],
        )
        self.assertEqual(head["snapshot"]["size"], [48, 8, 8])
        header = dict(head["snapshot"], palette=self.base["palette"])
        with self.assertRaises(ValueError):
            self.lib.call("workspaceCheckpoint", [self.packet(3, 2, [], header), 2])
        head = self.lib.call(
            "workspaceCheckpoint", [self.packet(3, 2, [{"key": "2,0,0", "blocks": []}], header), 2]
        )
        self.assertEqual(head["revision"], 3)
        self.assertEqual(
            self.blocks(3, "2,0,0")[0]["nbt"]["v"]["Counter"]["v"], "9223372036854775807"
        )

    def test_legacy_full_digest_replays_then_upgrades_on_next_version(self):
        self.save(1)
        legacy = hashlib.sha256(encode(self.snapshot)).hexdigest()
        with self.lib.connection() as conn:
            conn.execute(
                "UPDATE designer_chunk_workspaces SET digest=? WHERE workspace_id=?", (legacy, "ws")
            )
        replay = self.save(1)
        self.assertTrue(replay["replayed"])
        self.assertEqual(replay["digest"], legacy)
        updated = self.lib.call("workspaceCheckpoint", [self.packet(), 1])
        self.assertNotEqual(updated["digest"], legacy)
        self.assertEqual(self.blocks(2, "0,0,0"), self.base["blocks"][:1])
