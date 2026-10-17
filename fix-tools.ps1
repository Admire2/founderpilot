$key = "6921a420-4aeb-42b7-be88-e843a49973fe"
$karaId = "1ea37396-9a20-4760-b70c-b1e7bb443b61"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }

Write-Host "=== STEP 1: Delete the accidental junk tool ===" -ForegroundColor Cyan
$tools = Invoke-RestMethod -Uri "https://api.vapi.ai/tool" -Headers $headers
$junk = @($tools | Where-Object { $_.name -eq "api_request_tool" })
if ($junk.Count -gt 0) {
  foreach ($j in $junk) {
    try {
      Invoke-RestMethod -Uri ("https://api.vapi.ai/tool/" + $j.id) -Method Delete -Headers $headers | Out-Null
      Write-Host ("🗑 Deleted junk tool: " + $j.name + " (" + $j.id + ")") -ForegroundColor Yellow
    } catch { Write-Host ("Delete failed: " + $_.Exception.Message) -ForegroundColor Red }
  }
} else { Write-Host "No junk tool found - already clean." -ForegroundColor Green }

Write-Host "=== STEP 2: Attempt API tool attachment ===" -ForegroundColor Cyan
$identify = ($tools | Where-Object { $_.name -eq "identify_caller" } | Select-Object -First 1)
$endcall  = ($tools | Where-Object { $_.name -eq "end_outbound_call" } | Select-Object -First 1)
$ids = @()
if ($identify) { $ids += $identify.id }
if ($endcall)  { $ids += $endcall.id }
try {
  $body = (@{ tools = $ids } | ConvertTo-Json -Depth 5)
  Invoke-RestMethod -Uri ("https://api.vapi.ai/assistant/" + $karaId) -Method Patch -Headers $headers -Body $body | Out-Null
  Write-Host "✅ Tools attached via API!" -ForegroundColor Green
} catch {
  Write-Host "⚠️ API refused tool attachment (Vapi blocks it). Do the 30-second dashboard click:" -ForegroundColor Yellow
  Write-Host "   Assistants -> Kara-Karakata Lead Agent -> Tools section -> add identify_caller AND end_outbound_call -> Save" -ForegroundColor Cyan
}

Write-Host "=== STEP 3: Final state report ===" -ForegroundColor Cyan
$kara = Invoke-RestMethod -Uri ("https://api.vapi.ai/assistant/" + $karaId) -Headers $headers
$names = @()
if ($kara.tools) { $names = @($kara.tools | ForEach-Object { $_.name }) }
Write-Host ("Attached tools now: [" + ($names -join ", ") + "]") -ForegroundColor Magenta
