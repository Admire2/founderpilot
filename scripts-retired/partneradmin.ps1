$Host.UI.RawUI.WindowTitle = "Partner Onboarding"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$envFile = [System.IO.File]::ReadAllText("$PWD\.env.local", $utf8)
$supaUrl = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }) -replace "NEXT_PUBLIC_SUPABASE_URL=", ""
$supaKey = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""
$h = @{ apikey = $supaKey; Authorization = "Bearer $supaKey" }
while ($true) {
  Clear-Host
  Write-Host "===== PARTNER ONBOARDING =====" -ForegroundColor Magenta
  Write-Host "1. List applications"; Write-Host "2. Approve into directory"; Write-Host "0. Exit"
  $c = Read-Host "`nChoose"
  if ($c -eq "0") { break }
  if ($c -eq "1") {
    $r = Invoke-RestMethod -Uri "$supaUrl/rest/v1/partner_applications?select=*&order=id.desc" -Headers $h
    if ($r.Count -eq 0) { Write-Host "No applications yet. Share /partners/join link." -ForegroundColor Yellow } else { $r | Format-Table id, company, country, city, category, model_preference, contact_email -AutoSize }
  }
  if ($c -eq "2") {
    $id = Read-Host "Application id"
    $r = Invoke-RestMethod -Uri "$supaUrl/rest/v1/partner_applications?id=eq.$id" -Headers $h
    if ($r.Count -gt 0) {
      $a = $r[0]
      $url = if ($a.website) { $a.website + (if ($a.website.Contains("?")) { "&" } else { "?" }) + "ref=founderpilot" } else { "https://partners.founderpilot.ai/" + $a.company.ToLower().Replace(' ','-') }
      $h2 = $h.Clone(); $h2["Content-Type"] = "application/json"; $h2["Prefer"] = "return=minimal"
      $body = @{ partner_name = $a.company; category = $a.category; affiliate_url = $url; commission_rate = "per agreement"; network = "Own directory"; country = $a.country; city = $a.city; services = $a.notes; status = "confirmed"; partnership_model = $a.model_preference } | ConvertTo-Json
      Invoke-RestMethod -Uri "$supaUrl/rest/v1/affiliate_partners" -Method POST -Headers $h2 -Body $body | Out-Null
      Write-Host "Approved: $($a.company) as $($a.model_preference) partner." -ForegroundColor Green
    }
  }
  Read-Host "`nPress Enter"
}
