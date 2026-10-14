param([switch]$Recovery)
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot
$desiredPath=Join-Path $projectRoot '.data/public/desired.json'
if(-not(Test-Path -LiteralPath $desiredPath) -or -not(Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).enabled){exit 0}
if($Recovery -and -not(Get-Content -Raw -LiteralPath $desiredPath | ConvertFrom-Json).recoveryEnabled){exit 0}
& node (Join-Path $PSScriptRoot 'update-public-alias.mjs') --force
exit $LASTEXITCODE
