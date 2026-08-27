# Stop the backend (the process listening on :10000)
$p = Get-NetTCPConnection -State Listen -LocalPort 10000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
if ($p) {
  Stop-Process -Id $p -Force
  Write-Output "Stopped backend PID $p"
} else {
  Write-Output 'No backend running on :10000'
}
