param([ValidateSet('neoforge-1.21.1','forge-1.20.1','fabric-1.20.1','fabric-1.21.1')][string]$Profile='neoforge-1.21.1')
$ErrorActionPreference='Stop'
$taskProfiles=Get-Content (Join-Path $PSScriptRoot 'profiles.json') -Raw | ConvertFrom-Json
$taskConfiguration=$taskProfiles.profiles.$Profile
$taskDirectory=Join-Path $PSScriptRoot $taskConfiguration.directory
& gradle -p $taskDirectory build --console=plain
if($LASTEXITCODE -ne 0){throw "Bridge build failed: $Profile"}
