[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
try { Remove-Module PSReadLine -ErrorAction SilentlyContinue } catch {}

# Repo root
$repo = (git rev-parse --show-toplevel).Trim()
Set-Location $repo

$FeatureBranch = "feature/uiux-ingestor"
$sha = ""

# Prefer the most recent commit on 'main' that touched the ingestor package
$sha = (git log -n 1 --format=%H main -- "qa-framework/packages/uiux-ingestor" 2>$null)

# Fallback: commit on 'main' mentioning ingestor/uiux
if (-not $sha) {
  $sha = (git log -n 1 --format=%H main --grep="ingestor" --grep="uiux" 2>$null)
}

# Fallback: last commit on 'main' touching the converter (early Module 11 work often touched both)
if (-not $sha) {
  $sha = (git log -n 1 --format=%H main -- "qa-framework/packages/uiux-converter" 2>$null)
}

# Final fallback: if remote ref already exists for any reason, use it
if (-not $sha) {
  $sha = (git rev-parse --verify --quiet ("origin/" + $FeatureBranch))
}

if (-not $sha) {
  Write-Error "Could not determine a suitable tip commit on 'main' for Module 11. Inspect 'git log --oneline main' and rerun."
}

# Show what we found (for audit)
$short = (& git show -s --format="%h %s" $sha)
Write-Host ("AUTO: using commit " + $short)

# Re-run the main finalize script with -FeatureSha to recreate the branch, verify ancestry, and update the note
powershell -NoProfile -ExecutionPolicy Bypass -File .\finalize_module11.ps1 -FeatureSha $sha


