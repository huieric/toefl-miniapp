# Start the app (backend serves frontend + API on :10000) and expose via cpolar.
# Prereqs (run once): .\setup-local.ps1  ;  build frontend  ;  cpolar authtoken <token>
# Usage: .\run.ps1   (Ctrl+C to stop the tunnel)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Ensure backend is running on :10000
$listening = Get-NetTCPConnection -State Listen -LocalPort 10000 -ErrorAction SilentlyContinue
if (-not $listening) {
  $logdir = Join-Path $Root 'server\logs'
  New-Item -ItemType Directory -Force -Path $logdir | Out-Null
  Start-Process -FilePath 'node' -ArgumentList 'src/app.js' -WorkingDirectory (Join-Path $Root 'server') -WindowStyle Hidden -RedirectStandardOutput "$logdir\server.out.log" -RedirectStandardError "$logdir\server.err.log"
  Write-Host 'Backend started on :10000'
  Start-Sleep -Seconds 4
} else {
  Write-Host 'Backend already running on :10000'
}

# 2. Start cpolar tunnel (foreground)
Write-Host 'Starting cpolar tunnel to port 10000 ...'
Write-Host 'Look for a line like:  Forwarding  https://xxxx.cpolar.io  ->  localhost:10000'
cpolar http 10000
