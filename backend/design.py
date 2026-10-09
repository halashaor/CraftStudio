import copy
import json
from collections import Counter
from backend.formats import project


def validate(p):
    if p.get("schema") != 1 or not isinstance(p.get("palette"), list):
        raise ValueError("无效 CraftStudio 工程")
    if len(p.get("size", [])) != 3 or any(type(v) is not int or v < 1 for v in p["size"]):
        raise ValueError("无效工程尺寸")
    seen = set()
    for state in p["palette"]:
        if not isinstance(state.get("Name"), str) or ":" not in state["Name"]:
            raise ValueError("方块必须使用 namespace:id")
    for b in p.get("blocks", []):
        if len(b["pos"]) != 3 or any(type(v) is not int or v < 0 for v in b["pos"]):
            raise ValueError("方块位置必须是非负整数")
        if type(b["state"]) is not int or not 0 <= b["state"] < len(p["palette"]):
            raise ValueError("方块调色板索引无效")
        if any(b["pos"][a] >= p["size"][a] for a in range(3)):
            raise ValueError("方块位于尺寸边界之外")
        key = tuple(b["pos"])
        if key in seen:
            raise ValueError("工程中存在重复坐标")
        seen.add(key)
    return p


def materials(p):
    counts = Counter(p["palette"][b["state"]]["Name"] for b in p["blocks"])
    return [
        {"id": key, "count": count, "stacks": f"{count // 64} 组 + {count % 64}"}
        for key, count in counts.most_common()
    ]


def room(
    width=18,
    length=14,
    height=8,
    wall="minecraft:stone_bricks",
    floor="minecraft:polished_andesite",
    roof="minecraft:dark_oak_planks",
    glass="minecraft:glass",
):
    width, length, height = int(width), int(length), int(height)
    if not (5 <= width <= 128 and 5 <= length <= 128 and 4 <= height <= 64):
        raise ValueError("房间尺寸：宽/长 5–128，高 4–64")
    p = project("河畔工坊 · 参数化示例")
    p["palette"] = [{"Name": item} for item in (wall, floor, roof, glass)]
    rows = {}
    for x in range(width):
        for z in range(length):
            rows[(x, 0, z)] = 1
            for y in range(1, height):
                if x in (0, width - 1) or z in (0, length - 1):
                    s = 3 if 2 <= y <= height - 3 and (x % 5 in (2, 3) or z % 5 in (2, 3)) else 0
                    if z == 0 and abs(x - (width - 1) / 2) < 1.6 and y <= 3:
                        continue
                    rows[(x, y, z)] = s
    # Gabled roof in block geometry, not an artistic image.
    for z in range(-1, length + 1):
        for x in range(-1, width + 1):
            y = height + min(x + 1, width - x) // 2
            rows[(x, y, z)] = 2
    p["blocks"] = [{"pos": [x + 1, y, z + 1], "state": s} for (x, y, z), s in rows.items()]
    p["size"] = [width + 2, max(b["pos"][1] for b in p["blocks"]) + 1, length + 2]
    p["metadata"]["sourceFormat"] = "generated"
    return p


def apply_operations(original, operations, resources=None):
    p = copy.deepcopy(original)
    cells = {tuple(b["pos"]): b for b in p["blocks"]}
    palette_lookup = {json.dumps(s, sort_keys=True): i for i, s in enumerate(p["palette"])}
    for op in operations:
        kind = op.get("type")
        if kind not in ("set", "fill", "erase", "replace"):
            raise ValueError(f"不支持操作 {kind}")
        if kind != "erase":
            state = op.get("state")
            if not isinstance(state, dict) or not isinstance(state.get("Name"), str):
                raise ValueError("操作缺少方块状态")
            if resources and state["Name"] not in resources.ids:
                raise ValueError(f'所选实例没有方块 {state["Name"]}')
            if resources:
                # Normalize defaults using the actual resource blockstate definition.
                state = resources.block_model(state)["state"]
            key = json.dumps(state, sort_keys=True)
            if key not in palette_lookup:
                palette_lookup[key] = len(p["palette"])
                p["palette"].append(state)
            si = palette_lookup[key]
        if kind == "replace":
            source = op.get("from")
            for cell in cells.values():
                if p["palette"][cell["state"]]["Name"] == source:
                    cell["state"] = si
                    cell.pop("nbt", None)
            continue
        lo, hi = (op.get("pos"), op.get("pos")) if kind == "set" else (op.get("min"), op.get("max"))
        if not isinstance(lo, list) or not isinstance(hi, list) or len(lo) != 3 or len(hi) != 3:
            raise ValueError("需要三个整数坐标")
        if any(type(v) is not int or v < 0 for v in lo + hi) or any(
            lo[a] > hi[a] for a in range(3)
        ):
            raise ValueError("无效区域坐标")
        if (
            any(v > 4095 for v in hi)
            or (hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1) > 2000000
        ):
            raise ValueError("单次操作过大，请分成多个区域")
        for y in range(lo[1], hi[1] + 1):
            for z in range(lo[2], hi[2] + 1):
                for x in range(lo[0], hi[0] + 1):
                    pos = (x, y, z)
                    if kind == "erase" or p["palette"][si]["Name"] == "minecraft:air":
                        cells.pop(pos, None)
                    else:
                        old = cells.get(pos)
                        if old and old["state"] == si:
                            continue  # preserve typed NBT for unchanged blocks
                        cells[pos] = {"pos": list(pos), "state": si}
        p["size"] = [max(p["size"][a], hi[a] + 1) for a in range(3)]
    p["blocks"] = list(cells.values())
    return validate(p)


def rotate(p):
    if (
        p.get("entities")
        or any(b.get("nbt") for b in p["blocks"])
        or p.get("metadata", {}).get("nativeExtra")
    ):
        raise ValueError(
            "此结构含实体、方块实体或 Create 关联数据，旋转需要专用适配器；当前保持原始数据。"
        )
    if any(s["Name"].split(":")[0] != "minecraft" for s in p["palette"]):
        raise ValueError("Mod 方块旋转规则尚未注册，不能只旋转坐标。")
    p = copy.deepcopy(p)
    width, height, length = p["size"]
    for b in p["blocks"]:
        x, y, z = b["pos"]
        b["pos"] = [length - 1 - z, y, x]
    directions = {"north": "east", "east": "south", "south": "west", "west": "north"}
    rails = {
        "north_south": "east_west",
        "east_west": "north_south",
        "ascending_north": "ascending_east",
        "ascending_east": "ascending_south",
        "ascending_south": "ascending_west",
        "ascending_west": "ascending_north",
        "north_east": "south_east",
        "south_east": "south_west",
        "south_west": "north_west",
        "north_west": "north_east",
    }
    for state in p["palette"]:
        props = state.get("Properties", {})
        before = dict(props)
        for k, v in before.items():
            if k in directions:
                props.pop(k, None)
        for k, v in before.items():
            if k in directions:
                props[directions[k]] = v
            elif k == "facing" and v in directions:
                props[k] = directions[v]
            elif k == "axis" and v in ("x", "z"):
                props[k] = "z" if v == "x" else "x"
            elif k == "rotation":
                props[k] = str((int(v) + 4) % 16)
            elif k == "shape" and "rail" in state["Name"]:
                props[k] = rails.get(v, v)
    p["size"] = [length, height, width]
    return p
