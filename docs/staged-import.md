# Cancel replacement parsing without losing the current design

Replacement NBT/JSON/portable-project/MCA imports and stored-draft resume use a candidate Worker. The active scene remains available for reads until the candidate has parsed and indexed successfully and the current design has been checkpointed. Then the session swaps Workers and renders the new scene. Invalid input or cancellation terminates only the candidate; the original workspace and blocks remain intact.

An active AI proposal must be adopted or cancelled before replacing the scene, so its canonical edits are not silently bypassed.

The existing busy overlay reports preparation, file structure parsing, index recovery/validation and current-design preservation. **取消打开 · 保留原设计** stops candidate work. Writes to the original scene during staging are rejected explicitly (`IMPORT_ACTIVE`) rather than being silently discarded on a successful swap. Existing enabled resource-library archives seed the candidate; portable saved assets restore through the usual path.

The design intentionally keeps old and candidate Workers temporarily. This can increase peak memory while importing. Once committed, the old Worker is terminated and pending old requests are rejected. This is an atomic replacement/cancellation workflow, not constant-memory streamed parsing.

Scope limits:

- HTML reference imports remain the existing current-project proposal workflow, because they depend on the original scene and its edit history. They do not use this replacement cancellation path.
- File reading before Worker submission, checkpoint preservation, resource preparation and final scene mesh application retain their own work. A cancellation during preservation may wait for that save to finish.
- The overlay shows truthful phases, not an invented percentage or completion ETA.
- Full canonical scene data still resides in a Worker; backend authority and viewport-only working sets remain pending.

Validation includes unit lifecycle tests, an isolated browser with a controlled candidate-import delay for cancel/write rejection, invalid-file preservation and successful swap, saved half-height model/annotation regression, actual 520,227-block import with exact backend export, and a 204,800-edit autosave/reload regression. See [evidence](validation/staged-import.json). The controlled delay checks cancellation behavior; it is not a measured throughput result.

中文：替换式文件导入在候选 Worker 中解析，原设计在成功切换前保留；取消或失败只结束候选。已有资源和便携附件按原流程恢复，导入中拒绝原场景的新写入。界面显示阶段并提供取消按钮，暂不提供完整流式解析、精确进度百分比或所有阶段的即时取消。
