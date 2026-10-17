function Start-PublicWatchdog {
    param([string]$ProjectRoot)
    $privateRoot=Join-Path $ProjectRoot '.data/public'
    $desiredPath=Join-Path $privateRoot 'desired.json'
    if(-not(Test-Path -LiteralPath $desiredPath)){return}
    $desired=Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json
    if(-not $desired.enabled -or -not $desired.recoveryEnabled){return}
    # Repeated logon/recovery/start requests must create only one monitor.
    try{$monitorLease=[IO.File]::Open((Join-Path $privateRoot 'watchdog-start.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)}catch [IO.IOException]{return}
    try{
    $desired=Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json
    if(-not $desired.enabled -or -not $desired.recoveryEnabled){return}
    $scriptPath=Join-Path $ProjectRoot 'scripts/public-watchdog.mjs'
    $recordPath=Join-Path $privateRoot 'watchdog-process.json'
    $record=if(Test-Path -LiteralPath $recordPath){Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json}else{$null}
    if(Get-VerifiedPublicProcess $record $scriptPath 'node'){return}
    $process=Start-Process -FilePath (Get-Command node).Source -ArgumentList ('"'+$scriptPath+'"') -WorkingDirectory $ProjectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $privateRoot 'watchdog.log') -RedirectStandardError (Join-Path $privateRoot 'watchdog-error.log') -PassThru
    @{pid=$process.Id;started=$process.StartTime.ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $recordPath -Encoding UTF8
    }finally{$monitorLease.Dispose()}
}
