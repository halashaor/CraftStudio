import subprocess
import tempfile
import unittest
from pathlib import Path
from maintenance.sync_workspace import WorkspaceSync


class WorkspaceSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="craftstudio-sync-")
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / "source"
        self.target = Path(self.temp.name) / "local"
        self.source.mkdir()
        self.target.mkdir()
        subprocess.run(["git", "init", "-q", str(self.source)], check=True, capture_output=True)
        (self.source / "code.py").write_text("current\n", encoding="utf-8")
        (self.source / "new.cmd").write_text("launch\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.source), "add", "."], check=True, capture_output=True)

    def test_audit_is_read_only_and_conflict_blocks_all_copying(self):
        (self.target / "code.py").write_text("local change\n", encoding="utf-8")
        sync = WorkspaceSync(self.source, self.target)
        self.assertEqual({row["status"] for row in sync.audit()}, {"changed", "missing"})
        self.assertFalse((self.target / "new.cmd").exists())
        with self.assertRaisesRegex(ValueError, "no files copied"):
            sync.apply()
        self.assertEqual((self.target / "code.py").read_text(), "local change\n")
        self.assertFalse((self.target / "new.cmd").exists())

    def test_explicit_replacement_preserves_backup_and_untracked_project_data(self):
        (self.target / "code.py").write_text("prior local code\n", encoding="utf-8")
        (self.source / "private.craftlite").write_bytes(b"source-private")
        (self.target / "private.craftlite").write_bytes(b"user-project")
        result = WorkspaceSync(self.source, self.target).apply(replace_changed=True)
        self.assertEqual(result["copied"], 2)
        self.assertEqual((Path(result["backup"]) / "code.py").read_text(), "prior local code\n")
        self.assertEqual((self.target / "code.py").read_text(), "current\n")
        self.assertEqual((self.target / "private.craftlite").read_bytes(), b"user-project")
        self.assertEqual({row["status"] for row in result["files"]}, {"matching"})

    def test_kept_preferences_and_line_endings_do_not_create_conflicts(self):
        (self.target / "code.py").write_text("private preference\n", encoding="utf-8")
        (self.target / "new.cmd").write_bytes(b"launch\r\n")
        sync = WorkspaceSync(self.source, self.target, keep=["code.py"])
        self.assertEqual(sync.apply()["copied"], 0)
        self.assertEqual((self.target / "code.py").read_text(), "private preference\n")
        with self.assertRaisesRegex(ValueError, "tracked files"):
            WorkspaceSync(self.source, self.target, keep=["unknown.py"]).audit()
        with self.assertRaisesRegex(ValueError, "separate"):
            WorkspaceSync(self.source, self.source / "nested")

    def test_binary_files_require_exact_bytes(self):
        (self.source / "asset.bin").write_bytes(b"binary\r\npayload")
        (self.target / "asset.bin").write_bytes(b"binary\npayload")
        subprocess.run(
            ["git", "-C", str(self.source), "add", "asset.bin"], check=True, capture_output=True
        )
        rows = WorkspaceSync(self.source, self.target).audit()
        self.assertEqual(
            next(row["status"] for row in rows if row["path"] == "asset.bin"), "changed"
        )

    def test_unicode_repository_and_launcher_names_sync(self):
        source = Path(self.temp.name) / "源 仓库"
        source.mkdir()
        subprocess.run(["git", "init", "-q", str(source)], check=True, capture_output=True)
        name = "启动 Lite.cmd"
        (source / name).write_bytes(b"@echo off\r\n")
        subprocess.run(["git", "-C", str(source), "add", "."], check=True, capture_output=True)
        result = WorkspaceSync(source, self.target).apply()
        self.assertEqual(result["copied"], 1)
        self.assertEqual((self.target / name).read_bytes(), b"@echo off\r\n")


if __name__ == "__main__":
    unittest.main()
