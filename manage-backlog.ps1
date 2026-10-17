param(
  [string]$Add, [string]$Park, [string]$Promote, [string]$Done, [string]$Remove,
  [string]$Note = "",
  [switch]$Pack,
  [string]$Root = "C:\Users\great\founderpilot"
)

$bl = Join-Path $Root "BACKLOG.txt"
if (-not (Test-Path $bl)) {
  @("# Karakata Backlog & Parking Lot", "# Format: STATUS | DATE | NAME | NOTE", "# Statuses: IDEA, ROADMAP, PARKED, PACKED, DONE") | Set-Content $bl -Encoding utf8
}

function Read-Entries { Get-Content $bl | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' } }
function Write-Entries($entries) {
  $header = @(Get-Content $bl | Where-Object { $_ -match '^#' })
  @($header + @($entries)) | Set-Content $bl -Encoding utf8
}
function Set-Status($name, $status) {
  $entries = @(Read-Entries)
  $found = $false
  $new = $entries | ForEach-Object {
    $parts = $_ -split '\|'
    if ($parts.Count -ge 3 -and $parts[2].Trim() -eq $name) {
      $found = $true
      $note = if ($Note) { $Note } else { ($parts[3..($parts.Count-1)] -join '|').Trim() }
      ($status + " | " + (Get-Date -Format 'yyyy-MM-dd') + " | " + $parts[2].Trim() + " | " + $note)
    } else { $_ }
  }
  if (-not $found) { $new = @($new) + ($status + " | " + (Get-Date -Format 'yyyy-MM-dd') + " | " + $name + " | " + $Note) }
  Write-Entries $new
  Write-Host ("[" + $status + "] " + $name) -ForegroundColor Green
}

if ($Add) { Set-Status $Add "IDEA" }
if ($Park) { Set-Status $Park "PARKED" }
if ($Promote) { Set-Status $Promote "ROADMAP" }
if ($Done) { Set-Status $Done "DONE" }
if ($Remove) {
  $entries = @(Read-Entries | Where-Object { ($_ -split '\|')[2].Trim() -ne $Remove })
  Write-Entries $entries
  Write-Host ("Removed " + $Remove) -ForegroundColor Green
}
if ($Pack) {
  $ug = Join-Path $Root "ungoverned.txt"
  if (-not (Test-Path $ug)) { Write-Host "Run .\verify-capabilities.ps1 once first (it writes ungoverned.txt)." -ForegroundColor Yellow }
  else {
    foreach ($n in (Get-Content $ug)) {
      $n = $n.Trim()
      if ($n -eq '') { continue }
      $exists = @(Read-Entries | Where-Object { ($_ -split '\|')[2].Trim() -eq $n })
      if ($exists.Count -eq 0) { Set-Status $n "PACKED" }
    }
    Write-Host "All ungoverned projects packed into BACKLOG.txt" -ForegroundColor Green
  }
}

$entries = @(Read-Entries)
Write-Host ""
Write-Host "KARAKATA BACKLOG & PARKING LOT" -ForegroundColor Cyan
foreach ($st in @("ROADMAP","IDEA","PARKED","PACKED","DONE")) {
  $rows = @($entries | Where-Object { ($_ -split '\|')[0].Trim() -eq $st })
  if ($rows.Count -eq 0) { continue }
  Write-Host ""
  Write-Host ("--- " + $st + " (" + $rows.Count + ") ---") -ForegroundColor $(switch($st){"ROADMAP"{"Green"} "IDEA"{"Cyan"} "PARKED"{"Yellow"} "PACKED"{"DarkGray"} "DONE"{"Magenta"}})
  foreach ($r in $rows) {
    $p = $r -split '\|'
    Write-Host ("  " + $p[2].Trim() + "  (" + $p[1].Trim() + ")  " + ($p[3..($p.Count-1)] -join '|').Trim()) -ForegroundColor White
  }
}
Write-Host ""
