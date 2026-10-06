$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskStream = New-Object IO.MemoryStream
foreach ($taskName in @('server.py','assets.py','designer_storage.py','desktop_files.py','chunk_storage.py','chunk_export.py')) {
    $taskBytes = [IO.File]::ReadAllBytes((Join-Path $taskRoot $taskName))
    $taskStream.Write($taskBytes,0,$taskBytes.Length)
}
$taskHasher = [Security.Cryptography.SHA256]::Create()
$taskBuild = [BitConverter]::ToString($taskHasher.ComputeHash($taskStream.ToArray())).Replace('-','')
$taskStream.Dispose(); $taskHasher.Dispose()
$taskPort = 18767
$taskUrl = "http://127.0.0.1:$taskPort"
$taskReady = $false
try { $taskInfo = Invoke-RestMethod "$taskUrl/api/desktop/info" -TimeoutSec 2; $taskReady = $taskInfo.protocol -eq 'craftstudio-desktop/1' -and $taskInfo.backendBuild -eq $taskBuild } catch {}
if (!$taskReady) {
    $taskListener = Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($taskListener) {
        $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskListener.OwningProcess)"
        $taskScript = Join-Path $taskRoot 'server.py'
        if (!$taskInfo -or $taskInfo.protocol -ne 'craftstudio-desktop/1' -or $taskProcess.CommandLine.Replace('/','\').IndexOf($taskScript,[StringComparison]::OrdinalIgnoreCase) -lt 0) { throw "端口 $taskPort 被其他程序占用" }
        Stop-Process -Id ([int]$taskListener.OwningProcess) -Force -ErrorAction Stop
    }
    $taskPython = $env:CRAFTSTUDIO_PYTHON
    if (!$taskPython) {
        $taskConda = Join-Path $env:ProgramData 'anaconda3/python.exe'
        if (Test-Path -LiteralPath $taskConda) { $taskPython = $taskConda } else { $taskPython = (Get-Command python -ErrorAction Stop).Source }
    }
    $taskScript = '"' + (Join-Path $taskRoot 'server.py') + '"'
    Start-Process -FilePath $taskPython -ArgumentList @('-u',$taskScript,'--port',"$taskPort") -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'server.log') -RedirectStandardError (Join-Path $taskRoot 'server-error.log')
    for ($taskAttempt=0; $taskAttempt -lt 40; $taskAttempt++) {
        Start-Sleep -Milliseconds 250
        try { $taskInfo=Invoke-RestMethod "$taskUrl/api/desktop/info" -TimeoutSec 2; if ($taskInfo.backendBuild -eq $taskBuild) {$taskReady=$true;break} } catch {}
    }
    if (!$taskReady) {throw '本地服务未能启动，请查看 server-error.log'}
}
Start-Process $taskUrl
