param([ValidateSet('Auto','Browser','Local')][string]$Computation='Auto')
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
if ($Computation -eq 'Local') { $env:CRAFTSTUDIO_ENGINE='1' }
if ($Computation -eq 'Browser') { $env:CRAFTSTUDIO_ENGINE='0' }
$taskWantedMode = if ($env:CRAFTSTUDIO_ENGINE -eq '1') {'local'} else {'browser'}
$taskStream = New-Object IO.MemoryStream
foreach ($taskName in @('server.py','assets.py','designer_storage.py','desktop_files.py','chunk_storage.py','chunk_export.py','draft_storage.py','engine_gateway.py','local-engine/run-service.mjs','local-engine/service.mjs','local-engine/controller.mjs','local-engine/workspace.mjs','local-engine/worker.mjs','local-engine/checkpoint.mjs','local-engine/lazy-baseline.mjs','local-engine/store.mjs','local-engine/uploads.mjs','lite/src/engine-wire.js','lite/dist/worker.bundle.js')) {
    $taskBytes = [IO.File]::ReadAllBytes((Join-Path $taskRoot $taskName))
    $taskStream.Write($taskBytes,0,$taskBytes.Length)
}
$taskHasher = [Security.Cryptography.SHA256]::Create()
$taskBuild = [BitConverter]::ToString($taskHasher.ComputeHash($taskStream.ToArray())).Replace('-','')
$taskStream.Dispose(); $taskHasher.Dispose()
$taskPort = 18767
$taskUrl = "http://127.0.0.1:$taskPort"
$taskReady = $false
try { $taskInfo = Invoke-RestMethod "$taskUrl/api/desktop/info" -TimeoutSec 2; $taskReady = $taskInfo.protocol -eq 'craftstudio-desktop/1' -and $taskInfo.backendBuild -eq $taskBuild -and $taskInfo.requestedEngine -eq $taskWantedMode } catch {}
if (!$taskReady) {
    $taskListener = Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($taskListener) {
        $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskListener.OwningProcess)"
        $taskScript = Join-Path $taskRoot 'server.py'
        if (!$taskInfo -or $taskInfo.protocol -ne 'craftstudio-desktop/1' -or !$taskInfo.sourceRoot -or [IO.Path]::GetFullPath($taskInfo.sourceRoot).TrimEnd('\') -ne [IO.Path]::GetFullPath($taskRoot).TrimEnd('\') -or $taskProcess.CommandLine -notmatch 'server\.py') { throw "端口 $taskPort 被其他程序占用" }
    if ($taskInfo -and $taskInfo.protocol -eq 'craftstudio-desktop/1' -and $taskInfo.requestedEngine -ne $taskWantedMode) {
        Write-Host '切换计算模式会重启当前服务。请先在页面保存正式工程；切换后从工程库打开该版本。'
        $taskAnswer = Read-Host '保存后输入 YES 继续；直接回车保留当前模式'
        if ($taskAnswer -ne 'YES') { Start-Process $taskUrl; return }
    }
        $taskEngineScript = Join-Path $taskRoot 'local-engine\run-service.mjs'
        foreach ($taskChild in @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $($taskListener.OwningProcess)")) {
            if ($taskChild.Name -match '^node(?:\.exe)?$' -and $taskChild.CommandLine -and $taskChild.CommandLine.Replace('/','\').IndexOf($taskEngineScript,[StringComparison]::OrdinalIgnoreCase) -ge 0) { Stop-Process -Id ([int]$taskChild.ProcessId) -Force -ErrorAction Stop }
        }
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
if ($taskWantedMode -eq 'local' -and $taskInfo.capabilities -notcontains 'local-engine/1') { Write-Warning '本地计算未能启用，已使用浏览器计算。请检查现有 Node 22.13+ 和 lite 依赖；不会自动安装。' }
Start-Process $taskUrl
