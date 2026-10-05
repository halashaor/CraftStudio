$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try { & gradle build --console=plain; if ($LASTEXITCODE -ne 0) { throw 'Bridge build failed.' } } finally { Pop-Location }
