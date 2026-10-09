import base64
import gzip
import json
import tempfile
import unittest
from pathlib import Path
from backend.designer_bridge import DesignerPages, decode_reply


def wire(value):
    def pack(value):
        if isinstance(value, bytes):
            return ["b", "Uint8Array", base64.b64encode(value).decode()]
        if isinstance(value, dict):
            return ["o", [[key, pack(item)] for key, item in value.items()]]
        if isinstance(value, list):
            return ["a", [pack(item) for item in value]]
        return ["v", value]

    return base64.b64encode(
        gzip.compress(
            json.dumps({"schema": "craftstudio-engine-wire/1", "value": pack(value)}).encode()
        )
    ).decode()


class DesignerPageTests(unittest.TestCase):
    def test_resource_discovery_is_read_only_and_changes_need_scope(self):
        job = self.pages.submit(
            {"sessionId": self.sid, "operation": "resources", "options": {"action": "list"}}
        )
        self.assertEqual(job["operation"], "resources")
        with self.assertRaisesRegex(ValueError, "workspaceId"):
            self.pages.submit(
                {
                    "sessionId": self.sid,
                    "operation": "resources",
                    "options": {"action": "configure", "remove": ["r"]},
                }
            )
        changed = self.pages.submit(
            {
                "sessionId": self.sid,
                "operation": "resources",
                "options": {
                    "action": "configure",
                    "workspaceId": "w",
                    "expectedRevision": 1,
                    "enabled": {"r": False},
                },
            }
        )
        self.assertEqual(changed["workspaceId"], "w")

    def test_import_requires_explicit_scope_and_replays_one_job(self):
        with self.assertRaisesRegex(ValueError, "workspaceId"):
            self.pages.submit(
                {
                    "sessionId": self.sid,
                    "operation": "import",
                    "options": {"name": "site.nbt", "dataBase64": "AA=="},
                }
            )
        body = {
            "sessionId": self.sid,
            "operation": "import",
            "id": "open-once",
            "options": {
                "name": "site.nbt",
                "dataBase64": "AA==",
                "workspaceId": "w",
                "expectedRevision": 1,
            },
        }
        first = self.pages.submit(body)
        self.assertEqual(first["jobId"], self.pages.submit(body)["jobId"])
        job = self.pages.poll({"sessionId": self.sid})["job"]
        self.assertEqual(job["workspaceId"], "w")
        self.assertEqual(job["options"]["expectedRevision"], 1)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.now = 0
        self.pages = DesignerPages(self.temp.name, clock=lambda: self.now)
        self.sid = self.pages.register(
            {"metadata": {"title": "Main", "workspaceId": "w", "revision": 1}}
        )["sessionId"]

    def submit(self, identifier="r", **kwargs):
        return self.pages.submit(
            {
                "sessionId": self.sid,
                "operation": "request",
                "request": {
                    "id": identifier,
                    "method": "edit.apply",
                    "params": {"expectedRevision": 1, "workspaceId": "w"},
                },
                **kwargs,
            }
        )

    def test_same_request_is_one_job_and_different_payload_is_rejected(self):
        first = self.submit()
        self.assertEqual(self.submit()["jobId"], first["jobId"])
        with self.assertRaisesRegex(ValueError, "REQUEST_ID_REUSED"):
            self.submit(request={"id": "r", "method": "history.undo"})
        dispatch = self.pages.poll({"sessionId": self.sid})["job"]
        self.assertEqual(dispatch["workspaceId"], "w")
        result = {"ok": True, "revision": 2}
        reply = self.pages.reply(
            {"sessionId": self.sid, "jobId": first["jobId"], "wire": wire(result)}
        )
        self.assertEqual(decode_reply(self.pages.job(first["jobId"])["wire"]), result)
        self.assertEqual(self.submit()["status"], "completed")

    def test_multiple_connected_pages_require_an_explicit_target(self):
        self.pages.register({"metadata": {"workspaceId": "other"}})
        with self.assertRaisesRegex(ValueError, "多个页面"):
            self.pages.submit({"operation": "capture"})
        self.assertEqual(len(self.pages.sessions()["pages"]), 2)

    def test_disconnect_cancels_queued_but_does_not_claim_running_work_had_no_effect(self):
        running = self.submit("running")
        self.pages.poll({"sessionId": self.sid})
        queued = self.submit("queued")
        self.pages.close({"sessionId": self.sid})
        self.assertEqual(self.pages.job(running["jobId"])["status"], "unconfirmed")
        self.assertEqual(self.pages.job(queued["jobId"])["status"], "cancelled")
        self.pages.reply(
            {"sessionId": self.sid, "jobId": running["jobId"], "wire": wire({"ok": True})}
        )
        self.assertEqual(self.pages.job(running["jobId"])["status"], "completed")

    def test_poll_timeout_never_cancels_a_job_and_expired_receipts_are_reported(self):
        job = self.submit()
        self.assertEqual(self.pages.job(job["jobId"], 0)["status"], "queued")
        self.now = 601
        with self.assertRaisesRegex(ValueError, "记录不存在或已过期"):
            self.pages.job(job["jobId"])

    def test_export_writes_only_the_requested_artifact_and_returns_metadata(self):
        job = self.pages.submit(
            {"sessionId": self.sid, "operation": "export", "options": {"format": "delivery"}}
        )
        self.pages.poll({"sessionId": self.sid})
        result = self.pages.reply(
            {
                "sessionId": self.sid,
                "jobId": job["jobId"],
                "wire": wire({"exported": b"zip data", "source": {"revision": 1}}),
            }
        )
        self.assertEqual(result["status"], "completed")
        file = Path(self.pages.job(job["jobId"])["result"]["path"])
        self.assertEqual(file.parent, Path(self.temp.name).resolve())
        self.assertEqual(file.suffix, ".zip")
        self.assertEqual(file.read_bytes(), b"zip data")
        self.assertNotIn("wire", result)

    def test_foreign_page_cannot_complete_a_job(self):
        job = self.submit()
        other = self.pages.register({"metadata": {}})["sessionId"]
        with self.assertRaisesRegex(ValueError, "其他页面"):
            self.pages.reply({"sessionId": other, "jobId": job["jobId"], "wire": wire({})})

    def test_numeric_zero_request_id_is_preserved_and_distinct_from_string_zero(self):
        first = self.submit(0)
        self.assertEqual(self.submit(0)["jobId"], first["jobId"])
        other = self.submit("0")
        self.assertNotEqual(other["jobId"], first["jobId"])
        self.assertEqual(self.pages.poll({"sessionId": self.sid})["job"]["request"]["id"], 0)

    def test_versioned_requests_bind_the_explicit_document_not_the_latest_tab_metadata(self):
        with self.assertRaisesRegex(ValueError, "workspaceId"):
            self.pages.submit(
                {
                    "sessionId": self.sid,
                    "operation": "request",
                    "request": {"method": "edit.apply", "params": {"expectedRevision": 1}},
                }
            )
        self.pages.heartbeat(
            {"sessionId": self.sid, "metadata": {"workspaceId": "new", "serial": 1}}
        )
        self.submit("old-document")
        self.assertEqual(self.pages.poll({"sessionId": self.sid})["job"]["workspaceId"], "w")
