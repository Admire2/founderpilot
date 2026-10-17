# SCOUT ADMIN - Manage KaraKata AI scout and demand signals
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SCOUT ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Monitoring KaraKata AI scout requests, demand signals, and sourced matches." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] Test scout with a query" -ForegroundColor Green
Write-Host "[2] View all listings" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { $q = Read-Host "What do you want to buy?"; Invoke-RestMethod -Uri "$base/api/karakata" -Method Post -Body (@{mode="scout"; brief=$q; email="admin@founderpilot.com"} | ConvertTo-Json) -ContentType "application/json" }
if ($choice -eq "2") { Invoke-RestMethod -Uri "$base/api/karakata/list" | ConvertTo-Json -Depth 5 }
