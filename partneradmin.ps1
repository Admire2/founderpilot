# PARTNER ADMIN - Manage Maxi partners and sourcing
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PARTNER ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Managing Maxi engineering partners, sourcing partners, and Auto Desk franchises." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View all partners" -ForegroundColor Green
Write-Host "[2] View partner applications" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Invoke-RestMethod -Uri "$base/api/partners" | ConvertTo-Json -Depth 5 }
if ($choice -eq "2") { Invoke-RestMethod -Uri "$base/api/maxi-partners" | ConvertTo-Json -Depth 5 }
