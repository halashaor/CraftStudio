# Separate browser process scheduling from editor computation

The previous round observed Worker roundtrip delays not explained by Worker execution, and proposed checking the page main thread. This round added opt-in `scene-pick` timings and used Chromium DevTools tracing in a private isolated test context. No raycast acceleration or rendering rewrite was made: observed picking time was about 0.4–1 ms, which does not support it as the primary cause in this sample.

The same provided 520,227-block region and pointer placement/undo workflow was used with Edge headless and SwiftShader software rendering. Thread names were resolved from trace metadata, rather than attributing every top-level RunTask to the page. In the recorded run, maximum top-level tasks were approximately 34.88 ms in CrGpuMain, 3.83 ms in CrRendererMain, 10.49 ms in the scene Worker, and 0.46 ms in the compositor. Page animation-frame/layout tasks and ray picking did not explain the longest task. Software-renderer GPU-process activity is a candidate for this test's scheduling variance; these timings do not prove the cause on a user's hardware GPU.

Only aggregate timings and task counts are published in [evidence](validation/browser-thread-trace.json). Raw DevTools events, inputs, paths and test coordinates remain private. The performance ring remains disabled by default. `scene-pick` does not change hit ordering, model picking or terrain interactions.

Next: a comparable hardware-GPU run with resource models and repeated matched camera/input paths; then decide whether geometry, material/draw-call batching or browser scheduling needs changing. Backend-owned editing and viewport-only voxel working sets are still separate outstanding architecture requirements. This result corrects the earlier tentative inference of page-main-thread delay, not a demonstrated performance improvement.

中文：浏览器线程追踪显示软件渲染 GPU 进程的任务最长，不能把所有 RunTask 当作页面主线程。拾取约 1 ms 以内，不据此重写拾取算法；原版硬件 GPU 与真实资源模型复测仍待完成。公开仅聚合数据，原始追踪与场地数据不上传。
