# HUB - Quick navigation to all suite lobbies
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SUITE HUB" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Opening suite lobby pages in your browser for quick inspection." -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Business Suite (/suite/business)" -ForegroundColor Green
Write-Host "[2] Office Suite (/suite/office)" -ForegroundColor Green
Write-Host "[3] Engineering Suite (/suite/engineering)" -ForegroundColor Green
Write-Host "[4] Healthcare Suite (/suite/healthcare)" -ForegroundColor Green
Write-Host "[5] Marketplace Suite (/suite/marketplace)" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
$base = "https://founderpilot-theta.vercel.app"
if ($choice -eq "1") { Start-Process "$base/suite/business" }
if ($choice -eq "2") { Start-Process "$base/suite/office" }
if ($choice -eq "3") { Start-Process "$base/suite/engineering" }
if ($choice -eq "4") { Start-Process "$base/suite/healthcare" }
if ($choice -eq "5") { Start-Process "$base/suite/marketplace" }
