"""Zero-dependency MCP stdio adapter for the running local CraftStudio service."""

import json
import os
from backend.designer_bridge import decode_reply
import sys
import urllib.request
import urllib.error

BASE = os.environ.get("CRAFTSTUDIO_URL", "http://127.0.0.1:18767").rstrip("/")
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
PROTOCOL = "2024-11-05"
TOKEN = None
CAPABILITIES = set()


def authorize():
    global TOKEN, CAPABILITIES
    try:
        response = OPENER.open(BASE + "/api/desktop/info", timeout=20)
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise
        response = OPENER.open(BASE + "/api/bootstrap", timeout=20)
    with response:
        info = json.load(response)
    TOKEN, CAPABILITIES = info["token"], set(info.get("capabilities", []))


def http(route, data=None, retry=True):
    global TOKEN
    if TOKEN is None:
        authorize()
    request = urllib.request.Request(
        BASE + route,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Content-Type": "application/json", "X-CraftStudio-Token": TOKEN},
    )
    try:
        with OPENER.open(request, timeout=180) as response:
            if "application/json" in response.headers.get("Content-Type", ""):
                return json.load(response)
            return {"exported": True, "bytes": len(response.read()), "directory": "exports/"}
    except urllib.error.HTTPError as error:
        message = json.load(error).get("error", str(error))
        if retry and "令牌无效" in message:
            TOKEN = None
            return http(route, data, retry=False)
        raise ValueError(message) from None


def schema(properties=None, required=None):
    return {
        "type": "object",
        "properties": properties or {},
        "required": required or [],
        "additionalProperties": False,
    }


STRING = {"type": "string"}
COORDS = {"type": "array", "items": {"type": "integer"}, "minItems": 3, "maxItems": 3}
TOOLS = [
    {
        "name": "get_environment",
        "description": "List local Minecraft instances. Game directory is read-only.",
        "inputSchema": schema(),
    },
    {
        "name": "read_project",
        "description": "Read the current authoritative 3D project, revision and materials.",
        "inputSchema": schema(),
    },
    {
        "name": "search_blocks",
        "description": "Search actual installed block asset IDs and Chinese names.",
        "inputSchema": schema({"instance": STRING, "query": STRING}, ["instance"]),
    },
    {
        "name": "list_blueprints",
        "description": "List schematics, saves, dimensions and resource environment.",
        "inputSchema": schema({"instance": STRING}, ["instance"]),
    },
    {
        "name": "edit_project",
        "description": "Apply set/fill/erase/replace operations to the 3D scene. Pass latest revision to avoid overwriting outside edits.",
        "inputSchema": schema(
            {
                "instance": STRING,
                "revision": {"type": "integer"},
                "operations": {"type": "array", "items": {"type": "object"}},
            },
            ["instance", "revision", "operations"],
        ),
    },
    {
        "name": "import_blueprint",
        "description": "Import NBT/schem/litematic relative to the chosen instance schematics folder.",
        "inputSchema": schema(
            {"instance": STRING, "path": STRING, "revision": {"type": "integer"}},
            ["instance", "path", "revision"],
        ),
    },
    {
        "name": "read_world_region",
        "description": "Read a closed save region into the 3D project; never modifies game saves.",
        "inputSchema": schema(
            {
                "instance": STRING,
                "world": STRING,
                "dimension": STRING,
                "min": COORDS,
                "max": COORDS,
                "revision": {"type": "integer"},
            },
            ["instance", "world", "dimension", "min", "max", "revision"],
        ),
    },
    {
        "name": "export_blueprint",
        "description": "Write current project to exports as compressed vanilla/Create-compatible NBT. Does not install into game.",
        "inputSchema": schema({"name": STRING}),
    },
    {
        "name": "save_project",
        "description": "Save current 3D project to the local SQLite library with immutable content versions and a portable JSON copy.",
        "inputSchema": schema(
            {
                "name": STRING,
                "description": STRING,
                "tags": {"type": "array", "items": STRING},
                "kind": {"enum": ["project", "blueprint", "component"]},
                "note": STRING,
                "saveAs": {"type": "boolean"},
                "revision": {"type": "integer"},
                "head": {"type": "integer"},
                "instance": STRING,
            }
        ),
    },
    {
        "name": "list_saved_projects",
        "description": "Search reusable locally saved projects/blueprints/components including tags and favorites.",
        "inputSchema": schema(
            {
                "query": STRING,
                "kind": STRING,
                "favorite": {"type": "boolean"},
                "offset": {"type": "integer"},
            }
        ),
    },
    {
        "name": "open_saved_project",
        "description": "Load a saved local building or an older version into the live 3D scene. Older versions remain immutable; saving creates a new version.",
        "inputSchema": schema(
            {"id": STRING, "version": {"type": "integer"}, "revision": {"type": "integer"}},
            ["id", "revision"],
        ),
    },
    {
        "name": "list_project_versions",
        "description": "Inspect immutable saved building versions and notes.",
        "inputSchema": schema({"id": STRING}, ["id"]),
    },
    {
        "name": "backup_library",
        "description": "Make a consistent local SQLite backup including WAL updates.",
        "inputSchema": schema(),
    },
    {
        "name": "undo_edit",
        "description": "Undo a desktop design edit, not a game build.",
        "inputSchema": schema(),
    },
    {
        "name": "bridge_request",
        "description": "Connect to installed local bridge. apply builds current project in creative single-player; job reports progress; undo restores prior cells. Requires user-provided game bridge token.",
        "inputSchema": schema(
            {
                "action": {"enum": ["health", "read", "apply", "job", "undo"]},
                "port": {"type": "integer"},
                "token": STRING,
                "payload": {"type": "object"},
            },
            ["action", "token"],
        ),
    },
]


