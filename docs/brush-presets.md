# Reusable brush settings

Open Brush → Brush presets in the fixed properties panel. Search saved entries, load one, or save current settings under a name. Saving an existing name updates that preset. Select an entry, edit its name and use Rename; duplicate names are rejected. Delete has a one-step Undo delete button for the current session.

Export writes a `craftstudio-brush-presets/1` JSON file; import validates all incoming records before saving and merges them, suffixing conflicting names rather than overwriting existing entries. Files contain settings only, not worlds, textures, active materials, current selections or terrain/building permission grants. A selection condition reads the current selection at stroke start. The preset changes brush configuration, not voxels. Local and Lite use their existing preference storage and library backups; standalone JSON allows moving presets between them. Read/write failures are surfaced, not reported as saved.

The official [Axiom Tool Presets documentation](https://axiomdocs.moulberry.com/editor/toolpresets.html) describes saving named tool configurations and searching presets. This adaptation keeps fixed panels and adds portable JSON; no compatibility with Axiom NBT presets or hands-on Axiom comparison is claimed.

Validation: search, rename, load, delete/undo, JSON export/import, conflicting names, malformed-import atomicity, reload persistence and unchanged terrain permission passed in an isolated browser/backend. See [evidence](validation/brush-presets.json). This release manages brush presets; path/terrain presets and cross-device synchronization remain future work.

中文：画笔属性面板支持查找、保存、载入、重命名、删除及本次会话撤销删除；JSON 导入导出可在本地版与 Lite 间迁移，同名另存副本。预设不包含材料、方块、选区内容或场地保护授权。已有工程库备份仍包含这些偏好设置。
