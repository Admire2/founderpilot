# GROWTH ADMIN - Manage leads, waitlists, and marketing
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  GROWTH ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Managing waitlist signups, lead generation, and marketing campaign analytics." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View all leads" -ForegroundColor Green
Write-Host "[2] View waitlist signups" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Invoke-RestMethod -Uri "$base/api/leads" | ConvertTo-Json -Depth 5 }
if ($choice -eq "2") { Invoke-RestMethod -Uri "$base/api/waitlist" | ConvertTo-Json -Depth 5 }