for tool in TOOLS:
    if tool["name"] not in ("get_environment", "search_blocks", "list_blueprints"):
        tool[
            "description"
        ] = "Legacy compatibility state (not the open designer page). Use designer_call for the visible scene. " + tool[
            "description"
        ].replace(
            "current authoritative", "legacy compatibility"
        ).replace(
            "live 3D scene", "compatibility scene"
        )
TOOLS[:0] = [
    {
        "name": "designer_sessions",
        "description": "List explicitly connected open 3D designer pages. If none, enable the current-page connection in its AI panel. Multiple pages require a sessionId.",
        "inputSchema": schema(),
        "annotations": {"readOnlyHint": True},
    },
    {
        "name": "designer_call",
        "description": "Operate the connected visible designer using its shared API. request forwards any v1 method; capture returns the current 3D view (options.view can position the camera); export saves an artifact locally; save creates an immutable library version; import opens an explicit file using options {name,dataBase64,workspaceId,expectedRevision,region?} and returns the new workspace. .mca requires region {min,max}. Read workspace.describe before writes. A pending job continues running: poll designer_job with the same jobId, do not resubmit an uncertain write.",
        "inputSchema": schema(
            {
                "sessionId": STRING,
                "id": STRING,
                "operation": {"enum": ["request", "capture", "export", "save", "import"]},
                "request": {"type": "object"},
                "options": {"type": "object"},
            },
            ["operation"],
        ),
    },
    {
        "name": "designer_job",
        "description": "Read or wait for the same designer job. Observation timeout does not cancel execution. Unconfirmed means effects are not known; read the current authoritative scene before deciding to retry.",
        "inputSchema": schema(
            {"jobId": STRING, "wait": {"type": "number", "minimum": 0, "maximum": 20}}, ["jobId"]
        ),
        "annotations": {"readOnlyHint": True},
    },
]


def designer_result(job):
    if job.get("status") == "completed" and "wire" in job:
        job = dict(job)
        job["result"] = decode_reply(job.pop("wire"))
    return job


