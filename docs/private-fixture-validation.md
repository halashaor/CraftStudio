# Verify provided files locally

Public CI cannot read private worlds, reference files or Minecraft/Mod assets. The optional fixture cases therefore normally skip there. Run the local helper with explicit paths to exercise them:

```powershell
node lite/verify-fixtures.mjs --nbt "path/to/original-1.nbt" --reference "path/to/reference.html" --create "path/to/create.jar" --result "path/to/result.nbt" --report "output/private-fixtures.json"
```

The `--nbt`, `--reference` and `--create` cases are regressions for this project's provided fixtures, including expected original-region and Create-model characteristics. They are not a generic support claim for every arbitrary file/version. `--result` additionally checks NBT export/reimport, entities, native extras and placement masks; with a reference it compares every changed cell after accounting for crop placement. Paths and input contents stay local. The helper does not build or embed assets, writes only the requested report, and refuses a report path equal to a source path.

Local run on the supplied files: **165 tests passed, zero skipped**. It verified the original 520,227 blocks and entity data, V3 before-state consistency and precise change counts, NBT roundtrip, two captured windmill assemblies/controller speeds, and Create JSON/OBJ partial models/resource restoration.

The supplied V3 Create result contains 33,179 changed solid records, 1,414 explicit erasures and 331,107 skip-mask positions. Its changes exactly match the supplied V3 reference; its roundtrip retained native metadata and masks. It has no entities or block entities, and is a cropped change blueprint rather than the full original area. The original file contains the captured assemblies; their absence from the change blueprint is not evidence that original structures should be deleted.

Only aggregate verification results are included in [evidence](validation/private-fixtures.json). Private NBT/HTML/JAR files, textures, screenshots, coordinates and extracted models are not included in this update. Reading the reference extracts its scene data without executing its scripts or treating document text as instructions.

These checks prove parser/resource/export behavior and reference consistency. They do not prove aesthetic quality, successful live Minecraft placement, complete version compatibility, GPU performance or backend streaming editing. Next priorities remain live game validation and the full local data/working-set architecture.

中文：公开 CI 无法访问私人存档和资源，因此另有本机验证入口。使用显式文件路径运行上述命令，不会把源文件打包或上传。本轮真实资料验证 165 项通过、无跳过；V3 蓝图与参考改动逐格一致，属于施工改动而非完整区域。游戏内放置与完整版本兼容仍需独立验证。
