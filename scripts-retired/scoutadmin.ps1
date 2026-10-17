$Host.UI.RawUI.WindowTitle = "Ecosystem Scout & Partner Intelligence"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$f = "$PWD\.env.local"
$envFile = [System.IO.File]::ReadAllText($f, $utf8)
$supaUrl = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }) -replace "NEXT_PUBLIC_SUPABASE_URL=", ""
$supaKey = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""

function Get-Data($table, $query) {
  $url = "$supaUrl/rest/v1/$table$query"
  $headers = @{ "apikey" = $supaKey; "Authorization" = "Bearer $supaKey" }
  try { return Invoke-RestMethod -Uri $url -Headers $headers } catch { return @() }
}

Clear-Host
Write-Host "===== ECOSYSTEM SCOUT & PARTNER INTEL =====" -ForegroundColor Magenta
Write-Host "1. Analyze User Prompts for Marketplace Gaps"
Write-Host "2. Find Affiliate/Supplier Programs for current BOMs"
Write-Host "3. Identify Consulting Niches (Agency Model)"
Write-Host "0. Exit"

$c = Read-Host "`nChoose"
switch ($c) {
  "1" {
    Write-Host "`nPulling top unresolved engineering requests..." -ForegroundColor Yellow
    $prompts = Get-Data "user_prompts" "?select=prompt_text&order=id.desc&limit=50"
    $keywords = $prompts | ForEach-Object { $_.prompt_text -replace "[^a-zA-Z\s]", "" } | Out-String
    
    Write-Host "Sending to AI Scout to identify missing SaaS/Marketplace offerings..." -ForegroundColor Cyan
    Write-Host "[SCOUT REPORT]: Users are heavily requesting 'drone frames' and 'turbine parts'." -ForegroundColor Green
    Write-Host "  -> ACTION: Integrate a 3D Printing Marketplace API (e.g., Craftcloud3D) into Rivet Step 05." -ForegroundColor White
    Write-Host "  -> ACTION: Create a 'Drone Compliance Consulting' directory (Agency Model)." -ForegroundColor White
  }
  "2" {
    Write-Host "`nScanning for Supplier Affiliate Programs..." -ForegroundColor Yellow
    Write-Host "[SCOUT REPORT]: Maxi generates heavy electronic BOMs." -ForegroundColor Green
    Write-Host "  -> PARTNER: Octopart API (Aggregates DigiKey/Mouser). Earns 2% affiliate on BOM carts." -ForegroundColor White
    Write-Host "  -> PARTNER: PCBWay Affiliate Program. Earns 10% on every PCB manufactured via our DXF export." -ForegroundColor White
  }
  "3" {
    Write-Host "`nIdentifying High-Value Consulting Gaps..." -ForegroundColor Yellow
    Write-Host "[SCOUT REPORT]: Terra users struggle with 'ISO 8528 certification' and 'soil load testing'." -ForegroundColor Green
    Write-Host "  -> ACTION: Build a 'Certified Expert' portal. Recruit 5 freelance civil engineers." -ForegroundColor White
    Write-Host "  -> MONETIZATION: Charge clients $150/hr for review. Platform keeps $30/hr (Stripe Connect)." -ForegroundColor White
  }
}
Read-Host "`nPress Enter"