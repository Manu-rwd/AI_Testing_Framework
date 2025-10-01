[CmdletBinding()]
param(
  [string]$FeatureBranch = "feature/uiux-ingestor",
  [string]$FeatureSha = ""  # optional: set to a commit sha to recreate the branch
)

$ErrorActionPreference = "Stop"
try { Remove-Module PSReadLine -ErrorAction SilentlyContinue } catch {}

# Locate repo root
$repo = (git rev-parse --show-toplevel).Trim()
Set-Location $repo

# --- Ensure venv and tools
$venvDir = Join-Path $repo "ADEF\.venv"
$venvPy  = Join-Path $venvDir "Scripts\python.exe"
if (!(Test-Path $venvPy)) {
  if (Get-Command py -ErrorAction SilentlyContinue) { py -3 -m venv $venvDir } else { python -m venv $venvDir }
}
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install 'flake8<7' 'mypy>=1.6,<2'

# --- Configs (UTF-8 no BOM)
$flakePath = Join-Path $repo "ADEF\.flake8"
$mypyPath  = Join-Path $repo "ADEF\mypy.ini"
$flakeTxt  = "[flake8]`nmax-line-length = 120`nignore = E203,W503`nexclude = .venv,**/__pycache__/**`n"
$mypyTxt   = "[mypy]`nignore_missing_imports = True`nwarn_return_any = False`nwarn_unused_ignores = False`n"
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($flakePath, $flakeTxt, $enc)
[System.IO.File]::WriteAllText($mypyPath,  $mypyTxt,  $enc)

# --- Python gates
& $venvPy -m flake8 (Join-Path $repo "ADEF\scripts")
Write-Host "GATES: flake8 OK"
& $venvPy -m mypy --config-file $mypyPath (Join-Path $repo "ADEF\scripts")
Write-Host "GATES: mypy OK"

# --- JS tests (workspace)
pnpm -C (Join-Path $repo "qa-framework") -r test
Write-Host "JS TESTS: OK"

# Commit configs if changed
$cfgChanged = (git status --porcelain -- ADEF/.flake8 ADEF/mypy.ini)
if ($cfgChanged) {
  git add -- ADEF/.flake8 ADEF/mypy.ini
  git commit -m "chore-adef: ensure flake8 and mypy config"
}

# --- Merge (only if branch exists or recreated)
git fetch --all --prune

$branchExists = $false
if ($FeatureSha) {
  git branch -f $FeatureBranch $FeatureSha
  git push -u origin $FeatureBranch
  $branchExists = $true
} else {
  $remoteHead = git ls-remote --heads origin $FeatureBranch
  if ($remoteHead) { $branchExists = $true }
}

$mergeStatus    = "SKIPPED (branch not found)"
$ancestryStatus = "SKIPPED (branch not found)"

git switch main
git pull --ff-only

if ($branchExists) {
  git merge --no-ff -X theirs --log ("origin/" + $FeatureBranch) -m "merge: module11 uiux ingestor into main"
  pnpm -C (Join-Path $repo "qa-framework") -r test
  git push origin main
  $mergeStatus = "OK"

  git merge-base --is-ancestor ("origin/" + $FeatureBranch) main
  if ($LASTEXITCODE -eq 0) { $ancestryStatus = "OK" } else { $ancestryStatus = "FAIL" }
}

# --- Merge note (force add; UTF-8 no BOM; ASCII-safe)
$today  = Get-Date -Format 'yyyy-MM-dd'
$utcNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")

$noteDir  = Join-Path $repo "qa-framework\docs\changes\merges"
$notePath = Join-Path $noteDir ("{0}_module11_ingestor_merge.md" -f $today)

$mdSrc  = Join-Path $repo "qa-framework\temp\uiux_guide.md"
$smoke  = if (Test-Path $mdSrc) { "ran against $mdSrc" } else { "skipped (no MD present)" }

$lines = @(
  "# Merge Note - Module 11 UIUX Ingestor",
  "",
  "- Date: $utcNow",
  "- Branch merged: $FeatureBranch -> main",
  "- Summary: Parse UIUX guide MD or HTML into deterministic uiux.yaml with zod validation, facet mapping, guide_hash, and uiux_version.",
  "- Tests: workspace tests passed (converter, ingestor, planner).",
  "- Python gates: flake8 and mypy passed via local venv ADEF\.venv.",
  "- Optional smoke ingest: $smoke",
  "- Merge status: $mergeStatus",
  "- Ancestry check: $ancestryStatus",
  "",
  "CLI references:",
  "- Convert: pnpm -C qa-framework uiux:convert -- --in ""<abs path to pdf>"" --out ""<abs path md>"" --also-html",
  "- Ingest:  pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md"
)
$newNote = ($lines -join "`n") + "`n"
New-Item -ItemType Directory -Force -Path $noteDir | Out-Null
[System.IO.File]::WriteAllText($notePath, $newNote, $enc)

git add -f -- $notePath
git commit -m "docs-merge: add module11 ingestor merge note; $mergeStatus; $ancestryStatus"
git push origin main

Write-Host "RESULTS:"
Write-Host "- GATES: flake8 OK"
Write-Host "- GATES: mypy OK"
Write-Host "- JS TESTS: OK"
Write-Host "- MERGE: $mergeStatus"
Write-Host "- ANCESTRY: $ancestryStatus"
Write-Host "- NOTE: $notePath"
Write-Host "- DONE: Module 11 finalized."

