import os
import copy
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.nbt import Tag, compound, dumps, loads, to_json, from_json, plain
from backend.formats import import_nbt, export_structure, packed_values, project, import_region
from backend.design import room, rotate, apply_operations, validate


class CoreTests(unittest.TestCase):
    def test_typed_nbt_precision(self):
        original = compound(
            {
                "long": Tag(4, 9223372036854775807),
                "arr": Tag(12, [-9223372036854775808, 1234567890123456]),
                "byte": Tag(1, -128),
                "short": Tag(2, 32000),
                "float": Tag(5, 1.25),
                "double": Tag(6, 1.125),
                "bytes": Tag(7, [0, 127, 128, 255]),
                "ints": Tag(11, [-1, 42]),
                "string": Tag(8, "中文\0🧱"),
                "list": Tag(9, (10, [{"name": Tag(8, "齿轮")}])),
            }
        )
        self.assertEqual(original, loads(dumps(from_json(to_json(original)))))

    def test_real_create_roundtrips(self):
        if not os.environ.get("CRAFTSTUDIO_TEST_SCHEMATICS"):
            self.skipTest("optional local fixtures are not configured")
        folder = Path(os.environ["CRAFTSTUDIO_TEST_SCHEMATICS"])
        if not folder.is_dir():
            self.skipTest("local fixtures not present")
        for path in folder.glob("*.nbt"):
            if path.stat().st_size > 10000:
                continue
            with self.subTest(path=path.name):
                p = import_nbt(path.read_bytes(), path.stem)
                q = import_nbt(export_structure(p), path.stem)
                self.assertEqual(p["blocks"], q["blocks"])
                self.assertEqual(p["entities"], q["entities"])
                self.assertEqual(p["metadata"]["nativeExtra"], q["metadata"]["nativeExtra"])
                self.assertEqual(p["size"], q["size"])

    def test_generated_roundtrip(self):
        p = room()
        validate(p)
        q = import_nbt(export_structure(p), "roundtrip")
        self.assertEqual(p["blocks"], q["blocks"])
        self.assertEqual(p["palette"], q["palette"])

    def test_atomic_invalid_operation(self):
        p = room()
        before = copy.deepcopy(p)
        with self.assertRaises(ValueError):
            apply_operations(
                p, [{"type": "set", "pos": [-1, 1, 1], "state": {"Name": "minecraft:stone"}}]
            )
        self.assertEqual(before, p)

    def test_air_erases_and_no_duplicate_cells(self):
        p = room()
        p = apply_operations(
            p, [{"type": "set", "pos": [1, 0, 1], "state": {"Name": "minecraft:air"}}]
        )
        self.assertFalse(any(b["pos"] == [1, 0, 1] for b in p["blocks"]))
        validate(p)

    def test_direction_rotation(self):
        p = project()
        p["size"] = [3, 1, 4]
        p["palette"] = [
            {
                "Name": "minecraft:oak_stairs",
                "Properties": {"facing": "north", "half": "bottom", "shape": "straight"},
            },
            {
                "Name": "minecraft:oak_fence",
                "Properties": {"north": "true", "south": "false", "east": "false", "west": "true"},
            },
        ]
        p["blocks"] = [{"pos": [0, 0, 0], "state": 0}, {"pos": [1, 0, 0], "state": 1}]
        result = rotate(p)
        self.assertEqual(result["palette"][0]["Properties"]["facing"], "east")
        self.assertEqual(result["palette"][1]["Properties"]["east"], "true")
        self.assertEqual(result["palette"][1]["Properties"]["north"], "true")
        for _ in range(3):
            result = rotate(result)
        self.assertEqual(p, result)

    def test_packed_bit_boundaries(self):
        values = [i % 29 for i in range(100)]
        for padded in (True, False):
            data = [0] * 10
            for i, value in enumerate(values):
                word, shift = (i // 12, i % 12 * 5) if padded else (i * 5 // 64, i * 5 % 64)
                data[word] |= (value << shift) & ((1 << 64) - 1)
                if not padded and shift > 59:
                    data[word + 1] |= value >> (64 - shift)
            self.assertEqual(values, packed_values(data, 5, 100, padded))

    def test_reject_unsafe_mod_transform(self):
        p = room(wall="create:andesite_casing")
        with self.assertRaises(ValueError):
            rotate(p)

    def test_missing_world_region(self):
        with tempfile.TemporaryDirectory() as folder:
            p = import_region(folder, [-1, -10, -1], [1, 1, 1], "empty")
            self.assertEqual(p["size"], [3, 12, 3])
            self.assertEqual(p["blocks"], [])
            self.assertTrue(any("4" in w for w in p["warnings"]))


if __name__ == "__main__":
    unittest.main()
