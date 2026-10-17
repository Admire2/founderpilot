$Host.UI.RawUI.WindowTitle = "Stripe Payment Admin"
function Read-EnvVar($name) {
  $lines = Get-Content "$PWD\.env.local" -ErrorAction SilentlyContinue
  $line = $lines | Where-Object { $_ -match ("^" + $name + "=") } | Select-Object -First 1
  if (-not $line) { return "" }
  return ($line -replace ("^" + $name + "="), "").Trim().Trim('"').Trim("'")
}
$supaUrl = Read-EnvVar "NEXT_PUBLIC_SUPABASE_URL"
if (-not $supaUrl) { $supaUrl = Read-EnvVar "SUPABASE_URL" }
$supaKey = Read-EnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY"
if (-not $supaKey) { $supaKey = Read-EnvVar "SUPABASE_ANON_KEY" }
$supaUrl = $supaUrl.TrimEnd('/')
if (-not $supaUrl -or $supaUrl -notmatch "^https?://") { Write-Host "FATAL: Supabase URL not readable from .env.local" -ForegroundColor Red; Read-Host; exit }

function Get-Rows($table, $query) {
  $headers = @{ apikey = $supaKey; Authorization = "Bearer $supaKey" }
  try { return Invoke-RestMethod -Uri "$supaUrl/rest/v1/$table$query" -Headers $headers } catch { Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red; return @() }
}

while ($true) {
  Clear-Host
  Write-Host "===== Stripe Payment Admin =====" -ForegroundColor Cyan
  Write-Host "1. List recent payments (last 50)"
  Write-Host "2. List FAILED payments (recovery list)"
  Write-Host "3. Revenue stats (today / week / month)"
  Write-Host "4. Check webhook health (pending purchases)"
  Write-Host "5. Manually credit a purchase (fix webhook)"
  Write-Host "6. List refunds & clawbacks"
  Write-Host "0. Exit"
  $c = Read-Host "`nChoose"
  if ($c -eq "0") { break }
  switch ($c) {
    "1" { Get-Rows "purchases" "?select=id,email,pack,credits,status,created_at&order=id.desc&limit=50" | Format-Table id, email, pack, credits, status, created_at -AutoSize }
    "2" { $r = Get-Rows "purchases" "?select=id,email,pack,credits,status,created_at&status=neq.paid&order=id.desc&limit=50"; if ($r.Count) { $r | Format-Table id, email, pack, credits, status, created_at -AutoSize } else { Write-Host "No failed payments." -ForegroundColor Green } }
    "3" {
      $all = Get-Rows "purchases" "?select=credits,created_at,status"
      $now = Get-Date
      $t = @($all | Where-Object { $_.status -eq "paid" -and (Get-Date $_.created_at) -gt $now.AddDays(-1) })
      $w = @($all | Where-Object { $_.status -eq "paid" -and (Get-Date $_.created_at) -gt $now.AddDays(-7) })
      $m = @($all | Where-Object { $_.status -eq "paid" -and (Get-Date $_.created_at) -gt $now.AddDays(-30) })
      $tRev = [math]::Round((($t | Measure-Object credits -Sum).Sum) * 0.09, 2)
      $wRev = [math]::Round((($w | Measure-Object credits -Sum).Sum) * 0.09, 2)
      $mRev = [math]::Round((($m | Measure-Object credits -Sum).Sum) * 0.09, 2)
      Write-Host "Today: $($t.Count) purchases = $$tRev" -ForegroundColor Green
      Write-Host "Week:  $($w.Count) purchases = $$wRev" -ForegroundColor Green
      Write-Host "Month: $($m.Count) purchases = $$mRev" -ForegroundColor Green
    }
    "4" { $r = Get-Rows "purchases" "?select=id,email,pack,credits,status&status=eq.pending&order=id.desc&limit=20"; if ($r.Count) { Write-Host "PENDING (webhook missed these):" -ForegroundColor Red; $r | Format-Table id, email, pack, credits, status -AutoSize } else { Write-Host "No pending purchases. Webhooks healthy!" -ForegroundColor Green } }
    "5" {
      $id = Read-Host "Enter purchase ID to mark paid + credit"
      $h2 = @{ apikey = $supaKey; Authorization = "Bearer $supaKey"; "Content-Type" = "application/json"; Prefer = "return=minimal" }
      Invoke-RestMethod -Uri "$supaUrl/rest/v1/purchases?id=eq.$id" -Method PATCH -Headers $h2 -Body (@{ status = "paid" } | ConvertTo-Json) | Out-Null
      $pu = Get-Rows "purchases" "?select=email,credits&id=eq.$id"
      if ($pu.Count) { Invoke-RestMethod -Uri "$supaUrl/rest/v1/rpc/add_credits" -Method POST -Headers $h2 -Body (@{ email = $pu[0].email; amount = $pu[0].credits } | ConvertTo-Json) | Out-Null; Write-Host "Credited $($pu[0].credits) to $($pu[0].email)" -ForegroundColor Green }
    }
    "6" { $r = Get-Rows "purchases" "?select=id,email,pack,credits,status,created_at&status=eq.refunded&order=id.desc&limit=50"; if ($r.Count) { $r | Format-Table id, email, pack, credits, status, created_at -AutoSize } else { Write-Host "No refunds." -ForegroundColor Yellow } }
  }
  Read-Host "`nPress Enter to continue"
}