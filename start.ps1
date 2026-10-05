$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskPython = $env:CRAFTSTUDIO_PYTHON
if (!$taskPython) { $taskPython = (Get-Command python -ErrorAction Stop).Source }
$taskRunning = Get-NetTCPConnection -LocalPort 18765 -State Listen -ErrorAction SilentlyContinue
if (!$taskRunning) {
    Start-Process -FilePath $taskPython -ArgumentList @('server.py','--port','18765') -WorkingDirectory $taskRoot -WindowStyle Hidden
}
Start-Process 'http://127.0.0.1:18765/lite.html'
