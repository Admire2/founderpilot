$Host.UI.RawUI.WindowTitle = "Affiliate + 5-Layer Command Center"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$envFile = [System.IO.File]::ReadAllText("$PWD\.env.local", $utf8)
$supaUrl = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }) -replace "NEXT_PUBLIC_SUPABASE_URL=", ""
$supaKey = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""
$headers = @{ apikey = $supaKey; Authorization = "Bearer $supaKey" }
function Get-Data($table, $query) {
  try { return Invoke-RestMethod -Uri "$supaUrl/rest/v1/$table$query" -Headers $headers } catch { return @() }
}
while ($true) {
  Clear-Host
  Write-Host "===== AFFILIATE + 5-LAYER COMMAND CENTER =====" -ForegroundColor Magenta
  Write-Host "1. Partners directory (Layer 2)"
  Write-Host "2. Affiliate clicks (Layer 2 telemetry)"
  Write-Host "3. PRICE COMPARISON (Layer 3 marketplace)"
  Write-Host "4. Value chain analysis (Layer 5 input)"
  Write-Host "5. ORDER PIPELINE + advance status (Layer 4)"
  Write-Host "6. DEMAND AGGREGATION + bulk signals (Layer 5)"
  Write-Host "7. FIVE-LAYER DASHBOARD"
  Write-Host "0. Exit"
  $c = Read-Host "`nChoose"
  if ($c -eq "0") { break }
  switch ($c) {
    "1" { Get-Data "affiliate_partners" "?select=partner_name,category,city,country,status&order=partner_name" | Format-Table partner_name, category, city, country, status -AutoSize }
    "2" { Get-Data "affiliate_clicks" "?select=timestamp_et,user_email,partner_name,suite,project_context&order=id.desc&limit=20" | Format-Table timestamp_et, user_email, partner_name, suite, project_context -AutoSize }
    "3" {
      $ls = Get-Data "partner_listings" "?select=partner_name,item_key,title,price,moq,lead_time_days&order=item_key,price"
      if ($ls.Count -eq 0) { Write-Host "No price listings yet - run the seed SQL first." -ForegroundColor Yellow }
      else { $ls | Group-Object item_key | ForEach-Object { Write-Host ("ITEM: " + $_.Name) -ForegroundColor Cyan; $_.Group | Sort-Object price | Format-Table partner_name, title, price, moq, lead_time_days -AutoSize } }
    }
    "4" {
      $cl = Get-Data "affiliate_clicks" "?select=partner_name"
      $pa = Get-Data "affiliate_partners" "?select=partner_name,category"
      $map = @{}; foreach ($p in $pa) { $map[$p.partner_name] = $p.category }
      if ($cl.Count -eq 0) { Write-Host "No clicks yet - click a Get Quote button on /suite/maxi/partners first." -ForegroundColor Yellow }
      else { $cl | Group-Object { $map[$_.partner_name] } | Sort-Object Count -Descending | Format-Table Name, Count -AutoSize }
    }
    "5" {
      $od = Get-Data "partner_orders" "?select=id,partner_name,item_key,qty,status,created_at_et&order=id.desc&limit=20"
      if ($od.Count -eq 0) { Write-Host "No orders yet - use the Fulfillment Order Desk on /suite/maxi/partners." -ForegroundColor Yellow }
      else { $od | Format-Table id, partner_name, item_key, qty, status, created_at_et -AutoSize }
      $adv = Read-Host "Advance an order? Enter id (or blank to skip)"
      if ($adv) {
        $row = Get-Data "partner_orders" "?select=id,status&id=eq.$adv"
        if ($row.Count -gt 0) {
          $flow = @("requested","quoted","ordered","fulfilled")
          $i = [Array]::IndexOf($flow, $row[0].status)
          $next = if ($i -ge 0 -and $i -lt 3) { $flow[$i + 1] } else { "fulfilled" }
          $h2 = $headers.Clone(); $h2["Content-Type"] = "application/json"; $h2["Prefer"] = "return=minimal"
          Invoke-RestMethod -Uri "$supaUrl/rest/v1/partner_orders?id=eq.$adv" -Method PATCH -Headers $h2 -Body (@{ status = $next } | ConvertTo-Json) | Out-Null
          Write-Host "Order $adv advanced to: $next" -ForegroundColor Green
        }
      }
    }
    "6" {
      $od = Get-Data "partner_orders" "?select=item_key,qty"
      if ($od.Count -eq 0) { Write-Host "No orders yet - bulk signals appear once clients request orders." -ForegroundColor Yellow }
      else { $od | Group-Object item_key | ForEach-Object { $t = ($_.Group | Measure-Object qty -Sum).Sum; Write-Host ($_.Name + "  total qty: " + $t) -ForegroundColor $(if ($t -gt 50) { "Red" } else { "Green" }) } }
      Write-Host "RULE: TotalQty > 50 in a month --> negotiate bulk pricing or launch in-house production (Layer 5 trigger)." -ForegroundColor Yellow
    }
    "7" {
      $pa = (Get-Data "affiliate_partners" "?select=id").Count
      $cl = (Get-Data "affiliate_clicks" "?select=id").Count
      $ls = (Get-Data "partner_listings" "?select=id").Count
      $od = (Get-Data "partner_orders" "?select=id").Count
      Write-Host "`nL1 DESIGN: 4 suites live - credits flowing" -ForegroundColor Cyan
      Write-Host "L2 ROUTING: $pa partners | $cl tracked clicks" -ForegroundColor Cyan
      Write-Host "L3 MARKETPLACE: $ls priced listings (option 3 = price comparison)" -ForegroundColor Cyan
      Write-Host "L4 FULFILLMENT: $od tracked orders (option 5 = pipeline)" -ForegroundColor Cyan
      Write-Host "L5 INTELLIGENCE: options 4 + 6 = value chain & bulk signals" -ForegroundColor Cyan
    }
  }
  Read-Host "`nPress Enter to return to menu"
}