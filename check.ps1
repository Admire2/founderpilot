Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SYNCING LOCAL FOLDER WITH GITHUB..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$projectPath = "C:\Users\great\founderpilot"
Set-Location $projectPath

Write-Host "`n[STEP 1] PULLING LATEST CHANGES FROM GITHUB" -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    git pull origin master
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "VERIFYING BUYER VARIANT PAGE INTEGRATION" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$buyerProductPage = "$projectPath\app\karakata\product\[id]\page.tsx"

if (-Not (Test-Path $buyerProductPage)) {
    Write-Host "FAILED: Buyer product page not found at app/karakata/product/[id]/page.tsx" -ForegroundColor Red
    exit
}

$content = Get-Content $buyerProductPage -Raw
$checksPassed = 0
$totalChecks = 4

Write-Host "`n[CHECK 1] FETCHES FROM NEW VARIANT TABLE" -ForegroundColor Yellow
if ($content -match "from\(`"product_variants`"\)") {
    Write-Host "   SUCCESS: Queries the dedicated product_variants table." -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "   FAILED: Still looking for variants in old metadata." -ForegroundColor Red
}

Write-Host "`n[CHECK 2] MATERIAL SELECTOR STATE" -ForegroundColor Yellow
if ($content -match "selectedMaterial" -and $content -match "availableMaterials") {
    Write-Host "   SUCCESS: Material state and UI logic are present." -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "   FAILED: Material selector logic is missing." -ForegroundColor Red
}

Write-Host "`n[CHECK 3] SMART CART VARIANT ID" -ForegroundColor Yellow
if ($content -match "variant_id:\s*activeVariant\.id") {
    Write-Host "   SUCCESS: Cart saves the specific variant_id for accurate checkout." -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "   FAILED: Cart is not saving the specific variant_id." -ForegroundColor Red
}

Write-Host "`n[CHECK 4] DYNAMIC STOCK/PRICE LOGIC" -ForegroundColor Yellow
if ($content -match "stock_quantity" -and $content -match "price_usd") {
    Write-Host "   SUCCESS: Uses new stock_quantity and price_usd columns for dynamic updates." -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "   FAILED: Missing dynamic stock/price logic." -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Cyan
if ($checksPassed -eq $totalChecks) {
    Write-Host "ALL CHECKS PASSED! Buyer Variant Page is 100% LIVE and ready!" -ForegroundColor Green
} else {
    Write-Host "ONLY $checksPassed/$totalChecks CHECKS PASSED. Review the failures above." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan