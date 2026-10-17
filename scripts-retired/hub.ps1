$Host.UI.RawUI.WindowTitle = "FounderPilot Command Center"
Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   FOUNDERPILOT ECOSYSTEM COMMAND HUB    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Scanning for active management modules...`n" -ForegroundColor Yellow

# Auto-discover all admin tools in the current directory
$tools = Get-ChildItem -Path $PWD -Filter "*admin.ps1" | Sort-Object Name

$menuItems = @()
$i = 1
foreach ($tool in $tools) {
    $name = $tool.BaseName -replace "admin", ""
    $name = $name.Substring(0,1).ToUpper() + $name.Substring(1)
    Write-Host "[$i] $name Module" -ForegroundColor Green
    $menuItems += $tool.FullName
    $i++
}
Write-Host "[0] Exit Hub" -ForegroundColor DarkGray

$choice = Read-Host "`nLaunch Module"
if ($choice -eq "0") { exit }

$index = [int]$choice - 1
if ($index -ge 0 -and $index -lt $menuItems.Count) {
    Clear-Host
    Write-Host "Launching $($menuItems[$index])..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File $menuItems[$index]
} else {
    Write-Host "Invalid selection." -ForegroundColor Red
}