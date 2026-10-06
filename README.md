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
3. **Draw auxiliary geometry.** Click to define lines, curves, and closed outlines. Sketches default to auxiliary geometry rather than placing blocks immediately. Bézier control points move freely in X/Y/Z by default; an optional plane lock is visible in the main sketch controls.
4. **Generate a form.** Extrude an outline, loft between sections, or generate along a path. Coplanar, connected line segments can form a closed profile automatically. Inclined profiles support extrusion along their own normal.
5. **Refine and compare.** Edit blocks, transform selections, reuse components, and inspect the original site, final design, and change views.
6. **Confirm and save.** Preview generation before committing it. Confirmed modeling operations can be undone as one operation. Save an editable project and export the required blueprint.

The interface uses a fixed tool column, central 3D viewport, right-side scene collection and properties, and a bottom material/component shelf. Modeling panels stay outside the viewport. Dragging sketch handles provides immediate shape feedback while the worker calculates the precise block result.

Viewport controls: **left click / drag** selects or box-selects, **right drag** orbits, **middle drag** pans, and **F** frames the selection or scene. Space + left drag also orbits. **Ctrl+Z / Ctrl+Y** undo and redo. Placement adds one block per press. The brush can draw into empty cells or repaint existing blocks while retaining supported shape/orientation states. Selection, surface, sampled-material and height conditions can be combined and saved as presets; each stroke can be undone as one operation.

## What is available

- **Real terrain and change tracking:** preserve the imported baseline; track additions, replacements, and removals separately; protect terrain, water, and retained regions.
- **Editable sketch sources:** reopen saved sketches from the scene collection or by double-clicking their guide. Confirmed source edits can rebuild linked geometry/extrusion/loft/sweep outputs with one undo. Hand edits and deleted cells are preserved by default; missing legacy provenance and unrelated collisions are reported. Generated objects can be detached into independent voxel objects.
- **Sketches and modeling:** lines, Bézier curves, rectangles, circles, ellipses, arcs, polygons, extrusion, lofting, path generation, and terrain-following geometry. Curve rasterization can use slabs and stairs when suitable block variants are available.
- **Arbitrary planar profiles:** recognize inclined closed outlines; extrude forward, backward, or symmetrically; create hollow forms and cuts. Noncoplanar outlines are rejected rather than flattened. Inclined loft sections must be parallel.
- **Component definitions:** linked instances share a saved definition and fixed placement transforms. Publish edits from supported rotated/mirrored instances, preserve sibling overrides by default, expand the source range, or make one instance unique. Ordinary copies remain independent.
- **Isolation workflow:** focus the selected object/region with a visible status bar, enter nested views, and restore the previous camera (including orthographic zoom) on exit. Basic human placement/brush edits stay within the nearby edit range and skip hidden object members; explicit AI edits retain their own policies.
- **Editing and reuse:** block states, clipboard operations, selection transforms, mirrors, arrays, object groups, and reusable components.
- **Asset library:** lazy previews, search and filters, favorites, aliases, hierarchical user categories, and multiple category memberships per block.
- **Create visuals:** supported rotating parts and captured native assemblies use adapted Create resources and saved data. This is visual support, not a full production-line simulator.
- **Local persistence:** editable portable projects, versions, drafts, library backups, and asset preferences. The local edition stores complete designer projects in SQLite.
- **AI design interface:** exact scene reads, free block edits, transactions, conflict checks, save/export, and viewport capture through the public page/worker API. AI designs do not have to use predefined building templates.

## Files and resources

| Input / output | Current support |
|---|---|
| Vanilla / Create structure `.nbt` | Import and NBT export; preserve supported native data and placement masks |
| Sponge `.schem` | Import and export; format conversion has metadata limits |
| Litematica `.litematic` | Import; not a lossless Litematica round trip |
| Anvil `.mca` | Import a selected region from one region file |
| Resource-pack ZIPs and mod/game JARs | Read supported model and texture assets from selected files |
| `.craftlite` | Portable editable designer project |

Resource files can be added as needed. Missing resources may use fallback geometry or materials until the appropriate files are supplied. Custom mod renderers and behaviors are not universally supported.

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

Install Node.js 22 or later, then:

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

Further reading: [Architecture](ARCHITECTURE.md), [interaction design and implementation status](docs/interaction-spec.html), and [Design API](lite/DESIGN-API.md). These supporting documents are currently primarily in Chinese.

