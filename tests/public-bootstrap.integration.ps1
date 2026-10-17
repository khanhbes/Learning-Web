$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fixtureRoot=Join-Path (Join-Path $projectRoot 'output') ('public-bootstrap-fixture-'+[guid]::NewGuid().ToString('N'))
if(-not $fixtureRoot.StartsWith((Join-Path $projectRoot 'output'),[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid fixture path.'}
$fixtureScripts=Join-Path $fixtureRoot 'scripts'
$fixturePrivate=Join-Path $fixtureRoot '.data/public'
New-Item -ItemType Directory -Force -Path $fixtureScripts,$fixturePrivate | Out-Null
foreach($name in @('public-bootstrap.ps1','public-processes.ps1','public-watchdog.ps1')){Copy-Item -LiteralPath (Join-Path $projectRoot ('scripts/'+$name)) -Destination (Join-Path $fixtureScripts $name)}
'setInterval(() => {}, 1000);' | Set-Content -LiteralPath (Join-Path $fixtureScripts 'public-watchdog.mjs') -Encoding UTF8
'setInterval(() => {}, 1000);' | Set-Content -LiteralPath (Join-Path $fixtureScripts 'unrelated.mjs') -Encoding UTF8
# This fixture never starts an app or a tunnel, even if the live service is down.
@'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
'fixture-only' | Set-Content -LiteralPath (Join-Path $root '.data/public/startup-invoked.txt')
'@ | Set-Content -LiteralPath (Join-Path $fixtureScripts 'start-public.ps1') -Encoding UTF8
. (Join-Path $projectRoot 'scripts/public-processes.ps1')
$desiredPath=Join-Path $fixturePrivate 'desired.json'
$recordPath=Join-Path $fixturePrivate 'watchdog-process.json'
$unrelated=$null
try{
    foreach($flags in @(@{enabled=$false;recoveryEnabled=$true},@{enabled=$true;recoveryEnabled=$false})){
        $flags | ConvertTo-Json | Set-Content -LiteralPath $desiredPath -Encoding UTF8
        & powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $fixtureScripts 'public-bootstrap.ps1')
        if($LASTEXITCODE -ne 0 -or (Test-Path -LiteralPath $recordPath) -or (Test-Path -LiteralPath (Join-Path $fixturePrivate 'startup-invoked.txt'))){throw 'Disabled sharing or disabled recovery was restarted.'}
    }
    @{enabled=$true;recoveryEnabled=$true} | ConvertTo-Json | Set-Content -LiteralPath $desiredPath -Encoding UTF8
    & powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $fixtureScripts 'public-bootstrap.ps1')
    $first=Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    if(-not(Get-VerifiedPublicProcess $first (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node')){throw 'Missing verified fixture monitor.'}
    & powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $fixtureScripts 'public-bootstrap.ps1')
    $second=Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    if($first.pid -ne $second.pid -or $first.started -ne $second.started){throw 'Repeated bootstrap created another monitor.'}
    Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $second (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node')
    $unrelated=Start-Process -FilePath (Get-Command node).Source -ArgumentList ('"'+(Join-Path $fixtureScripts 'unrelated.mjs')+'"') -WorkingDirectory $fixtureRoot -WindowStyle Hidden -PassThru
    $unrelatedRecord=@{pid=$unrelated.Id;started=$unrelated.StartTime.ToUniversalTime().ToString('o')}
    $unrelatedRecord | ConvertTo-Json | Set-Content -LiteralPath $recordPath -Encoding UTF8
    & powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $fixtureScripts 'public-bootstrap.ps1')
    $repaired=Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    if($repaired.pid -eq $unrelated.Id -or $unrelated.HasExited -or -not(Get-VerifiedPublicProcess $repaired (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node')){throw 'Stale monitor record did not preserve the unrelated process.'}
    # Stop remains a persistent opt-out, including subsequent timer/logon requests.
    Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $repaired (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node')
    @{enabled=$false;recoveryEnabled=$true} | ConvertTo-Json | Set-Content -LiteralPath $desiredPath -Encoding UTF8
    & powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File (Join-Path $fixtureScripts 'public-bootstrap.ps1')
    if(Get-VerifiedPublicProcess $repaired (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node'){throw 'Explicit Stop was undone.'}
    'Bootstrap integration passed: disabled flags, one monitor, stale PID safety and explicit Stop; real website unchanged.'
}finally{
    if(Test-Path -LiteralPath $recordPath){Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess (Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json) (Join-Path $fixtureScripts 'public-watchdog.mjs') 'node')}
    if($unrelated){Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $unrelatedRecord (Join-Path $fixtureScripts 'unrelated.mjs') 'node')}
}
