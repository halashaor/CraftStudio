"""Audit or sync tracked code into a separate local installation, retaining backups."""

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

TEXT_SUFFIXES = {
    ".py",
    ".js",
    ".mjs",
    ".html",
    ".css",
    ".json",
    ".md",
    ".txt",
    ".toml",
    ".yaml",
    ".yml",
    ".ps1",
    ".cmd",
    ".svg",
}


def same_content(source, target):
    before, after = source.read_bytes(), target.read_bytes()
    if source.suffix in TEXT_SUFFIXES or source.name in {
        ".gitignore",
        ".editorconfig",
        ".prettierignore",
    }:
        before, after = before.replace(b"\r\n", b"\n"), after.replace(b"\r\n", b"\n")
    return before == after


class WorkspaceSync:
    def __init__(self, source, target, keep=()):
        self.source = Path(source).resolve()
        self.target = Path(target).resolve()
        if self.source.is_relative_to(self.target) or self.target.is_relative_to(self.source):
            raise ValueError("Source and target must be separate workspace directories")
        self.keep = {Path(name).as_posix() for name in keep}

    def tracked_files(self):
        command = ["git", "-C", str(self.source), "-c", f"safe.directory={self.source.as_posix()}"]
        root = Path(
            subprocess.check_output(
                command + ["rev-parse", "--show-toplevel"], text=True, encoding="utf-8"
            ).strip()
        ).resolve()
        if root != self.source:
            raise ValueError("Source must be the repository root")
        files = [
            path.decode("utf-8")
            for path in subprocess.check_output(command + ["ls-files", "-z"]).split(b"\0")
            if path
        ]
        if self.keep - set(files):
            raise ValueError("Keep paths must name tracked files")
        return files

    def paths(self, relative):
        source, target = [(root / relative).resolve() for root in (self.source, self.target)]
        if not source.is_relative_to(self.source) or not target.is_relative_to(self.target):
            raise ValueError(f"Path leaves its workspace: {relative}")
        return source, target

    def audit(self):
        rows = []
        for relative in self.tracked_files():
            source, target = self.paths(relative)
            if relative in self.keep:
                status = "kept"
            elif not source.is_file():
                raise ValueError(f"Tracked source file is missing: {relative}")
            elif not target.exists():
                status = "missing"
            elif same_content(source, target):
                status = "matching"
            else:
                status = "changed"
            rows.append({"path": relative, "status": status})
        return rows

    def apply(self, replace_changed=False):
        rows = self.audit()
        if not replace_changed and any(row["status"] == "changed" for row in rows):
            raise ValueError(
                "Changed local files require --keep or explicit --replace-changed; no files copied"
            )
        changed = [row for row in rows if row["status"] in {"missing", "changed"}]
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + "-" + uuid4().hex[:8]
        backup = (self.target / "output/source-sync-backups" / stamp).resolve()
        if not backup.is_relative_to(self.target):
            raise ValueError("Backup path leaves its workspace")
        for row in changed:
            source, target = self.paths(row["path"])
            if target.exists():
                saved = backup / row["path"]
                saved.parent.mkdir(parents=True, exist_ok=True)
                saved.write_bytes(target.read_bytes())
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
        if changed:
            backup.mkdir(parents=True, exist_ok=True)
            (backup / "sync.json").write_text(
                json.dumps(changed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
        return {
            "copied": len(changed),
            "backup": str(backup) if changed else None,
            "files": self.audit(),
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=Path(__file__).resolve().parents[1])
    parser.add_argument("--target", required=True)
    parser.add_argument(
        "--keep", action="append", default=[], help="Exact tracked path to retain locally"
    )
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--replace-changed", action="store_true")
    args = parser.parse_args()
    sync = WorkspaceSync(args.source, args.target, args.keep)
    result = sync.apply(args.replace_changed) if args.apply else {"files": sync.audit()}
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
