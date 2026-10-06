# Find design tools

Press **F3** or click **查找工具** to open the tool finder in the fixed right inspector. Search Chinese labels, English aliases or categories, then choose with Up/Down and Enter. Escape closes the finder and returns focus to the previous operation. Opening or cancelling search does not commit, cancel or reset an active sketch/transform preview.

Results include category, existing shortcut and an unavailable reason. For example, moving needs a selection, clipboard placement needs copied data, and lofting needs saved closed profiles. Search does not bypass these prerequisites or the normal commit/preview workflow. Commands route to existing tools and specific operations rather than duplicate their implementation. Loft search opens loft settings, not generic extrusion settings.

The list covers editing, sketch shapes, extrusion/loft/sweep, arrangement and component operations, terrain, materials, local projects and views. Recently used command IDs are stored through the existing local library preference store. Search remains a supplementary entry point; ordinary tool buttons remain available. No additional floating modelling window is introduced, and opening search does not resize the 3D viewport.

Reference: Blender's official [Menu Search documentation](https://docs.blender.org/manual/en/3.6/interface/controls/templates/operator_search.html). Its indexed search excerpt describes F3, typed names, keyboard navigation and menu location hints. Direct body retrieval failed this round, and no hands-on Blender comparison was performed; the learning ledger records that distinction. CraftStudio adapts the discoverability pattern to a fixed dock rather than copying Blender's popup layout.

Validation: label/alias/category matching and recent ranking unit tests; fresh isolated browser checks for disabled reasons, search without scene mutation, sketch/transform preservation on Escape, focus-view restoration, exact loft routing, terrain/arrangement routing, recent persistence and unchanged viewport bounds. A screenshot was visually inspected. See [evidence](validation/command-search.json).

Remaining work includes broader command coverage, custom user shortcuts, deeper dependency/history editing, local streaming edit authority and live Minecraft validation.

中文：F3 或“查找工具”打开右侧固定搜索面板，支持中文名称、英文别名、上下键选择和 Enter 打开；Esc 返回原操作。结果显示分类、快捷键及不可用原因，搜索本身不会修改场景或取消草图/变换预览。最近使用的工具保存到现有本地工程库偏好中。
