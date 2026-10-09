"""Immutable chunk references for autosave; backup/resume expose portable bytes."""

import base64, gzip, io, json, hashlib, zlib
from backend.chunk_storage import workspace_head, checkpoint_digest


def setup(conn):
    conn.execute(
        "CREATE TABLE IF NOT EXISTS designer_draft_blobs (digest TEXT PRIMARY KEY, payload BLOB NOT NULL)"
    )
    migrate = not conn.execute(
        "SELECT 1 FROM sqlite_master WHERE name='designer_draft_refs'"
    ).fetchone()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS designer_draft_refs (session_id TEXT NOT NULL, chunk_key TEXT NOT NULL, digest TEXT NOT NULL, PRIMARY KEY(session_id,chunk_key))"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS designer_draft_refs_digest ON designer_draft_refs(digest)"
    )
    if migrate:
        for (payload,) in conn.execute(
            "SELECT payload FROM designer_records WHERE store='sessions' AND (key='active' OR key LIKE 'draft:%')"
        ):
            set_refs(conn, json.loads(zlib.decompress(payload)))


def set_refs(conn, row):
    if row.get("id") != "active" and not str(row.get("id", "")).startswith("draft:"):
        return
    refs = row.get("checkpointDraft", {}).get("chunks", [])
    previous = conn.execute(
        "SELECT chunk_key,digest FROM designer_draft_refs WHERE session_id=?", (row["id"],)
    ).fetchall()
    if set(previous) == {tuple(item) for item in refs}:
        return
    conn.execute("DELETE FROM designer_draft_refs WHERE session_id=?", (row["id"],))
    conn.executemany(
        "INSERT INTO designer_draft_refs VALUES (?,?,?)",
        ((row["id"], key, digest) for key, digest in refs),
    )


def capture(conn, data):
    head = workspace_head(conn, data.get("workspaceId"))
    if not head or head["revision"] != data.get("revision") or head["digest"] != data.get("digest"):
        raise ValueError("草稿检查点已变化，请重试")
    chunks = []
    for key, digest, payload in conn.execute(
        "SELECT chunk_key,digest,payload FROM designer_overlay_chunks WHERE workspace_id=? ORDER BY chunk_key",
        (head["workspaceId"],),
    ):
        if hashlib.sha256(payload).hexdigest() != digest:
            raise ValueError("草稿区块摘要不一致")
        conn.execute("INSERT OR IGNORE INTO designer_draft_blobs VALUES (?,?)", (digest, payload))
        chunks.append([key, digest])
    snapshot = dict(head["snapshot"])
    if data.get("saveForm") is not None:
        form = data["saveForm"]
        if (
            not isinstance(form, dict)
            or form.get("schema") != "craftstudio-save-form/1"
            or any(not isinstance(form.get(k), str) for k in ("title", "tags", "kind", "note"))
        ):
            raise ValueError("草稿保存表单格式无效")
        snapshot["saveForm"] = {k: form[k] for k in ("schema", "title", "tags", "kind", "note")}
    if "history" in data:
        history = data["history"]
        if (
            not isinstance(history, dict)
            or history.get("schema") != "craftstudio-draft-history/1"
            or any(
                not isinstance(history.get(k), list) for k in ("chunks", "designs", "undo", "redo")
            )
        ):
            raise ValueError("草稿撤销历史格式无效")
        snapshot["history"] = history
    if data.get("title"):
        if not isinstance(data["title"], str):
            raise ValueError("草稿名称无效")
        snapshot["title"] = data["title"]
    return {
        "schema": "craftstudio-checkpoint-draft/1",
        "workspaceId": head["workspaceId"],
        "revision": head["revision"],
        "digest": checkpoint_digest(snapshot, dict(chunks)),
        "snapshot": snapshot,
        "chunks": chunks,
        "baseKey": head["baseKey"],
    }


def materialize(conn, row):
    ref = row.get("checkpointDraft")
    if not ref:
        return dict(row)
    if (
        ref.get("schema") != "craftstudio-checkpoint-draft/1"
        or checkpoint_digest(ref["snapshot"], dict(ref["chunks"])) != ref["digest"]
    ):
        raise ValueError("草稿引用摘要无效")

    def text(value):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode(
            "utf-8", errors="backslashreplace"
        )

    out = io.BytesIO()
    with gzip.GzipFile(fileobj=out, mode="wb", compresslevel=1, mtime=0) as stream:
        stream.write(b'{"liteSchema":1,"site":' + text(ref["snapshot"])[:-1] + b',"overlay":[')
        first = True
        for key, digest in ref["chunks"]:
            blob = conn.execute(
                "SELECT payload FROM designer_draft_blobs WHERE digest=?", (digest,)
            ).fetchone()
            if not blob or hashlib.sha256(blob[0]).hexdigest() != digest:
                raise ValueError("草稿区块内容缺失或损坏")
            for block in json.loads(gzip.decompress(blob[0])):
                if not first:
                    stream.write(b",")
                stream.write(text(block))
                first = False
        stream.write(b"]}}")
    result = {k: v for k, v in row.items() if k != "checkpointDraft"}
    result["bytes"] = {"$bytes": base64.b64encode(out.getvalue()).decode()}
    return result


def prune(conn):
    conn.execute(
        "DELETE FROM designer_draft_blobs WHERE NOT EXISTS (SELECT 1 FROM designer_draft_refs WHERE designer_draft_refs.digest=designer_draft_blobs.digest)"
    )
