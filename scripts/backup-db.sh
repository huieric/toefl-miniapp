#!/bin/bash
# 托福备考助手 — 数据库备份脚本
# 用法: bash scripts/backup-db.sh [backup_dir]

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_HOST="${PG_HOST:-localhost}"
DB_PORT="${PG_PORT:-5433}"
DB_NAME="${PG_DB:-toefl_db}"
DB_USER="${PG_USER:-toefl}"
export PGPASSWORD="${PG_PASSWORD:-toefl123}"

mkdir -p "$BACKUP_DIR"

echo "=== 托福备考助手 - 数据库备份 ==="
echo "时间: $(date)"
echo "数据库: $DB_NAME@$DB_HOST:$DB_PORT"
echo "备份目录: $BACKUP_DIR"

# 1. Custom format backup (pg_restore 兼容)
DUMP_FILE="$BACKUP_DIR/toefl_db_custom_${TIMESTAMP}.dump"
echo "[1/3] 正在备份 custom 格式..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --verbose \
  --file="$DUMP_FILE"
echo "  ✓ 完成: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

# 2. SQL format backup (可读性强)
SQL_FILE="$BACKUP_DIR/toefl_db_sql_${TIMESTAMP}.sql"
echo "[2/3] 正在备份 SQL 格式..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain --verbose \
  --file="$SQL_FILE"
echo "  ✓ 完成: $SQL_FILE ($(du -h "$SQL_FILE" | cut -f1))"

# 3. 备份统计
echo "[3/3] 备份统计..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
echo "  表数量: $TABLE_COUNT"

# 清理 30 天前的旧备份
echo "[4/4] 清理旧备份 (30天前)..."
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete 2>/dev/null || true

echo ""
echo "=== 备份完成 ==="
echo "文件列表:"
ls -lh "$BACKUP_DIR"/toefl_db_*_${TIMESTAMP}* 2>/dev/null || echo "  (无新文件)"
