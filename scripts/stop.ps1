$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$recordPath = Join-Path $projectRoot '.data/server-process.json'
if (Test-Path -LiteralPath $recordPath) {
    $record = Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    $appProcess = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($appProcess) {
        $command = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $record.pid)
        $sameStart = [Math]::Abs(($appProcess.StartTime.ToUniversalTime() - [DateTime]::Parse($record.started).ToUniversalTime()).TotalSeconds) -lt 2
        if ($sameStart -and $command -and $command.CommandLine -and $command.CommandLine.Contains($record.server)) {
            $appProcess.Kill()
            if (-not $appProcess.WaitForExit(5000)) { throw 'BytePath has not stopped yet. Try again.' }
        }
        else { Write-Host 'Recorded process no longer matches BytePath; it was left running.'; exit 1 }
    }
}
Write-Host 'BytePath stopped. Your progress and code runtimes were kept.'
