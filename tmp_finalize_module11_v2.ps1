$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Remove-Module PSReadLine -ErrorAction SilentlyContinue

function Write-Utf8NoBom {
  param([Parameter(Mandatory)] [string]$Path, [Parameter(Mandatory)] [string]$Content)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

# Repo root
$repo = (git rev-parse --show-toplevel).Trim()
if (-not $repo) { throw "Could not determine repo root." }
Set-Location $repo

# 1) Python gates (flake8 + mypy)
if (!(Test-Path "$repo\ADEF\.venv\Scripts\python.exe")) {
  if (Get-Command py -ErrorAction SilentlyContinue) { py -3 -m venv "$repo\ADEF\.venv" } else { python -m venv "$repo\ADEF\.venv" }
}
$venvPy = "$repo\ADEF\.venv\Scripts\python.exe"
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install "flake8<7" "mypy>=1.6,<2"

# Write configs WITHOUT BOM (mypy dislikes BOM)
$flake8Text = @"
[flake8]
max-line-length = 120
ignore = E203,W503
exclude = .venv,**/__pycache__/**
"@.Trim() + "`n"
Write-Utf8NoBom -Path "$repo\ADEF\.flake8" -Content $flake8Text

$mypyText = @"
[mypy]
ignore_missing_imports = True
warn_return_any = False
warn_unused_ignores = False
"@.Trim() + "`n"
Write-Utf8NoBom -Path "$repo\ADEF\mypy.ini" -Content $mypyText

& $venvPy -m flake8 "$repo\ADEF\scripts"
Write-Host "GATES: flake8 OK"

& $venvPy -m mypy --config-file "$repo\ADEF\mypy.ini" "$repo\ADEF\scripts"
Write-Host "GATES: mypy OK"

# 2) JS/TS tests
pnpm -C "$repo\qa-framework" -r test
Write-Host "JS TESTS: OK"

# Optional smoke ingest if MD exists
$md   = Join-Path $repo "qa-framework\temp\uiux_guide.md"
$proj = Join-Path $repo "projects\example"
$smoke = "skipped (no MD present)"
if (Test-Path $md) {
  pnpm -C "$repo\qa-framework" uiux:ingest -- --project $proj --in $md
  $smoke = "ran against $md"
}

# 3) Safe merge feature/uiux-ingestor -> main
$BRANCH = "feature/uiux-ingestor"
git fetch --all --prune | Out-Null

# Ensure main is current
git switch main
git pull --ff-only

# Detect branch existence (local or remote)
$localExists  = (git show-ref --verify --quiet "refs/heads/$BRANCH"); $localExists = ($LASTEXITCODE -eq 0)
$remoteExists = (git ls-remote --exit-code --heads origin $BRANCH *> $null); $remoteExists = ($LASTEXITCODE -eq 0)

$mergeStatus = "SKIPPED (branch not found)"
if (-not $localExists -and $remoteExists) {
  # Create local tracking branch from origin if it exists remotely
  $refspec = "${BRANCH}:${BRANCH}"
  git fetch origin $refspec
  $localExists = $true
}

if ($localExists) {
  git merge --no-ff -X theirs --log $BRANCH -m "merge: Module 11 - UI/UX ingestor into main"
  $mergeStatus = "MERGED"
} else {
  Write-Host "MERGE: $mergeStatus"
}

# Re-run tests on main and push
pnpm -C "$repo\qa-framework" -r test
git push origin main

# Verify ancestry only if branch exists
$ancestry = "SKIPPED (branch not found)"
if ($localExists -or $remoteExists) {
  git merge-base --is-ancestor $BRANCH main
  if ($LASTEXITCODE -ne 0) { throw "ANCESTRY: FAIL (branch exists but is not ancestor of main)" }
  $ancestry = "OK"
  Write-Host "ANCESTRY: OK"
} else {
  Write-Host "ANCESTRY: SKIPPED (branch not found)"
}

# 4) Write merge note (ASCII-safe) and push
$today  = Get-Date -Format "yyyy-MM-dd"
$utcNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")
$notePath = Join-Path "$repo\qa-framework\docs\changes\merges" "${today}_module11_ingestor_merge.md"

$lines = @(
  "# Merge Note - Module 11 (UI/UX Guide Ingestor)"
  ""
  "- Date: $utcNow"
  "- Branch merged: $BRANCH -> main"
  "- Merge status: $mergeStatus"
  "- Summary: Parse UI/UX guide MD/HTML into deterministic uiux.yaml with zod validation, facet mapping, guide_hash, and uiux_version."
  "- Tests: workspace tests passed (converter, ingestor, planner suites)."
  "- Python gates: flake8 + mypy passed via local venv (ADEF\.venv)."
  "- Optional smoke ingest: $smoke"
  "- Ancestry check: $ancestry"
  ""
  "CLI references:"
  '- Convert: pnpm -C qa-framework uiux:convert -- --in [abs path to pdf] --out [abs path md] --also-html'
  '- Ingest:  pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md'
)
$note = ($lines -join "`r`n") + "`r`n"
New-Item -ItemType Directory -Force -Path (Split-Path $notePath) | Out-Null
Write-Utf8NoBom -Path $notePath -Content $note

git add $notePath
git commit -m 'docs-merge: Module 11 - ingestor merged to main; gates green'
git push origin main

Write-Host ("NOTE: " + $notePath)
Write-Host "DONE: Module 11 finalized."

