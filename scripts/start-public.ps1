param([switch]$Qa, [switch]$Fresh, [switch]$UseExistingProgress, [switch]$Recovery, [switch]$EnableRecovery)
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot
. (Join-Path $PSScriptRoot 'public-processes.ps1')
. (Join-Path $PSScriptRoot 'public-watchdog.ps1')
$cloudCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudCommand) { throw 'Install cloudflared first: https://developers.cloudflare.com/tunnel/downloads/' }
if (-not (Test-Path -LiteralPath 'dist/index.html')) { throw 'Run npm run build before opening the public site.' }
& node --input-type=module -e "import {wasmHealth} from './server/wasm-runner.mjs'; if (!(await wasmHealth()).available) process.exit(1);"
if ($LASTEXITCODE -ne 0) { throw 'Run npm run runner:setup before opening the public site.' }
$privateRoot = Join-Path $projectRoot '.data/public'
New-Item -ItemType Directory -Force -Path $privateRoot | Out-Null
$recordPath = Join-Path $privateRoot 'processes.json'
$statePath = Join-Path $privateRoot 'state.json'
$accessPath = Join-Path $privateRoot 'access.txt'
$desiredPath = Join-Path $privateRoot 'desired.json'
function Assert-PublicStartAllowed {
    if(-not(Test-Path -LiteralPath $desiredPath) -or -not(Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).enabled){throw 'Public startup was cancelled.'}
    if($Recovery -and -not(Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).recoveryEnabled){throw 'Automatic recovery has not been enabled.'}
}
$lease = [IO.File]::Open((Join-Path $privateRoot 'start.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
try {
if($Recovery){Assert-PublicStartAllowed}else{
    $previousDesired=if(Test-Path -LiteralPath $desiredPath){Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json}else{$null}
    @{enabled=$true;recoveryEnabled=($EnableRecovery.IsPresent -or ($previousDesired -and $previousDesired.recoveryEnabled -eq $true))} | ConvertTo-Json | Set-Content -LiteralPath $desiredPath -Encoding UTF8
}
$serverPath = Join-Path $projectRoot 'scripts/tunnel-server.mjs'
$record = if (Test-Path -LiteralPath $recordPath) { Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json } else { $null }
$state = if (Test-Path -LiteralPath $statePath) { Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json } else { $null }
if (([int]$Qa.IsPresent + [int]$Fresh.IsPresent + [int]$UseExistingProgress.IsPresent) -gt 1) { throw 'Choose exactly one database mode.' }
$database = if ($Qa) { '.data/public/tunnel-qa.sqlite' } elseif ($UseExistingProgress) { '.data/bytepath.sqlite' } elseif ($Fresh) { '.data/public/online.sqlite' } elseif ($Recovery -and $state -and $state.db -eq '.data/public/tunnel-qa.sqlite') { $state.db } elseif ($state -and $state.db -in @('.data/bytepath.sqlite', '.data/public/online.sqlite')) { $state.db } else { '.data/public/online.sqlite' }
$tunnelProcess = Get-VerifiedPublicProcess $record.tunnel $cloudCommand.Source 'cloudflared'
$publicAppProcess = Get-VerifiedPublicProcess $record.server $serverPath 'node'
function Assert-PublicGradingIdle {
    if(-not $Recovery){return}
    $currentRecord=if(Test-Path -LiteralPath $recordPath){Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json}else{$null}
    $recordedServer=if($currentRecord.server.pid){Get-Process -Id $currentRecord.server.pid -ErrorAction SilentlyContinue}else{$null}
    $currentListeners=Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
    # Jobs from a crashed server cannot finish; only bypass active jobs when no recorded PID or listener exists.
    $mayBeRunning=([bool]($recordedServer -or $currentListeners)).ToString().ToLowerInvariant()
    & node --input-type=module -e "import {readPublicJobState} from './scripts/public-watchdog.mjs'; const state=readPublicJobState(process.argv[1]); if(state==='unknown'||(state==='active'&&process.argv[2]==='true'))process.exit(3);" $database $mayBeRunning
    if($LASTEXITCODE -ne 0){throw 'Recovery deferred while grading is active or cannot be checked.'}
}
Assert-PublicGradingIdle
$listeners = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($listeners -and -not $publicAppProcess) { throw 'Port 3002 belongs to another process. It was not exposed or stopped.' }
if ($tunnelProcess -and $publicAppProcess -and $state.db -eq $database) {
    try { $existing = Invoke-RestMethod -Uri 'http://127.0.0.1:3002/api/health' -TimeoutSec 2 } catch { $existing = $null }
    if ($existing -and $existing.mode -eq 'cloud') {
        try { $upstreamReady = Invoke-RestMethod -Uri ($state.origin + '/api/health') -TimeoutSec 5 } catch { $upstreamReady = $null }
        if ($upstreamReady -and $upstreamReady.mode -eq 'cloud') {
            if ($state.publicOrigin -and (Test-Path -LiteralPath (Join-Path $privateRoot 'worker.json'))) {
                Assert-PublicStartAllowed
                & node (Join-Path $PSScriptRoot 'update-public-alias.mjs')
                if ($LASTEXITCODE -ne 0) { Write-Warning ('Could not update the short address. Use the tunnel fallback URL: ' + $state.origin) }
            }
            Write-Host ('Public BytePath: ' + $(if ($state.publicOrigin) { $state.publicOrigin } else { $state.origin }))
            Write-Host ('Login password is in ' + $accessPath)
            Assert-PublicStartAllowed
            if((Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).recoveryEnabled){Start-PublicWatchdog $projectRoot}
            exit 0
        }
        Write-Host 'The old tunnel no longer responds. Reconnecting with the existing password and database.'
        Assert-PublicStartAllowed
        Assert-PublicGradingIdle
        Stop-VerifiedPublicProcess $tunnelProcess
        $tunnelProcess = $null
    }
}
Assert-PublicStartAllowed
Assert-PublicGradingIdle
Stop-VerifiedPublicProcess $publicAppProcess
try {
    if (-not $tunnelProcess) {
        $stamp = [DateTime]::UtcNow.Ticks
        $tunnelOut = Join-Path $privateRoot ('cloudflared-' + $stamp + '.log')
        $tunnelError = Join-Path $privateRoot ('cloudflared-' + $stamp + '-error.log')
        Assert-PublicStartAllowed
        $tunnelProcess = Start-Process -FilePath $cloudCommand.Source -ArgumentList @('tunnel', '--no-autoupdate', '--url', 'http://127.0.0.1:3002', '--protocol', 'http2') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $tunnelOut -RedirectStandardError $tunnelError -PassThru
        $tunnelRecord = @{pid=$tunnelProcess.Id;started=$tunnelProcess.StartTime.ToUniversalTime().ToString('o')}
        @{tunnel=$tunnelRecord;server=$null} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $recordPath -Encoding utf8
        $publicOrigin = $null
        for ($attempt = 0; $attempt -lt 60; $attempt++) {
            Assert-PublicStartAllowed
            $logText = ''
            foreach ($logPath in @($tunnelOut, $tunnelError)) { if (Test-Path -LiteralPath $logPath) { $logText += Get-Content -Raw -LiteralPath $logPath } }
            $match = [regex]::Match($logText, 'https://[a-z0-9-]+\.trycloudflare\.com')
            if ($match.Success) { $publicOrigin = $match.Value; break }
            if ($tunnelProcess.HasExited) { throw ('Cloudflare could not start. See ' + $tunnelError) }
            Start-Sleep -Milliseconds 500
        }
        if (-not $publicOrigin) { throw ('Cloudflare has not supplied a URL. See ' + $tunnelError) }
    } else {
        $publicOrigin = $state.origin
        $tunnelRecord = $record.tunnel
    }
    if ($publicOrigin -notmatch '^https://[a-z0-9-]+\.trycloudflare\.com$') { throw 'Invalid tunnel URL; no application was exposed.' }
    $loginPassword = if ($state -and $state.password.Length -ge 8) { $state.password } else {
        $passwordBytes = New-Object byte[] 24
        $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $generator.GetBytes($passwordBytes)
        $generator.Dispose()
        [Convert]::ToBase64String($passwordBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    }
    $nextState = @{origin=$publicOrigin;password=$loginPassword;db=$database}
    if ($state.publicOrigin) { $nextState.publicOrigin = $state.publicOrigin }
    Assert-PublicStartAllowed
    $nextState | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding utf8
    $displayOrigin = if ($nextState.publicOrigin) { $nextState.publicOrigin } else { $publicOrigin }
    @(('BytePath public URL: ' + $displayOrigin), ('Tunnel fallback URL: ' + $publicOrigin), '', ('Login password: ' + $loginPassword), '', 'Keep this file private. Run Stop Public BytePath.cmd to take the site offline.') | Set-Content -LiteralPath $accessPath -Encoding utf8
    if ($database -eq '.data/bytepath.sqlite') { & (Join-Path $PSScriptRoot 'stop.ps1') }
    Assert-PublicStartAllowed
    $publicAppProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('"' + $serverPath + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $privateRoot 'server.log') -RedirectStandardError (Join-Path $privateRoot 'server-error.log') -PassThru
    @{tunnel=$tunnelRecord;server=@{pid=$publicAppProcess.Id;started=$publicAppProcess.StartTime.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $recordPath -Encoding utf8
    $ready = $null
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Assert-PublicStartAllowed
        try { $ready = Invoke-RestMethod -Uri 'http://127.0.0.1:3002/api/health' -TimeoutSec 2 } catch { $ready = $null }
        if ($ready -and $ready.mode -eq 'cloud' -and $ready.runner.available) { break }
        if ($publicAppProcess.HasExited) { throw ('Public BytePath could not start. See ' + (Join-Path $privateRoot 'server-error.log')) }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready -or $ready.mode -ne 'cloud' -or -not $ready.runner.available) { throw 'Public BytePath did not become ready.' }
    if ($nextState.publicOrigin -and (Test-Path -LiteralPath (Join-Path $privateRoot 'worker.json'))) {
        Assert-PublicStartAllowed
        & node (Join-Path $PSScriptRoot 'update-public-alias.mjs')
        if ($LASTEXITCODE -ne 0) {
            Write-Warning ('Could not update the short address. Use the tunnel fallback URL: ' + $publicOrigin)
            Write-Warning 'Run node scripts/update-public-alias.mjs after signing in with npx wrangler login.'
        }
    }
    Write-Host ('Public BytePath: ' + $displayOrigin)
    Write-Host ('Login password is in ' + $accessPath)
    Write-Host 'Keep this computer awake and connected. The tunnel fallback URL changes after stopping and starting.'
    Assert-PublicStartAllowed
    if((Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).recoveryEnabled){Start-PublicWatchdog $projectRoot}
} catch {
    if($Recovery){
        Stop-VerifiedPublicProcess $publicAppProcess
        Stop-VerifiedPublicProcess $tunnelProcess
    }else{
        $lease.Dispose()
        $lease=$null
        & (Join-Path $PSScriptRoot 'stop-public.ps1')
    }
    throw
}
} finally { if($lease){$lease.Dispose()} }
