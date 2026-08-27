# 本地环境一键初始化：Docker PostgreSQL + 安装前后端依赖
# 用法：在 PowerShell 里运行  .\setup-local.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "=== 1/3 PostgreSQL (Docker) ==="
$container = docker ps -a --format "{{.Names}}" | Select-String -Pattern '^toefl-postgres$'
if ($container) {
  Write-Host "容器已存在，启动..."
  docker start toefl-postgres
} else {
  Write-Host "创建并启动 PostgreSQL 容器（首次会拉取镜像，稍等）..."
  docker run -d --name toefl-postgres `
    -e POSTGRES_USER=toefl -e POSTGRES_PASSWORD=toefl123 -e POSTGRES_DB=toefl_db `
    -p 5433:5432 -v toefl_pgdata:/var/lib/postgresql/data postgres:16
}
Start-Sleep -Seconds 3

Write-Host "=== 2/3 安装 server 依赖 ==="
Set-Location (Join-Path $Root 'server')
npm install

Write-Host "=== 3/3 安装 web 依赖 ==="
Set-Location (Join-Path $Root 'web')
npm install

Write-Host ""
Write-Host "初始化完成！接下来开两个终端启动："
Write-Host "  终端1: cd $Root\server ; npm start        (后端 :10000)"
Write-Host "  终端2: cd $Root\web ; npm run dev        (前端 :5173)"
Write-Host "  本机访问: http://localhost:5173"
Write-Host "  （后端启动时自动建表 + 灌种子数据，无需手动建库）"
