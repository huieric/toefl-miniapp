# 托福备考助手 — 数据库备份脚本（本地 Docker PostgreSQL / 直连 PG）
# 用法：powershell -File scripts/backup-db.ps1 [backup_dir]
# 说明：支持 Docker 容器备份和直连 PostgreSQL 两种方式

param(
    [string]$BackupDir = "",
    [switch]$Direct,  # 跳过 Docker，直接连接 PostgreSQL
    [int]$KeepCount = 10  # 保留最近 N 份
)

$ErrorActionPreference = 'Stop'

# 配置
$Container = 'toefl-postgres'
$DbUser = 'toefl'
$DbName = 'toefl_db'
$DefaultBackupDir = Join-Path $PSScriptRoot '..\backups'
$BackupOutputDir = if ($BackupDir) { $BackupDir } else { $DefaultBackupDir }

New-Item -ItemType Directory -Force -Path $BackupOutputDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Write-Host "=== 托福备考助手 - 数据库备份 ===" -ForegroundColor Cyan
Write-Host "时间: $(Get-Date)" -ForegroundColor Gray
Write-Host "数据库: $DbName" -ForegroundColor Gray
Write-Host "备份目录: $BackupOutputDir" -ForegroundColor Gray

# ==================== 方式1: Docker 容器备份 ====================
function Invoke-DockerBackup {
    Write-Host "`n[1/3] 使用 Docker 容器备份..." -ForegroundColor Yellow

    $running = docker ps --filter "name=$Container" --filter "status=running" --format '{{.Names}}' 2>$null
    if (-not $running) {
        Write-Host "  ⚠ 容器 $Container 未运行，跳过 Docker 备份" -ForegroundColor Yellow
        return $false
    }

    # Custom 格式
    $customFile = Join-Path $BackupOutputDir "toefl_db_custom_${stamp}.dump"
    docker exec $Container pg_dump -U $DbUser -d $DbName -F c -f /tmp/backup_custom.dump 2>$null
    if ($LASTEXITCODE -eq 0) {
        docker cp "${Container}:/tmp/backup_custom.dump" $customFile 2>$null
        docker exec $Container rm -f /tmp/backup_custom.dump 2>$null
        $size = (Get-Item $customFile).Length / 1MB
        Write-Host "  ✓ Custom 格式: $customFile ($([math]::Round($size,2)) MB)" -ForegroundColor Green
        return $true
    }

    # SQL 格式 fallback
    $sqlFile = Join-Path $BackupOutputDir "toefl_db_${stamp}.sql"
    docker exec $Container pg_dump -U $DbUser -d $DbName -F p -f /tmp/backup.sql 2>$null
    docker cp "${Container}:/tmp/backup.sql" $sqlFile 2>$null
    docker exec $Container rm -f /tmp/backup.sql 2>$null
    if (Test-Path $sqlFile) {
        $size = (Get-Item $sqlFile).Length / 1MB
        Write-Host "  ✓ SQL 格式: $sqlFile ($([math]::Round($size,2)) MB)" -ForegroundColor Green
        return $true
    }

    Write-Host "  ✗ Docker 备份失败" -ForegroundColor Red
    return $false
}

# ==================== 方式2: 直连 PostgreSQL ====================
function Invoke-DirectBackup {
    Write-Host "`n[1/3] 直连 PostgreSQL 备份..." -ForegroundColor Yellow

    $dbHost = $env:PG_HOST ?? "localhost"
    $dbPort = $env:PG_PORT ?? "5433"
    $dbPassword = $env:PG_PASSWORD ?? "toefl123"

    $env:PGPASSWORD = $dbPassword

    # Custom 格式
    $customFile = Join-Path $BackupOutputDir "toefl_db_custom_${stamp}.dump"
    $pgDumpArgs = @("-h", $dbHost, "-p", $dbPort, "-U", $DbUser, "-d", $DbName,
                    "-F", "c", "--compress=9", "-f", "`"$customFile`"")

    try {
        & pg_dump @pgDumpArgs 2>$null
        if (Test-Path $customFile) {
            $size = (Get-Item $customFile).Length / 1MB
            Write-Host "  ✓ Custom 格式: $customFile ($([math]::Round($size,2)) MB)" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  ⚠ pg_dump 不可用，尝试 psql fallback..." -ForegroundColor Yellow
    }

    # SQL 格式 fallback
    $sqlFile = Join-Path $BackupOutputDir "toefl_db_${stamp}.sql"
    try {
        & psql -h $dbHost -p $dbPort -U $DbUser -d $DbName -f - -o $sqlFile 2>$null | Out-Null
        if (Test-Path $sqlFile) {
            $size = (Get-Item $sqlFile).Length / 1MB
            Write-Host "  ✓ SQL 格式: $sqlFile ($([math]::Round($size,2)) MB)" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  ✗ 直连备份失败" -ForegroundColor Red
    }

    return $false
}

# ==================== 执行备份 ====================
$backupSuccess = $false
if ($Direct) {
    $backupSuccess = Invoke-DirectBackup
} else {
    $backupSuccess = Invoke-DockerBackup
    if (-not $backupSuccess) {
        Write-Host "  尝试直连备份作为 fallback..." -ForegroundColor Yellow
        $backupSuccess = Invoke-DirectBackup
    }
}

if (-not $backupSuccess) {
    Write-Error "备份失败，请检查 PostgreSQL 是否运行。"
    exit 1
}

# ==================== 备份统计 ====================
Write-Host "`n[2/3] 备份统计..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = ($env:PG_PASSWORD ?? "toefl123")
    $tableCount = & psql -h localhost -p 5433 -U toefl -d toefl_db -t -c `
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null | ForEach-Object { $_.Trim() }
    Write-Host "  表数量: $tableCount" -ForegroundColor Gray

    $recordCount = & psql -h localhost -p 5433 -U toefl -d toefl_db -t -c `
        "SELECT count(*) FROM questions;" 2>$null | ForEach-Object { $_.Trim() }
    Write-Host "  题目总数: $recordCount" -ForegroundColor Gray
} catch {
    Write-Host "  (无法获取统计)" -ForegroundColor Gray
}

# ==================== 清理旧备份 ====================
Write-Host "`n[3/3] 清理旧备份 (超过 $KeepCount 份)..." -ForegroundColor Yellow

Get-ChildItem $BackupOutputDir -Filter 'toefl_db_*' |
    Sort-Object Name |
    Select-Object -SkipLast $KeepCount |
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  已删除: $($_.Name)" -ForegroundColor Gray
    }

# ==================== 显示备份文件 ====================
Write-Host "`n=== 备份完成 ===" -ForegroundColor Green
Write-Host "备份文件:" -ForegroundColor Cyan
Get-ChildItem $BackupOutputDir -Filter 'toefl_db_*' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 5 |
    Format-Table Name, @{Label="大小";Expression={"{0:N2} MB" -f ($_.Length/1MB)}}, LastWriteTime -AutoSize
