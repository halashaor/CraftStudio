# Draw through vegetation without an edge-on stroke plane

In Brush → Draw, **Drawing plane** defaults to Automatic. If the picked face axis is nearly parallel to the viewing ray (absolute direction component below 0.15), the stroke uses the world axis plane most facing the view. This fixes real grass cross-plane models: a top view can hit a vertical grass card, which previously selected an edge-on plane and left only the first stamp. When the chosen axis changes, placement is anchored adjacent to the hit cell along the new axis rather than retaining the old face offset.

Choose **Along starting surface** to keep the face-axis behavior, **View-facing axis plane** for the most view-facing XZ/XY/YZ plane, or explicitly choose XZ/XY/YZ. The plane is fixed for the stroke. These are voxel axis planes, not arbitrary continuous sketch planes; arbitrary sketch/model workplanes remain available separately. Single-block placement and painting existing materials keep their original face/surface behavior. Erasing can also use the drawing-plane choice. Ordinary non-grazing surface strokes remain unchanged.

The plane choice is saved with brush presets; legacy presets default to Automatic. Opt-in diagnostics include `brush-stamp` axis/diameter/pending/visited counts without coordinates.

## Integration evidence

A fresh hardware-rendered context loaded the user's own vanilla and Create JARs, then the 520,227-block region. A 24-step pointer drag produced 29 valid additions, one undo restored the stroke, portable export/reopen matched exact states, and right-drag navigation did not edit blocks. Both isolated local SQLite and pure browser IndexedDB modes passed; browser mode explicitly blocked desktop discovery. Local/Lite recorded 8/9 precise scene updates and 35/35 frame submissions during the stroke. Maximum scene preparation in these samples was 15.8/16.7 ms. These counts are not sustained FPS or pointer-to-monitor latency measurements.

See [aggregate validation](validation/resource-drag.json). Raw worlds, JARs, textures, coordinates and screenshots remain private. Resource readiness means the provided source archives loaded; it is not a claim that all custom block/entity renderers or every mod are supported. Longer strokes, additional packs/mods and backend-owned editing remain outstanding.

中文：真实小草交叉贴片在俯视下可能选中侧向法线，导致固定绘制面几乎平行视线，只落下第一笔。自动模式避开这种轴面；可手选起笔表面、视图轴面或 XZ/XY/YZ。一笔固定一个平面，放置工具及已有材料涂改保持原行为。两版在真实原版/Create 资源下通过拖绘、一次撤销、保存重读和视角导航验证。
