$utf8 = [System.Text.UTF8Encoding]::new($false)
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FOUNDERPILOT DIAGNOSTICS v2 (scope-aware)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$issues = @()
$pages = Get-ChildItem "$PWD\app" -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue

Write-Host "[1/6] Module-scope duplicate declarations (the Sprint-A collision signature)..." -ForegroundColor Yellow
foreach ($file in $pages) {
    $lines = [System.IO.File]::ReadAllLines($file.FullName, $utf8)
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'   # case-SENSITIVE
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^(const|let|var|function|class)\s+([A-Za-z0-9_]+)') {   # indent 0 = module scope ONLY
            if (-not $seen.Add($matches[2])) { $issues += "MODULE-SCOPE DUP: '$($matches[2])' in $($file.FullName.Replace($PWD,'')) line $($i+1)" }
        }
    }
}

Write-Host "[2/6] Sidebar href integrity..." -ForegroundColor Yellow
$sb = "$PWD\components\Sidebar.tsx"; if (-not (Test-Path -LiteralPath $sb)) { $sb = "$PWD\app\components\Sidebar.tsx" }
if (Test-Path -LiteralPath $sb) {
    $c = [System.IO.File]::ReadAllText($sb, $utf8)
    if ($c -match 'label:\s*"Office Suite"' -and $c -notmatch 'href:\s*"/suite/office"[^}]*label:\s*"Office Suite"' -and $c -notmatch 'label:\s*"Office Suite"[^}]*href:\s*"/suite/office"') { $issues += "NAV: Office Suite not pointing at /suite/office" }
    if ($c -match 'label:\s*"Business Suite"' -and $c -notmatch '/suite/business[^}]*label:\s*"Business Suite"' -and $c -notmatch 'label:\s*"Business Suite"[^}]*href:\s*"/suite/business"') { $issues += "NAV: Business Suite not pointing at /suite/business" }
    $mp = ([regex]::Matches($c, 'Marketplace Suite')).Count
    if ($mp -gt 1) { $issues += "NAV: 'Marketplace Suite' appears $mp times in sidebar (dedupe needed)" }
}

Write-Host "[3/6] Route existence for every /suite href..." -ForegroundColor Yellow
foreach ($h in @("/suite","/suite/business","/suite/office","/suite/engineering","/suite/healthcare","/suite/marketplace")) {
    if (-not (Test-Path -LiteralPath "$PWD\app$h\page.tsx")) { $issues += "ROUTE MISSING: $h has no page.tsx" }
}

Write-Host "[4/6] Buyer-privacy leaks on listing pages (tel:/wa.me/raw phone render)..." -ForegroundColor Yellow
$lp = Get-ChildItem -LiteralPath "$PWD\app\karakata\p" -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue
foreach ($file in $lp) {
    $c = [System.IO.File]::ReadAllText($file.FullName, $utf8)
    if ($c -match 'tel:' -or $c -match 'wa\.me' -or $c -match '\{[^}]*\.phone[^}]*\}') { $issues += "PRIVACY LEAK: direct contact renders in $($file.FullName.Replace($PWD,''))" }
}

Write-Host "[5/6] Competitor-name audit (office + components + karakata API)..." -ForegroundColor Yellow
$audit = Get-ChildItem "$PWD\app\suite\office","$PWD\app\components","$PWD\app\api\karakata" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue | Select-String -CaseSensitive -Pattern 'Nextcloud|Blender|OBS|Bitwarden|Vaultwarden|Super Productivity'
foreach ($a in $audit) { $issues += "COMPETITOR NAME: $($a.Path.Replace($PWD,'')) line $($a.LineNumber)" }

Write-Host "[6/6] Duplicate HTML ids per page..." -ForegroundColor Yellow
foreach ($file in $pages) {
    $c = [System.IO.File]::ReadAllText($file.FullName, $utf8)
    $ids = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($m in [regex]::Matches($c, 'id="([^"]+)"')) { if (-not $ids.Add($m.Groups[1].Value)) { $issues += "DUP ID: '$($m.Groups[1].Value)' in $($file.FullName.Replace($PWD,''))" } }
}

Write-Host ""
if ($issues.Count -eq 0) { Write-Host "ECOSYSTEM HEALTHY: all 6 checks clean." -ForegroundColor Green }
else { Write-Host "FOUND $($issues.Count) REAL ISSUE(S):" -ForegroundColor Red; foreach ($x in $issues) { Write-Host "  > $x" -ForegroundColor Yellow } }
Write-Host "=========================================" -ForegroundColor Cyan
