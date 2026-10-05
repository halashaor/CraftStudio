# CraftStudio maintenance

After each authorized update:

1. Update the shared designer sources and rebuild the local and Lite outputs.
2. Run checks appropriate to the change and verify the generated pages are synchronized.
3. Commit and push all public project changes to https://github.com/halashaor/CraftStudio.
4. Verify the remote commit and GitHub Actions result before reporting publication as complete.
5. If uploading fails, report the exact blocker and retain a reviewable local commit. Never describe a local-only update as published.

Keep private worlds, blueprints, resource packs, screenshots, databases, and credentials out of the public repository. README.md is the default English documentation; keep README.zh-CN.md in sync.
