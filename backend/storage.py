"""Local reusable project library. SQLite transactions and compressed typed snapshots."""

import copy
import hashlib
import json
import sqlite3
import uuid
import zlib
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from backend.design import validate


def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def pack(project):
    raw = json.dumps(
        validate(project), ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return zlib.compress(raw), hashlib.sha256(raw).hexdigest()


def unpack(blob):
    return validate(json.loads(zlib.decompress(blob)))


class Library:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            version = conn.execute("PRAGMA user_version").fetchone()[0]
            if version > 1:
                raise ValueError("数据库版本比当前程序新，请使用更新的 CraftStudio")
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '[]', kind TEXT NOT NULL DEFAULT 'project', favorite INTEGER NOT NULL DEFAULT 0,
                    instance TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    deleted_at TEXT, head INTEGER NOT NULL DEFAULT 0, block_count INTEGER NOT NULL DEFAULT 0,
                    size TEXT NOT NULL DEFAULT '[1,1,1]', legacy_file TEXT UNIQUE
                );
                CREATE TABLE IF NOT EXISTS versions (
                    project_id TEXT NOT NULL REFERENCES projects(id), number INTEGER NOT NULL,
                    created_at TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', digest TEXT NOT NULL,
                    payload BLOB NOT NULL, PRIMARY KEY(project_id, number)
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id), revision INTEGER NOT NULL,
                    updated_at TEXT NOT NULL, payload BLOB NOT NULL
                );
                CREATE TABLE IF NOT EXISTS environments (
                    instance TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, summary TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS block_catalog (
                    instance TEXT NOT NULL REFERENCES environments(instance), block_id TEXT NOT NULL,
                    label TEXT NOT NULL, namespace TEXT NOT NULL, PRIMARY KEY(instance, block_id)
                );
                CREATE INDEX IF NOT EXISTS projects_updated ON projects(deleted_at, updated_at DESC);
                CREATE INDEX IF NOT EXISTS block_namespace ON block_catalog(instance, namespace);
                PRAGMA user_version=1;
            """
            )

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.path, timeout=15)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=15000")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    @staticmethod
    def item(row):
        if row is None:
            raise ValueError("工程不存在")
        result = dict(row)
        result["tags"] = json.loads(result["tags"])
        result["size"] = json.loads(result["size"])
        result["favorite"] = bool(result["favorite"])
        return result

    def get(self, identifier):
        with self.connect() as conn:
            return self.item(
                conn.execute("SELECT * FROM projects WHERE id=?", (identifier,)).fetchone()
            )

    def list(self, query="", kind="", favorite=False, deleted=False, offset=0, limit=60):
        conditions = ["deleted_at IS NOT NULL" if deleted else "deleted_at IS NULL"]
        values = []
        if query:
            pattern = (
                "%" + query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
            )
            conditions.append(
                "(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')"
            )
            values.extend([pattern] * 3)
        if kind:
            conditions.append("kind=?")
            values.append(kind)
        if favorite:
            conditions.append("favorite=1")
        where = " AND ".join(conditions)
        with self.connect() as conn:
            count = conn.execute("SELECT COUNT(*) FROM projects WHERE " + where, values).fetchone()[
                0
            ]
            rows = conn.execute(
                "SELECT * FROM projects WHERE "
                + where
                + " ORDER BY favorite DESC, updated_at DESC, id LIMIT ? OFFSET ?",
                values + [max(1, min(int(limit), 200)), max(0, int(offset))],
            ).fetchall()
        return {"items": [self.item(row) for row in rows], "total": count}

    def save(
        self,
        project,
        identifier=None,
        title=None,
        description=None,
        tags=None,
        kind=None,
        note="",
        expected_head=None,
        legacy_file=None,
    ):
        project = copy.deepcopy(project)
        if title is not None:
            title = str(title).strip()
            if not title:
                raise ValueError("工程名称不能为空")
            project["name"] = title
        title = project["name"]
        payload, digest = pack(project)
        timestamp = now()
        with self.connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            old = (
                conn.execute("SELECT * FROM projects WHERE id=?", (identifier,)).fetchone()
                if identifier
                else None
            )
            if identifier and old is None:
                raise ValueError("目标工程不存在")
            if old and old["deleted_at"]:
                raise ValueError("工程在回收站中，请先恢复或另存为")
            if old and expected_head is not None and old["head"] != expected_head:
                raise ValueError("数据库工程版本已更新，请重新打开后保存")
            identifier = identifier or str(uuid.uuid4())
            kind = kind or (old["kind"] if old else "project")
            if kind not in ("project", "blueprint", "component"):
                raise ValueError("未知工程类型")
            if tags is None:
                tags = json.loads(old["tags"]) if old else []
            if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
                raise ValueError("标签必须是字符串数组")
            tags = list(dict.fromkeys(t.strip() for t in tags if t.strip()))
            description = str(
                description if description is not None else old["description"] if old else ""
            )
            instance = project.get("metadata", {}).get("instance", "")
            if not old:
                legacy_file = legacy_file or identifier + ".craft.json"
                conn.execute(
                    "INSERT INTO projects(id,title,description,tags,kind,instance,created_at,updated_at,legacy_file) VALUES(?,?,?,?,?,?,?,?,?)",
                    (
                        identifier,
                        title,
                        description,
                        json.dumps(tags, ensure_ascii=False),
                        kind,
                        instance,
                        timestamp,
                        timestamp,
                        legacy_file,
                    ),
                )
            head = old["head"] if old else 0
            previous = conn.execute(
                "SELECT digest,note FROM versions WHERE project_id=? AND number=?",
                (identifier, head),
            ).fetchone()
            if (
                previous is None
                or previous["digest"] != digest
                or (note and note != previous["note"])
            ):
                head += 1
                conn.execute(
                    "INSERT INTO versions VALUES(?,?,?,?,?,?)",
                    (identifier, head, timestamp, str(note), digest, payload),
                )
            conn.execute(
                "UPDATE projects SET title=?,description=?,tags=?,kind=?,instance=?,updated_at=?,head=?,block_count=?,size=? WHERE id=?",
                (
                    title,
                    description,
                    json.dumps(tags, ensure_ascii=False),
                    kind,
                    instance,
                    timestamp,
                    head,
                    len(project["blocks"]),
                    json.dumps(project["size"]),
                    identifier,
                ),
            )
            return self.item(
                conn.execute("SELECT * FROM projects WHERE id=?", (identifier,)).fetchone()
            )

    def load(self, identifier, version=None):
        with self.connect() as conn:
            item = self.item(
                conn.execute("SELECT * FROM projects WHERE id=?", (identifier,)).fetchone()
            )
            if item["deleted_at"]:
                raise ValueError("工程在回收站中，请先恢复")
            row = conn.execute(
                "SELECT payload FROM versions WHERE project_id=? AND number=?",
                (identifier, version or item["head"]),
            ).fetchone()
            if row is None:
                raise ValueError("工程版本不存在")
            return {
                "item": item,
                "project": unpack(row["payload"]),
                "version": version or item["head"],
            }

    def versions(self, identifier):
        self.get(identifier)
        with self.connect() as conn:
            return [
                dict(row)
                for row in conn.execute(
                    "SELECT number,created_at,note,digest,length(payload) AS compressed_bytes FROM versions WHERE project_id=? ORDER BY number DESC",
                    (identifier,),
                )
            ]

    def metadata(self, identifier, changes):
        allowed = {"favorite", "description", "tags", "kind", "title"}
        if not changes or set(changes) - allowed:
            raise ValueError("无效工程信息修改")
        item = self.get(identifier)
        if item["deleted_at"]:
            raise ValueError("请先恢复工程")
        values = {}
        for key, value in changes.items():
            if key == "tags":
                if not isinstance(value, list) or any(not isinstance(t, str) for t in value):
                    raise ValueError("无效标签")
                value = json.dumps(
                    list(dict.fromkeys(t.strip() for t in value if t.strip())), ensure_ascii=False
                )
            elif key == "favorite":
                if type(value) is not bool:
                    raise ValueError("收藏状态必须为布尔值")
                value = int(value)
            elif key == "kind":
                if value not in ("project", "blueprint", "component"):
                    raise ValueError("未知工程类型")
            else:
                value = str(value).strip()
                if key == "title" and not value:
                    raise ValueError("工程名称不能为空")
            values[key] = value
        values["updated_at"] = now()
        with self.connect() as conn:
            conn.execute(
                "UPDATE projects SET " + ",".join(k + "=?" for k in values) + " WHERE id=?",
                list(values.values()) + [identifier],
            )
        return self.get(identifier)

    def trash(self, identifier, restore=False):
        self.get(identifier)
        with self.connect() as conn:
            conn.execute(
                "UPDATE projects SET deleted_at=?,updated_at=? WHERE id=?",
                (None if restore else now(), now(), identifier),
            )
        return self.get(identifier)

    def put_session(self, project, revision, identifier=None):
        payload, _ = pack(project)
        with self.connect() as conn:
            keys = ["active"] + (["draft:" + identifier] if identifier else [])
            conn.executemany(
                "INSERT INTO sessions VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id,revision=excluded.revision,updated_at=excluded.updated_at,payload=excluded.payload",
                [(key, identifier, revision, now(), payload) for key in keys],
            )

    def draft(self, identifier):
        with self.connect() as conn:
            row = conn.execute(
                "SELECT payload,updated_at FROM sessions WHERE id=?", ("draft:" + identifier,)
            ).fetchone()
            return (
                {"project": unpack(row["payload"]), "updated_at": row["updated_at"]}
                if row
                else None
            )

    def session(self):
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM sessions WHERE id='active'").fetchone()
            return (
                {
                    "project": unpack(row["payload"]),
                    "revision": row["revision"],
                    "project_id": row["project_id"],
                }
                if row
                else None
            )

    def migrate_files(self, directory):
        result = {"imported": 0, "errors": []}
        for file in sorted(Path(directory).glob("*.craft.json")):
            with self.connect() as conn:
                exists = conn.execute(
                    "SELECT id FROM projects WHERE legacy_file=?", (file.name,)
                ).fetchone()
            if exists:
                continue
            try:
                project = json.loads(file.read_text(encoding="utf-8"))
                self.save(
                    project,
                    title=file.stem.removesuffix(".craft"),
                    note="从原工程文件导入",
                    legacy_file=file.name,
                )
                result["imported"] += 1
            except (ValueError, OSError, KeyError, TypeError) as error:
                result["errors"].append({"file": file.name, "error": str(error)})
        return result

    def cache_environment(self, resource_index):
        summary = resource_index.summary()
        instance = resource_index.instance
        with self.connect() as conn:
            old = conn.execute(
                "SELECT fingerprint FROM environments WHERE instance=?", (instance,)
            ).fetchone()
            if old and old["fingerprint"] == summary["fingerprint"]:
                return
            conn.execute(
                "INSERT INTO environments VALUES(?,?,?,?) ON CONFLICT(instance) DO UPDATE SET fingerprint=excluded.fingerprint,summary=excluded.summary,updated_at=excluded.updated_at",
                (instance, summary["fingerprint"], json.dumps(summary, ensure_ascii=False), now()),
            )
            conn.execute("DELETE FROM block_catalog WHERE instance=?", (instance,))
            items = resource_index.search("", limit=len(resource_index.ids))["items"]
            conn.executemany(
                "INSERT INTO block_catalog VALUES(?,?,?,?)",
                [(instance, i["id"], i["label"], i["source"]) for i in items],
            )

    def cached_blocks(self, instance, query="", offset=0, limit=100):
        with self.connect() as conn:
            pattern = (
                "%" + query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
            )
            condition = "instance=? AND (block_id LIKE ? ESCAPE '\\' OR label LIKE ? ESCAPE '\\')"
            values = (instance, pattern, pattern)
            count = conn.execute(
                "SELECT COUNT(*) FROM block_catalog WHERE " + condition, values
            ).fetchone()[0]
            rows = conn.execute(
                "SELECT block_id AS id,label,namespace AS source FROM block_catalog WHERE "
                + condition
                + " ORDER BY block_id LIMIT ? OFFSET ?",
                values + (max(1, min(int(limit), 200)), max(0, int(offset))),
            ).fetchall()
            return {"items": [dict(row) for row in rows], "total": count}

    def stats(self):
        with self.connect() as conn:
            return {
                "path": str(self.path),
                "schema": conn.execute("PRAGMA user_version").fetchone()[0],
                "projects": conn.execute(
                    "SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL"
                ).fetchone()[0],
                "trash": conn.execute(
                    "SELECT COUNT(*) FROM projects WHERE deleted_at IS NOT NULL"
                ).fetchone()[0],
                "versions": conn.execute("SELECT COUNT(*) FROM versions").fetchone()[0],
                "environments": conn.execute("SELECT COUNT(*) FROM environments").fetchone()[0],
                "blocks": conn.execute("SELECT COUNT(*) FROM block_catalog").fetchone()[0],
            }

    def backup(self, directory):
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / (
            "library-"
            + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
            + "-"
            + uuid.uuid4().hex[:8]
            + ".sqlite3"
        )
        with self.connect() as source:
            dest = sqlite3.connect(target)
            try:
                source.backup(dest)
                if dest.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise ValueError("数据库备份完整性检查失败")
            finally:
                dest.close()
        return str(target)
