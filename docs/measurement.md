# Measure actual scene positions

Click **测量** on the left tool rail, or find the tool with F3. Pick a start and end on visible geometry; moving the mouse after the first point previews the segment. The fixed inspector shows straight-line distance, horizontal distance, signed height difference, X/Z offsets, axis-distance sum, slope percentage and pitch. Default half-block snapping supports slab/stair levels; whole-block and exact-surface modes are available. Coordinates can be edited numerically.

Measurements describe endpoint spacing, not material quantity or inclusive block counts. Vertical segments show a vertical slope, and coincident points are identified separately. A saved ruler is a snapshot of positions, not a constraint or an automatic follower of moving Create structures. The tool uses the app's left-click picking and right-click camera conventions.

The working ruler is read-only. Saving creates a metadata annotation, independently undoable; no blocks are placed or removed. Saved lines and camera-sized labels remain in the 3D scene, with a visibility toggle and edit/delete controls in the inspector. Escape ends picking; search can be opened/cancelled without discarding the current ruler. Portable projects and local drafts preserve the annotations; Minecraft block exports do not emit them as construction blocks.

AI/API methods:

- `measurements.list`, with optional `space: "world"`.
- `measurements.put`, with `expectedRevision`, optional workspace/transaction ID and `measurement: {name, points: [[x,y,z],[x,y,z]], id?}`.
- `measurements.remove`, with `expectedRevision` and `id`.

Points support finite fractional coordinates and negative world coordinates when the origin is confirmed. Metadata edits share the existing revision, transaction, replay and undo rules. Canonical annotation writes are rejected during an active AI proposal; read-only measuring remains available.

Reference: Axiom's official [Ruler Tool documentation](https://axiomdocs.moulberry.com/tools/utility/ruler.html), read this round. It describes in-scene points/lines, distance and coordinate information. CraftStudio adapts that measurement workflow to its fixed dock and terrain-first design, adding signed rise and slope. Axiom hands-on observation, multi-segment rulers, angular dimensions and persistent snapping references remain future work.

Validation: spatial/fractional/vertical/zero metrics; world-coordinate API, guards, metadata-only undo and portable restore; fresh browser picking of explicit half-height slab models at Y=1.5 and Y=5.5, horizontal separation 3 and measured distance 5; live preview, no voxel changes, save/delete/undo, export/reopen, search and Escape behavior. Screenshots were inspected. See [evidence](validation/measurement.json).

中文：左侧“测量”或 F3 可进入取点测量，固定面板显示间距、高差和坡度；半格、整格及不吸附可选。保存的是位置快照标注，不是方块或工程约束，支持删除、撤销和便携工程恢复。后续继续研究多段测量、角度尺寸与持久参照吸附。
