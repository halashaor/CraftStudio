$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskPython = $env:CRAFTSTUDIO_PYTHON
if (!$taskPython) { $taskPython = (Get-Command python -ErrorAction Stop).Source }
$taskPort = 18767
$taskUrl = "http://127.0.0.1:$taskPort"
$taskReady = $false
try { $taskInfo = Invoke-RestMethod "$taskUrl/api/desktop/info" -TimeoutSec 2; $taskReady = $taskInfo.protocol -eq 'craftstudio-desktop/1' } catch {}
if (!$taskReady) {
    $taskListener = Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue
    if ($taskListener) { throw "端口 $taskPort 已被其他程序占用，请关闭占用程序后重试" }
    Start-Process -FilePath $taskPython -ArgumentList @('-u',(Join-Path $taskRoot 'server.py'),'--port',"$taskPort") -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'server.log') -RedirectStandardError (Join-Path $taskRoot 'server-error.log')
    for ($taskAttempt=0; $taskAttempt -lt 40; $taskAttempt++) {
        Start-Sleep -Milliseconds 250
        try { $taskInfo=Invoke-RestMethod "$taskUrl/api/desktop/info" -TimeoutSec 2; if ($taskInfo.protocol -eq 'craftstudio-desktop/1') {$taskReady=$true;break} } catch {}
    }
    if (!$taskReady) {throw '本地服务未能启动，请查看 server-error.log'}
}
Start-Process $taskUrl
