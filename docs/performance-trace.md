# Observe latency before selecting the next optimization

`CraftStudio.diagnostics.start()` enables a 256-event in-memory timing ring, `read()` returns a detached snapshot and `stop()` disables recording. It is disabled by default and is not persisted. Events contain stage/action names, durations, aggregate chunk/geometry counts and timestamps. They do not include input coordinates, file contents, paths, block IDs, scene names or AI prompts. Worker execution/queue timings travel separately from normal RPC results only for traced requests.

Stages distinguish pointer input, Worker request roundtrip, Worker queue/execution, scene preparation and WebGL frame submission. The first frame after `scene-ready` is used to measure input-to-final-scene submission, rather than the earlier brush cursor preview. These CPU timestamps cannot prove monitor presentation, GPU completion or interactive FPS. Independent browser-driver timing includes its own overhead and should not be treated as pure file decode time.

## Current real-region sample

An isolated Edge headless/SwiftShader context imported the user-provided region (520,227 blocks), placed three consecutive blocks via real pointer clicks and verified exact resulting block states and undo to air. No resource pack was imported. Import wall time was approximately 1.44 s, including automation overhead; staged import RPC was 702 ms. Three pointer-to-scene-frame-submission samples were 27.8, 53.5 and 54.9 ms. Mesh computation was 5.1, 8.8 and 6.8 ms; each edit rebuilt two chunks with 56 resident chunks.

Worker beginStroke execution/queue measurements were approximately zero, while its roundtrip varied 7–26 ms. That shows this sample does not support blaming voxel mutation for all input delay; investigate main-thread message handling, frame scheduling and display work next. Earlier preliminary samples also varied, so these numbers are evidence from one run, not a stable hardware comparison or a demonstrated performance improvement. No backend authority or viewport-only voxel working-set claim is made.

See [aggregate evidence](validation/real-latency.json). Private world/blueprint data and test coordinates remain outside the public repository. Next: repeated matched camera/input paths with real resource models and a real GPU, main-thread tracing, then backend-owned editing and working-set validation. Lite remains file-oriented; local storage streaming currently does not remove the full canonical scene from the browser Worker.

中文：按需诊断区分点击、Worker 往返/排队/执行、几何准备和帧提交；默认关闭，不保存文件/坐标/提示词。52 万方块真实区域三次鼠标放置与撤销已验证，不能把软件渲染样本当作用户显卡帧率，也不宣称本地后端已接管全部编辑。
