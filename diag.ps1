$key = "6921a420-4aeb-42b7-be88-e843a49973fe"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }
$karaId = "1ea37396-9a20-4760-b70c-b1e7bb443b61"
$toolId = "0c932384-86b0-4e7f-bb76-45d3f8de3223"

Write-Host "===== 1. ASSISTANT STATE =====" -ForegroundColor Cyan
try {
  $k = Invoke-RestMethod -Uri ("https://api.vapi.ai/assistant/" + $karaId) -Headers $headers
  Write-Host ("name: " + $k.name)
  Write-Host ("firstMessage: " + $k.firstMessage)
  Write-Host ("model: " + $k.model.provider + " / " + $k.model.model)
  $tn = @(); if ($k.tools) { $tn = @($k.tools | ForEach-Object { $_.name }) }
  Write-Host ("ATTACHED TOOLS: [" + ($tn -join ", ") + "]") -ForegroundColor Yellow
  $sys = ""
  if ($k.model.messages) { $s = $k.model.messages | Where-Object { $_.role -eq "system" } | Select-Object -First 1; if ($s) { $sys = $s.content } } elseif ($k.model.systemPrompt) { $sys = $k.model.systemPrompt }
  Write-Host ("ROUTING RULE present: " + [bool]($sys -match "ROUTING RULE"))
  Write-Host ("FALLBACK RULE present: " + [bool]($sys -match "FALLBACK RULE"))
} catch { Write-Host ("ERR: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host "===== 2. TOOL STATE =====" -ForegroundColor Cyan
try {
  $t = Invoke-RestMethod -Uri ("https://api.vapi.ai/tool/" + $toolId) -Headers $headers
  Write-Host ("name: " + $t.name + " | type: " + $t.type)
  if ($t.apiRequest) {
    Write-Host ("url: " + $t.apiRequest.url + " | method: " + $t.apiRequest.method)
    if ($t.apiRequest.PSObject.Properties.Name -contains "staticBodyFields") {
      Write-Host ("staticBody: " + ($t.apiRequest.staticBodyFields | ConvertTo-Json -Depth 3 -Compress))
    }
  }
} catch { Write-Host ("ERR: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host "===== 3. PHONE NUMBER STATE =====" -ForegroundColor Cyan
try {
  $pn = Invoke-RestMethod -Uri "https://api.vapi.ai/phone-number" -Headers $headers
  foreach ($p in @($pn)) { Write-Host ("number: " + $p.number + " | serverUrl: " + $p.serverUrl + " | assistantId: " + $p.assistantId) }
} catch { Write-Host ("ERR: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host "===== 4. LAST 4 CALLS =====" -ForegroundColor Cyan
try {
  $calls = Invoke-RestMethod -Uri "https://api.vapi.ai/call?limit=4" -Headers $headers
  $list = if ($calls.results) { $calls.results } else { $calls }
  foreach ($c in @($list) | Select-Object -First 4) { Write-Host ("call: " + $c.id + " | " + $c.type + " | ended: " + $c.endedReason + " | " + $c.startedAt) }
} catch { Write-Host ("ERR: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host "===== 5. /identify ENDPOINT =====" -ForegroundColor Cyan
try {
  $r = Invoke-RestMethod -Uri "https://founderpilot-theta.vercel.app/api/karakata/kaws/identify" -Method Post -Body '{"customerNumber":"+18329492815"}' -ContentType "application/json" -TimeoutSec 30
  Write-Host ("identify OK -> " + $r.result.Substring(0, [Math]::Min(120, $r.result.Length))) -ForegroundColor Green
} catch { Write-Host ("identify ERR: " + $_.Exception.Message) -ForegroundColor Red }
