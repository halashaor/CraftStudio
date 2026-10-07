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
3. **Draw auxiliary geometry.** Click to define lines, curves, and closed outlines. Continuous polylines finish as open paths with Enter or the Finish button; click the start point or Close to close them. Picked points have local undo/redo. In Precision coordinates, select a point then insert a midpoint after it or remove it for polylines, polygons and Bézier control sets. These edits stay in preview until confirmation and use the same linked rebuild/undo flow. Bézier curves also offer degree elevation without changing the continuous shape, retaining the current sampling count until a real control edit; preview undo/redo and portable storage preserve it. Fixed-point shapes retain coordinate editing; active four-point symmetry must be released before changing the count. Saved paths can drive linked sweeps; closed coplanar paths can extrude. Sketches default to auxiliary geometry rather than placing blocks immediately. Bézier control points move freely in X/Y/Z by default; an optional plane lock is visible in the main sketch controls.
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

Single-player writes require creative mode. Dedicated-server writes require an explicit operator setting; the bridge remains on loopback. Compilation and live-world validation are separate checks. See the bridge documentation for build artifacts, install steps and the compatibility matrix. Bedrock is outside the project's scope. The connection panel follows bridge capabilities: read-only/unknown write permission allows supported reads/checks but disables construction/world undo. Token/port changes invalidate the session, and busy jobs disable new builds. Connection UI tests use a simulated bridge; they do not verify live-world construction.

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

Reconnecting to the Java bridge recovers an active build/undo task and its progress; completed tasks retain progress lookup while Stop is disabled. Tokens are never saved. This does not resume tasks across a Minecraft restart.

Use **Focus selection** in the selection inspector or F3 search to frame selected objects/regions while retaining camera direction, perspective/orthographic mode and zoom. F3 also exposes isolate, exit one isolation level and restore the full scene.

Viewport geometry, pooled materials and textures release unused graphics resources as you move through large scenes. Returning reloads needed textures; cached Create models retain their referenced textures. Temporary image URLs are revoked after decoding. Canonical voxel data still resides in memory; this is not full world-data streaming.

The optional local engine now stores immutable source blocks in independently verified chunks. Stored baseline queries read requested chunks without loading unrelated source blobs, with checkpoint sequence checks; legacy checkpoints restore and upgrade on the next successful save. The local canonical workspace decodes source chunks on demand with a bounded cache. File-backed local workspaces fetch verified source chunks through a read-only SQLite connection on demand. In-memory test workspaces retain compressed chunks; native parsing, broad operations and complete exports can still materialize the whole source.

Large scenes now show nearby geometry in batches while the view remains navigable. Placement waits for the current view to finish loading; after a loading error, rotate the view to retry. Explicit view changes clear residual orbit inertia.

Sketch/model numeric fields support dragging their labels or Alt-dragging the value. Shift gives finer control, Ctrl snaps to the field step, and Esc cancels the drag. These gestures adjust the preview; block placement still requires confirmation. Existing coordinate/depth preview undo remains available.

Before confirming construction, numeric sketch/model settings (including sweep width/height and hollow thickness) use local preview undo/redo. Focus the viewport and press Ctrl+Z / Ctrl+Y; numeric changes do not undo the saved scene. Changing tools or source selections resets this temporary history.

Terrain numeric preview history now includes target elevation, smoothing radius, slope coefficients and endpoint heights. Ramp endpoints and their derived slope are restored together. Before confirmation, these edits leave the original terrain unchanged; confirmed construction still uses scene undo. Valid plain-number edits can be confirmed directly without a redundant blur-triggered recalculation.

Construction preview history also covers common sketch/model checkboxes and option lists, including fill, hollow/end caps and voxel fitting. Tool kind, workplane and source-selection changes remain context switches that reset this temporary history.

The construction tool’s Frame button preserves the current camera orientation, projection and zoom, fits the guide and available preview geometry, and includes both sides of symmetric extrusion. It keeps the tool and its current settings open.

Construction tools can now pause unconfirmed work in the current project session. Use **Pause** and the fixed inspector’s **Continue** actions to restore points, scope, materials, settings and preview history; current scene data is recalibrated before confirmation. Each tool kind retains its latest intent. Explicit Close/Esc discards the active intent; switching tools can retain it. Changing projects clears paused intents. Explicit Pause now saves the confirmed scene draft and tool intent locally; after reloading matching scene content, Continue restores the preview. Switching tools still retains session state; use Pause and wait for the saved status for reload recovery. Different confirmed content will not automatically match old intent. Identical scene copies can share a content-bound intent slot.

Linear arrays and linked instances now offer **Gap spacing** alongside free XYZ offsets. Gap mode adds the selected occupied span to the requested gap on the chosen axis, supports reverse direction, and reports resolved integer-grid spacing before confirmation. Slabs/stairs use occupied block bounds, not exact rendered surface separation.

Path arrays can use fixed spacing or distribute a requested number over the full path. Open paths include their endpoints; closed guides include the closing segment without repeating the seam. Preview reports actual count and theoretical spacing; duplicate anchors after voxel snapping are skipped explicitly.

