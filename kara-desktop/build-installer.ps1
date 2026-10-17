# Kara Office Release Pipeline - run this anytime to produce a fresh installer
$root = "C:\Users\great\founderpilot"
Set-Location "$root\kara-office-mvp\kara-office-ui"
npm run build
Copy-Item -Path "dist" -Destination "$root\kara-desktop\renderer" -Recurse -Force
Set-Location "$root\kara-desktop"
npm run build-win
Write-Host "INSTALLER READY: $root\kara-desktop\dist\Kara Office Setup 1.0.0.exe" -ForegroundColor Green
