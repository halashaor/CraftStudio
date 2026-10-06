# Save and restore complete observation views

Use **收藏视角** in the viewport toolbar, fixed right panel or F3 tool finder. Name and save the current view; select a saved entry to restore it, or update/delete the selected record. Saving/deleting is undoable project metadata. Restoring changes observation settings only, not scene revision or voxel data, and remains accessible while a sketch/model operation is open.

Records include position, target, perspective/orthographic projection, field of view, zoom, up direction and orthographic view height. Capture reads the current camera after projection changes. Old position/target-only records remain readable with defaults and can be updated to permanent IDs. Legacy restore controls route through the current view setter rather than an initialization-time camera closure.

`views.list`, `views.put` and `views.remove` use the existing metadata API/transactions/revision rules. World-space positions and targets are supported when the origin is known; direction vectors remain directions. Public `viewState`/`setView` now carry `up` and orthographic `viewHeight`. The bundled OrbitControls patch refreshes its cached up-vector rotation only when the camera's up vector changes. Its original license/header is retained.

Reference: Rhino's official [NamedView documentation](https://docs.mcneel.com/rhino/8/help/en-us/commands/namedview.htm), read this round. It describes named view save/restore/edit management. CraftStudio adapts that repeated-observation workflow to a fixed panel, without floating viewports. No hands-on Rhino comparison is claimed.

Validation covers projection/zoom/up/world coordinates, legacy update, invalid-state atomicity, metadata-only history and portable restore. A fresh browser saved an orthographic rolled view after a camera replacement, switched to perspective, restored all captured settings, reopened a portable project and tested delete/undo. View restoration preserved a pending sketch. Saved-view and modelling/measurement regressions passed; screenshot inspected. See [evidence](validation/saved-views.json).

Scope limits: OrbitControls may apply tiny numerical/polar-angle adjustments, so tests compare position within tolerance. Optionally save `display` with mode (after/before/diff/removed), cut (null for all layers), and plants/ground/existing booleans. Restore clamps numbered layers to current scene bounds. Camera-only entries leave display settings unchanged. `displayState`/`setDisplay` expose the same validated observation settings. Object isolation, object visibility, lighting, grid and world state are not captured. Thumbnails, smooth transitions and configurable keymaps remain future work.

中文：固定面板收藏视角保存位置、目标、投影、缩放、朝上方向及正交范围，切换相机后读取当前视图。恢复不修改方块/场景版本，正在编辑草图时仍可使用；旧视角兼容，保存/删除可撤销并随便携工程恢复。勾选“包含剖切层和显示设置”可恢复施工层、对照模式及植被/地形/原建筑显示；普通收藏保持当前显示设置。隔离、对象隐藏、灯光和网格不在保存范围。

The optional display snapshot follows the parameter-selection pattern in the official [Rhino Snapshots documentation](https://docs.mcneel.com/rhino/8/help/en-us/commands/snapshots.htm). Only the documented pattern was studied. Browser validation covered display restore, camera-only preservation, portable reopen, pending sketch preservation and unchanged voxel/revision state. See [evidence](validation/display-snapshot.json).
