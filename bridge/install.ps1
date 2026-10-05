param([Parameter(Mandatory=$true)][string]$ModsDirectory,[ValidateSet('neoforge-1.21.1','forge-1.20.1','fabric-1.20.1','fabric-1.21.1')][string]$Profile='neoforge-1.21.1')
$ErrorActionPreference='Stop'
$taskProfiles=Get-Content (Join-Path $PSScriptRoot 'profiles.json') -Raw | ConvertFrom-Json
$taskLibs=Join-Path (Join-Path $PSScriptRoot $taskProfiles.profiles.$Profile.directory) 'build/libs'
$taskSources=@(Get-ChildItem -LiteralPath $taskLibs -Filter '*.jar' | Where-Object {$_.Name -notmatch 'sources|dev|javadoc'})
if($taskSources.Count -ne 1 -or !(Test-Path -LiteralPath $ModsDirectory -PathType Container)){throw 'Build the selected profile and check the mods directory.'}
$taskResolvedMods=(Resolve-Path -LiteralPath $ModsDirectory).Path
$taskParent=Split-Path -Parent $taskResolvedMods
$taskBackups=Join-Path $taskParent 'craftstudio-bridge-backups'
$taskTarget=Join-Path $taskResolvedMods $taskSources[0].Name
foreach($taskOld in Get-ChildItem -LiteralPath $taskResolvedMods -Filter 'craftstudio-bridge*.jar'){
    if(!$taskOld.FullName.StartsWith($taskResolvedMods+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected bridge path.'}
    if(!(Test-Path -LiteralPath $taskBackups)){New-Item -ItemType Directory -Path $taskBackups | Out-Null}
    $taskBackup=Join-Path $taskBackups ($taskOld.Name+'.'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.backup')
    Move-Item -LiteralPath $taskOld.FullName -Destination $taskBackup
}
Copy-Item -LiteralPath $taskSources[0].FullName -Destination $taskTarget
