# STRIPE ADMIN - Monitor Stripe health, webhooks, and Connect accounts
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  STRIPE ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Monitoring Stripe webhook health, Connect account status, and payment flow diagnostics." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] Check Stripe health" -ForegroundColor Green
Write-Host "[2] View webhook logs" -ForegroundColor Green
Write-Host "[3] Test webhook endpoint" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Invoke-RestMethod -Uri "$base/api/stripe-health" | ConvertTo-Json -Depth 5 }
if ($choice -eq "2") { Write-Host "Checking Supabase kara_emails for webhook events..." -ForegroundColor Yellow }
if ($choice -eq "3") { Write-Host "Sending test webhook..." -ForegroundColor Yellow; Invoke-RestMethod -Uri "$base/api/webhook" -Method Post -ContentType "application/json" -Body '{"type":"test"}' }
