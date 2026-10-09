import json
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from test_lite_bridge import server
from backend.designer_bridge import DesignerPages


class DesignerHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.old = server.DESIGNER_PAGES
        server.DESIGNER_PAGES = DesignerPages(cls.temp.name)
        cls.http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=cls.http.serve_forever, daemon=True).start()
        cls.base = "http://127.0.0.1:" + str(cls.http.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        server.DESIGNER_PAGES = cls.old
        cls.temp.cleanup()

    def fetch(self, path, body=None, token=True, origin=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["X-CraftStudio-Token"] = server.TOKEN
        if origin:
            headers["Origin"] = origin
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(body).encode() if body is not None else None,
            headers=headers,
        )
        with urllib.request.urlopen(request) as response:
            return json.load(response)

    def test_page_status_and_registration_require_the_existing_desktop_token_and_origin(self):
        for path, body in [
            ("/api/desktop/designer/sessions", None),
            ("/api/desktop/designer/register", {"metadata": {}}),
        ]:
            with self.assertRaises(urllib.error.HTTPError):
                self.fetch(path, body, token=False)
            with self.assertRaises(urllib.error.HTTPError):
                self.fetch(path, body, origin="https://unrelated.invalid")

    def test_authenticated_requests_use_the_registered_page_queue(self):
        sid = self.fetch("/api/desktop/designer/register", {"metadata": {"workspaceId": "w"}})[
            "sessionId"
        ]
        job = self.fetch(
            "/api/desktop/designer/request",
            {"sessionId": sid, "operation": "request", "request": {"method": "workspace.describe"}},
        )
        dispatched = self.fetch("/api/desktop/designer/poll", {"sessionId": sid})["job"]
        self.assertEqual(dispatched["jobId"], job["jobId"])
        self.fetch(
            "/api/desktop/designer/reply",
            {"sessionId": sid, "jobId": job["jobId"], "error": {"message": "test response"}},
        )
        self.assertEqual(
            self.fetch("/api/desktop/designer/job?jobId=" + job["jobId"])["status"], "failed"
        )
        self.fetch("/api/desktop/designer/close", {"sessionId": sid})
