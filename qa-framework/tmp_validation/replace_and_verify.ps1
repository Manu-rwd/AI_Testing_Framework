# 1) Pre-flight: ensure repo root + required paths exist
if (!(Test-Path -LiteralPath ".git")) { throw "Not at repo root (missing .git). Open the repo root and re-run." }
if (!(Test-Path -LiteralPath "qa-framework")) { throw "Missing qa-framework workspace folder." }
if (!(Test-Path -LiteralPath "qa-framework\tmp_validation\fixed_Accesare_Automation.csv")) { throw "Fixed CSV not found at qa-framework\tmp_validation\fixed_Accesare_Automation.csv" }

# 2) Create branch
$branch = "chore/replace-fixed-accesare-csv"
git switch -c $branch 2>$null
if ($LASTEXITCODE -ne 0) {
  git switch $branch
  if ($LASTEXITCODE -ne 0) { throw "Branch creation/switch failed." }
}

# 3) Backup the old CSV and replace with the fixed one (preserve bytes)
$src = "qa-framework\tmp_validation\fixed_Accesare_Automation.csv"
$dst = "qa-framework\tmp_exports\Accesare_Automation.csv"
if (Test-Path $dst) { Copy-Item -LiteralPath $dst -Destination ($dst + ".backup") -Force }
Copy-Item -LiteralPath $src -Destination $dst -Force
if ($LASTEXITCODE -ne 0) { throw "Copy replacement failed." }

# 4) Build the workspace
Push-Location qa-framework
pnpm -w build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Build failed." }
Pop-Location

# 5) Run Module 9 validation on this file — expect OK (issues=0)
$validateCmd = "qa-framework\packages\planner\dist\cli\index.js"
node $validateCmd plan:validate --input "qa-framework\tmp_exports\Accesare_Automation.csv" --format text --module Accesare
if ($LASTEXITCODE -ne 0) { throw "Validation failed on fixed CSV. Check output above." }

# 6) Review columns idempotency check (hash before/after `plan:review:init --inPlace`)
$csv = "qa-framework\tmp_exports\Accesare_Automation.csv"
$csvRel = "tmp_exports\Accesare_Automation.csv"
$h1 = (Get-FileHash -LiteralPath $csv -Algorithm SHA256).Hash
node $validateCmd plan:review:init --input $csvRel --inPlace
if ($LASTEXITCODE -ne 0) { throw "plan:review:init failed." }
$h2 = (Get-FileHash -LiteralPath $csv -Algorithm SHA256).Hash
if ($h1 -ne $h2) { throw "Idempotency failed: CSV bytes changed after review:init. Before=$h1 After=$h2" }

# 7) Commit (PowerShell-safe message) and push
git add -A
git commit -m 'chore(csv): replace Accesare_Automation.csv with validated fixed file (BOM+CRLF, header suffix, compact JSON, selectors, review values)'
if ($LASTEXITCODE -ne 0) { throw "Commit failed." }

git push -u origin $branch
if ($LASTEXITCODE -ne 0) { throw "Push failed." }

# 8) Print PR URL for convenience
$origin = git remote get-url origin
$prUrl = $null
if ($origin -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/\.]+)') {
  $owner = $Matches['owner']; $repo = $Matches['repo']
  $prUrl = "https://github.com/$owner/$repo/pull/new/$branch"
}
if ($null -ne $prUrl) {
  Write-Host ("PR Link: " + $prUrl)
} else {
  Write-Host ("PR Link: Open your Git provider and create a PR from branch $branch")
}

# 9) Final summary
Write-Host "\nSummary:"
Write-Host "- File replaced: qa-framework/tmp_exports/Accesare_Automation.csv"
Write-Host "- Validation: OK (Totals: files=1 issues=0)"
Write-Host "- Review suffix idempotency: OK (SHA256 unchanged)"
Write-Host ("- Branch: " + $branch)
if ($null -ne $prUrl) {
  Write-Host ("- PR: " + $prUrl)
} else {
  Write-Host "- PR: (see above)"
}


