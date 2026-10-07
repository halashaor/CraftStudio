# CraftStudio

**English** | [简体中文](README.zh-CN.md)

A local 3D workspace for designing Minecraft buildings on real terrain. Import a site, sketch and model in the viewport, review the block changes, and export a buildable blueprint.

CraftStudio focuses on architectural appearance and creative freedom. Sketches, modeling tools, reusable components, direct block editing, and AI-generated designs can be combined in the same project.

> The current application interface is primarily in Chinese. This README is the default English documentation; the complete Chinese version is linked above.

## Quick start

### Offline Lite — open a file and start designing

1. Download or clone this repository.
2. Open [`lite/dist/CraftStudio-Lite.html`](lite/dist/CraftStudio-Lite.html) in a recent Chrome or Edge browser.
3. Import your own structure or terrain file, or begin in an empty workspace.
4. Save a portable project for later editing, or export a blueprint for Minecraft.

The standalone HTML contains the designer. It needs no backend and does not require Minecraft to be running. Lite reads files you explicitly select; it does not scan your Minecraft installation. Projects, versions, drafts, and asset preferences are stored in the current browser's IndexedDB. Export a portable project or library backup to transfer them to another browser or computer.

### Local edition — SQLite storage and installation access

On Windows, double-click `启动建筑工作台.cmd` (the workspace launcher). The launcher requires an existing Python installation; `CRAFTSTUDIO_PYTHON` can specify its executable.

Alternatively, start the service from the repository root:

```sh
python server.py --port 18767
```

Open <http://127.0.0.1:18767/>. Python 3.12 is the version used in CI. The backend uses the Python standard library.

Set `CRAFTSTUDIO_MINECRAFT_HOME` to the `.minecraft` directory you want the local edition to use. The local edition adds a SQLite project library and access to selected installation files. Minecraft itself does not need to run for design work.

| | Offline Lite | Local edition |
|---|---|---|
| 3D designer and modeling tools | Shared designer | Shared designer |
| Inputs | User-selected files | User-selected files and local installation access |
| Project storage | Browser IndexedDB | Local SQLite library |
| Portable project and blueprint export | Yes | Yes |
| Backend required | No | Python local service |

## Set up the base resource library

Open **Asset library → Resource library**. In the local edition, choose **Set up base materials from a local instance**, select the intended instance, and import the preselected vanilla and Create files. Lite users choose their own game/Mod JARs or resource-pack ZIPs once.

The library caches resource assets in SQLite locally or IndexedDB in Lite and restores enabled files for new projects and later launches. Add other Mods and packs as needed; enable or disable each entry and move it up or down. Files load from top to bottom, with later files overriding earlier ones. Loading a new vanilla/Create base disables the previously cached base of that kind. Library backups include cached resources; portable projects retain the assets used by the project. No game or Mod assets are added to the public distribution.

## Design workflow

1. **Import the real site.** Keep terrain, water, and existing structures as the starting point. Review the origin and selected region before designing.
2. **Choose materials visually.** Browse block previews and filter by source, shape, use, or color. Create your own categories and favorites.
3. **Draw auxiliary geometry.** Click to define lines, curves, and closed outlines. Continuous polylines finish as open paths with Enter or the Finish button; click the start point or Close to close them. Picked points have local undo/redo. In Precision coordinates, select a point then insert a midpoint after it or remove it for polylines, polygons and Bézier control sets. These edits stay in preview until confirmation and use the same linked rebuild/undo flow. Fixed-point shapes retain coordinate editing; active four-point symmetry must be released before changing the count. Saved paths can drive linked sweeps; closed coplanar paths can extrude. Sketches default to auxiliary geometry rather than placing blocks immediately. Bézier control points move freely in X/Y/Z by default; an optional plane lock is visible in the main sketch controls.
4. **Generate a form.** Extrude an outline, loft between sections, or generate along a path. Coplanar, connected line segments can form a closed profile automatically. Inclined profiles support extrusion along their own normal. Closed-contour offsets expand or shrink within the contour's own plane, preserving corners and saved workplanes; their results are independent reusable guides. New offsets retain their source and distance. Use Edit source or Rebuild from source in the sketch tree: source changes mark the copy as stale, and an explicit preview/confirmation rebuilds downstream features with one undo while preserving supported manual block edits. Use Change source to repair a missing reference or choose another saved closed contour from a named list; preview and confirmation update the offset and downstream features together, and one undo restores the old source and blocks. Self/descendant cycles are rejected. Older offsets without source records stay independent.
5. **Refine and compare.** Edit blocks, transform selections, reuse components, and inspect the original site, final design, and change views.
6. **Confirm and save.** Preview generation before committing it. Confirmed modeling operations can be undone as one operation. Save an editable project and export the required blueprint.

