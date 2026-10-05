param([Parameter(Mandatory=$true)][string]$ModsDirectory)
$ErrorActionPreference = 'Stop'
$taskSource = Join-Path $PSScriptRoot 'build/libs/craftstudio-bridge-0.1.0.jar'
if (!(Test-Path -LiteralPath $taskSource) -or !(Test-Path -LiteralPath $ModsDirectory)) { throw 'Check build output and the selected mods directory.' }
$taskTarget = Join-Path $ModsDirectory 'craftstudio-bridge-0.1.0.jar'
if (Test-Path -LiteralPath $taskTarget) { Copy-Item -LiteralPath $taskTarget -Destination ($taskTarget + '.backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
Copy-Item -LiteralPath $taskSource -Destination $taskTarget
