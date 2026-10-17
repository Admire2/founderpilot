# FIX PANELS - Repair iLera healthcare panels
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FIX PANELS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Repairing iLera healthcare panel recommendations and risk scoring logic." -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Run panel repair" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Write-Host "Running iLera panel repair..." -ForegroundColor Yellow; Invoke-RestMethod -Uri "https://founderpilot-theta.vercel.app/api/suite/fix" -Method Post -ContentType "application/json" -Body '{"target":"panels"}' }
