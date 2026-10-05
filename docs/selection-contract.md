# Shared selection contract

Selections contain local integer `min` / `max` bounds (inclusive, 0–4095), and optional exact `members` (XYZ arrays or packed local keys). Optional `regions` is an ordered list of bounded operands, each with `operation`: `replace`, `add`, `subtract`, or `intersect`, and optional exact `members`. Evaluation starts empty and applies each operand in order, intersected with the outer bounds. A region includes air unless it provides exact members. Empty member arrays select nothing. No dense air enumeration is required.

The same representation is accepted by `edit.brush` at `params.mask.selection`, and `selection.transform` directly at `params` beside `at`, `move`, etc. For `space: world`, all bounds and member XYZ arrays (including region operands) are translated by the confirmed world origin; packed keys are local-only. Existing policies, revisions, transactions and undo semantics still apply. Human viewport selections use this representation without changing voxel data or increasing the workspace revision.

```json
{"min":[0,0,0],"max":[30,8,30],"regions":[{"operation":"replace","min":[0,0,0],"max":[10,8,10]},{"operation":"add","min":[20,0,20],"max":[30,8,30]},{"operation":"subtract","min":[2,0,2],"max":[4,8,4]}]}
```

Viewport selection operands are transient. Saving object groups or generated voxel results uses the existing project persistence. Terrain generators do not yet universally consume this contract. A compound region's yellow bounding box is not its complete membership; colored operands and member outlines explain its construction.
