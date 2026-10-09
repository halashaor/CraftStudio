"""Authenticated transport to explicitly connected designer pages; owns no scene data."""

import base64
import copy
import gzip
import json
import threading
import time
import uuid
from pathlib import Path


def decode_reply(wire):
    envelope = json.loads(gzip.decompress(base64.b64decode(wire)))
    if envelope.get("schema") != "craftstudio-engine-wire/1":
        raise ValueError("Unsupported page reply encoding")

    def unpack(value):
        kind = value[0]
        if kind == "u":
            return None
        if kind == "v":
            return value[1]
        if kind == "a":
            return [unpack(item) for item in value[1]]
        if kind == "o":
            return {key: unpack(item) for key, item in value[1]}
        if kind == "b":
            return {"$binary": {"type": value[1], "base64": value[2]}}
        if kind == "i":
            return {"$bigint": value[1]}
        if kind == "n":
            return {"$number": value[1]}
        raise ValueError("Unknown page reply tag")

    return unpack(envelope["value"])


class DesignerPages:
    def __init__(self, exports, clock=time.monotonic, lease=120):
        self.exports = Path(exports)
        self.clock, self.lease = clock, lease
        self.condition = threading.Condition()
        self.pages, self.jobs, self.receipts = {}, {}, {}

    def alive(self, page):
        return page["enabled"] and self.clock() - page["seen"] < self.lease

    def prune(self):
        now = self.clock()
        for identifier, job in list(self.jobs.items()):
            page = self.pages[job["sessionId"]]
            if now - job["updated"] > 600 and (
                job["status"] in ("completed", "failed", "cancelled", "unconfirmed")
                or not self.alive(page)
            ):
                del self.jobs[identifier]
        finished = [
            job
            for job in self.jobs.values()
            if job["status"] in ("completed", "failed", "cancelled", "unconfirmed")
        ]
        for job in sorted(finished, key=lambda job: job["updated"])[:-64]:
            self.jobs.pop(job["jobId"], None)
        self.receipts = {
            key: identifier for key, identifier in self.receipts.items() if identifier in self.jobs
        }
        referenced = {job["sessionId"] for job in self.jobs.values()}
        for identifier, page in list(self.pages.items()):
            if identifier not in referenced and not self.alive(page) and now - page["seen"] > 600:
                del self.pages[identifier]

    def page(self, identifier):
        if identifier not in self.pages:
            raise ValueError("页面连接已失效，请重新连接工作台")
        return self.pages[identifier]

    def register(self, body):
        with self.condition:
            identifier = uuid.uuid4().hex
            self.pages[identifier] = {
                "sessionId": identifier,
                "enabled": True,
                "seen": self.clock(),
                "metadata": body.get("metadata", {}),
                "queue": [],
            }
            self.prune()
            return {"sessionId": identifier, "protocol": "craftstudio-page-bridge/1"}

    def heartbeat(self, body):
        with self.condition:
            page = self.page(body["sessionId"])
            if not page["enabled"]:
                raise ValueError("页面连接已关闭")
            page["seen"] = self.clock()
            metadata = body.get("metadata", page["metadata"])
            if metadata.get("serial", 0) >= page["metadata"].get("serial", 0):
                page["metadata"] = metadata
            return {"connected": True}

    def sessions(self):
        with self.condition:
            self.prune()
            return {
                "pages": [
                    {"sessionId": page["sessionId"], **page["metadata"]}
                    for page in self.pages.values()
                    if self.alive(page)
                ]
            }

    def submit(self, body):
        with self.condition:
            self.prune()
            identifier = body.get("sessionId")
            if not identifier:
                pages = [page for page in self.pages.values() if self.alive(page)]
                if len(pages) != 1:
                    raise ValueError("请先在 AI 面板连接一个工作台；多个页面时指定 sessionId")
                identifier = pages[0]["sessionId"]
            page = self.page(identifier)
            if not self.alive(page):
                raise ValueError("工作台尚未连接或连接已中断")
            operation = body.get("operation", "request")
            if operation not in ("request", "capture", "export", "save"):
                raise ValueError("Unknown designer operation")
            request = copy.deepcopy(body.get("request", {}))
            if operation == "request" and not isinstance(request.get("method"), str):
                raise ValueError("需要设计器 method")
            request_id = body.get("id") if body.get("id") is not None else request.get("id")
            if request_id is None:
                request_id = uuid.uuid4().hex
            if type(request_id) not in (str, int):
                raise ValueError("请求 ID 必须是字符串或整数")
            if operation == "request":
                request["id"] = request_id
            params = request.get("params", {})
            if (
                operation == "request"
                and "expectedRevision" in params
                and not params.get("workspaceId")
            ):
                raise ValueError("版本请求需同时传 workspaceId，请先读取 workspace.describe")
            workspace = (
                params.get("workspaceId")
                if operation == "request"
                else body.get("options", {}).get("workspaceId")
            )
            workspace = workspace or page["metadata"].get("workspaceId")
            payload = {
                "operation": operation,
                "request": request,
                "options": copy.deepcopy(body.get("options", {})),
                "workspaceId": workspace,
            }
            fingerprint = json.dumps(payload, sort_keys=True, separators=(",", ":"))
            receipt = (identifier, workspace, json.dumps(request_id))
            if receipt in self.receipts:
                job = self.jobs[self.receipts[receipt]]
                if job["fingerprint"] != fingerprint:
                    raise ValueError("REQUEST_ID_REUSED: 请求 ID 与原内容不同")
                return self.public(job)
            job_id = uuid.uuid4().hex
            job = {
                "jobId": job_id,
                "sessionId": identifier,
                "requestId": request_id,
                "status": "queued",
                "updated": self.clock(),
                "fingerprint": fingerprint,
                **payload,
            }
            self.jobs[job_id] = job
            self.receipts[receipt] = job_id
            page["queue"].append(job_id)
            self.condition.notify_all()
            return self.public(job)

    def poll(self, body):
        with self.condition:
            page = self.page(body["sessionId"])
            deadline = self.clock() + 10
            while page["enabled"]:
                page["seen"] = self.clock()
                while page["queue"]:
                    job = self.jobs.get(page["queue"].pop(0))
                    if not job or job["status"] != "queued":
                        continue
                    job.update(status="running", updated=self.clock())
                    return {
                        "job": {
                            key: job[key]
                            for key in ("jobId", "operation", "request", "options", "workspaceId")
                        }
                    }
                remaining = deadline - self.clock()
                if remaining <= 0:
                    return {"job": None}
                self.condition.wait(remaining)
            raise ValueError("页面连接已关闭")

    def export_file(self, job, wire):
        value = decode_reply(wire)
        exported = value["exported"]
        payload = exported.get("bytes", exported)
        binary = payload["$binary"]
        if binary["type"] not in ("Uint8Array", "ArrayBuffer"):
            raise ValueError("导出结果不是字节数据")
        options = job["options"]
        extension = {
            "nbt": "nbt",
            "craftlite": "craftlite",
            "schem": "schem",
            "json": "craft.json",
            "delivery": "zip",
        }[options.get("format", "nbt")]
        self.exports.mkdir(parents=True, exist_ok=True)
        file = self.exports / ("designer-" + job["jobId"] + "." + extension)
        raw = base64.b64decode(binary["base64"])
        file.write_bytes(raw)
        metadata = {
            key: item for key, item in exported.items() if key != "bytes" and key != "$binary"
        }
        return {
            "path": str(file.resolve()),
            "bytes": len(raw),
            "source": value["source"],
            **metadata,
        }

    def reply(self, body):
        with self.condition:
            job = self.jobs.get(body["jobId"])
            if not job or job["sessionId"] != body["sessionId"]:
                raise ValueError("任务不存在或属于其他页面")
            if job["status"] in ("completed", "failed"):
                return self.ack(job)
            if job["status"] not in ("running", "unconfirmed"):
                raise ValueError("任务尚未派发")
            if body.get("error"):
                job.update(status="failed", error=body["error"])
            else:
                try:
                    if job["operation"] == "export":
                        job["result"] = self.export_file(job, body["wire"])
                    else:
                        job["wire"] = body["wire"]
                    job["status"] = "completed"
                except (ValueError, KeyError, TypeError, IndexError, OSError) as error:
                    job.update(status="failed", error={"message": str(error)})
            job["updated"] = self.clock()
            self.condition.notify_all()
            return self.ack(job)

    def ack(self, job):
        return {key: job[key] for key in ("jobId", "status", "error") if key in job}

    def close(self, body):
        with self.condition:
            page = self.page(body["sessionId"])
            page["enabled"] = False
            for job in self.jobs.values():
                if job["sessionId"] != page["sessionId"]:
                    continue
                if job["status"] == "queued":
                    job.update(status="cancelled", updated=self.clock())
                elif job["status"] == "running":
                    job.update(status="unconfirmed", updated=self.clock())
            self.condition.notify_all()
            return {"connected": False}

    def public(self, job):
        keys = (
            "jobId",
            "sessionId",
            "requestId",
            "operation",
            "workspaceId",
            "status",
            "wire",
            "result",
            "error",
        )
        return {
            **{key: job[key] for key in keys if key in job},
            "pageConnected": self.alive(self.pages[job["sessionId"]]),
        }

    def job(self, identifier, wait=0):
        with self.condition:
            self.prune()
            deadline = self.clock() + max(0, min(float(wait), 20))
            while True:
                job = self.jobs.get(identifier)
                if not job:
                    raise ValueError("任务记录不存在或已过期；请先读取当前工程，不要盲目重提写入")
                remaining = deadline - self.clock()
                if job["status"] not in ("queued", "running") or remaining <= 0:
                    return self.public(job)
                self.condition.wait(remaining)

    def dispatch(self, action, body):
        routes = {
            "register": self.register,
            "heartbeat": self.heartbeat,
            "poll": self.poll,
            "reply": self.reply,
            "close": self.close,
            "request": self.submit,
        }
        if action not in routes:
            raise ValueError("Unknown page bridge route")
        return routes[action](body)
