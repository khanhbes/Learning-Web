$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fixtureRoot=Join-Path (Join-Path $projectRoot 'output') ('public-stop-fixture-'+[guid]::NewGuid().ToString('N'))
if(-not $fixtureRoot.StartsWith((Join-Path $projectRoot 'output'),[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid fixture path.'}
$fixtureScripts=Join-Path $fixtureRoot 'scripts'
$fixturePrivate=Join-Path $fixtureRoot '.data/public'
New-Item -ItemType Directory -Force -Path $fixtureScripts,$fixturePrivate | Out-Null
foreach($name in @('stop-public.ps1','public-processes.ps1')){Copy-Item -LiteralPath (Join-Path $projectRoot ('scripts/'+$name)) -Destination (Join-Path $fixtureScripts $name)}
'setInterval(() => {},1000);' | Set-Content -LiteralPath (Join-Path $fixtureScripts 'tunnel-server.mjs') -Encoding UTF8
@{enabled=$true;recoveryEnabled=$true} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixturePrivate 'desired.json') -Encoding UTF8
@'
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$private=Join-Path $root '.data/public'
$lease=[IO.File]::Open((Join-Path $private 'start.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
try{
    $parent=Get-Process -Id $PID
    @{pid=$PID;started=$parent.StartTime.ToUniversalTime().ToString('o');script=$PSCommandPath} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $private 'recovery-process.json') -Encoding UTF8
    $server=Join-Path $root 'scripts/tunnel-server.mjs'
    $child=Start-Process -FilePath (Get-Command node).Source -ArgumentList ('"'+$server+'"') -WorkingDirectory $root -WindowStyle Hidden -PassThru
    @{pid=$child.Id;started=$child.StartTime.ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $private 'spawn-window.json') -Encoding UTF8
    Start-Sleep -Milliseconds 1500
    @{tunnel=$null;server=@{pid=$child.Id;started=$child.StartTime.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $private 'processes.json') -Encoding UTF8
}finally{$lease.Dispose()}
Start-Sleep -Seconds 10
'@ | Set-Content -LiteralPath (Join-Path $fixtureScripts 'start-public.ps1') -Encoding UTF8
$fixtureParent=$null
try{
    $fixtureParent=Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+(Join-Path $fixtureScripts 'start-public.ps1')+'"')) -WorkingDirectory $fixtureRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $fixtureRoot 'startup.log') -RedirectStandardError (Join-Path $fixtureRoot 'startup-error.log') -PassThru
    $deadline=[DateTime]::UtcNow.AddSeconds(15)
    while(-not(Test-Path -LiteralPath (Join-Path $fixturePrivate 'spawn-window.json'))){
        if($fixtureParent.HasExited -or [DateTime]::UtcNow -ge $deadline){throw 'Fixture startup did not reach spawn window.'}
        Start-Sleep -Milliseconds 50
    }
    $spawned=Get-Content -Raw -LiteralPath (Join-Path $fixturePrivate 'spawn-window.json') | ConvertFrom-Json
    & (Join-Path $fixtureScripts 'stop-public.ps1') | Out-Null
    $desired=Get-Content -Raw -LiteralPath (Join-Path $fixturePrivate 'desired.json') | ConvertFrom-Json
    if($desired.enabled -ne $false -or $desired.recoveryEnabled -ne $true){throw 'Stop did not retain the disabled marker and recovery preference.'}
    if(Get-Process -Id $spawned.pid -ErrorAction SilentlyContinue){throw 'Spawned fixture server survived Stop.'}
    # A second Stop remains safe when all owned processes have already exited.
    & (Join-Path $fixtureScripts 'stop-public.ps1') | Out-Null
    'Stop during spawn/record race: passed; no orphan process and no resurrection.'
}finally{
    . (Join-Path $projectRoot 'scripts/public-processes.ps1')
    $windowPath=Join-Path $fixturePrivate 'spawn-window.json'
    if(Test-Path -LiteralPath $windowPath){Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess (Get-Content -Raw -LiteralPath $windowPath | ConvertFrom-Json) (Join-Path $fixtureScripts 'tunnel-server.mjs') 'node')}
    Stop-VerifiedPublicProcess $fixtureParent
}
