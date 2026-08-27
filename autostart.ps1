# Autostart (runs at logon): TOEFL backend + cpolar tunnels (toefl:10000, dsh:49298)
$Node   = 'C:\Program Files\nodejs\node.exe'
$Cpolar = 'C:\Users\hui\cpolar\cpolar\cpolar.exe'
$Root   = 'D:\TapTap游戏赛道调研\toefl-miniapp'

# 1. TOEFL backend on :10000 (serves frontend + API)
$be = Get-NetTCPConnection -State Listen -LocalPort 10000 -ErrorAction SilentlyContinue
if (-not $be) {
  $logdir = Join-Path $Root 'server\logs'
  New-Item -ItemType Directory -Force -Path $logdir | Out-Null
  Start-Process -FilePath $Node -ArgumentList 'src/app.js' -WorkingDirectory (Join-Path $Root 'server') -WindowStyle Hidden -RedirectStandardOutput "$logdir\server.out.log" -RedirectStandardError "$logdir\server.err.log"
}

# 2. cpolar tunnels (persistent background process)
$cp = Get-Process cpolar -ErrorAction SilentlyContinue
if (-not $cp) {
  Start-Process -FilePath $Cpolar -ArgumentList 'start','toefl','dsh' -WindowStyle Hidden
}