The interface uses a fixed tool column, central 3D viewport, right-side scene collection and properties, and a bottom material/component shelf. Modeling panels stay outside the viewport. Dragging sketch handles provides immediate shape feedback while the worker calculates the precise block result.

Viewport controls: **left click / drag** selects or box-selects, **right drag** orbits, **middle drag** pans, and **F** frames the selection or scene. Space + left drag also orbits. **Ctrl+Z / Ctrl+Y** undo and redo. During sketch drawing, undo/redo applies to picked points; Backspace or the Back button removes the last point. Enter closes a polygon, then confirms a ready outline/model preview. Control-point moves/coordinate edits, sketch dimensions and extrusion depth have temporary preview undo/redo. Esc during a handle drag restores its starting state and keeps the panel open; losing window focus cancels that drag too. Changing other operation settings starts a fresh preview-history context. Dimension and control-point fields accept arithmetic such as `(12+4)/2` and `7/2`; Enter or leaving the field adopts the result. Incomplete or invalid expressions block confirmation, and Esc restores the prior value. The project stores evaluated numbers, not persistent parameter equations. While adjusting a completed sketch, X/Y/Z restrict control-point movement and Shift+axis restricts movement to the other two axes; repeat the same combination to restore free movement. The direction selector shows world axes or a locked custom plane's U/V directions. Plane locking remains authoritative. Text fields retain their native shortcuts. Placement adds one block per press. The brush can draw into empty cells or repaint existing blocks while retaining supported shape/orientation states. Selection, surface, sampled-material and height conditions can be combined and saved as presets; each stroke can be undone as one operation.

## What is available

