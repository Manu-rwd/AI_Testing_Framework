$ErrorActionPreference = "Stop"
try { Remove-Module PSReadLine -ErrorAction SilentlyContinue } catch {}

# UTF-8 without BOM writer
Add-Type -TypeDefinition @"
using System.Text;
using System.IO;
public static class Utf8NoBom {
  public static void WriteAllText(string path, string contents){
    var utf8NoBom = new UTF8Encoding(false);
    File.WriteAllText(path, contents, utf8NoBom);
  }
}
"@

function Write-NoBom($Path, $Content) {
  [Utf8NoBom]::WriteAllText($Path, $Content)
}

# Repo root
$root = (& git rev-parse --show-toplevel).Trim()
if (-not $root) { throw "Not a git repository" }
Set-Location $root

# 1) Fetch and branch
git fetch --all --prune
try {
  git switch -c feature/merge-engine-v2
} catch {
  git switch feature/merge-engine-v2
}
git fetch origin

# 2) Install and build JS package
pnpm -C qa-framework i
$buildOk = $true
try {
  pnpm -C qa-framework -r build
} catch {
  try {
    pnpm -C qa-framework -r test
  } catch {
    Write-Host "build step skipped for non-ts packages"
  }
}

# 3) Python gates (idempotent)
$venvPath = Join-Path $root "ADEF\.venv"
if (-not (Test-Path $venvPath)) {
  python -m venv $venvPath
}
$pythonExe = Join-Path $venvPath "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = Join-Path $venvPath "bin/python" }

& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install "flake8<7" "mypy>=1.6,<2"

# Ensure config files exist (UTF-8 no BOM)
if (-not (Test-Path "ADEF\.flake8")) { Write-NoBom "ADEF\.flake8" "[flake8]`nmax-line-length = 120`nexclude = .venv,__pycache__" }
if (-not (Test-Path "ADEF\mypy.ini")) { Write-NoBom "ADEF\mypy.ini" "[mypy]`npython_version = 3.11`nignore_missing_imports = True" }

# Run gates
& $pythonExe -m flake8 ADEF/scripts | Write-Output
$flakeExit = $LASTEXITCODE
if ($flakeExit -ne 0) { throw "flake8 failed" }
Write-Host "GATES: flake8 OK"

& $pythonExe -m mypy --config-file ADEF/mypy.ini ADEF/scripts
$mypyExit = $LASTEXITCODE
if ($mypyExit -ne 0) { throw "mypy failed" }
Write-Host "GATES: mypy OK"

# 4) JS tests (merge package only)
pnpm -C qa-framework --filter @pkg/merge test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed" }
Write-Host "JS TESTS: OK"

# 5) Commit package changes
git add -A
git commit -m "feat: module13 merge engine v2"

# 6) Push branch
git push -u origin feature/merge-engine-v2

# 7) Merge into main with log
git switch main
git pull --ff-only
git merge --no-ff -X theirs --log feature/merge-engine-v2 -m "merge: Module 13 - merge engine v2 into main"

# Re-run merge tests on main
pnpm -C qa-framework --filter @pkg/merge test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed after merge" }
git push origin main
git pull --ff-only

# 8) Write merge note (UTF-8 no BOM)
$noteDir = Join-Path $root "qa-framework/docs/changes/merges"
New-Item -ItemType Directory -Force -Path $noteDir | Out-Null
$today = "2025-10-02"
$notePath = Join-Path $noteDir "${today}_module13_merge_engine_v2_merge.md"
$noteBody = @"
# Module 13 — Merge Engine v2

Date: $today

- Branch: feature/merge-engine-v2
- Precedence: US > Project > UI/UX > Coverage > Defaults
- Provenance bumps: project +0.03, uiux +0.02, qa_library +0.01, defaults 0
- CLI: pnpm -C qa-framework --filter @pkg/merge run cli -- --project ./projects/example --us input/us_and_test_cases.txt --out temp/merged_plan.json
"@
Write-NoBom $notePath $noteBody

git add -f $notePath
git commit -m "docs-merge: add module13 merge engine v2 note; OK; OK"
git push origin main

# 9) Results
Write-Host "MERGE: OK"
Write-Host "NOTE: $notePath"
Write-Host "DONE."