## Design roadmap

See the [design roadmap and research ledger](docs/design-roadmap.html) (Chinese) for current evidence, reference tools, implementation priorities, and end-to-end acceptance tasks. Research, prototypes, compiled checks, and real-world validation are tracked separately. The goal is terrain-first, free human/AI architectural design, with practical differences between local and Lite editions.

Large scenes (100,000 source plus added blocks) request chunk geometry by camera frustum and evict off-view geometry. Complete voxel data remains available for edits, saves and exports; this is geometry streaming, not backend data streaming. Resource-model bounds are conservative, camera updates are coalesced, and editing waits while visible geometry loads. See [design evidence](docs/design-roadmap.json). Run `node lite/tests/performance-baseline.mjs` for a reproducible synthetic compute/buffer benchmark; it does not measure pointer-to-visible latency or hardware GPU FPS.

Selections support replace/add/subtract/intersect. Shift adds and Ctrl subtracts when clicking blocks/objects or box-selecting; the inspector also offers explicit modes. Exact object membership and region volumes share brush, clipboard, transform, deletion and component extraction rules. Yellow indicates the extent; blue/red/purple indicate added/subtracted/intersection operands. Selection changes do not edit blocks. See [selection evidence](docs/validation/selection-combine.json).

Paths/figures and terrain tools can use the shared selection as an exact 3D volume or an XZ footprint. Footprint mode projects each operand before combining it and ignores Y; volume mode limits every voxel, including supports and earthwork. Guides retain their complete design shape. The selected range is captured for the operation and may be explicitly refreshed; saved path recipes retain it. Pick the target ground layer directly from an existing static block. Preview reports stay above confirmation controls. See [scope validation](docs/validation/construction-scope.json).

For a terrain ramp, choose **Drag a ramp**, press a static block at the start and drag toward the end. A lightweight plane and signed measurements update while dragging; release recalibrates the voxel preview, then confirm to apply. Edit either endpoint ground layer as needed. Escape restores the previous settings. Beyond the endpoints the ramp stays at the first/last heights, within the chosen scope. Only relevant terrain controls are shown. Terrain recipes retain endpoints in portable projects; reopening their voxels is verified, while saved terrain recipe editing is still pending. See [ramp evidence](docs/validation/terrain-slope.json).

Sketches can set a construction plane from an actual model face or three noncollinear points, then face the plane directly. Custom-plane state, grid and local axes are visible. Snapping, shape generation and locked gizmos share that frame; unlocking retains free 3D editing. Automatic extrusion respects the saved normal, including negative-axis faces. Portable guide recipes retain the frame. Moving-object attachments are still pending. See [workplane evidence](docs/validation/custom-workplane.json).

The sketch panel can save, use, rename/update and delete named planes within a project. Plane metadata shares revision checks, transactions, undo and portable storage. Existing sketches retain snapshots. A curve station slider uses sampled-polyline arc length and transported axes; its small yellow icon previews a section before explicit adoption and drawing. `workplanes.list`, `workplanes.put`, `workplanes.remove` and `workplanes.atCurve` expose the same capabilities to AI. Automatic reference attachment remains pending. See [plane library validation](docs/validation/plane-library.json).

Single-rail sweeps now accept one or more user-drawn closed profiles, including concave shapes, along a sampled 3D path. Choose retained drawing offset or centered placement, hollow walls, optional end caps or cutting. Exact voxel preview is separate from the lightweight continuous surface; auxiliary loops are sparse. Shared generation scopes also apply to extrusion, loft and sweep. Source path updates retain manual edits and one-operation undo. Old recipes and quick rectangular sweeps remain supported. Nonplanar closed seams, self-intersection repair, multiple varying profiles and further slab/stair boundary refinement remains pending. See [sweep validation](docs/validation/profile-sweep.json).

Profile sweeps also support multiple sections positioned along the rail. They are sorted by station, resampled and matched by cyclic start/winding before linear or smooth interpolation. Intermediate bulges are included; hollow caps use arc-length thickness across subdivisions. Editing any source section regenerates the result while retaining manual overrides. Automatic shape-seam repair and further adaptive boundary refinement remains pending. See [variable sweep validation](docs/validation/variable-sweep.json).