- **Real terrain and change tracking:** preserve the imported baseline; track additions, replacements, and removals separately; protect terrain, water, and retained regions.
- **Editable sketch sources:** reopen saved sketches from the scene collection or by double-clicking their guide. Confirmed source edits can rebuild linked geometry/extrusion/loft/sweep outputs with one undo. Hand edits and deleted cells are preserved by default; missing legacy provenance and unrelated collisions are reported. Generated objects can be detached into independent voxel objects. Their source details also offer Repair/change modeling sources: select replacement sections or a sweep path by name, preview, then confirm. Object/output-guide identities and downstream references remain stable; supported manual edits and one-step undo are retained. Custom-section sweeps track both the section and path. The parameter panel follows the operation: extrusion distance for extrudes, section width/height for rectangular sweeps, section/path inputs for lofts and custom-section sweeps, and wall thickness when hollow is enabled. In this panel, Enter in a numeric field updates preview; Enter in the viewport confirms only a ready result, and Esc cancels. Enter on a focused button keeps its native action. Space toggles focused controls and remains viewport navigation elsewhere. Generation ownership records are required.
- **Sketches and modeling:** lines, open/closed polylines, Bézier curves, rectangles, circles, ellipses, arcs, polygons, extrusion, lofting, path generation, and terrain-following geometry. Curve rasterization can use slabs and stairs when suitable block variants are available. Ground-following/graded roads skip water, conflicting buildings/plants and absent ground, including widened/diagonal connection candidates; grading preserves the entire skipped column instead of placing road blocks after declining earthworks. Support generation preflights whole known-ground-to-deck columns, skips blocked pillars as a whole, and reports grounded/blocked/missing/buried/selection-clipped candidates. This describes planned voxel geometry, not engineering load capacity. Free-height design remains available.
- **Arbitrary planar profiles:** recognize inclined closed outlines; extrude forward, backward, or symmetrically; create hollow forms and cuts. Noncoplanar outlines are rejected rather than flattened. Inclined loft sections must be parallel.
- **Component definitions:** linked instances share a saved definition and fixed placement transforms. Publish edits from supported rotated/mirrored instances, preserve sibling overrides by default, expand the source range, or make one instance unique. Ordinary copies remain independent.
- **Isolation workflow:** focus the selected object/region with a visible status bar, enter nested views, and restore the previous camera (including orthographic zoom) on exit. Basic human placement/brush edits stay within the nearby edit range and skip hidden object members; explicit AI edits retain their own policies.
- **Editing and reuse:** block states, clipboard operations, selection transforms, mirrors, arrays, object groups, and reusable components.
- **Asset library:** lazy previews, search and filters, favorites, aliases, hierarchical user categories, and multiple category memberships per block.
- **Create visuals:** supported rotating parts and captured native assemblies use adapted Create resources and saved data. This is visual support, not a full production-line simulator.
- **Local persistence:** editable portable projects, versions, drafts, library backups, and asset preferences. The local edition stores complete designer projects in SQLite.
- **AI design interface:** exact scene reads, free block edits, transactions, conflict checks, save/export, and viewport capture through the public page/worker API. AI designs do not have to use predefined building templates.

- **Measurement and views:** distance, spatial angles, polyline length, sketch snapping and saved observation views.
- **Reusable tool settings:** searchable brush presets with selectable drawing planes and JSON import/export.

## Files and resources

| Input / output | Current support |
|---|---|
| Vanilla / Create structure `.nbt` | Import and NBT export; preserve supported native data and placement masks |
| Sponge `.schem` | Import and export; format conversion has metadata limits |
| Litematica `.litematic` | Import; not a lossless Litematica round trip |
| Anvil `.mca` | Import a selected region from one region file |
| Resource-pack ZIPs and mod/game JARs | Read supported model and texture assets from selected files |
| `.craftlite` | Portable editable designer project |

The material library includes Recent items and Favorites. Using a material remembers its full block state; selecting it again keeps supported facing, slab/stair half and other properties, and dragging uses the current selected state. Preferences and library backups retain these choices. Save named states in the material detail panel to keep multiple orientations/shapes of one block; selecting a state previews it, and explicit Save/update or Delete manages it. Incompatible known properties report an error instead of silently changing a saved state. Resource files can be added as needed. Missing resources may use fallback geometry or materials until the appropriate files are supplied. Custom mod renderers and behaviors are not universally supported.

Sponge and Litematica conversions do not preserve every entity, biome, scheduled tick, or multi-region detail. MCA import reads the selected portion of one file and does not convert entities, lighting, or scheduled ticks. Blueprint export is not a complete Minecraft world save exporter.

## AI and game integration

See the [Design API](lite/DESIGN-API.md) for the shared page/worker protocol:

```js
const result = await window.CraftStudio.request({
  schema: 'craftstudio-design/1',
  id: 'describe-workspace',
  method: 'workspace.describe',
  params: {}
});
```

This API belongs to the open designer page. It does not automatically expose an unauthenticated HTTP write endpoint. An external AI agent still needs an adapter and its own tool loop. The Python/MCP compatibility interfaces are not yet fully unified with this protocol.

