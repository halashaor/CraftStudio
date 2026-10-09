"""Instance-aware layered resource index; does not modify game files."""

import os
import hashlib
import json
import threading
import zipfile
from pathlib import Path

_nearby = Path(__file__).resolve().parents[2] / ".minecraft"
MC = Path(
    os.environ.get(
        "CRAFTSTUDIO_MINECRAFT_HOME",
        str(
            _nearby
            if _nearby.is_dir()
            else Path(os.environ.get("APPDATA", Path.home())) / ".minecraft"
        ),
    )
)


def read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return {}


def instances():
    result = []
    if not (MC / "versions").is_dir():
        return result
    for path in sorted((MC / "versions").iterdir()):
        if not path.is_dir() or not (path / (path.name + ".json")).is_file():
            continue
        config = read_json(path / (path.name + ".json"))
        libs = [lib.get("name", "") for lib in config.get("libraries", [])]
        loader = (
            "NeoForge"
            if "neoforged" in str(libs)
            else (
                "Forge"
                if "forge" in str(libs)
                else "Fabric" if "fabric" in str(libs) else "Vanilla"
            )
        )
        result.append(
            {
                "id": path.name,
                "loader": loader,
                "java": config.get("javaVersion", {}).get("majorVersion"),
                "mods": len(list((path / "mods").glob("*.jar"))),
                "isolated": (path / "mods").is_dir(),
            }
        )
    return result


def instance_path(name):
    path = (MC / "versions" / name).resolve()
    if path.parent != (MC / "versions").resolve() or not path.is_dir():
        raise ValueError("无效实例")
    return path


def scope_path(base, relative):
    path = (Path(base) / relative).resolve()
    if not path.is_relative_to(Path(base).resolve()):
        raise ValueError("路径超出所选目录")
    return path


