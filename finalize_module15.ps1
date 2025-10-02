$ErrorActionPreference = "Stop"
if (Get-Module -ListAvailable PSReadLine) { Remove-Module PSReadLine -ErrorAction SilentlyContinue }
$root = (git rev-parse --show-toplevel)
Set-Location $root

$branch = "feature/parity-scorer"
try { git switch -c $branch } catch { git switch $branch }

# Install/build/test (workspace)
pnpm -C qa-framework install
pnpm -C qa-framework -r build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed" }

# Python gates (flake8 + mypy)
$venv = Join-Path $root "ADEF/.venv"
if (-not (Test-Path $venv)) { python -m venv $venv }
& "$venv/Scripts/python.exe" -m pip install --upgrade pip
& "$venv/Scripts/pip.exe" install "flake8<7" "mypy>=1.6,<2"
& "$venv/Scripts/flake8.exe" ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "flake8 failed" }
Write-Host "GATES: flake8 OK"
& "$venv/Scripts/mypy.exe" --config-file ADEF/mypy.ini ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "mypy failed" }
Write-Host "GATES: mypy OK"

# Commit and push
git add -A
git commit -m "feat: module15 parity scorer"
git push -u origin $branch

# Merge into main
git switch main
git pull --ff-only
git merge --no-ff -X theirs --log $branch -m "merge: Module 15 - parity scorer into main"

# Sanity: re-run JS tests on main
pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed after merge" }

git push origin main

# Merge note
$today = (Get-Date).ToString('yyyy-MM-dd')
$noteDir = Join-Path $root "qa-framework/docs/changes/merges"
if (-not (Test-Path $noteDir)) { New-Item -ItemType Directory -Path $noteDir | Out-Null }
$note = Join-Path $noteDir "${today}_module15_parity_scorer_merge.md"
$lines = @(
  "# Merge: Module 15 - Parity Scorer",
  "- Branch: $branch",
  "- CLI: pnpm -C qa-framework --filter @pkg/parity run cli -- --project ./projects/example --tip Vizualizare --manual docs/modules/Vizualizare_Capitole_Grafice_Tehnice_Manual.md",
  "- Outputs: reports/<Area>_<Tip>_parity.json and .md",
  "- Thresholds: CRUD 95% / Visual 85%",
  "- Status: OK"
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($note, $lines, $utf8NoBom)

git add -f $note
git commit -m "docs-merge: add module15 parity scorer note; OK; OK"

git push origin main

Write-Host "GATES: flake8 OK"
Write-Host "GATES: mypy OK"
Write-Host "JS TESTS: OK"
Write-Host ("NOTE: {0}" -f $note)
Write-Host "MERGE: OK"
Write-Host "DONE."


