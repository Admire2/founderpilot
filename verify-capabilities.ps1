param(
  [string]$Root = "C:\Users\great\founderpilot",
  [switch]$NoReport
)

$registryPath = Join-Path $Root "capability-registry.json"
$suitesPath = Join-Path $Root "capability-registry-suites.json"
if (-not (Test-Path $registryPath)) { Write-Host "MISSING capability-registry.json" -ForegroundColor Red; exit 1 }

$features = @()
$features += (Get-Content $registryPath -Raw | ConvertFrom-Json).features
if (Test-Path $suitesPath) { $features += (Get-Content $suitesPath -Raw | ConvertFrom-Json).features }

$suiteMap = @{
  'Kara Word'='Kara Office Suite'; 'Kara Sheets'='Kara Office Suite'; 'Kara Notes'='Kara Office Suite';
  'Kara Seek Engine'='Kara Office Suite'; 'Kara Search Node'='Kara Office Suite'
}

function Resolve-Path-Ex {
  param([string]$Root, [string]$Rel)
  if ($Rel -eq "-") { return $null }
  $p = Join-Path $Root ($Rel -replace '/', '\')
  if (Test-Path $p) { return $p }
  $leaf = Split-Path $Rel -Leaf
  $found = Get-ChildItem -Path $Root -Recurse -Filter $leaf -Depth 6 -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { return $found.FullName }
  return $null
}

Write-Host ""
Write-Host "KARAKATA GROUP CAPABILITY AUDIT - AGENT v2 (all suites)" -ForegroundColor Cyan

$results = @()
foreach ($item in $features) {
  $suite = if ($item.suite) { $item.suite } elseif ($suiteMap.ContainsKey($item.product)) { $suiteMap[$item.product] } else { "Platform" }
  if ($item.status -eq "roadmap") {
    $results += [PSCustomObject]@{ Suite=$suite; Product=$item.product; Feature=$item.feature; Competitor=$item.competitor; Exclusive=$item.exclusive; Status="ROADMAP"; Proof="-" }
    continue
  }
  $path = Resolve-Path-Ex -Root $Root -Rel $item.file
  $ok = $false; $proof = if ($item.type -eq "route") { "route" } else { "code" }
  if ($path) {
    if ($item.type -eq "route") { $ok = $true }
    else {
      if (Test-Path $path -PathType Leaf) {
        $content = Get-Content -Path $path -Raw -ErrorAction SilentlyContinue
        if ($content -and ($content -match $item.pattern)) { $ok = $true }
      }
    }
  }
  $results += [PSCustomObject]@{ Suite=$suite; Product=$item.product; Feature=$item.feature; Competitor=$item.competitor; Exclusive=$item.exclusive; Status=$(if ($ok) { "VERIFIED" } else { "NOT FOUND" }); Proof=$proof }
}

$suites = $results | Select-Object -ExpandProperty Suite -Unique
foreach ($s in $suites) {
  Write-Host ""
  Write-Host ("===== SUITE: " + $s + " =====") -ForegroundColor Green
  $rows = @($results | Where-Object { $_.Suite -eq $s })
  $prods = $rows | Select-Object -ExpandProperty Product -Unique
  foreach ($pr in $prods) {
    Write-Host ("  -- " + $pr) -ForegroundColor White
    foreach ($r in @($rows | Where-Object { $_.Product -eq $pr })) {
      $color = if ($r.Status -eq "VERIFIED") { "Green" } elseif ($r.Status -eq "ROADMAP") { "Yellow" } else { "Red" }
      Write-Host ("     [" + $r.Status + " / " + $r.Proof + "] " + $r.Feature) -ForegroundColor $color
    }
  }
  $v = @($rows | Where-Object { $_.Status -eq "VERIFIED" }).Count
  $m = @($rows | Where-Object { $_.Status -eq "NOT FOUND" }).Count
  Write-Host ("  => Suite verified: " + $v + " | missing: " + $m) -ForegroundColor Cyan
}

Write-Host ""
Write-Host "===== GOVERNANCE STATUS OF UNREGISTERED PROJECTS =====" -ForegroundColor Magenta
$packed = @()
$blPath = Join-Path $Root "BACKLOG.txt"
if (Test-Path $blPath) { $packed = @(Get-Content $blPath | Where-Object { $_ -match '^PACKED\s*\|' } | ForEach-Object { ($_ -split '\|')[2].Trim() }) }
$registered = $features | ForEach-Object { ($_file = $_.file) -replace '/.*','' } | Where-Object { $_ -ne "-" } | Select-Object -Unique
$topDirs = Get-ChildItem -Path $Root -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notin @('node_modules','.next','.vercel','.vscode') }
$ungoverned = @()
foreach ($d in $topDirs) {
  $covered = @($features | Where-Object { $_.file -ne "-" -and ($_.file -replace '/.*','') -eq $d.Name }).Count
  if ($covered -eq 0) { $ungoverned += $d.Name; if ($packed -contains $d.Name) { Write-Host ("  [PACKED] " + $d.Name + "  (deferred by CEO decision)") -ForegroundColor DarkGray } else { Write-Host ("  ! " + $d.Name + "  (register claims or retire)") -ForegroundColor Yellow } }
}
$suiteDirs = Get-ChildItem -Path (Join-Path $Root "app\suite") -Directory -ErrorAction SilentlyContinue
foreach ($d in $suiteDirs) {
  $covered = @($features | Where-Object { $_.file -like ("app/suite/" + $d.Name + "*") }).Count
  if ($covered -eq 0) { $ungoverned += ("app/suite/" + $d.Name); if ($packed -contains ("app/suite/" + $d.Name)) { Write-Host ("  [PACKED] app/suite/" + $d.Name + "  (deferred by CEO decision)") -ForegroundColor DarkGray } else { Write-Host ("  ! app/suite/" + $d.Name + "  (register claims or retire)") -ForegroundColor Yellow } }
}
$ungoverned | Out-File -FilePath (Join-Path $Root "ungoverned.txt") -Encoding utf8
if ($ungoverned.Count -eq 0) { Write-Host "  (none - every project is governed)" -ForegroundColor Green }

