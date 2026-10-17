$p = "src\App.tsx"
$src = @(Get-Content -Path $p)
$out = [System.Collections.Generic.List[string]]::new()
$done = $false
foreach ($ln in $src) {
  $isOldCond = $ln.Contains("['dashboard', 'word', 'notes', 'sheets', 'pdf'].includes(activeApp)")
  $isDupCond = $ln.Contains("['dashboard', 'word', 'notes', 'sheets', 'slides'].includes(activeApp)")
  if ($isOldCond -or $isDupCond) {
    if (-not $done) {
      $out.Add("            {activeApp === 'slides' && <KaraSlides />}")
      $out.Add("            {!['dashboard', 'word', 'notes', 'sheets', 'slides', 'pdf'].includes(activeApp) && (")
      $out.Add('              <div className="w-full h-full flex items-center justify-center text-slate-400">')
      $done = $true
      Write-Host "REBUILT placeholder block (slides render + exclusion + outer div)" -ForegroundColor Green
    }
    continue
  }
  $out.Add($ln)
}
if (-not $done) { Write-Host "FATAL: corrupted condition lines not found" -ForegroundColor Red; exit 1 }
Set-Content -Path $p -Value ($out -join "`n") -Encoding utf8
Write-Host "DONE. Proof:" -ForegroundColor Yellow
Select-String -Path $p -Pattern "KaraSlides />|includes\(activeApp\)" | ForEach-Object { Write-Host ("  L" + $_.LineNumber + ": " + $_.Line.Trim()) }
