# CREDIT ADMIN - Manage user credits, packs, and settlements
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  CREDIT ADMIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Responsible for: Managing credit packs, user balances, settlements, and credit audits." -ForegroundColor Yellow
Write-Host ""
$base = "https://founderpilot-theta.vercel.app"
Write-Host "[1] View all credit transactions" -ForegroundColor Green
Write-Host "[2] Grant credits to a user" -ForegroundColor Green
Write-Host "[3] Audit credit usage" -ForegroundColor Green
Write-Host "[0] Exit" -ForegroundColor Gray
$choice = Read-Host "Choose"
if ($choice -eq "1") { Invoke-RestMethod -Uri "$base/api/admin/credits" | ConvertTo-Json -Depth 5 }
if ($choice -eq "2") { $email = Read-Host "User email"; $amt = Read-Host "Amount"; Invoke-RestMethod -Uri "$base/api/admin/credits" -Method Post -Body (@{email=$email; amount=$amt} | ConvertTo-Json) -ContentType "application/json" }
if ($choice -eq "3") { Invoke-RestMethod -Uri "$base/api/usage" | ConvertTo-Json -Depth 5 }
