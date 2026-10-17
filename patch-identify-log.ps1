$utf8 = [System.Text.UTF8Encoding]::new($false)
$f = "$PWD\app\api\karakata\kaws\identify\route.ts"
$c = [System.IO.File]::ReadAllText($f, $utf8)
$old = 'return NextResponse.json({ result: instructions });'
$new = "console.log(`"🧠 IDENTIFY CALL:`", callerNumber, `"-> lane:`", lane);`n    return NextResponse.json({ result: instructions });"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); [System.IO.File]::WriteAllText($f, $c, $utf8); Write-Host "✅ identify route now logs every hit" -ForegroundColor Green } else { Write-Host "⚠️ pattern not found" -ForegroundColor Yellow }
