param(
  $Url  = $env:SUPABASE_URL,
  $Key  = $env:SUPABASE_ANON_KEY
)
if (-not $Url -or -not $Key) {
  $envLocal = Get-Content "$PSScriptRoot\..\.env.local" -ErrorAction SilentlyContinue
  foreach ($line in $envLocal) {
    if ($line -match '^SUPABASE_URL="?(.+)"?$') { $Url = $Matches[1] }
    if ($line -match '^SUPABASE_ANON_KEY="?(.+)"?$') { $Key = $Matches[1] }
  }
}
$h = @{ apikey = $Key; Authorization = "Bearer $Key" }
$sellers  = Invoke-RestMethod "$Url/rest/v1/kara_sellers?select=*"  -Headers $h
$listings = Invoke-RestMethod "$Url/rest/v1/kara_listings?select=*" -Headers $h
$inv      = Invoke-RestMethod "$Url/rest/v1/kara_inventory?select=*" -Headers $h
$reqs     = Invoke-RestMethod "$Url/rest/v1/kara_requests?select=*" -Headers $h
$cons     = Invoke-RestMethod "$Url/rest/v1/kara_consents?select=*" -Headers $h

Write-Host "`n=== AJE - KARAKATA GROWTH & FUNDING INTELLIGENCE ===" -ForegroundColor Cyan
$rows = foreach ($s in $sellers) {
  $my    = @($listings | Where-Object { $_.seller_id -eq $s.id })
  $myInv = @($inv      | Where-Object { $_.seller_id -eq $s.id })
  $stock = ($myInv | Measure-Object -Property stock_qty -Sum).Sum
  $demand = @($reqs | Where-Object { $_.category -eq $s.category }).Count
  $consent = $cons | Where-Object { $_.email -eq $s.email }
  $tier = "Watchlist"
  if ($my.Count -ge 2 -and $consent.consent_funding) { $tier = "Emerging" }
  if ($my.Count -ge 3 -and $demand -ge 2 -and $consent.consent_funding -and $stock -gt 0) { $tier = "FUND-READY" }
  [pscustomobject]@{
    Shop = $s.shop_name; Category = $s.category; Listings = $my.Count
    Stock = [int]$stock; BuyerDemand = $demand
    InventoryConsent = [bool]$consent.consent_inventory; FundingConsent = [bool]$consent.consent_funding
    Tier = $tier
  }
}
$rows | Sort-Object Tier, Listings -Descending | Format-Table -AutoSize
$fund = @($rows | Where-Object { $_.Tier -eq "FUND-READY" })
Write-Host ("FUND-READY CANDIDATES: " + $fund.Count) -ForegroundColor Green
$fund | ForEach-Object { Write-Host ("  -> " + $_.Shop + " (" + $_.Category + ") demand:" + $_.BuyerDemand + " stock:" + $_.Stock) -ForegroundColor Yellow }
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
if (-not (Test-Path "$PSScriptRoot\..\reports")) { New-Item -ItemType Directory -Path "$PSScriptRoot\..\reports" -Force | Out-Null }
$rows | Export-Csv "$PSScriptRoot\..\reports\aje-$stamp.csv" -NoTypeInformation
Write-Host ("Report saved: reports/aje-$stamp.csv") -ForegroundColor Cyan