Closed spatial rail sweeps now distribute accumulated frame rotation to align the first/last section direction. The correction may be disabled. Automatic or manual perimeter correspondence, start fraction and winding reversal are available per selected section, with orange start markers. Corrected continuous previews and voxel sampling share frames. This handles frame closure, not automatic repair of differing endpoint contours or self-intersections. See [closed sweep validation](docs/validation/closed-sweep.json).

Profile sweeps offer optional half-cell boundary fitting. Occupancy is unioned across segments, then matched to full blocks, top/bottom slabs and straight stairs with valid facing/half states. Variants come from explicit role choices or available material families; missing/unsupported boundaries are reported. Pure block mode remains available and cuts stay voxel-based. Closed membership now uses corrected frames, not only corrected display rings. Eight-sample fitting is approximate; inspect thin walls, cavities and corner cases. See [boundary validation](docs/validation/voxel-fit.json).

Sweep diagnostics now mark center-sampled voxel overlap between distant rail portions, with a red location overlay and focus action. Keep merged volume or explicitly stop confirmation; the same blocker applies to AI commits and source regeneration. Shared scopes filter overlap reports. This is voxel sampling, not exact continuous self-intersection or automatic topology repair, and may miss thin/nearby contacts. See [overlap validation](docs/validation/sweep-overlap.json).

The full local service exposes immutable baseline chunk queries: `scene.baselineManifest` and `scene.readBaselineChunks` through `window.CraftStudio.request`. SQLite caches 16³ chunks while retaining original portable baselines; masks, metadata, entities and typed NBT are preserved. Reads return requested records only and distinguish empty-records from outside bounds. The query client has bounded LRU caching. This is a baseline-only foundation: current Worker editing still holds the complete scene; overlay authority and stream-aware rendering/generation/export remain pending. Lite keeps file-based editing. See [local chunk evidence](docs/validation/local-chunks.json).

The full local service now mirrors versioned Worker checkpoints as chunk-indexed overlays. `scene.chunkSnapshot` synchronizes metadata and delta state; `scene.readStoredChunks` reads baseline plus current checkpoint edits, including deletions, new extents and typed NBT. Reads are revision/digest pinned and the query cache invalidates changed chunks. Unchanged revisions avoid reposting full delta/design. This remains a derived query mirror: Worker retains complete canonical editing state; viewport-only editing and backend generation are not complete. Local project save/download and full NBT now export pinned SQLite checkpoints chunk by chunk; compressed output and resources remain buffered. See [checkpoint export](docs/checkpoint-export.md). Portable projects remain the recovery format. See [workspace chunk evidence](docs/validation/workspace-chunks.json).

Clipboard placement: Ctrl+C copies the selection; Ctrl+V starts a cursor-following preview. Click to lock its anchor, then adjust with the gizmo or numeric offsets. Enter or Ctrl+V confirms; Escape cancels without editing. Fast copy/paste waits for the clipboard data. See [workflow evidence](docs/validation/paste-cursor.json).

Shortcut context: text fields retain native clipboard/deletion/undo. Undo during a transform, sketch or designer preview cancels that preview before affecting committed scene history; Delete does not delete the original selection behind a preview. Scene redo supports Ctrl+Y and Ctrl+Shift+Z. See [validation](docs/validation/keyboard-context.json).

Optional reviewable AI proposals now expose `proposal.prepare/inspect/commit/cancel`, connected to the 3D preview. Proposal ID and scene revision guard adoption, true deletions and typed NBT survive, and accepted edits undo as one step. External API edits invalidate old direct-transform previews. See [proposal API](docs/proposal-api.md).

Pending modelling previews now preserve parameters and recompute after external edits in the same workspace. Late or invalid results cannot be confirmed; deleted profile/path references remain explicit instead of being silently replaced. Workspace switching ends the old operation. See [recompute workflow](docs/draft-recompute.md).

Press F3 or 查找工具 to search design tools by Chinese labels, English aliases or category. Results show shortcuts and unavailable reasons; Up/Down and Enter open the existing tool. Escape returns to the previous sketch/transform, and recent tool IDs persist in the local library. See [tool finder](docs/command-search.md).

