# Connect sketches to existing guide geometry

During sketch point picking, the optional **辅助线端点 / 中点 / 中心吸附** control targets saved guide geometry near the mouse. A cyan 3D marker and always-visible fixed result badge identify the snap kind and source guide. Ctrl temporarily bypasses object snaps; the control can disable them completely. Ordinary half/full/free cursor grid snapping remains available.

The cursor uses a 12-pixel capture radius and rejects points outside camera depth. Explicit working planes, and the plane established by the first anchor, filter off-plane targets. With no explicit plane or first anchor, a saved reference can establish the first point's elevation. The guide being edited and guides marked hidden are excluded.

Targets include curve endpoints, sampled-path arc-length midpoints, explicit circle/ellipse/arc centers and polygon vertices. Rectangles expose actual corners, edge midpoints and center. The old generic bounding-box-center guess is removed; it is not a valid curve center. Guide targets are cached when saved guide metadata changes.

Cursor picks and gizmo movement apply snapping before generating their coordinates. The UI passes `snapApplied: true` to avoid quantizing them again during preview/regeneration; numeric coordinate entries also preserve the value entered. Other callers of `constrainSketch` retain its previous grid-rounding behavior unless they explicitly set that flag. Saved recipes keep the chosen pick snap setting and exact input points. Final Minecraft voxel generation still resolves geometry to supported block states separately.

Reference: Rhino's official [Object snaps documentation](https://docs.mcneel.com/rhino/8/help/en-us/user_interface/object_snaps.htm), read this round. It describes geometric target types, a capture radius, markers, persistent modes and temporary suspension. CraftStudio adapts the workflow to saved guides and existing controls. This is documentation study and CraftStudio validation, not a hands-on Rhino comparison or a full Rhino snap implementation.

Validation covers path-length midpoint versus bounding/endpoint averages, camera/plane/radius filtering, hidden/excluded guides, explicit centers, rectangle targets and coordinate precision. A fresh browser picked saved endpoints and midpoints at fractional coordinates, rejected a different elevation after establishing a plane, retained a typed 12.375 coordinate, saved a guide without placing blocks, identified a circle center and toggled/bypassed snapping. The badge was checked inside the viewport height and the screenshot inspected. See [evidence](validation/object-snaps.json).

Remaining work includes arbitrary surface-edge/mesh snapping, intersection and tangent modes, occlusion-aware reference selection, persistent source-following constraints and configurable per-kind snap controls.

中文：绘制草图时，鼠标附近的已保存辅助线可提供端点、中点和中心吸附，青色标记与固定结果区明确提示来源；Ctrl 暂停，复选框关闭。工作平面过滤其他标高的目标，已吸附及手动输入的精确坐标不会在预览时被再次舍入。MC 方块生成仍单独处理，不把吸附变成强制工程约束。
