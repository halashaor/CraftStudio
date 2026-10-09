# CraftStudio maintenance

After each authorized update:

1. Update the shared designer sources and rebuild the local and Lite outputs.
2. Run checks appropriate to the change and verify the generated pages are synchronized.
3. In the Git publishing checkout, run `node lite/check-publication.mjs`, then commit and push only code, build/config files, tests, licenses and necessary usage/API documentation to https://github.com/halashaor/CraftStudio.
4. Verify the remote commit and GitHub Actions result before reporting publication as complete.
5. If uploading fails, report the exact blocker and retain a reviewable local commit. Never describe a local-only update as published.

Keep private worlds, blueprints, resource packs, screenshots, databases, and credentials out of the public repository. README.md is the default English documentation; keep README.zh-CN.md in sync.

Compare the complete publish tree with the remote branch, including local commits, rather than checking only uncommitted files. Keep the launcher and backend build fingerprint changes together.

On Windows, use the normal signed-in user's permissions for Git credential access if sandboxed HTTPS helpers crash or cannot access credentials. For a Codex-created checkout, a per-command safe.directory entry for that exact checkout is sufficient; do not change global trust settings. Reuse an existing reachable proxy when required and keep TLS certificate verification enabled.

If the configured manager fails to load .NET components, a verified fallback is a command-local empty credential.helper followed by credential.helper=wincred, with GIT_TERMINAL_PROMPT=0. Reuse existing Windows credentials; do not print credential values or change global helper settings. The connected GitHub integration may be read-only, so do not assume it can publish commits.

## Ongoing design learning

Keep docs/design-roadmap.json and docs/design-roadmap.html as a LOCAL-ONLY learning ledger when present. Never commit or publish design specifications, roadmaps, research notes, verification reports or reference-source collections. The entire docs/ directory, ARCHITECTURE.md, output/ and lite/reference/ are ignored. Necessary public documentation belongs in the READMEs and API/setup guides. Study primary references around a complete human workflow, record observed behavior and applicability, then implement and validate the chosen improvement. Distinguish documented patterns, hands-on observations, prototypes, completed code, performance benchmarks, and live game validation. Do not mark candidate references or planned capabilities as studied or implemented.

Preserve terrain-first design, unrestricted human/AI voxel editing, arbitrary 3D sketching, and distinct local/Lite scale and storage roles. Borrow coherent operation semantics from mature software rather than mixing unrelated menus. Do not declare the overall ongoing design objective complete because a narrow test or CI build passed.

## Code organization

Keep front-end modules under their functional directories in lite/src. app.js and worker.js compose features; they should not absorb new domain implementations. Keep Python helpers in backend/, with server.py and mcp_server.py as entry points. Separate sizable static interface markup into adjacent views/ templates. Prefer small named functions and focused controllers over generic wrappers. Validate external inputs and preserve transaction/transport error boundaries; avoid duplicate checks and catch-and-ignore blocks. Run the pinned Prettier and Black checks before publication. Prioritize complete end-to-end design workflows before further detail polishing.

Object membership arrays are immutable snapshots: replace cells arrays when membership changes. ObjectProtection reuses weakly keyed indexes for unchanged arrays and resolves object/collection lock flags afresh for every operation.

Keep draft epochs, dirty state, timers and in-flight save coalescing in storage/draft-controller.js. Keep checkpoint metadata and cached asset retry in storage/checkpoint-draft.js; app.js supplies scene/UI callbacks. Preserve immutable formal version snapshots and verify both concurrent-save behavior and project switching when changing this boundary.

Keep page/UI exports in storage/project-export.js and ui/project-export-ui.js. Delivery archives and reports use storage/delivery-package.js in the shared engine. Preserve revision consistency across all bundled files, exact selection scopes, unknown world origins, and read-only optional project titles. Keep both ZIP reopening paths and legacy single-file exports working.

The connected-page MCP bridge forwards the open page API and must not own a second scene. Keep queues/receipts in backend/designer_bridge.py and page transport in integration/designer-client.js. Preserve document+revision binding, request ID replay, explicit connection controls, uncertain execution status after disconnect, and legacy namespace isolation. Do not turn observation waits into execution deadlines or route current-page edits through legacy CURRENT.
