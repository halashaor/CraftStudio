# CraftStudio maintenance

After each authorized update:

1. Update the shared designer sources and rebuild the local and Lite outputs.
2. Run checks appropriate to the change and verify the generated pages are synchronized.
3. Commit and push all public project changes to https://github.com/halashaor/CraftStudio.
4. Verify the remote commit and GitHub Actions result before reporting publication as complete.
5. If uploading fails, report the exact blocker and retain a reviewable local commit. Never describe a local-only update as published.

Keep private worlds, blueprints, resource packs, screenshots, databases, and credentials out of the public repository. README.md is the default English documentation; keep README.zh-CN.md in sync.

Compare the complete publish tree with the remote branch, including local commits, rather than checking only uncommitted files. Keep the launcher and backend build fingerprint changes together.

On Windows, use the normal signed-in user's permissions for Git credential access if sandboxed HTTPS helpers crash or cannot access credentials. For a Codex-created checkout, a per-command safe.directory entry for that exact checkout is sufficient; do not change global trust settings. Reuse an existing reachable proxy when required and keep TLS certificate verification enabled.

## Ongoing design learning

Maintain docs/design-roadmap.json and docs/design-roadmap.html as the learning and implementation ledger. Study primary references around a complete human workflow, record observed behavior and applicability, then implement and validate the chosen improvement. Distinguish documented patterns, hands-on observations, prototypes, completed code, performance benchmarks, and live game validation. Do not mark candidate references or planned capabilities as studied or implemented.

Preserve terrain-first design, unrestricted human/AI voxel editing, arbitrary 3D sketching, and distinct local/Lite scale and storage roles. Borrow coherent operation semantics from mature software rather than mixing unrelated menus. Do not declare the overall ongoing design objective complete because a narrow test or CI build passed.