Object collections organize voxel objects by building or area. In the scene collection panel, create a named collection, assign selected objects, filter its members, select all members, or hide/show it. Removing a collection only removes membership. Individual hidden states remain independent, and confirmed collection edits support undo and project save/reopen. This release uses single-level collections with one collection per object.
Collection members can also be moved out individually; object rows display their current collection name. Removing membership preserves blocks and supports undo.

The scene list offers a needs-attention filter for generated objects. Missing recorded sketch sources are errors; explicitly outdated outputs are warnings. Badges explain the reason, and existing source details provide editing/repair actions. Inspection does not change blocks or lock unrelated editing; detached objects are excluded. These statuses describe recorded relationships, not a complete validation of every possible generation failure.

Recorded generation diagnostics also follow producer/output-guide dependencies: downstream objects name problematic upstream objects, actual cycle members are marked separately, and ambiguous output ownership is reported. Detached outputs stop propagation. Source details show the reasons. These checks inspect recorded relationships and explicit outdated flags; they do not replace geometry validation.

Generated objects also report broken, cyclic or outdated offset-outline ancestry. Repairing the named offset source clears the diagnostic after confirmation; cancelling retains the original, and undo restores it. An upstream offset awaiting rebuild is a warning rather than a missing-source error.

Project material schemes live in the existing material shelf and travel with the project. Create a named scheme, add the currently previewed full block state, choose a saved state, or remove entries/the scheme. Stair facing and half, slab layer and unknown Mod properties are retained. Global categories/resources remain separate; scheme membership never restricts human or AI edits. Confirmed scheme edits support undo and local/Lite save/reopen.
Material schemes can be exported as `.craftpalette.json` and reused in another project. Import shows the name and exact states before explicit confirmation, creates a new scheme, and rejects a conflicting name without overwriting. The file carries state metadata rather than project identities or resource archives. Import is one undoable edit in the current session.

Autosaved drafts preserve confirmed undo/redo history in browser-compute local mode and standalone Lite. History stores changed chunk versions and deduplicated design snapshots without copying baseline terrain into each step. Restoration supports exact block states, block-entity NBT and metadata edits. Old drafts without history still load; formal portable project export does not add an undo journal.

Direct move/copy/paste offsets support arithmetic and label dragging. Enter in an offset field updates the preview; Escape restores that field. Enter on a focused button keeps its native action, including Cancel. Enter in the viewport confirms. Invalid or unfinished expressions block confirmation, and confirmed transforms remain one undoable edit.
Interrupted direct gizmo drags now release their drag state and pointer capture. Escape cancels the operation; window blur, pointer cancellation or lost capture restores the current drag start while keeping the operation preview available. A normal mouse release keeps the adjusted preview.

While a direct move/copy/rotate/paste preview is active, Undo/Redo step through completed preview adjustments instead of cancelling the whole operation. Numeric edits, gizmo drags, quarter turns, paste position locking and overlap changes are separate steps; new edits discard the old redo branch. No confirmed voxels change until confirmation, which remains one scene undo. Preview history lasts for that operation session.

Direct transform preparation appears immediately in the fixed inspector with unavailable controls disabled. Escape or Cancel dismisses preparation, and late replies cannot reopen it or unlock a newer request. Preparing paste while clipboard copying is pending follows the same rule. Scene changes invalidate preparation; source preview/copy reads carry revision and workspace guards. UI cancellation does not preempt an already-running worker calculation.

While an unconfirmed tool preview is active, the quick-save button says Save confirmed content and the result explains that the preview is not included. Saving keeps the preview available in the current page without accepting or discarding it. Confirm it to include the change in a subsequent save; supported construction tools still offer explicit Pause for separate intent persistence.

A formal save freezes its name, note, tags, size and block statistics before serialization and guards the scene revision. Later edits are not mislabeled as part of that version; when its draft succeeds, the save result explains that they remain in the working draft and need another formal save. A note typed during saving is not cleared.

Pending save-form text (name, raw tags, type and next-version note) follows the local working draft and is restored on reload. The optional local engine keeps this UI form in a workspace-bound local preference. A submitted note is cleared before the next draft is written, so it does not reappear. Opening another project resets its fields; formal building exports do not include pending form data.

A native modal dialog owns keyboard input before the viewport tools. Escape closes the dialog without cancelling a background preview; Enter keeps the focused dialog button action, and Undo does not change the underlying transform. Closing the dialog restores viewport shortcuts. Docked design panels retain their existing tool rules.

Enter on a focused design-panel button, checkbox, selector or other control stays with that control; it cannot confirm a background operation. Pointer-down in the viewport explicitly focuses the canvas, preserving viewport Enter for drawing/confirmation even when a tool captures the pointer. This rule covers construction, arrangement, direct transforms and measurement.

Arrangement and feature-edit numeric fields share arithmetic input and label scrubbing with sketch/direct tools. Enter or blur resolves a calculation and updates preview; Escape restores the field. Visible unfinished/invalid expressions block confirmation without changing the scene. Existing generator integer/range/source validation still applies.