def call(name, args):
    from urllib.parse import urlencode

    if name.startswith("designer_"):
        if TOKEN is None:
            authorize()
        if "designer-page/1" not in CAPABILITIES:
            raise ValueError("请更新并重启本地工作台，以启用当前页面连接")
    legacy_write = name in {
        "edit_project",
        "import_blueprint",
        "read_world_region",
        "save_project",
        "open_saved_project",
        "undo_edit",
    } or (name == "bridge_request" and args.get("action") == "apply")
    if legacy_write:
        if TOKEN is None:
            authorize()
        if "designer-page/1" in CAPABILITIES and http("/api/desktop/designer/sessions")["pages"]:
            raise ValueError(
                "旧写入接口指向独立兼容工程；当前工作台已连接，请使用 designer_call。游戏施工请使用当前工作台的游戏连接或交付文件。"
            )
    if name == "designer_sessions":
        return http("/api/desktop/designer/sessions")
    if name == "designer_call":
        job = http("/api/desktop/designer/request", args)
        if job["status"] in ("queued", "running"):
            job = http("/api/desktop/designer/job?" + urlencode({"jobId": job["jobId"], "wait": 2}))
        return designer_result(job)
    if name == "designer_job":
        return designer_result(
            http(
                "/api/desktop/designer/job?"
                + urlencode({"jobId": args["jobId"], "wait": args.get("wait", 0)})
            )
        )
    if name == "get_environment":
        data = http("/api/bootstrap")
        return {"instances": data["instances"], "version": data["version"]}
    if name == "read_project":
        return http("/api/project")
    if name == "search_blocks":
        return http(
            "/api/blocks?" + urlencode({"instance": args["instance"], "q": args.get("query", "")})
        )
    if name == "list_blueprints":
        return http("/api/catalogue?" + urlencode({"instance": args["instance"]}))
    if name == "list_saved_projects":
        return http(
            "/api/library?"
            + urlencode(
                {
                    "q": args.get("query", ""),
                    "kind": args.get("kind", ""),
                    "favorite": "1" if args.get("favorite") else "0",
                    "offset": args.get("offset", 0),
                }
            )
        )
    if name == "list_project_versions":
        return http("/api/library/versions?" + urlencode({"id": args["id"]}))
    routes = {
        "edit_project": "/api/edit",
        "import_blueprint": "/api/import",
        "read_world_region": "/api/world",
        "export_blueprint": "/api/export",
        "save_project": "/api/save",
        "undo_edit": "/api/undo",
        "open_saved_project": "/api/library/open",
        "backup_library": "/api/library/backup",
    }
    if name in routes:
        return http(routes[name], args)
    if name == "bridge_request":
        args = dict(args)
        action = args.pop("action")
        if action not in ("health", "read", "apply", "job", "undo"):
            raise ValueError("Unknown bridge action")
        return http("/api/bridge/" + action, args)
    raise ValueError("Unknown tool")


def handle(message):
    global PROTOCOL
    method, identifier = message.get("method"), message.get("id")
    if identifier is None:
        return None
    if method == "initialize":
        requested = message.get("params", {}).get("protocolVersion")
        PROTOCOL = (
            requested
            if requested in {"2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"}
            else "2025-11-25"
        )
        result = {
            "protocolVersion": PROTOCOL,
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "craftstudio", "version": "0.3.0"},
        }
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        try:
            params = message["params"]
            value = call(params["name"], params.get("arguments", {}))
            content = []
            if (
                isinstance(value, dict)
                and value.get("operation") == "capture"
                and value.get("status") == "completed"
            ):
                value = dict(value)
                image = dict(value["result"])
                uri = image.pop("dataUrl")
                if not uri.startswith("data:image/png;base64,"):
                    raise ValueError("Unsupported capture type")
                content.append(
                    {"type": "image", "mimeType": "image/png", "data": uri.split(",", 1)[1]}
                )
                value["result"] = image
            content.append({"type": "text", "text": json.dumps(value, ensure_ascii=False)})
            result = {"content": content}
            if isinstance(value, dict):
                failed = value.get("status") in ("failed", "cancelled", "unconfirmed") or (
                    isinstance(value.get("result"), dict) and value["result"].get("ok") is False
                )
                if failed:
                    result["isError"] = True
                if PROTOCOL != "2024-11-05":
                    result["structuredContent"] = value
        except Exception as error:
            result = {"isError": True, "content": [{"type": "text", "text": str(error)}]}
    else:
        return {
            "jsonrpc": "2.0",
            "id": identifier,
            "error": {"code": -32601, "message": "Method not found"},
        }
    return {"jsonrpc": "2.0", "id": identifier, "result": result}


if __name__ == "__main__":
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    for line in sys.stdin:
        try:
            result = handle(json.loads(line))
            if result is not None:
                print(json.dumps(result, ensure_ascii=False), flush=True)
        except Exception as error:
            print(
                json.dumps(
                    {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(error)}}
                ),
                flush=True,
            )
