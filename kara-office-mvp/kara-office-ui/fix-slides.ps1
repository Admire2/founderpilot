$p = "src\App.tsx"
$arr = @(Get-Content -Path $p)
$lines = [System.Collections.Generic.List[string]]$arr
$text = $lines -join "`n"
Write-Host ("App.tsx lines: " + $lines.Count)

if (-not $text.Contains("import KaraSheets from './components/KaraSheets';")) {
  for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if ($lines[$i].StartsWith("import ")) { $lines.Insert($i + 1, "import KaraSheets from './components/KaraSheets';"); Write-Host "INSERT sheets import" -ForegroundColor Green; break }
  }
}
$text = $lines -join "`n"
if (-not $text.Contains("import KaraSlides from './components/KaraSlides';")) {
  for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if ($lines[$i].StartsWith("import ")) { $lines.Insert($i + 1, "import KaraSlides from './components/KaraSlides';"); Write-Host "INSERT slides import" -ForegroundColor Green; break }
  }
}

$phIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i].Contains(".includes(activeApp)")) { $phIdx = $i; Write-Host ("FOUND placeholder line " + ($i + 1) + ": " + $lines[$i].Trim()) -ForegroundColor Cyan; break }
}
if ($phIdx -lt 0) { Write-Host "FATAL: placeholder line not found - stop and report" -ForegroundColor Red; exit 1 }

$text = $lines -join "`n"
$ins = @()
if (-not $text.Contains("<KaraSheets />")) { $ins += "            {activeApp === 'sheets' && <KaraSheets />}" }
if (-not $text.Contains("<KaraSlides />")) { $ins += "            {activeApp === 'slides' && <KaraSlides />}" }
if ($ins.Count -gt 0) { $lines.InsertRange($phIdx, $ins); $phIdx += $ins.Count; Write-Host ("INSERT " + $ins.Count + " render line(s)") -ForegroundColor Green }

$lines[$phIdx] = "            {!['dashboard', 'word', 'notes', 'sheets', 'slides'].includes(activeApp) && ("
Write-Host "REWRITE exclusion list" -ForegroundColor Green

Set-Content -Path $p -Value ($lines -join "`n") -Encoding utf8
Write-Host "DONE. Proof:" -ForegroundColor Yellow
Select-String -Path $p -Pattern "KaraSlides|includes\(activeApp\)" | ForEach-Object { Write-Host ("  L" + $_.LineNumber + ": " + $_.Line.Trim()) }
