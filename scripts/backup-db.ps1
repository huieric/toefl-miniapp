# 数据库备份脚本（本地 Docker PostgreSQL）
# 用法：powershell -File scripts/backup-db.ps1
# 说明：docker exec 到 toefl-postgres 容器执行 pg_dump，存到 backups/ 目录（保留最近 N 份）

$ErrorActionPreference = 'Stop'
$Container = 'toefl-postgres'
$DbUser = 'toefl'
$DbName = 'toefl_db'
$BackupDir = Join-Path $PSScriptRoot '..\backups'
$KeepCount = 10  # 保留最近 10 份

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# 检查容器是否在运行
$running = docker ps --filter "name=$Container" --filter "status=running" --format '{{.Names}}' 2>$null
if (-not $running) {
  Write-Error "容器 $Container 未运行，请先启动 Docker 和数据库。"
  exit 1
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outFile = Join-Path $BackupDir "toefl_db_$stamp.sql"

Write-Host "开始备份 $DbName -> $outFile ..."
docker exec $Container pg_dump -U $DbUser -d $DbName -F c -f /tmp/backup.dump
docker cp "${Container}:/tmp/backup.dump" $outFile
docker exec $Container rm -f /tmp/backup.dump

$size = (Get-Item $outFile).Length / 1MB
Write-Host "备份完成：$outFile ($([math]::Round($size,2)) MB)"

# 轮转：删除超过 KeepCount 份的旧备份
$old = Get-ChildItem $BackupDir -Filter 'toefl_db_*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -Skip $KeepCount
foreach ($f in $old) {
  Remove-Item $f.FullName -Force
  Write-Host "已删除旧备份: $($f.Name)"
}

Write-Host '备份轮转完成。'
