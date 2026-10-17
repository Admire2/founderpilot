$env:PSReadLineEditMode = "Windows"
$Host.UI.RawUI.WindowTitle = "FounderPilot Error Diagnostic Center"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$f = "$PWD\.env.local"
$envFile = [System.IO.File]::ReadAllText($f, $utf8)
$supaUrl = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }) -replace "NEXT_PUBLIC_SUPABASE_URL=", ""
$supaKey = ($envFile -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""

function Get-Errors($query) {
  $url = "$supaUrl/rest/v1/system_errors$query"
  $headers = @{ "apikey" = $supaKey; "Authorization" = "Bearer $supaKey" }
  try { return Invoke-RestMethod -Uri $url -Headers $headers } catch { return @() }
}

while ($true) {
  Clear-Host
  Write-Host "===== ERROR DIAGNOSTIC CENTER =====" -ForegroundColor Red
  Write-Host "1. Triage Dashboard (Recent Open Errors)"
  Write-Host "2. Deep Dive (View Full Stack Trace)"
  Write-Host "3. Mark Error as RESOLVED"
  Write-Host "4. Error Stats (What's breaking the most?)"
  Write-Host "0. Exit"
  
  $c = Read-Host "`nChoose"
  if ($c -eq "0") { break }
  
  switch ($c) {
    "1" {
      $errs = Get-Errors "?select=id,timestamp_et,user_email,error_type,error_message,status&status=eq.open&order=id.desc&limit=20"
      if ($errs.Count -eq 0) { Write-Host "All clear! No open errors." -ForegroundColor Green }
      else { $errs | Format-Table id, timestamp_et, user_email, error_type, error_message -AutoSize }
    }
    "2" {
      $id = Read-Host "Enter Error ID to inspect"
      $err = Get-Errors "?select=*&id=eq.$id"
      if ($err.Count -gt 0) {
        Write-Host "`n--- ERROR DETAILS ---" -ForegroundColor Yellow
        Write-Host "Time: $($err[0].timestamp_et)"
        Write-Host "User: $($err[0].user_email)"
        Write-Host "Page: $($err[0].page_url)"
        Write-Host "Type: $($err[0].error_type)"
        Write-Host "`nMessage:`n$($err[0].error_message)" -ForegroundColor Red
        Write-Host "`nStack Trace:`n$($err[0].stack_trace)" -ForegroundColor Gray
        Write-Host "`nContext (JSON):`n$($err[0].context | ConvertTo-Json -Depth 5)" -ForegroundColor Cyan
      }
    }
    "3" {
      $id = Read-Host "Enter Error ID to mark as RESOLVED"
      $headers = @{ "apikey" = $supaKey; "Authorization" = "Bearer $supaKey"; "Content-Type" = "application/json"; "Prefer" = "return=minimal" }
      $body = @{ status = "resolved" } | ConvertTo-Json
      Invoke-RestMethod -Uri "$supaUrl/rest/v1/system_errors?id=eq.$id" -Method PATCH -Headers $headers -Body $body | Out-Null
      Write-Host "Error $id marked as resolved!" -ForegroundColor Green
    }
    "4" {
      $all = Get-Errors "?select=error_type,status"
      $open = $all | Where-Object { $_.status -eq "open" }
      $grouped = $open | Group-Object -Property error_type | Sort-Object Count -Descending
      Write-Host "`nTop Active Error Types:" -ForegroundColor Magenta
      $grouped | Format-Table Name, Count -AutoSize
    }
  }
  Read-Host "`nPress Enter to continue"
}