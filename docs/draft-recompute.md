# Recompute pending design previews

A pending modelling operation retains its design inputs while the scene changes. Within the same workspace, canonical edits invalidate the old preview, disable confirmation and request a fresh computation. Sketch points, extrusion settings, array counts and selected guide IDs are retained. Late responses from older scene revisions cannot become confirmable results. Switching workspaces ends the old operation.

Deleted guide references remain selected as explicitly missing references. The designer does not silently substitute a different available profile or path. Failure hides obsolete block preview meshes, keeps the input parameters available and leaves confirmation disabled. Choose a valid reference or revise the parameters to continue. Existing generated features and saved sketches retain their previous editing workflows.

The Worker tags construction previews and design inspection results with scene revision and workspace identity. The existing commit guard remains the final check; a displayed preview is not authority to commit after the scene changes again. Confirming a recomputed operation creates the usual undo step, independently of the external edit that triggered recomputation.

The workflow adapts two documented FreeCAD patterns: marking results that need recomputation and distinguishing failed objects whose dependants may still show older geometry. See the official [Refresh documentation](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Std_Refresh.md) and [Tree view documentation](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Tree_view.md). This is documentation research and CraftStudio validation, not a hands-on FreeCAD test. SOLIDWORKS search excerpts describe rebuild error reporting, but its requested help page returned a loading shell this round; its full workflow remains unverified.

Validation covers extrusion parameter retention, automatic revision-pinned recomputation, successful subsequent commit, undo preserving the earlier external edit, deleted profile identity, disabled invalid confirmation, array parameter retention and workspace switching. See [evidence](validation/draft-recompute.json).

This does not yet provide a complete dependency graph, topology repair, saved operation history for every tool, backend-authoritative streaming editing or live Minecraft validation.

中文：场景变更后，待确认的草图、拉伸和排列操作保留参数并重新校准。旧预览不能确认，迟到的旧版本结果不会重新启用确认；删除的轮廓明确标为失效，不自动替换成另一条。失败时保留设计输入供修改，切换工程则结束旧工程的预览。
