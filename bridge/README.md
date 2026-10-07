# CraftStudio Java bridge

English | [简体中文](README.zh-CN.md)

The designer connects to a shared `craftstudio-bridge/1` protocol. Loader adapters handle lifecycle events; a common runtime handles authenticated local HTTP, world reads, validation, batched builds, cancellation, backups, readback and undo.

## Build profiles

| Profile | Minecraft | Loader / dependency | Java |
|---|---|---|---|
| `neoforge-1.21.1` | 1.21.1 | NeoForge 21.1.209 | 21 |
| `forge-1.20.1` | 1.20.1 | Forge 47.4.0 | 17 |
| `fabric-1.20.1` | 1.20.1 | Fabric Loader 0.16.10 + Fabric API 0.92.2 | 17 |
| `fabric-1.21.1` | 1.21.1 | Fabric Loader 0.16.10 + Fabric API 0.116.5 | 21 |

These are specific adapter targets, not a claim that one JAR works across all Minecraft versions. CI builds each profile separately and publishes JARs as workflow artifacts. Compilation verifies mapped APIs; live-world testing is a separate validation step. Bedrock is outside scope.

```powershell
./build.ps1 -Profile fabric-1.20.1
./install.ps1 -Profile fabric-1.20.1 -ModsDirectory 'path/to/instance/mods'
```

Or run `gradle -p profiles/fabric-1.20.1 build`. Use the Java version from the table and Gradle 8.14.3. Fabric uses official Mojang mappings via Loom. Install Fabric API in Fabric instances. Create is optional: registered blocks can be read and validated without compiling against a specific Create release.

## Connect

Open a Java world with the matching bridge installed. In the local designer choose **Files → Connect Java game**, select `config/craftstudio-token.txt`, and connect. Tokens stay in the current dialog session and are not stored in project/library backups. Choose a dimension and site origin; read a region or build the design changes. Changes retain their offset relative to the site origin, including cropped exports.

Single-player writes require creative mode. Dedicated-server reads work; writes require the operator to set `allowDedicatedServer: true` in `config/craftstudio-bridge.json`. The same config selects the local port (default 18766). The designer's Python service proxies requests; the mod rejects browser-origin requests and binds only to loopback. Remote-server forwarding requires an independently configured authenticated transport, not a public mod endpoint.

## Compatibility behavior

File-based NBT, Sponge, Litematica and palette-based Anvil import remain independent of a running game or loader. Numeric-ID Anvil worlds from 1.12 and earlier require upgrading a copy in Minecraft; they are explicitly rejected rather than loaded as an empty region.

Different DataVersions can build ordinary block states when all IDs, properties and values exist in the target registry. No unknown state is silently replaced. This is state validation, not Minecraft DataFixer conversion. Cross-version block-entity NBT is rejected. Native entities and Create association data use native schematic placement; typed NBT is preserved by file import/export, but the bridge does not reconstruct arbitrary native assemblies.

Inclined modeling and resource packs belong to the designer, independently of the bridge profile. Create visual adapters remain limited to implemented models/assemblies; loader compatibility does not imply universal animation support.

## Protocol

All routes use authenticated POSTs: `/health`, `/read`, `/validate`, `/apply`, `/job`, `/cancel`, `/undo`. Health returns Minecraft version, DataVersion, loader, dimensions, write availability and capabilities. Cancellation requires the active job ID, keeps its already placed prefix, and retains a snapshot for conflict-checked undo. Undo checks block states and block-entity data against the post-build snapshot before restoring.

Builds never run automatically when connecting. Native entity placement, unloaded chunks, world bounds and state errors are reported before game writes. A JSON backup is written under `craftstudio-backups` before applying a job.

Build references: [Fabric mappings](https://wiki.fabricmc.net/tutorial:mappings), [Fabric Loom](https://docs.fabricmc.net/develop/loom/), [ForgeGradle](https://docs.minecraftforge.net/en/fg-6.x/configuration/).

Health optionally includes `activeJob` and `lastJob` summaries with `id`, `status`, `placed`, `total` and `restoring`. This supports UI reconnection within the same running game session. Task states `queued` and `building` remain busy; terminal tasks cannot be cancelled. Legacy health responses without task summaries remain supported.
