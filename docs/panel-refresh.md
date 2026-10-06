# Keep stable inspector content during voxel edits

Scene summaries update changed counters immediately but preserve unchanged source-summary rows, protection lists and material totals. Saved sketch actions rebuild only when the workspace, guides or guide-dependency links change. Generation source details preserve their DOM and expanded state while their relation data is unchanged; new object rows still receive source controls. Workspace changes are included in cache keys so a different project cannot reuse stale callbacks.

This reduces unnecessary DOM replacement and keeps focus/expanded controls stable during repeated edits. It does not skip canonical voxel edits or mesh updates. `ui-summary` diagnostic events now measure the synchronous inspector-summary refresh.

Functional browser evidence verifies retained sketch/source nodes across voxel writes, direct closed-loop extrusion, dependency badges after feature commit, exact placed block and undo, and explicit path selection. A repeated real-region pointer sample (520,227 blocks, software rendering) measured summary UI updates of 0.6–0.8 ms, but input-to-frame submission varied approximately 56–189 ms. This does not prove overall speedup against the earlier run. Worker execution remained small while roundtrip time varied; the remaining main-thread/display scheduling cause is not yet isolated.

See [validation](validation/panel-refresh.json). No real GPU frame-rate claim is made. Next evidence should measure main-thread tasks and frame scheduling under matched repeated input paths, with real resource models, before changing rendering architecture. Backend-owned editing and viewport voxel working sets remain outstanding.

中文：普通方块编辑保留未变化的场地摘要、保护区列表、草图按钮和源关联详情；草图/关联或工作区改变才更新对应内容，计数与网格保持及时。主线程摘要刷新已测，整体点击延迟仍波动，不能宣称大场景性能问题解决。
