$key = "6921a420-4aeb-42b7-be88-e843a49973fe"
$karaId = "1ea37396-9a20-4760-b70c-b1e7bb443b61"
$toolId = "0c932384-86b0-4e7f-bb76-45d3f8de3223"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }

Write-Host "Fetching Kara and Tool..." -ForegroundColor Cyan
$kara = Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Headers $headers
$tool = Invoke-RestMethod -Uri "https://api.vapi.ai/tool/$toolId" -Headers $headers

$rule = "ROUTING RULE (HIGHEST PRIORITY): At the start of every call, immediately call the identify_caller tool. Adopt the persona it returns.`n`n"
$prompt = ""
if ($kara.model.messages) {
    $sys = $kara.model.messages | Where-Object { $_.role -eq "system" } | Select-Object -First 1
    if ($sys) { $prompt = $sys.content }
} elseif ($kara.model.systemPrompt) { $prompt = $kara.model.systemPrompt }

if ($prompt -notmatch "ROUTING RULE") { $prompt = $rule + $prompt }

$currentTools = @()
if ($kara.tools) { $currentTools = @($kara.tools) }
$hasIdentify = $currentTools | Where-Object { $_.id -eq $toolId }
if (-not $hasIdentify) { $currentTools += $tool }

$patch = [PSCustomObject]@{
    firstMessage = "Thank you for calling Akande Joseph Realty, one moment while I pull up your file."
    model = [PSCustomObject]@{
        provider = $kara.model.provider
        model = $kara.model.model
        systemPrompt = $prompt
    }
    tools = $currentTools
}

$body = $patch | ConvertTo-Json -Depth 15
Write-Host "Pushing clean payload to Vapi..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/$karaId" -Method Patch -Headers $headers -Body $body | Out-Null
    Write-Host "SUCCESS! Kara's brain has been surgically rewritten." -ForegroundColor Green
} catch {
    Write-Host "Failed:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
}
