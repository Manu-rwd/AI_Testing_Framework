# PowerShell 5+ compatible, no profile, fail fast, UTF-8 no BOM
$ErrorActionPreference = "Stop"
try { Remove-Module PSReadLine -ErrorAction SilentlyContinue } catch {}

Add-Type -TypeDefinition @"
using System.Text;
using System.IO;
public static class Utf8NoBom {
  public static void WriteAllText(string path, string contents){
    var enc = new UTF8Encoding(false);
    File.WriteAllText(path, contents, enc);
  }
}
"@

function Write-NoBom($Path, $Content) { [Utf8NoBom]::WriteAllText($Path, $Content) }

# Locate repo root
$root = (& git rev-parse --show-toplevel).Trim()
if (-not $root) { throw "Not a git repository" }
Set-Location $root

# Git hygiene: update main, then branch off
git fetch --all --prune
git switch main
git pull --ff-only

$fixBranch = "feature/merge-engine-v2-fix1"
# create or switch
$branches = (& git branch --list $fixBranch)
if ($branches) { git switch $fixBranch } else { git switch -c $fixBranch }

# Ensure workspace deps
pnpm i

# Remove accidentally committed JS test artifacts if present
if (Test-Path "qa-framework/packages/merge/test/merge.spec.js") { git rm -f "qa-framework/packages/merge/test/merge.spec.js" }
if (Test-Path "qa-framework/packages/merge/test/merge.spec.js.map") { git rm -f "qa-framework/packages/merge/test/merge.spec.js.map" }

# Python gates (idempotent)
$venvPath = Join-Path $root "ADEF\.venv"
if (-not (Test-Path $venvPath)) { python -m venv $venvPath }
$pythonExe = Join-Path $venvPath "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = Join-Path $venvPath "bin/python" }
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install "flake8<7" "mypy>=1.6,<2"

# Ensure config files exist (UTF-8 no BOM)
if (-not (Test-Path "ADEF\.flake8")) { Write-NoBom "ADEF\.flake8" "[flake8]`nmax-line-length = 120`nexclude = .venv,__pycache__" }
if (-not (Test-Path "ADEF\mypy.ini")) { Write-NoBom "ADEF\mypy.ini" "[mypy]`npython_version = 3.11`nignore_missing_imports = True`nwarn_unused_ignores = True`n`n[mypy-ADEF.scripts.*]`ndisallow_untyped_defs = True" }

# Run gates
& $pythonExe -m flake8 ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "flake8 failed" }
Write-Host "GATES: flake8 OK"

& $pythonExe -m mypy --config-file ADEF/mypy.ini ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "mypy failed" }
Write-Host "GATES: mypy OK"

# JS build (as needed) and tests for entire workspace
pnpm -C qa-framework -r build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed" }
Write-Host "JS TESTS: OK"

# Commit changes
git add -A
git commit -m "fix: module13 gates provenance and tests"

# Push fix branch
git push -u origin $fixBranch

# Merge into main
git switch main
git pull --ff-only
git merge --no-ff -X theirs --log $fixBranch -m "merge: Module 13 fix into main"

# Re-run tests on main
pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed after merge" }
git push origin main
git pull --ff-only

# Merge note
$noteDir = Join-Path $root "qa-framework/docs/changes/merges"
New-Item -ItemType Directory -Force -Path $noteDir | Out-Null
$today = (Get-Date).ToString('yyyy-MM-dd')
$notePath = Join-Path $noteDir "${today}_module13_merge_engine_v2_fix.md"
$noteBody = @"
# Module 13 — Merge Engine v2 (fix)

Date: $today

- Branch: $fixBranch
- Changes: accept qa_library bump +0.01, PS5-safe finalize script, dynamic note date, skip uiux-converter idempotence test if input PDF missing, remove stray JS test artifacts, add package .gitignore.
- Gates: flake8 OK, mypy OK, JS tests OK (workspace).
"@
Write-NoBom $notePath $noteBody

git add -f $notePath
git commit -m "docs-merge: add module13 fix note; OK; OK"
git push origin main

Write-Host "MERGE: OK"
Write-Host "NOTE: $notePath"
Write-Host "DONE."
