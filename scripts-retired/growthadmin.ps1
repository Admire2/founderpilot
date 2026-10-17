$Host.UI.RawUI.WindowTitle = "Growth & Opportunity Engine"
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

while ($true) {
  Clear-Host
  Write-Host "===== GROWTH & OPPORTUNITY ENGINE =====" -ForegroundColor Magenta
  Write-Host "1. Time vs Monetization Analysis"
  Write-Host "2. Friction Hotspots (System Errors)"
  Write-Host "3. High-Intent Abandonment (Stripe)"
  Write-Host "4. PROMPT DEMAND ANALYSIS (What are they asking for?)" -ForegroundColor Yellow
  Write-Host "0. Exit"
  
  $c = Read-Host "`nChoose"
  if ($c -eq "0") { break }
  
  switch ($c) {
    "1" {
      $sessions = Get-Data "user_sessions" "?select=suite,duration_seconds"
      $usage = Get-Data "credit_usage" "?select=suite,credits"
      $suiteTime = @{}; $suiteSpend = @{}
      foreach ($s in $sessions) { $suite = $s.suite -replace "/suite/", ""; $suiteTime[$suite] = ($suiteTime[$suite] + $s.duration_seconds) }
      foreach ($u in $usage) { $suiteSpend[$u.suite] = ($suiteSpend[$u.suite] + [math]::Abs($u.credits)) }
      
      Write-Host "`n--- TIME vs MONETIZATION ---" -ForegroundColor Cyan
      foreach ($suite in $suiteTime.Keys) {
          $hours = [math]::Round($suiteTime[$suite] / 3600, 1)
          $credits = $suiteSpend[$suite]
          Write-Host "  $suite : $hours hrs spent | $credits credits burned"
      }
    }
    "2" {
      $errors = Get-Data "system_errors" "?select=page_url,error_type&status=eq.open"
      Write-Host "`n--- FRICTION HOTSPOTS ---" -ForegroundColor Cyan
      $errors | Group-Object -Property page_url | Sort-Object Count -Descending | Select-Object -First 5 | Format-Table Name, Count -AutoSize
    }
    "3" {
      $failed = Get-Data "purchases" "?select=id,status&status=neq.paid"
      Write-Host "`n--- HIGH-INTENT ABANDONMENT ---" -ForegroundColor Cyan
      Write-Host "  $($failed.Count) users reached checkout but didn't pay." -ForegroundColor Red
    }
    "4" {
      Write-Host "`nAnalyzing recent user prompts for feature demand..." -ForegroundColor Yellow
      $prompts = Get-Data "user_prompts" "?select=prompt_text,suite&order=id.desc&limit=200"
      
      # Simple keyword frequency analyzer
      $stopWords = @("the","and","a","to","of","in","i","is","that","it","for","with","on","as","by","an","be","this","which","or","from","at","not","but","was","are","we","you","your","my","me","can","will","just","do","use","design","build","make")
      $wordCounts = @{}
      
      foreach ($p in $prompts) {
        $words = ($p.prompt_text -replace "[^a-zA-Z0-9\s]", " ").ToLower() -split "\s+"
        foreach ($w in $words) {
          if ($w.Length -gt 3 -and $stopWords -notcontains $w) {
            $wordCounts[$w] = ($wordCounts[$w] + 1)
          }
        }
      }
      
      Write-Host "`nTOP 20 MOST REQUESTED CONCEPTS (Last 200 prompts):" -ForegroundColor Green
      $wordCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | Format-Table @{L="Keyword";E={$_.Key}}, @{L="Demand Score";E={$_.Value}} -AutoSize
      
      Write-Host "`nRECENT RAW PROMPTS (Last 10):" -ForegroundColor Cyan
      $prompts | Select-Object -First 10 | ForEach-Object { Write-Host "[$($_.suite)] $($_.prompt_text.Substring(0, [math]::Min(100, $_.prompt_text.Length)))..." -ForegroundColor DarkGray }
    }
  }
  Read-Host "`nPress Enter to continue"
}