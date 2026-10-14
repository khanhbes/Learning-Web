$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'public-processes.ps1')
$privateRoot = Join-Path $projectRoot '.data/public'
$lease=$null
if(Test-Path -LiteralPath $privateRoot){
    $desiredPath=Join-Path $privateRoot 'desired.json'
    $previousDesired=if(Test-Path -LiteralPath $desiredPath){Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json}else{$null}
    @{enabled=$false;recoveryEnabled=($previousDesired -and $previousDesired.recoveryEnabled -eq $true)} | ConvertTo-Json | Set-Content -LiteralPath $desiredPath -Encoding UTF8
    $watchPath=Join-Path $privateRoot 'watchdog-process.json'
    if(Test-Path -LiteralPath $watchPath){
        $watch=Get-Content -Raw -LiteralPath $watchPath | ConvertFrom-Json
        Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $watch (Join-Path $projectRoot 'scripts/public-watchdog.mjs') 'node')
    }
    # Let an in-progress startup record its children and observe cancellation before cleaning up.
    $deadline=[DateTime]::UtcNow.AddSeconds(60)
    while(-not $lease){
        try{$lease=[IO.File]::Open((Join-Path $privateRoot 'start.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)}
        catch [IO.IOException]{
            if([DateTime]::UtcNow -ge $deadline){throw 'Public startup is still finishing. Recovery is disabled; run Stop Public BytePath again shortly.'}
            Start-Sleep -Milliseconds 100
        }
    }
}
try {
if(Test-Path -LiteralPath $privateRoot){
    $recoveryPath=Join-Path $privateRoot 'recovery-process.json'
    if(Test-Path -LiteralPath $recoveryPath){
        $recovery=Get-Content -Raw -LiteralPath $recoveryPath | ConvertFrom-Json
        $expected=if($recovery.script -eq (Join-Path $projectRoot 'scripts/repair-public-alias.ps1')){Join-Path $projectRoot 'scripts/repair-public-alias.ps1'}else{Join-Path $projectRoot 'scripts/start-public.ps1'}
        Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $recovery $expected 'powershell')
    }
}
$recordPath = Join-Path $projectRoot '.data/public/processes.json'
if (Test-Path -LiteralPath $recordPath) {
    $record = Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    $cloudCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cloudCommand) { Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $record.tunnel $cloudCommand.Source 'cloudflared') }
    Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $record.server (Join-Path $projectRoot 'scripts/tunnel-server.mjs') 'node')
}
Write-Host 'Public BytePath stopped. The public URL is offline; progress and credentials are kept.'
} finally {if($lease){$lease.Dispose()}}
