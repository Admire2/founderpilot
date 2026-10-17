# ERROR ADMIN - View and manage error logs
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ERROR ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Viewing application error logs, identifying failed API calls, and debugging production issues." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View recent errors" -ForegroundColor Green
Write-Host "[2] Check Vercel build logs" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Write-Host "Querying Supabase error_log table..." -ForegroundColor Yellow }
if ($choice -eq "2") { vercel logs --limit 20 }
