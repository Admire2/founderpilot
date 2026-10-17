$Host.UI.RawUI.WindowTitle = "FounderPilot Task & Backlog Admin"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$taskFile = "$PWD\tasks.json"

if (-not (Test-Path $taskFile)) {
    $initialTasks = @(
        @{ id = 1; title = "Sourcing Search (Advanced)"; desc = "AI search agent, 10-credit charge, new-tab quotes, geo-routing." },
        @{ id = 2; title = "LEX (Legal & IP Suite)"; desc = "NDA generator, Patent drafter, Compliance navigator." },
        @{ id = 3; title = "PRISM (Brand & Marketing)"; desc = "Logo, product renders, launch page, ads, packaging." },
        @{ id = 4; title = "CAPITAL / FundBridge"; desc = "Financial model, Investor matchmaker, lead fees." },
        @{ id = 5; title = "Affiliate Applications"; desc = "Send dossier emails to PCBWay, JLCPCB, Octopart." },
        @{ id = 6; title = "Recruit Regional Fabricators"; desc = "Onboard 1 real partner in Lagos, Nairobi, Cape Town." }
    )
    [System.IO.File]::WriteAllText($taskFile, ($initialTasks | ConvertTo-Json -Depth 3), $utf8)
}

while ($true) {
    Clear-Host
    Write-Host "===== FOUNDERPILOT BACKLOG & TASK ADMIN =====" -ForegroundColor Magenta
    $tasks = @()
    try { $tasks = Get-Content $taskFile -Raw | ConvertFrom-Json } catch {}
    
    if ($tasks.Count -eq 0) {
        Write-Host "All clear! No postponed tasks. Ecosystem is fully built." -ForegroundColor Green
        Read-Host "Press Enter to exit"
        break
    }

    Write-Host "Active Postponed Tasks:" -ForegroundColor Yellow
    $i = 1
    foreach ($t in $tasks) {
        Write-Host "[$i] $($t.title)" -ForegroundColor Cyan
        Write-Host "    -> $($t.desc)" -ForegroundColor DarkGray
        $i++
    }
    Write-Host "`n[A] Add new task to backlog" -ForegroundColor White
    Write-Host "[C] Complete a task (removes it from list)" -ForegroundColor Green
    Write-Host "[0] Exit" -ForegroundColor White

    $choice = Read-Host "`nChoose"
    if ($choice -eq "0") { break }
    
    if ($choice -eq "A") {
        $title = Read-Host "Task Title"
        $desc = Read-Host "Task Description"
        $newId = 1
        if ($tasks.Count -gt 0) { $newId = ($tasks | Measure-Object -Property id -Maximum).Maximum + 1 }
        $newTask = [PSCustomObject]@{ id = $newId; title = $title; desc = $desc }
        $tasks = @($tasks) + $newTask
        [System.IO.File]::WriteAllText($taskFile, ($tasks | ConvertTo-Json -Depth 3), $utf8)
        Write-Host "Task added to backlog!" -ForegroundColor Green
    }
    elseif ($choice -eq "C") {
        $idx = [int](Read-Host "Enter task number to COMPLETE and remove") - 1
        if ($idx -ge 0 -and $idx -lt $tasks.Count) {
            $completed = $tasks[$idx].title
            $tasks = @($tasks | Where-Object { $_.id -ne $tasks[$idx].id })
            [System.IO.File]::WriteAllText($taskFile, ($tasks | ConvertTo-Json -Depth 3), $utf8)
            Write-Host "'$completed' marked COMPLETE and dropped from backlog!" -ForegroundColor Green
        }
    }
    Read-Host "`nPress Enter to continue"
}