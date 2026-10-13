$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 24 or newer first.' }
$nodeMajor = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 24) { throw 'Install Node.js 24 or newer first.' }
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
# This launcher always serves this computer and uses the local test runner.
$env:BYTEPATH_MODE = 'local'
$env:BYTEPATH_RUNNER = 'wasm'
$env:SERVER_PORT = '3001'
$env:PORT = '3001'
try { $publicHealth = Invoke-RestMethod -Uri 'http://127.0.0.1:3002/api/health' -TimeoutSec 2 } catch { $publicHealth = $null }
if ($publicHealth -and $publicHealth.mode -eq 'cloud' -and (Test-Path -LiteralPath '.data/public/state.json')) {
    $publicState = Get-Content -Raw -LiteralPath '.data/public/state.json' | ConvertFrom-Json
    if ($publicState.db -eq '.data/bytepath.sqlite') { throw 'Public BytePath is using your progress. Run Stop Public BytePath.cmd before starting local BytePath.' }
}
try { $existing = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2 } catch { $existing = $null }
if ($existing -and $existing.version) {
    if ($existing.mode -ne 'local') { throw 'A cloud server is already running on port 3001. Stop it before starting local BytePath.' }
    Write-Host 'BytePath is already running: http://127.0.0.1:3001'
    exit 0
}
if (-not (Test-Path -LiteralPath 'node_modules')) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' } }
& node --input-type=module -e "import { wasmHealth } from './server/wasm-runner.mjs'; if (!(await wasmHealth()).available) process.exit(1);"
if ($LASTEXITCODE -ne 0) { & npm.cmd run runner:setup; if ($LASTEXITCODE -ne 0) { throw 'Runner setup failed. Check your connection and retry.' } }
if (-not (Test-Path -LiteralPath 'dist/index.html')) { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed.' } }
New-Item -ItemType Directory -Force -Path '.data' | Out-Null
$serverPath = Join-Path $projectRoot 'server/index.mjs'
$appProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('"' + $serverPath + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot '.data/server.log') -RedirectStandardError (Join-Path $projectRoot '.data/server-error.log') -PassThru
@{pid=$appProcess.Id;started=$appProcess.StartTime.ToUniversalTime().ToString('o');server=$serverPath} | ConvertTo-Json | Set-Content -LiteralPath '.data/server-process.json' -Encoding utf8
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try { $ready = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2 } catch { $ready = $null }
    if ($ready -and $ready.version -and $ready.mode -eq 'local') { break }
    if ($appProcess.HasExited) { throw 'BytePath could not start. See .data/server-error.log.' }
    Start-Sleep -Milliseconds 500
}
if (-not $ready -or $ready.mode -ne 'local') { throw 'BytePath has not become ready. See .data/server-error.log.' }
Write-Host 'BytePath: http://127.0.0.1:3001'
Write-Host 'Open this address in your browser. Progress stays on this computer.'
if (-not $ready.ai.available) { Write-Host 'AI needs a Gemini Free Tier key in .env. Lessons and code grading are ready.' }