Small edits now use chunked copy-on-write overlays and incremental summary counts, preserving undo/candidate isolation and portable formats. A 204800-edit browser import/brush/SQLite/export/reopen workflow passed. Local microbenchmark improvements cover only the editing-data phase, not overall rendering latency. See [overlay performance](docs/overlay-performance.md).

The upgraded local service synchronizes only changed checkpoint chunks after the initial snapshot (`workspace-delta/1`), with version-checked atomic updates, explicit undo removals and full retry on missing bases/cache. A synthetic one-cell edit sent about 117 KB instead of the initial 12 MB; metadata-only workplane update sent 672 bytes. These are request-size measurements. See [checkpoint deltas](docs/workspace-delta.md).

Local autosave now captures immutable checkpoint chunk references (`checkpoint-draft/1`) and reuses resource attachments, with portable resume/backup materialization and legacy/Lite compatibility. Import waits for pending saves and preserves the current design. Empty-library active draft restore is supported without replacing an existing draft. See [checkpoint autosave](docs/checkpoint-autosave.md).

Measure actual scene surfaces with the left-side 测量 tool or F3: fractional spacing, rise and slope appear in the fixed inspector and 3D ruler. Saved metadata annotations support edit/delete/undo, world-coordinate API and portable persistence without placing blocks. See [measurement](docs/measurement.md).

Sketch picking now identifies saved-guide endpoints, midpoints and centers near the cursor, with a cyan marker and fixed source badge. Workplane filtering, optional Ctrl bypass and exact numeric/reference coordinate preservation support connected design without mandatory constraints. See [object snaps](docs/object-snaps.md).

Private provided-file regressions can be run locally with `node lite/verify-fixtures.mjs` and explicit paths. The latest local run passed 165 tests with zero skips; the supplied V3 change blueprint matched its reference exactly. Public CI still excludes private files and licensed assets. See [fixture verification scope](docs/private-fixture-validation.md).

Original point lookup and chunk indexing now share immutable baseline maps. A supplied-region Node sample reduced retained index heap from about 31 MB to 16 MB; timing/lookup scope and tradeoffs are documented. Real-file tests and an isolated browser/backend full NBT export matched all original records. This is not viewport-only streaming. See [baseline indexing](docs/baseline-index.md).

Replacement imports and draft resume now parse in a candidate Worker with phase feedback and cancellation, preserving the active design until successful swap. Invalid/cancelled input leaves original data intact; writes during staging are rejected. Peak memory can rise temporarily, and HTML reference proposals keep their existing flow. See [staged import](docs/staged-import.md).

Embedded partial geometry/textures now survive portable re-export before visual demand, with namespace-correct selected resource precedence. Captured assembly original-view controller NBT is separated from current edits and undo restores supported speeds. See [Create resource fidelity](docs/create-resource-fidelity.md).

Generated result rows expose named source sketches; saved guides show dependant counts. Source editing explains linked vs source-only scope and preview update/manual-preservation counts, with one-step undo. Read-only `generation.links` exposes existing provenance. See [generation navigation](docs/generation-navigation.md).

Recorded generated-output dependencies now propagate source and upstream-feature updates in dependency order, with cycle/missing-reference rejection, manual preservation and one undo. The edit panel includes indirect affected results; ordinary snaps remain snapshots. See [generation propagation](docs/generation-propagation.md).

Saved views now capture the current camera including projection, zoom, up direction and orthographic extent. The fixed panel/F3 entry supports metadata save/update/delete/undo and portable restore, with legacy compatibility; restoration preserves pending sketches and does not edit voxels. See [saved views](docs/saved-views.md).

Saved views optionally include the cut layer, comparison mode and vegetation/terrain/existing-building display switches. Camera-only bookmarks preserve current display settings. See [display snapshot evidence](docs/validation/display-snapshot.json).

Brush presets support search, rename, delete/undo and portable JSON import/export with conflict copies and atomic validation. See [brush presets](docs/brush-presets.md).

Saved sketch rows expose context actions for extrusion and path generation, automatically selecting the source, including joined closed line loops. See [source sketch actions](docs/guide-actions.md).

Opt-in `CraftStudio.diagnostics` records bounded input/Worker/scene/frame submission timings without scene content. See [latency measurements and limits](docs/performance-trace.md).

Unchanged inspector/tree content is retained across voxel edits, with dependency-aware sketch actions and `ui-summary` timing. See [panel refresh scope and measurements](docs/panel-refresh.md).
