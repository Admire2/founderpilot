$root = "C:\Users\great\founderpilot"
Write-Host "=== KARA OFFICE V2.2 CONSOLIDATION AUDIT ===" -ForegroundColor Cyan
$checks = @(
  @{ n="Icon (.ico)"; p="$root\kara-desktop\build\icon.ico" },
  @{ n="Version 1.1.0"; p="$root\kara-desktop\package.json"; pat="1.1.0" },
  @{ n="Splash screen"; p="$root\kara-desktop\main.cjs"; pat="splash" },
  @{ n="AI settings lib"; p="$root\kara-office-mvp\kara-office-ui\src\lib\aiSettings.ts"; pat="__karaAi" },
  @{ n="AI model wired suite-wide"; p="$root\kara-office-mvp\kara-office-ui\src\components\KaraBase.tsx"; pat="__karaAi" },
  @{ n="Flow drag & drop"; p="$root\kara-office-mvp\kara-office-ui\src\components\KaraFlow.tsx"; pat="draggable" },
  @{ n="Base->Flow bridge"; p="$root\kara-office-mvp\kara-office-ui\src\components\KaraBase.tsx"; pat="sendToFlow" },
  @{ n="Connect conditions"; p="$root\kara-office-mvp\kara-office-ui\src\lib\connectEngine.ts"; pat="condition" },
  @{ n="Connect daily scheduler"; p="$root\kara-office-mvp\kara-office-ui\src\lib\connectEngine.ts"; pat="karaConnectLastDaily" },
  @{ n="Manifesto"; p="$root\docs\15_MANIFESTO.md"; pat="sovereign" },
  @{ n="Landing page"; p="$root\kara-office-mvp\kara-office-ui\public\landing.html"; pat="Kara Office" }
)
$pass = 0
foreach ($c in $checks) {
  $ok = $false
  if (Test-Path $c.p) { if ($c.pat) { $ok = (Get-Content $c.p -Raw) -match $c.pat } else { $ok = $true } }
  if ($ok) { $pass++; Write-Host ("  PASS  " + $c.n) -ForegroundColor Green } else { Write-Host ("  FAIL  " + $c.n) -ForegroundColor Red }
}
Write-Host ("RESULT: " + $pass + "/" + $checks.Count) -ForegroundColor $(if ($pass -eq $checks.Count) { 'Green' } else { 'Yellow' })
