# AFFILIATE ADMIN - Manage affiliate partners and commissions
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AFFILIATE ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Managing affiliate partners, tracking referrals, and processing commission payouts." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View all affiliates" -ForegroundColor Green
Write-Host "[2] Track affiliate sessions" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Invoke-RestMethod -Uri "$base/api/affiliate/claim" | ConvertTo-Json -Depth 5 }
if ($choice -eq "2") { Invoke-RestMethod -Uri "$base/api/track-affiliate" | ConvertTo-Json -Depth 5 }
