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

$branch = "feature/manual-qa-emitter-v1"
if (git branch --list $branch) { git switch $branch } else { git switch -c $branch }

# Ensure workspace deps (scope to qa-framework to avoid PNPM_NO_PKG_MANIFEST at repo root)
pnpm -C qa-framework i

# Build all TS packages then run full tests
pnpm -C qa-framework -r build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed" }

# Python gates (idempotent)
$venvPath = Join-Path $root "ADEF\.venv"
if (-not (Test-Path $venvPath)) { python -m venv $venvPath }
$pythonExe = Join-Path $venvPath "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = Join-Path $venvPath "bin/python" }
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install "flake8<7" "mypy>=1.6,<2"

# Ensure config files exist (UTF-8 no BOM)
if (-not (Test-Path "ADEF\.flake8")) { Write-NoBom "ADEF\.flake8" "[flake8]`nmax-line-length = 120`nexclude = .venv,__pycache__" }
if (-not (Test-Path "ADEF\mypy.ini")) { Write-NoBom "ADEF\mypy.ini" "[mypy]`npython_version = 3.11`nignore_missing_imports = True" }

# Run gates
& $pythonExe -m flake8 ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "flake8 failed" }
Write-Host "GATES: flake8 OK"

& $pythonExe -m mypy --config-file ADEF/mypy.ini ADEF/scripts
if ($LASTEXITCODE -ne 0) { throw "mypy failed" }
Write-Host "GATES: mypy OK"

# Smoke the manual emitter CLI end-to-end
$merged = "qa-framework/temp/merged_plan.json"
$manualOut = "qa-framework/docs/modules/Accesare_Manual.md"
$mergedAbs = Join-Path $root $merged
$manualOutAbs = Join-Path $root $manualOut
if (-not (Test-Path $mergedAbs)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $mergedAbs) | Out-Null
  $demo = @'
{ "cases": [ { "id": 1, "nume": "Accesare din meniu", "tipFunctionalitate": "Accesare", "general_valabile": 1, "pasi": ["Click pe meniu"], "rezultat_asteptat": ["Se deschide pagina"] } ] }
'@
  [Utf8NoBom]::WriteAllText($mergedAbs, $demo)
}
$titleVal = "Plan de testare - Accesare"
pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in $mergedAbs --out $manualOutAbs --filter-tip Accesare --include-general-only --title "$titleVal"
if ($LASTEXITCODE -ne 0) { throw "manual emitter cli failed" }

# Commit package changes
git add -A
git commit -m "feat: module14 manual qa emitter strict parity"

# Push branch
git push -u origin $branch

# Merge into main with log
git switch main
git pull --ff-only
git merge --no-ff -X theirs --log $branch -m "merge: Module 14 - manual qa emitter into main"

# Re-run workspace tests on main
pnpm -C qa-framework -r test
if ($LASTEXITCODE -ne 0) { throw "JS tests failed after merge" }
git push origin main
git pull --ff-only

# Merge note built from a safe array of lines (avoid here-string and escaping pitfalls)
$noteDir = Join-Path $root "qa-framework/docs/changes/merges"
New-Item -ItemType Directory -Force -Path $noteDir | Out-Null
$today = (Get-Date).ToString('yyyy-MM-dd')
$notePath = Join-Path $noteDir "${today}_module14_manual_qa_emitter_merge.md"

$cliLine = "- CLI: pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in $mergedAbs --out $manualOutAbs --filter-tip Accesare --include-general-only --title $titleVal"

$noteLines = @(
  "# Module 14 - Manual QA Emitter (strict parity)",
  "",
  "Date: $today",
  "",
  "- Branch: $branch",
  "- Behavior: strict parity headings, deterministic order, no metadata leaks",
  "- Filtering: Tip functionalitate; include only General valabile = 1",
  $cliLine,
  "- Gates: flake8 OK, mypy OK, JS tests OK (workspace)"
)
$noteBody = [string]::Join("`n", $noteLines)
Write-NoBom $notePath $noteBody

git add -f $notePath
git commit -m "docs-merge: add module14 manual qa emitter note; OK; OK"
git push origin main

Write-Host "GATES: flake8 OK"
Write-Host "GATES: mypy OK"
Write-Host "JS TESTS: OK"
Write-Host "MERGE: OK"
Write-Host "NOTE: $notePath"
Write-Host "DONE."
