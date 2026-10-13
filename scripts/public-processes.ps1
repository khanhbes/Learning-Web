function Get-VerifiedPublicProcess {
    param($Record, [string]$ExpectedPath, [string]$ExpectedName)
    if (-not $Record -or -not $Record.pid) { return $null }
    $candidate = Get-Process -Id $Record.pid -ErrorAction SilentlyContinue
    if (-not $candidate) { return $null }
    $recordStarted = if ($Record.started -is [DateTime]) { $Record.started.ToUniversalTime() } else { [DateTime]::Parse($Record.started, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::RoundtripKind).ToUniversalTime() }
    $sameStart = [Math]::Abs(($candidate.StartTime.ToUniversalTime() - $recordStarted).TotalSeconds) -lt 2
    $detail = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $Record.pid)
    $expectedCommandPath = [System.IO.Path]::GetFullPath($ExpectedPath).Replace('/', '\').ToLowerInvariant()
    if ($sameStart -and $candidate.ProcessName -eq $ExpectedName -and $detail -and $detail.CommandLine -and $detail.CommandLine.Replace('/', '\').ToLowerInvariant().Contains($expectedCommandPath)) { return $candidate }
    Write-Host 'A recorded PID no longer matches BytePath; the unrelated process was left running.'
    return $null
}
function Stop-VerifiedPublicProcess {
    param($Process)
    if ($Process) {
        $Process.Kill()
        if (-not $Process.WaitForExit(5000)) { throw 'BytePath process has not stopped yet.' }
    }
}
