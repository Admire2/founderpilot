# SCRIPT HYGIENE - FounderPilot
RULE: app/suite/office/* pages = whole-file writes ONLY. No .Replace patches, ever.
RETIRED (never run): Sprint A patch script; first-gen office creator; sidebar regex script; cart patch.
SAFE FOREVER: five idempotent rewrites; SQL migrations; office-modes add (guarded); build+deploy.
After ANY one-shot patch succeeds: archive it to scripts-retired/ and clear PSReadLine history.

RULE 2: NEVER .catch() on a Supabase builder - await it inside try/catch.
RULE 3: Paths with [brackets] break Test-Path/Get-ChildItem wildcards - use -LiteralPath or Get-ChildItem -Filter on the parent.
