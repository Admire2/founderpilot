# TASK ADMIN - Manage Ops Board tasks and AI breakdowns
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TASK ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Monitoring Ops Board tasks, AI goal breakdowns, and voice-captured tasks." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View all tasks" -ForegroundColor Green
Write-Host "[2] Test AI task breakdown" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Write-Host "Querying Supabase fp_tasks table..." -ForegroundColor Yellow }
if ($choice -eq "2") { $goal = Read-Host "What goal to break down?"; Invoke-RestMethod -Uri "$base/api/karakata" -Method Post -Body (@{mode="taskbreak"; brief=$goal; email="admin@founderpilot.com"} | ConvertTo-Json) -ContentType "application/json" }
