import hashlib
import json
import shutil
import subprocess
import unittest
from pathlib import Path
from test_lite_bridge import server


class BuildManifestTests(unittest.TestCase):
    def test_manifest_covers_backend_and_runtime_files(self):
        root = Path(server.ROOT)
        files = json.loads((root / "backend/build-files.json").read_text(encoding="utf-8"))
        self.assertEqual(len(files), len(set(files)))
        required = {
            "server.py",
            "backend/build-files.json",
            "lite/src/runtime/engine-wire.js",
            "lite/dist/worker.bundle.js",
        }
        required.update(
            path.relative_to(root).as_posix() for path in (root / "backend").glob("*.py")
        )
        required.update(
            path.relative_to(root).as_posix()
            for path in (root / "local-engine").glob("*.mjs")
            if not path.name.startswith("verify")
        )
        self.assertTrue(required.issubset(files), required - set(files))
        self.assertTrue(all((root / name).is_file() for name in files))
        expected = (
            hashlib.sha256(b"".join((root / name).read_bytes() for name in files))
            .hexdigest()
            .upper()
        )
        self.assertEqual(server.BACKEND_BUILD, expected)

    @unittest.skipUnless(
        shutil.which("pwsh") or shutil.which("powershell"), "PowerShell unavailable"
    )
    def test_launcher_hash_prefix_matches_live_service_without_starting_or_stopping_processes(self):
        root = str(server.ROOT).replace("'", "''")
        script = (
            f"$taskText = Get-Content -LiteralPath '{root}/start.ps1' -Raw; "
            "$taskPrefix = $taskText.Substring(0, $taskText.IndexOf('$taskPort = 18767')); "
            f"$taskPrefix = $taskPrefix.Replace('$PSScriptRoot', \"'{root}'\"); "
            ". ([scriptblock]::Create($taskPrefix)); [Console]::WriteLine($taskBuild)"
        )
        result = subprocess.run(
            [
                shutil.which("pwsh") or shutil.which("powershell"),
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script,
            ],
            capture_output=True,
            text=True,
            check=True,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.assertEqual(result.stdout.strip(), server.BACKEND_BUILD)


if __name__ == "__main__":
    unittest.main()
