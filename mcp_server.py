"""Zero-dependency MCP stdio adapter for the running local CraftStudio service."""

import json
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:18765"
TOKEN = None


def http(route, data=None, retry=True):
    global TOKEN
    if TOKEN is None:
        TOKEN = json.load(urllib.request.urlopen(BASE + "/api/bootstrap", timeout=20))["token"]
    request = urllib.request.Request(
        BASE + route,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Content-Type": "application/json", "X-CraftStudio-Token": TOKEN},
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            if "application/json" in response.headers.get("Content-Type", ""):
                return json.load(response)
            return {"exported": True, "bytes": len(response.read()), "directory": "exports/"}
    except urllib.error.HTTPError as error:
        message = json.load(error).get("error", str(error))
        if retry and data is not None and "令牌无效" in message:
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


def call(name, args):
    from urllib.parse import urlencode

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
    method, identifier = message.get("method"), message.get("id")
    if identifier is None:
        return None
    if method == "initialize":
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "craftstudio", "version": "0.2.0"},
        }
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        try:
            params = message["params"]
            result = {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(
                            call(params["name"], params.get("arguments", {})), ensure_ascii=False
                        ),
                    }
                ]
            }
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
