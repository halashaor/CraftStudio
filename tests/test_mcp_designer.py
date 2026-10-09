import unittest
from unittest.mock import patch
import mcp_server
from test_designer_bridge import wire


class McpDesignerTests(unittest.TestCase):
    def setUp(self):
        self.old = mcp_server.PROTOCOL
        self.addCleanup(setattr, mcp_server, "PROTOCOL", self.old)
        mcp_server.handle(
            {"id": 1, "method": "initialize", "params": {"protocolVersion": "2025-11-25"}}
        )

    def test_tools_negotiate_protocol_and_return_native_image_with_structured_metadata(self):
        tools = mcp_server.handle({"id": 2, "method": "tools/list"})["result"]["tools"]
        self.assertEqual(tools[0]["name"], "designer_sessions")
        self.assertIn(
            "Legacy", next(tool for tool in tools if tool["name"] == "read_project")["description"]
        )
        job = {
            "jobId": "j",
            "status": "completed",
            "operation": "capture",
            "wire": wire(
                {
                    "dataUrl": "data:image/png;base64,AA==",
                    "mimeType": "image/png",
                    "scene": {"geometryLoading": True},
                }
            ),
        }
        with patch.object(mcp_server, "TOKEN", "test"), patch.object(
            mcp_server, "CAPABILITIES", {"designer-page/1"}
        ), patch.object(mcp_server, "http", return_value=job):
            result = mcp_server.handle(
                {
                    "id": 3,
                    "method": "tools/call",
                    "params": {"name": "designer_job", "arguments": {"jobId": "j"}},
                }
            )["result"]
        self.assertEqual(result["content"][0]["type"], "image")
        self.assertEqual(result["content"][0]["data"], "AA==")
        self.assertNotIn("dataUrl", result["structuredContent"]["result"])
        self.assertTrue(result["structuredContent"]["result"]["scene"]["geometryLoading"])

    def test_connected_page_blocks_hidden_legacy_edits_and_legacy_game_apply(self):
        with patch.object(mcp_server, "TOKEN", "test"), patch.object(
            mcp_server, "CAPABILITIES", {"designer-page/1"}
        ), patch.object(mcp_server, "http", return_value={"pages": [{"sessionId": "s"}]}) as http:
            for name, args in [("edit_project", {}), ("bridge_request", {"action": "apply"})]:
                with self.assertRaisesRegex(ValueError, "独立兼容工程"):
                    mcp_server.call(name, args)
            self.assertTrue(
                all(
                    call.args[0] == "/api/desktop/designer/sessions" for call in http.call_args_list
                )
            )

    def test_disconnected_compatibility_clients_keep_their_existing_routes(self):
        def http(route, data=None):
            return {"pages": []} if route.endswith("sessions") else {"route": route}

        with patch.object(mcp_server, "TOKEN", "test"), patch.object(
            mcp_server, "CAPABILITIES", {"designer-page/1"}
        ), patch.object(mcp_server, "http", side_effect=http):
            self.assertEqual(mcp_server.call("edit_project", {})["route"], "/api/edit")
