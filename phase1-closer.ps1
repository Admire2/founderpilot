$key = "6921a420-4aeb-42b7-be88-e843a49973fe"
$karaId = "1ea37396-9a20-4760-b70c-b1e7bb443b61"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }

Write-Host "=== TEST 1: /identify endpoint (the brain) ===" -ForegroundColor Cyan
try {
  $r = Invoke-RestMethod -Uri "https://founderpilot-theta.vercel.app/api/karakata/kaws/identify" -Method Post -Body '{"customerNumber":"+18329492815"}' -ContentType "application/json" -TimeoutSec 30
  $lane = ($r.result -split "`n" | Where-Object { $_ -match "LANE:" } | Select-Object -First 1)
  Write-Host ("Endpoint OK. " + $lane) -ForegroundColor Green
} catch {
  Write-Host ("Endpoint FAILED: " + $_.Exception.Message) -ForegroundColor Red
}

Write-Host "=== TEST 2: is the tool actually attached? ===" -ForegroundColor Cyan
$kara = Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Headers $headers
$toolNames = @()
if ($kara.tools) { $toolNames = @($kara.tools | ForEach-Object { $_.name }) }
Write-Host ("Attached tools: [" + ($toolNames -join ", ") + "]") -ForegroundColor Yellow
$sysText = ""
if ($kara.model.messages) { $s = $kara.model.messages | Where-Object { $_.role -eq "system" } | Select-Object -First 1; if ($s) { $sysText = $s.content } } elseif ($kara.model.systemPrompt) { $sysText = $kara.model.systemPrompt }
Write-Host ("Has ROUTING RULE: " + [bool]($sysText -match "ROUTING RULE")) -ForegroundColor Yellow

Write-Host "=== TEST 3: inject FALLBACK RULE (kills silence-death forever) ===" -ForegroundColor Cyan
$fallback = "`nFALLBACK RULE: If the identify_caller tool errors, times out, or returns empty, immediately continue as the general Akande Joseph Realty receptionist: greet the caller warmly and ask if they are calling to buy, sell, or about a property notice. NEVER stay silent for more than 2 seconds.`n"
if ($sysText -notmatch "FALLBACK RULE") {
  if ($kara.model.messages) {
    $s = $kara.model.messages | Where-Object { $_.role -eq "system" } | Select-Object -First 1
    $s.content = $s.content + $fallback
    $modelObj = [PSCustomObject]@{ provider = $kara.model.provider; model = $kara.model.model; messages = $kara.model.messages }
  } else {
    $modelObj = [PSCustomObject]@{ provider = $kara.model.provider; model = $kara.model.model; systemPrompt = ($sysText + $fallback) }
  }
  $patch = [PSCustomObject]@{ model = $modelObj }
  try {
    Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Method Patch -Headers $headers -Body ($patch | ConvertTo-Json -Depth 15) | Out-Null
    Write-Host "FALLBACK RULE injected." -ForegroundColor Green
  } catch { Write-Host ("Patch failed: " + $_.ErrorDetails.Message) -ForegroundColor Red }
} else { Write-Host "Already present." -ForegroundColor Green }
