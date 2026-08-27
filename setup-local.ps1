# Local environment setup: Docker PostgreSQL + install frontend/backend deps
# Usage (in PowerShell): .\setup-local.ps1
# NOTE: messages are in English to avoid Windows PowerShell 5.1 encoding issues.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host '=== 1/3 PostgreSQL (Docker) ==='

# Check Docker daemon is running
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'ERROR: Docker daemon is NOT running.' -ForegroundColor Red
    Write-Host 'Please start "Docker Desktop" first, wait until it shows "Engine running", then re-run this script.' -ForegroundColor Yellow
    exit 1
}

$container = docker ps -a --format '{{.Names}}' | Select-String -Pattern '^toefl-postgres$'
if ($container) {
    Write-Host 'Container exists, starting it...'
    docker start toefl-postgres
} else {
    Write-Host 'Creating PostgreSQL container (first run pulls image, may take a while)...'
    docker run -d --name toefl-postgres `
        -e POSTGRES_USER=toefl -e POSTGRES_PASSWORD=toefl123 -e POSTGRES_DB=toefl_db `
        -p 5433:5432 -v toefl_pgdata:/var/lib/postgresql/data postgres:16
}
Start-Sleep -Seconds 3

Write-Host '=== 2/3 install server deps ==='
Set-Location (Join-Path $Root 'server')
npm install

Write-Host '=== 3/3 install web deps ==='
Set-Location (Join-Path $Root 'web')
npm install

Write-Host ''
Write-Host 'Done! Next, open TWO terminals and run:'
Write-Host "  Terminal 1: cd $Root\server ; npm start"
Write-Host "  Terminal 2: cd $Root\web ; npm run dev"
Write-Host '  Local access: http://localhost:5173'
