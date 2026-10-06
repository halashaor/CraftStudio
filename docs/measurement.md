# Measure actual scene positions

Click **测量** on the left tool rail, or find the tool with F3. Pick a start and end on visible geometry; moving the mouse after the first point previews the segment. The fixed inspector shows straight-line distance, horizontal distance, signed height difference, X/Z offsets, axis-distance sum, slope percentage and pitch. Default half-block snapping supports slab/stair levels; whole-block and exact-surface modes are available. Coordinates can be edited numerically.

Measurements describe endpoint spacing, not material quantity or inclusive block counts. Vertical segments show a vertical slope, and coincident points are identified separately. A saved ruler is a snapshot of positions, not a constraint or an automatic follower of moving Create structures. The tool uses the app's left-click picking and right-click camera conventions.

The working ruler is read-only. Saving creates a metadata annotation, independently undoable; no blocks are placed or removed. Saved lines and camera-sized labels remain in the 3D scene, with a visibility toggle and edit/delete controls in the inspector. Escape ends picking; search can be opened/cancelled without discarding the current ruler. Portable projects and local drafts preserve the annotations; Minecraft block exports do not emit them as construction blocks.

AI/API methods:

- `measurements.list`, with optional `space: "world"`.
- `measurements.put`, with `expectedRevision`, optional workspace/transaction ID and `measurement: {name, points: [[x,y,z],[x,y,z]], id?}`.
- `measurements.remove`, with `expectedRevision` and `id`.

Points support finite fractional coordinates and negative world coordinates when the origin is confirmed. Metadata edits share the existing revision, transaction, replay and undo rules. Canonical annotation writes are rejected during an active AI proposal; read-only measuring remains available.

Reference: Axiom's official [Ruler Tool documentation](https://axiomdocs.moulberry.com/tools/utility/ruler.html), read this round. It describes in-scene points/lines, distance and coordinate information. CraftStudio adapts that measurement workflow to its fixed dock and terrain-first design, adding signed rise and slope. Axiom hands-on observation and persistent snapping references remain future work; typed angle/polyline measurements were added in the follow-up below.

Validation: spatial/fractional/vertical/zero metrics; world-coordinate API, guards, metadata-only undo and portable restore; fresh browser picking of explicit half-height slab models at Y=1.5 and Y=5.5, horizontal separation 3 and measured distance 5; live preview, no voxel changes, save/delete/undo, export/reopen, search and Escape behavior. Screenshots were inspected. See [evidence](validation/measurement.json).

中文：左侧“测量”或 F3 可进入取点测量，固定面板显示间距、高差和坡度；半格、整格及不吸附可选。保存的是位置快照标注，不是方块或工程约束，支持删除、撤销和便携工程恢复。已补充三点夹角与折线累计长度；持久参照吸附仍待研究。

## Three-point angles and accumulated paths

The existing Measure panel now has Distance, Angle and Path modes. Angle picks endpoint → vertex → endpoint and reports the spatial interior angle from 0 to 180 degrees and both arm lengths. Zero-length arms are rejected. Path accepts consecutive points, reports accumulated 3D length separately from straight start/end distance, segment count, rise, ascent and descent. These are picked straight segments, not exact analytic Bezier length or material counts.

Hover previews the next point; Remove last point corrects a click without discarding the whole measurement. Numeric XYZ fields edit points in 3D. Save or Enter commits the annotation; Escape closes the operation. Mode changes start a fresh measurement. Saved labels can be reopened for editing, undone and restored from portable projects. The empty-scene welcome card no longer blocks measurement or saved sketch/annotation content.

`measurements.put` accepts optional `kind: distance | angle | path`, with missing kind treated as the original two-point distance. Angle requires three points with the second as the common vertex; path requires at least two. Returned/listed metrics depend on kind: angle has `angleDegrees`/`armLengths`; path has `totalLength`/`chordLength`/`segmentCount`/`segments`/`rise`/`ascent`/`descent`. World-space translation changes points, not angle/length. No voxel changes or persistent constraints are implied.

Rhino's official [Angle](https://docs.mcneel.com/rhino/8/help/en-us/commands/angle.htm) documents measuring two imaginary lines and [Length](https://docs.mcneel.com/rhino/8/help/en-us/commands/length.htm) documents accumulated curve length. CraftStudio adapts that analysis workflow to a common-vertex three-point angle and picked polyline. Both bodies were read; Blender's requested body failed to load, and no hands-on Rhino comparison is claimed.

Browser validation covered hover angle preview before the third point, 90-degree save, a four-point path with 12-unit total, backtracking, a vertical edit producing 13 units, Enter save, metadata undo, portable reopen, editing typed records and no voxel changes. The earlier half-height surface regression also passed. See [typed measurement evidence](validation/measurement-types.json).

中文补充：测量面板可选三点夹角（第二点为顶点）和连续折线总长；支持实时预览、退回上一点、三维数值修改、Enter 保存、重读和撤销。角度是空间内角，路径按直线段累计，不是曲线解析长度、方块数量或强制约束。

## Pick exact sketch locations

Measurement uses the same `guideSnapTargets`/`nearestScreenSnap` utility as sketching. Endpoints, polyline half-length midpoints and supported shape centers/corners are selectable within a 12-pixel pointer radius, even when the guide is above a block surface. A cyan marker and source/kind text show the picked location. Marker size follows camera projection so it remains readable when zooming. Exact sketch positions take precedence over the half/full-grid setting and are not rounded again.

The geometry snap checkbox is optional. Hold Ctrl to pause sketch snapping for a pick (grid snapping remains active); disabling the global auxiliary-guide layer also disables its measurement snaps. Hidden guide records are excluded. Workspace/guide changes refresh targets, and snapshots retain their stored coordinates after source geometry changes. No persistent dependency or constraint is created.

Reference: official [Rhino object snaps](https://docs.mcneel.com/rhino/8/help/en-us/user_interface/object_snaps.htm) describes precise object locations, marker feedback and temporary suspension. CraftStudio keeps its existing Ctrl convention and visible auxiliary-guide workflow. This is sketch-target snapping, not arbitrary block-mesh edges, analytic intersections/tangents or full occlusion-aware CAD snapping; overlay guides can be picked as displayed.

An isolated browser verified airborne endpoints, half-length midpoints, fractional coordinates with half-grid enabled, Ctrl bypass, hidden guide layer, workspace target refresh and unchanged saved coordinates after guide movement. Angle/polyline and legacy half-slab regressions passed. See [snap evidence](validation/measurement-snaps.json).

中文：测量可吸附已有草图端点、中点和中心，青色标记提示来源；精确坐标不再半格取整。Ctrl 暂停草图吸附（网格仍生效），关闭辅助线也会暂停。保存的标注仍是位置快照，不会随源线移动。
