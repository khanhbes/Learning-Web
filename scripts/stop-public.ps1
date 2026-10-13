$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'public-processes.ps1')
$recordPath = Join-Path $projectRoot '.data/public/processes.json'
if (Test-Path -LiteralPath $recordPath) {
    $record = Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    $cloudCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cloudCommand) { Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $record.tunnel $cloudCommand.Source 'cloudflared') }
    Stop-VerifiedPublicProcess (Get-VerifiedPublicProcess $record.server (Join-Path $projectRoot 'scripts/tunnel-server.mjs') 'node')
}
Write-Host 'Public BytePath stopped. The public URL is offline; progress and credentials are kept.'
