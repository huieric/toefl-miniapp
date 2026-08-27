# Autostart (boot/logon): Docker Desktop -> PostgreSQL -> backend -> cpolar tunnels
$ErrorActionPreference = 'SilentlyContinue'
$Node          = 'C:\Program Files\nodejs\node.exe'
$Cpolar        = 'C:\Users\hui\cpolar\cpolar\cpolar.exe'
$DockerDesktop = 'E:\Docker\Docker\Docker Desktop.exe'
$Root          = 'D:\TapTap游戏赛道调研\toefl-miniapp'
$logdir        = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logdir | Out-Null

# 1. Docker Desktop + PostgreSQL container
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  if (Test-Path $DockerDesktop) { Start-Process -FilePath $DockerDesktop }
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 3
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { break }
  }
}
if ($LASTEXITCODE -eq 0) {
  docker start toefl-postgres *> $null
  Start-Sleep -Seconds 3
}

# 2. Backend on :10000 (serves frontend + API)
$be = Get-NetTCPConnection -State Listen -LocalPort 10000 -ErrorAction SilentlyContinue
if (-not $be) {
  Start-Process -FilePath $Node -ArgumentList 'src/app.js' -WorkingDirectory (Join-Path $Root 'server') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logdir 'server.out.log') -RedirectStandardError (Join-Path $logdir 'server.err.log')
}

# 3. cpolar tunnels (toefl:10000, dsh:49298)
$cp = Get-Process cpolar -ErrorAction SilentlyContinue
if (-not $cp) {
  Start-Process -FilePath $Cpolar -ArgumentList 'start','toefl','dsh' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logdir 'cpolar.out.log') -RedirectStandardError (Join-Path $logdir 'cpolar.err.log')
}
