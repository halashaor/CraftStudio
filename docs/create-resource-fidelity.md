# Keep partial resources and original motion data consistent

Portable resource bundles now retain valid partial models already embedded in a project even when the current visual preview has not requested them. Their texture references and image bytes/URIs are copied into the new bundle. Reopening and exporting an inactive/empty preview no longer discards those resources merely because they were absent from the runtime cache.

Bundling resolves saved partial keys through the normal resource loader. Selected model files and texture packs keep priority over embedded snapshots. Partial lookup uses each resource namespace instead of a hardcoded Create path, and first restoration of a nonmissing saved partial updates the partial-content version marker. Repeated cached reads do not repeatedly advance it.

A separate reproduced bug affected captured assembly controller data: **原始场地** read the currently edited controller NBT. The original view now reads the immutable baseline controller, while the finished view reads current data; switching view invalidates the entity cache. Tests verify original +16 RPM, edited -8 RPM and undo restoring +16 RPM for a synthetic native bearing assembly.

Verification includes synthetic partial retention without preview demand, cached version behavior, selected resource/texture precedence, non-Create namespace overrides and repeated portable reopen in a fresh isolated browser. Real provided-file/Create JSON/OBJ regressions also passed. See [evidence](validation/create-resource-fidelity.json).

Scope: current supported captured structures are read from native entity data; controller NBT edits affect supported speed/running state. This update does not add arbitrary native entity editing, live contraption reconstruction, production-line simulation or all-Create-version support. Missing/custom unsupported loaders retain their existing diagnostics. Only synthetic/public code and aggregate evidence are published; actual JARs, models and textures remain local.

中文：已嵌入工程的有效局部模型和贴图在未启用动态预览时也保留，重新保存不会因运行缓存尚未使用而遗漏。当前选用资源仍优先覆盖，命名空间正确处理；原始场地读取原控制器 NBT，完工视图读取改动，撤销后恢复。此修复不等于新增实体编辑、实机装置重建或产线仿真。
