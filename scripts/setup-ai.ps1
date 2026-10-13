param([ValidateSet('qwen3:4b','qwen3:1.7b')][string]$Model='qwen3:4b',[switch]$CpuOnly)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install/start Docker Desktop first.' }
$present = & docker ps -a --filter 'name=^bytepath-ai$' --format '{{.Names}}'
if ($present -eq 'bytepath-ai') { & docker start bytepath-ai | Out-Null }
else {
    $aiArgs = @('run','-d','--name','bytepath-ai','--memory','6g','--cpus','4','-p','127.0.0.1:11434:11434','-v','bytepath-models:/root/.ollama','-e','OLLAMA_NO_CLOUD=1','-e','OLLAMA_NUM_PARALLEL=1','-e','OLLAMA_CONTEXT_LENGTH=4096')
    if (-not $CpuOnly) { $aiArgs += @('--gpus','all') }
    $aiArgs += 'ollama/ollama@sha256:adca95a12c2b386a8f9a995e7fa0600e187e3323b5e5522f5a6c3b1ec73eff99'
    & docker @aiArgs
    if ($LASTEXITCODE -ne 0) { throw 'AI container failed to start. Try -CpuOnly after checking Docker/GPU support.' }
}
& docker exec bytepath-ai ollama pull $Model
if ($LASTEXITCODE -ne 0) { throw 'Model download failed. Run this script again to resume.' }
Write-Host ('AI local ready: ' + $Model + '. No cloud API is used.')
