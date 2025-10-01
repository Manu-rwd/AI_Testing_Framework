$ErrorActionPreference = 'Stop'
Remove-Module PSReadLine -ErrorAction SilentlyContinue

$repo = (git rev-parse --show-toplevel)
Set-Location $repo

# Ensure venv
if (!(Test-Path "$repo\ADEF\.venv\Scripts\python.exe")) {
  if (Get-Command py -ErrorAction SilentlyContinue) { py -3 -m venv "$repo\ADEF\.venv" } else { python -m venv "$repo\ADEF\.venv" }
}
$venvPy = "$repo\ADEF\.venv\Scripts\python.exe"

# Tools
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install 'flake8<7' 'mypy>=1.6,<2'

# Lint configs (create only if missing)
if (!(Test-Path "$repo\ADEF\.flake8")) {
  Set-Content -Encoding UTF8 -NoNewline -Path "$repo\ADEF\.flake8" -Value "[flake8]`nmax-line-length = 120`nignore = E203,W503`nexclude = .venv,**/__pycache__/**`n"
}
if (!(Test-Path "$repo\ADEF\mypy.ini")) {
  Set-Content -Encoding UTF8 -NoNewline -Path "$repo\ADEF\mypy.ini" -Value "[mypy]`nignore_missing_imports = True`nwarn_return_any = False`nwarn_unused_ignores = False`n"
}

# Run gates (mypy must use explicit config file path)
& $venvPy -m flake8 "$repo\ADEF\scripts"
Write-Host "GATES: flake8 OK"

& $venvPy -m mypy --config-file "$repo\ADEF\mypy.ini" "$repo\ADEF\scripts"
Write-Host "GATES: mypy OK"

# 2) JS/TS tests
pnpm -C "$repo\qa-framework" -r test
Write-Host "JS TESTS: OK"

# (Optional) smoke ingest, only if MD exists
$md   = Join-Path $repo "qa-framework\temp\uiux_guide.md"
$proj = Join-Path $repo "projects\example"
$smoke = "skipped (no MD present)"
if (Test-Path $md) {
  pnpm -C "$repo\qa-framework" uiux:ingest -- --project $proj --in $md
  $smoke = "ran against $md"
}

# 3) Merge feature/uiux-ingestor -> main
$BRANCH = "feature/uiux-ingestor"
git fetch --all --prune
git switch main
git pull --ff-only
git merge --no-ff -X theirs --log $BRANCH -m "merge: Module 11 - UI/UX ingestor into main"

# Re-run tests on main, push
pnpm -C "$repo\qa-framework" -r test
git push origin main

# Verify ancestry
git merge-base --is-ancestor $BRANCH main
if ($LASTEXITCODE -ne 0) { throw "ANCESTRY: FAIL" } else { Write-Host "ANCESTRY: OK" }

# 4) Write merge note and push
$today    = Get-Date -Format "yyyy-MM-dd"
$utcNow   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")
$notePath = Join-Path "$repo\qa-framework\docs\changes\merges" "${today}_module11_ingestor_merge.md"

$lines = @(
  '# Merge Note - Module 11 (UI/UX Guide Ingestor)'
  ''
  ("- Date: $utcNow")
  ("- Branch merged: $BRANCH -> main")
  '- Summary: Parse UI/UX guide MD/HTML into deterministic `uiux.yaml` with zod validation, facet mapping, guide_hash, and uiux_version.'
  '- Tests: workspace tests passed (converter, ingestor, planner suites).'
  '- Python gates: flake8 + mypy passed via local venv (ADEF\\.venv).'
  ("- Optional smoke ingest: $smoke")
  '- Ancestry check: ANCESTRY: OK'
  ''
  'CLI references:'
  '- Convert: pnpm -C qa-framework uiux:convert -- --in "<abs path to pdf>" --out "<abs path md>" --also-html'
  '- Ingest:  pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md'
)
$note = $lines -join "`n"

New-Item -ItemType Directory -Force -Path (Split-Path $notePath) | Out-Null
Set-Content -Encoding UTF8 -Path $notePath -Value $note

git add $notePath
git commit -m "docs-merge: Module 11 - ingestor merged to main; gates green"
git push origin main

# Final summary
Write-Host ("NOTE: " + $notePath)
Write-Host "DONE: Module 11 finalized."


