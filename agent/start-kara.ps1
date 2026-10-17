Write-Host "=== 🧠 SMART STARVE MODE ACTIVATED ===" -ForegroundColor Cyan

# 1. Starve background apps (protecting critical Windows processes)
$protectedApps = @("System", "Idle", "svchost", "explorer", "dwm", "csrss", "winlogon", "lsass", "services", "MsMpEng", "WmiPrvSE", "SearchIndexer", "fontdrvhost", "ShellExperienceHost")
$allProcesses = Get-Process -ErrorAction SilentlyContinue

foreach ($proc in $allProcesses) {
    if ($protectedApps -contains $proc.Name -or $proc.Name -eq "node") { 
        continue 
    }
    try {
        if ($proc.PriorityClass -ne 'Idle') {
            $proc.PriorityClass = 'Idle'
        }
    } catch {
        # Ignore protected processes
    }
}
Write-Host "✅ Background apps are now STARVED (Idle Priority)." -ForegroundColor Green

# 2. Check if Kara is already running, if so, boost her. If not, start her.
$kara = Get-Process node -ErrorAction SilentlyContinue | Sort-Object WorkingSet64 -Descending | Select-Object -First 1

if ($kara) {
    $kara.PriorityClass = 'High'
    Write-Host "🚀 Kara (PID: $($kara.Id)) boosted to HIGH PRIORITY!" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting Kara agent..." -ForegroundColor Yellow
    npm run start
}

Write-Host "`n=== ✅ SYSTEM OPTIMIZED & READY ===" -ForegroundColor Cyan
