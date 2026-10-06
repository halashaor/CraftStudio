# Navigate from generated results to source sketches

Generated object rows now contain an expandable source section. Each existing editable guide has a named **编辑源草图** button; multiple profile/loop/path sources stay separate. Missing references are identified and disabled, outdated results are marked, and detached results show their independent status. Source expansion is retained across tree refreshes and rows wrap within the fixed inspector width.

The saved-sketch list includes dependent-result counts. Editing a source guide shows the names of affected results and distinguishes linked updating from source-only editing. The precise preview reports regenerated object count and preserved manual-cell count through the existing generation planner. Confirmation remains a single undo step. Source-only edits keep the previous generated voxels and mark related objects as awaiting update.

`generation.links` is a read-only public API that returns object-to-guide sources and guide-to-object dependants, including missing/editable/outdated/detached status. It derives the relationships from existing generation metadata and legacy recipe IDs; it does not invent new dependencies or change scene history. The reverse index is built by traversing recorded links rather than repeatedly scanning every object for every guide.

Reference: FreeCAD's official [Tree view documentation](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Tree_view.md), reread this round. It describes visible parametric history and derived-object relationships. CraftStudio adapts discoverability and source navigation to its existing guide/regeneration workflow; no hands-on FreeCAD validation is claimed.

Validation includes multi/loop sources, missing references, detached objects, read-only API revision behavior, browser result-to-source navigation, named update scope, linked preview/commit, one-step undo, source-only outdated marking and inspector-width checks. Object snaps and external-edit recomputation regressions also passed. Screenshot inspected. See [evidence](validation/generation-navigation.json).

Limits: this is not a complete dependency graph editor, automatic resolution of broken references, persistent object-snap following or full multi-level generation propagation. Those require separate design and validation. Backend-authoritative streaming and live game validation remain pending.

中文：结果对象可展开来源并直接编辑源草图，草图显示关联数量；编辑面板说明受影响结果，预览显示更新数量和手工改动保留数。仅修改草图时标记结果待更新，关联更新仍可一次撤销。已有关系可通过只读 `generation.links` 查询，不新增强制约束。