The optional [Java game bridge](bridge/README.md) now has separate **NeoForge 1.21.1, Forge 1.20.1, and Fabric 1.20.1 / 1.21.1** profiles. Each profile produces its own JAR; Fabric also needs Fabric API. Open **Files → Connect Java game** in the local designer to identify the running version, read regions, validate target block states, build changes, monitor progress, cancel, or undo. State-only builds can cross DataVersions after registry validation; native entities and cross-version block-entity NBT still need a native schematic/conversion workflow.

Single-player writes require creative mode. Dedicated-server writes require an explicit operator setting; the bridge remains on loopback. Compilation and live-world validation are separate checks. See the bridge documentation for build artifacts, install steps and the compatibility matrix. Bedrock is outside the project's scope.

## Development

Install Node.js 22.13 or later, then:

```sh
cd lite
npm install
npm test
npm run build
npm run check:sync
```

Run backend checks from the repository root:

```sh
python -m unittest discover -s tests -p "test_*.py"
```

Both editions share [`lite/src`](lite/src). One build generates `lite/dist/CraftStudio-Lite.html`, `web/lite.html`, and `web/index.html`; the sync check verifies that these three pages match byte for byte. On a successful `main` update, GitHub Actions rebuilds and commits stale generated outputs. This does not upload local changes automatically: they must first be committed and pushed to GitHub.

After downloading an update, reopen the Lite HTML or restart the local launcher and refresh the page.

## Scope, data, and licensing

CraftStudio is a work in progress. Current limits include incomplete custom-renderer support, parallel-section requirements for inclined lofts, and no complete engineering simulation or automatic external-AI setup.

Public builds do not include private worlds, user blueprints, resource packs, screenshots, or databases. Builds exclude user data by default. `LITE_SOURCE_NBT` and `LITE_REFERENCE_HTML` are optional personal-build inputs; do not publish generated files containing private data. Databases and logs are created locally and covered by ignore rules.

See [third-party notices](lite/THIRD-PARTY.txt). Bundled third-party code retains its original terms. Minecraft/mod game textures are not bundled in the public release. The main project code currently has **no separately declared open-source license**; a public repository alone does not grant unrestricted reuse rights.

API reference: [Design API](lite/DESIGN-API.md).

For backend development, [local-engine](local-engine/README.md) provides a shared Node host, immutable SQLite checkpoints and a persist-before-acknowledgement controller. The Python service and designer can opt into it as described below.

## Optional backend editing

The local service can run the editing engine in Node behind the existing authenticated Python endpoint. This path is opt-in while resource-heavy performance is being improved. It requires existing Node 22.13+ and the dependencies installed in `lite`; no runtime is installed automatically.

On Windows, double-click `启动本地计算版.cmd` for local computing or `启动浏览器计算版.cmd` for browser computing; the original launcher keeps its default/environment choice. You can also run `start.ps1 -Computation Local` or `Browser`. Save a formal project version before switching a running service: the launcher asks before a mode restart, and Enter keeps the current service. Both modes share the project library, but resume their own working states; open the saved version from the library after switching. The footer reports the actual computing mode. Missing local dependencies fall back visibly without installing anything. Alternatively, set `CRAFTSTUDIO_ENGINE=1` before starting the local launcher/service. Set `CRAFTSTUDIO_NODE` to a Node executable if it is not discoverable. The service advertises `local-engine/1` only after startup succeeds. The page then uses its authenticated loopback endpoint directly, remembers its last confirmed scene and retains undo/redo across reloads. The Python proxy remains available for clients without a direct endpoint. Direct browser access is limited to the launcher's explicit local origins and private token. Standalone Lite continues to use browser Workers and IndexedDB. `CRAFTSTUDIO_ENGINE=0` disables the new path.

Selected-file imports on this backend read successive 4 MiB slices with checksums and cancellation; they avoid a whole-file browser buffer. Backend parsing still assembles the input in memory. Standalone Lite retains browser parsing. Remote-path latency is not fully optimized. See [local engine API](local-engine/README.md) for developer usage.