class ResourceIndex:
    def __init__(self, instance):
        self.instance = instance
        self.path = instance_path(instance)
        self.home = self.path if (self.path / "mods").is_dir() else MC
        self.resources, self.sources, self.languages, self.models = {}, [], {}, {}
        self.warnings = []
        self.lock = threading.RLock()
        self.data_version = 0
        manifest = read_json(self.path / (instance + ".json"))
        version_jar = self.path / (instance + ".jar")
        self.add_source(version_jar, "原版")
        if version_jar.is_file():
            with zipfile.ZipFile(version_jar) as archive:
                if "version.json" in archive.namelist():
                    self.data_version = json.loads(archive.read("version.json")).get(
                        "world_version", 0
                    )
        if not any(k.startswith("assets/minecraft/blockstates/") for k in self.resources):
            parent = manifest.get("inheritsFrom")
            if parent:
                self.add_source(MC / "versions" / parent / (parent + ".jar"), "原版继承")
        if not any(k.startswith("assets/minecraft/blockstates/") for k in self.resources):
            self.warnings.append("未找到对应版本的原版模型，原版方块可能显示占位模型。")
        for file in sorted((self.home / "mods").glob("*.jar")):
            self.add_source(file, file.stem)
        # KubeJS-generated static client resources override bundled mod assets.
        if (self.home / "kubejs" / "assets").is_dir():
            self.add_source(self.home / "kubejs", "KubeJS")
        enabled = []
        options = self.home / "options.txt"
        if options.is_file():
            for line in options.read_text(encoding="utf-8", errors="replace").splitlines():
                if line.startswith("resourcePacks:"):
                    try:
                        enabled = json.loads(line.split(":", 1)[1])
                    except ValueError:
                        self.warnings.append("材质包启用列表无法解析")
        self.packs = []
        for item in enabled:
            if item.startswith("file/"):
                path = scope_path(self.home / "resourcepacks", item[5:])
                self.add_source(path, item[5:])
                self.packs.append(item[5:])
            elif item not in ("vanilla", "mod_resources"):
                self.warnings.append(f"内建或动态资源包 {item} 需游戏桥接读取")
        for language in ("en_us", "zh_cn"):
            for key in self.resources:
                if key.endswith("/lang/" + language + ".json"):
                    self.languages.update(self.json(key))
        self.ids = sorted(
            f'{k.split("/")[1]}:{k.split("/blockstates/")[1][:-5]}'
            for k in self.resources
            if "/blockstates/" in k and k.endswith(".json")
        )
        self.fingerprint = hashlib.sha256(
            "|".join(f"{p}:{p.stat().st_mtime_ns}" for p, _ in self.sources).encode()
        ).hexdigest()[:16]

    def add_source(self, path, label):
        if not path.exists():
            return
        try:
            if path.is_dir():
                names = [
                    f.relative_to(path).as_posix()
                    for f in (path / "assets").rglob("*")
                    if f.is_file()
                ]
            else:
                with zipfile.ZipFile(path) as archive:
                    names = [
                        n
                        for n in archive.namelist()
                        if n.startswith("assets/") and not n.endswith("/")
                    ]
            self.sources.append((path, label))
            for key in names:
                self.resources[key] = (path, label)
        except (OSError, zipfile.BadZipFile):
            self.warnings.append(f"无法读取资源：{path.name}")

    def read(self, key):
        item = self.resources.get(key)
        if not item:
            return None
        path = item[0]
        if path.is_dir():
            return scope_path(path, key).read_bytes()
        with zipfile.ZipFile(path) as archive:
            return archive.read(key)

    def json(self, key):
        try:
            data = self.read(key)
            return json.loads(data) if data else {}
        except (ValueError, OSError):
            return {}

    def summary(self):
        return {
            "instance": self.instance,
            "blocks": len(self.ids),
            "resources": len(self.resources),
            "packs": self.packs,
            "sources": len(self.sources),
            "dataVersion": self.data_version,
            "fingerprint": self.fingerprint,
            "warnings": self.warnings,
        }

    def search(self, query, offset=0, limit=100):
        result = []
        q = query.lower()
        for block in self.ids:
            ns, name = block.split(":", 1)
            label = self.languages.get(f'block.{ns}.{name.replace("/", ".")}', name)
            if q not in block.lower() and q not in label.lower():
                continue
            result.append({"id": block, "label": label, "source": ns})
        return {"total": len(result), "items": result[offset : offset + limit]}

    def resolve_model(self, name, seen=None):
        if name in self.models:
            return self.models[name]
        seen = set() if seen is None else seen
        if name in seen or len(seen) > 32:
            return {}
        seen.add(name)
        ns, path = name.split(":", 1) if ":" in name else ("minecraft", name)
        raw = self.json(f"assets/{ns}/models/{path}.json")
        result = (
            dict(self.resolve_model(raw["parent"], seen))
            if raw.get("parent") and not raw["parent"].startswith("builtin/")
            else {}
        )
        textures = dict(result.get("textures", {}))
        textures.update(raw.get("textures", {}))
        result.update(raw)
        result["textures"] = textures
        self.models[name] = result
        return result

    def block_model(self, state):
        block = state["Name"]
        ns, path = block.split(":", 1)
        key = f"assets/{ns}/blockstates/{path}.json"
        raw = self.json(key)
        props = dict(state.get("Properties", {}))
        choices = []
        variants = raw.get("variants", {})
        if not props and variants:
            first = next(iter(variants))
            props = dict(p.split("=", 1) for p in first.split(",") if "=" in p)
        for condition, value in variants.items():
            expected = dict(p.split("=", 1) for p in condition.split(",") if "=" in p)
            if all(props.get(k) in v.split("|") for k, v in expected.items()):
                choices.append(value)
                break

        def matches(condition):
            if not condition:
                return True
            if "OR" in condition:
                return any(matches(c) for c in condition["OR"])
            if "AND" in condition:
                return all(matches(c) for c in condition["AND"])
            return all(props.get(k) in str(v).split("|") for k, v in condition.items())

        for part in raw.get("multipart", []):
            if matches(part.get("when")):
                choices.append(part["apply"])
        parts, issues = [], []
        for choice in choices:
            if isinstance(choice, list):
                choice = choice[0]  # deterministic preview of weighted variants
            model = self.resolve_model(choice.get("model", ""))
            if model.get("loader"):
                issues.append("自定义模型加载器：" + model["loader"])
            if model.get("render_type"):
                pass
            textures = model.get("textures", {})

            def texture(ref):
                seen = set()
                while ref and ref.startswith("#"):
                    if ref in seen:
                        return None
                    seen.add(ref)
                    ref = textures.get(ref[1:])
                if not ref:
                    return None
                tns, tpath = ref.split(":", 1) if ":" in ref else ("minecraft", ref)
                return f"assets/{tns}/textures/{tpath}.png"

            elements = []
            for element in model.get("elements", []):
                e = dict(element)
                e["faces"] = {
                    direction: dict(face, texture=texture(face.get("texture")))
                    for direction, face in element.get("faces", {}).items()
                }
                elements.append(e)
            parts.append(
                {
                    "x": choice.get("x", 0),
                    "y": choice.get("y", 0),
                    "uvlock": choice.get("uvlock", False),
                    "elements": elements,
                }
            )
        missing = not any(part["elements"] for part in parts)
        if missing:
            issues.append("无可用静态几何；需要游戏内动态渲染适配")
        if any(part.get("uvlock") for part in parts):
            issues.append("UV 锁定目前为近似预览")
        return {
            "id": block,
            "state": {"Name": block, "Properties": props} if props else {"Name": block},
            "parts": parts,
            "missing": missing,
            "issues": issues,
            "source": self.resources.get(key, (None, "缺失"))[1],
        }


_indexes = {}
_index_lock = threading.RLock()


def index(instance):
    with _index_lock:
        if instance not in _indexes:
            _indexes[instance] = ResourceIndex(instance)
        return _indexes[instance]
