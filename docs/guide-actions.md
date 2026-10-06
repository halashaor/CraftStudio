# Start modelling from its source sketch

Saved sketch rows in the scene tree now offer Edit, Extrude and Generate along path. Extrude automatically selects the closed profile containing that sketch, including loops assembled from separately saved connected lines. Generate along path uses that specific sketch as the path. Both enter the existing fixed modelling panel and preview workflow; adjust dimensions/materials, inspect conflicts, then confirm or cancel. Opening these actions does not commit voxel edits.

Unavailable extrusion has a disabled button with a reason: the source must form a closed coplanar contour. Gaps, branches and nonplanar contours are not welded automatically. The existing manual profile picker remains available. Sources are resolved from current guides before opening; missing sources are rejected. Profile inference is shared across the rows instead of recomputed for every button. Arbitrary coplanar orientation is preserved and modelling starts with automatic plane inference.

Reference: official [ObjToSchematic Editor Workflows](https://objtoschematic.com/wiki/editor_workflows) describes actions applicable to the selected scene object. CraftStudio applies that context pattern to its existing sketch-to-block modelling tools; this is not mesh import/voxel conversion support, and no hands-on ObjToSchematic observation is claimed.

Validation: an isolated browser imported three independent triangle edges plus an open 3D path, launched extrusion from the middle edge, verified the full-loop source, preview revision stability, actual block placement, undo to air, explicit path selection and disabled/reasoned open-line extrusion. Unit checks include reversed source order, degenerate paths and tilted profiles. See [evidence](validation/guide-actions.json).

中文：草图树直接提供“拉伸”和“沿路径生成”，自动带入所点草图；多段相接线框使用整圈闭合轮廓。未闭合/不共面的来源给出禁用原因，仍保留手动选择和自由编辑。操作进入预览，确认才写入方块。
