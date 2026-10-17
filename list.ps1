$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$scripts = @(
    @{name="creditadmin.ps1"; desc="Manage user credits, packs, settlements, and audits"},
    @{name="stripeadmin.ps1"; desc="Monitor Stripe health, webhooks, and Connect accounts"},
    @{name="erroradmin.ps1"; desc="View error logs and debug production issues"},
    @{name="hub.ps1"; desc="Quick navigation to all suite lobbies"},
    @{name="growthadmin.ps1"; desc="Manage leads, waitlists, and marketing"},
    @{name="scoutadmin.ps1"; desc="Monitor KaraKata AI scout and demand signals"},
    @{name="affliateadmin.ps1"; desc="Manage affiliate partners and commissions"},
    @{name="partneradmin.ps1"; desc="Manage Maxi partners and Auto Desk franchises"},
    @{name="taskadmin.ps1"; desc="Monitor Ops Board tasks and AI breakdowns"},
    @{name="fix-panels.ps1"; desc="Repair iLera healthcare panels"},
    @{name="diagnostics.ps1"; desc="Run ecosystem health checks (v2 scope-aware)"}
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FOUNDERPILOT COMMAND CENTER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

for ($i = 0; $i -lt $scripts.Count; $i++) { 
    Write-Host "[$($i + 1)] $($scripts[$i].name)" -ForegroundColor Green -NoNewline
    Write-Host " - $($scripts[$i].desc)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "[0] Exit" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan

$choice = Read-Host "Enter the number of the script to run"
$num = 0
if ([int]::TryParse($choice, [ref]$num)) {
    if ($num -gt 0 -and $num -le $scripts.Count) {
        $selected = Join-Path $projectRoot $scripts[$num - 1].name
        if (Test-Path -LiteralPath $selected) {
            Write-Host "`nRunning: $($scripts[$num - 1].name)`n" -ForegroundColor Yellow
            & $selected
        } else {
            Write-Host "Script not found: $selected" -ForegroundColor Red
        }
    }
    if ($num -eq 0) { Write-Host "Exiting." -ForegroundColor Gray }
    if ($num -lt 0 -or $num -gt $scripts.Count) { Write-Host "Invalid selection." -ForegroundColor Red }
}
