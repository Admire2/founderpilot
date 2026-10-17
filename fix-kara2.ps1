$key = "6921a420-4aeb-42b7-be88-e843a49973fe"
$karaId = "1ea37396-9a20-4760-b70c-b1e7bb443b61"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }

$kara = Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Headers $headers
$rule = "ROUTING RULE (HIGHEST PRIORITY): At the start of every call, immediately call the identify_caller tool. Adopt the persona it returns exactly until the call ends.`n`n"

$modelObj = $null
if ($kara.model.messages) {
    $sys = $kara.model.messages | Where-Object { $_.role -eq "system" } | Select-Object -First 1
    if ($sys -and $sys.content -notmatch "ROUTING RULE") { $sys.content = $rule + $sys.content }
    $modelObj = [PSCustomObject]@{ provider = $kara.model.provider; model = $kara.model.model; messages = $kara.model.messages }
} elseif ($kara.model.systemPrompt) {
    $p = $kara.model.systemPrompt
    if ($p -notmatch "ROUTING RULE") { $p = $rule + $p }
    $modelObj = [PSCustomObject]@{ provider = $kara.model.provider; model = $kara.model.model; systemPrompt = $p }
}

$patch = [PSCustomObject]@{
    firstMessage = "Thank you for calling Akande Joseph Realty, one moment while I pull up your file."
    model = $modelObj
}

$body = $patch | ConvertTo-Json -Depth 15
try {
    $res = Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Method Patch -Headers $headers -Body $body
    Write-Host "SUCCESS! Brain patched." -ForegroundColor Green
    Write-Host ("First message: " + $res.firstMessage) -ForegroundColor Magenta
} catch {
    Write-Host "Failed:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
}