if (-not $NoReport) {
  $md = "# Karakata Group - Verified Capabilities Report`n`nGenerated: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + "`nScope: entire founderpilot ecosystem (all suites)`nProof levels: code = capability logic pattern-matched; route = module deployed in codebase`n`n## Executive Summary`n`n"
  $tv = @($results | Where-Object { $_.Status -eq "VERIFIED" }).Count
  $tm = @($results | Where-Object { $_.Status -eq "NOT FOUND" }).Count
  $tr = @($results | Where-Object { $_.Status -eq "ROADMAP" }).Count
  $md += "- Verified capabilities: **" + $tv + "**`n- Missing (fix or de-market): **" + $tm + "**`n- Roadmap commitments: **" + $tr + "**`n- Ungoverned projects: **" + $ungoverned.Count + "**`n`n"
  foreach ($s in $suites) {
    $md += "## " + $s + "`n`n| Product | Capability | Competitor | Kara-exclusive | Proof | Status |`n|---|---|---|---|---|---|`n"
    foreach ($r in @($results | Where-Object { $_.Suite -eq $s })) {
      $comp = if ($r.Competitor) { "Yes" } else { "-" }
      $excl = if ($r.Exclusive) { "Kara-only" } else { "" }
      $md += "| " + $r.Product + " | " + $r.Feature + " | " + $comp + " | " + $excl + " | " + $r.Proof + " | " + $r.Status + " |`n"
    }
    $md += "`n"
  }
  $md += "## Ungoverned Projects`n`n"
  if ($ungoverned.Count -eq 0) { $md += "None.`n" } else { foreach ($u in $ungoverned) { $md += "- " + $u + "`n" } }
  $md += "`n---`n*No claim ships without code. No code ships without a claim.*`n"
  $md | Out-File -FilePath (Join-Path $Root "VERIFIED-CAPABILITIES.md") -Encoding utf8
  $results | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $Root "verification-report.json") -Encoding utf8
  Write-Host ""
  Write-Host "Group report written: VERIFIED-CAPABILITIES.md + verification-report.json" -ForegroundColor Green
}

