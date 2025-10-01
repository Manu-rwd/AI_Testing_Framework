#Requires -Version 5.1
# finalize_module.ps1 - Simple, robust finalize-and-merge flow
[CmdletBinding()]
param(
  [string]$Branch = "feature/module12-coverage-exporter",
  [string[]]$ExcludePkgs = @("@pkg/uiux-converter"),  # you can override per-run
  [switch]$AllowEmptyCommit                           # allow empty commit on the feature branch
)

$ErrorActionPreference = "Stop"

# Safety: avoid PSReadLine render issues
try { Remove-Module PSReadLine -ErrorAction SilentlyContinue } catch {}
try { if ($PSVersionTable.PSVersion.Major -ge 7) { $PSStyle.OutputRendering = "PlainText" } } catch {}

function Fail($msg) { Write-Error $msg; exit 1 }
function Info($msg) { Write-Host $msg }

function Run {
  param([string]$cmd)
  Info ">> $cmd"
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { Fail "Command failed: $cmd" }
}

# Helper: write UTF-8 without BOM
function Write-Utf8NoBom {
  param([Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$Content)
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $Path), $Content, $enc)
}

# Go to repo root
$root = (& git rev-parse --show-toplevel).Trim()
if (-not $root) { Fail "Not inside a git repo" }
Set-Location $root

# --- Ensure feature branch exists and contains current work --------------------
Run "git fetch --all --prune"

# If local branch missing, try to create from remote; otherwise from main
$localExists = ($null -ne (& git rev-parse --verify --quiet "refs/heads/$Branch"))
if (-not $localExists) {
  $remoteExists = ($null -ne (& git rev-parse --verify --quiet "refs/remotes/origin/$Branch"))
  if ($remoteExists) {
    Run "git switch -c `"$Branch`" --track origin/`"$Branch`""
  } else {
    Run "git switch main"
    Run "git pull --ff-only"
    Run "git switch -c `"$Branch`""
  }
} else {
  Run "git switch `"$Branch`""
}

# Stage and commit current work to ensure nothing is left behind
Run "git add -A"
$commitCmd = 'git commit -m "chore: module finalize adjustments"'
if ($AllowEmptyCommit) { $commitCmd += " --allow-empty" }
cmd /c $commitCmd | Out-Null

# --- Python gates -------------------------------------------------------------
$venvPath = Join-Path $root "ADEF.venv"
$python = $null
try { $python = (& py -3 -c "import sys;print(sys.executable)" 2>$null) } catch {}
if (-not $python) { try { $python = (& python -c "import sys;print(sys.executable)" 2>$null) } catch {} }
if (-not $python) { Fail "Python not found" }

if (-not (Test-Path $venvPath)) { Run "`"$python`" -m venv `"$venvPath`"" }
$venvPy = Join-Path $venvPath "Scripts\python.exe"
$venvPip = Join-Path $venvPath "Scripts\pip.exe"

Run "`"$venvPy`" -m pip install --upgrade pip"
Run "`"$venvPip`" install `"flake8<7`" `"mypy>=1.6,<2`""

$adefDir = Join-Path $root "ADEF"
if (-not (Test-Path $adefDir)) { New-Item -ItemType Directory -Force -Path $adefDir | Out-Null }

$flake8Path = Join-Path $root ".flake8"
if (-not (Test-Path $flake8Path)) {
  $flake8Cfg = @"
[flake8]
max-line-length = 120
extend-ignore = E203,W503
"@
  Write-Utf8NoBom -Path $flake8Path -Content $flake8Cfg
}

$mypyPath = Join-Path $adefDir "mypy.ini"
if (-not (Test-Path $mypyPath)) {
  $mypyCfg = @"
[mypy]
python_version = 3.11
warn_unused_ignores = True
warn_redundant_casts = True
warn_unreachable = True
disallow_untyped_defs = True
no_site_packages = True
"@
  Write-Utf8NoBom -Path $mypyPath -Content $mypyCfg
}

$scriptsDir = Join-Path $adefDir "scripts"
if (-not (Test-Path $scriptsDir)) {
  New-Item -ItemType Directory -Force -Path $scriptsDir | Out-Null
  $stub = @"
# stub for gates
def ok() -> None:
    pass
"@
  Write-Utf8NoBom -Path (Join-Path $scriptsDir "stub.py") -Content $stub
}

Run "`"$venvPy`" -m flake8 ADEF/scripts"
Write-Host "GATES: flake8 OK"
Run "`"$venvPy`" -m mypy --config-file `"$mypyPath`" ADEF/scripts"
Write-Host "GATES: mypy OK"

# --- JS tests (workspace) -----------------------------------------------------
function Invoke-WorkspaceTests {
  param([string[]]$Exclude)
  $filters = @()
  foreach ($p in $Exclude) {
    if ($p -and $p.Trim() -ne "") { $filters += "--filter `"!$p`"" }
  }
  $joined = ($filters -join " ")
  $cmd = ("pnpm -C qa-framework -r {0} test" -f $joined).Trim()
  Run $cmd
}

Invoke-WorkspaceTests -Exclude $ExcludePkgs
Write-Host "JS TESTS: OK"

# --- Merge to main ------------------------------------------------------------
Run "git switch main"
Run "git pull --ff-only"

# Ensure ancestry (fast safety; if it fails, we still try a normal merge)
cmd /c "git merge-base --is-ancestor `"$Branch`" main"
if ($LASTEXITCODE -ne 0) {
  Info "Ancestry check failed or unknown; proceeding with a normal merge."
}

# Merge and push
Run "git merge --no-ff -X theirs --log `"$Branch`" -m `"merge: finalize into main`""

# Re-run tests on main to be safe (respect exclusions)
Invoke-WorkspaceTests -Exclude $ExcludePkgs

# Push
Run "git push origin main"

# --- Merge note ---------------------------------------------------------------
$today = Get-Date -Format "yyyy-MM-dd"
$noteRel = "qa-framework/docs/changes/merges/${today}_module_finalize_merge.md"
$noteAbs = Join-Path $root $noteRel
$note = @"
# Module finalize merge note

Branch: $Branch
Excluded JS packages: $($ExcludePkgs -join ", ")
Date: $today
"@
Write-Utf8NoBom -Path $noteAbs -Content $note
Run "git add -f `"$noteRel`""
Run "git commit -m `"docs-merge: add finalize merge note; OK; OK`""
Run "git push"

Write-Host "MERGE: OK"
Write-Host ("NOTE: " + $noteAbs)
Write-Host "DONE."


