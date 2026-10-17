$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$privateRoot=Join-Path $projectRoot '.data/public'
$desiredPath=Join-Path $privateRoot 'desired.json'
# A login or timer must never undo an explicit Stop, enable sharing, or select a DB.
if(-not(Test-Path -LiteralPath $desiredPath)){return}
$desired=Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json
if($desired.enabled -ne $true -or $desired.recoveryEnabled -ne $true){return}
. (Join-Path $PSScriptRoot 'public-processes.ps1')
. (Join-Path $PSScriptRoot 'public-watchdog.ps1')
$recordPath=Join-Path $privateRoot 'watchdog-process.json'
$record=if(Test-Path -LiteralPath $recordPath){Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json}else{$null}
if(Get-VerifiedPublicProcess $record (Join-Path $PSScriptRoot 'public-watchdog.mjs') 'node'){return}
Start-PublicWatchdog $projectRoot
# With a live backend the monitor checks the tunnel/alias; no startup churn.
try{
    $health=Invoke-RestMethod -Uri 'http://127.0.0.1:3002/api/health' -TimeoutSec 2
    if($health.mode -eq 'cloud'){return}
}catch{}
# At login, start immediately. If Internet is not ready the live monitor retries.
& powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start-public.ps1') -Recovery *> (Join-Path $privateRoot 'bootstrap-last.log')
if($LASTEXITCODE -ne 0){Write-Warning 'Public startup deferred; the connection monitor will retry when possible.'}
