<# 
  repo_snapshot.ps1  (ASCII-only, PowerShell 5.1 compatible)
  Creates a Markdown snapshot of the current Git repository.
  Output: repo_snapshot.md (UTF-8) in repo root, unless -OutFile is provided.

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\repo_snapshot.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\repo_snapshot.ps1 -OutFile ".\snapshots\repo_snapshot_$(Get-Date -Format yyyyMMdd_HHmmss).md" -CommitCount 50 -Since "21 days ago"
#>

[CmdletBinding()]
param(
  [string]$OutFile,
  [int]$CommitCount = 30,
  [string]$Since
)

function Assert-GitRepo {
  $root = git rev-parse --show-toplevel 2>$null
  if (-not $root) {
    Write-Error "Not inside a Git repository. cd into a repo and re-run."
    exit 1
  }
  return $root.Trim()
}

function Run([string]$cmd, [switch]$AllowFail) {
  try {
    $out = Invoke-Expression $cmd
    return $out
  } catch {
    if (-not $AllowFail) { throw }
    return $null
  }
}

$repoRoot = Assert-GitRepo
Set-Location $repoRoot

if (-not $OutFile) { $OutFile = Join-Path $repoRoot "repo_snapshot.md" }

# Basic repo info
$repoName  = Split-Path $repoRoot -Leaf
$curBranch = (git rev-parse --abbrev-ref HEAD).Trim()
$headSha   = (git rev-parse --short HEAD).Trim()
$headInfo  = git show -s --date=iso --format="%h | %ad | %an | %s" HEAD

# Remotes
$remotes = git remote -v

# Status & diffs
$statusRaw     = git status --porcelain=1
$stagedStat    = git diff --cached --stat
$stagedNames   = git diff --cached --name-status
$unstagedStat  = git diff --stat
$unstagedNames = git diff --name-status

# Branches & tags
$branches = git branch -vv --no-abbrev
$tags     = git tag --sort=-creatordate | Select-Object -First 20

# Submodules (if any)
$submodules = git submodule status 2>$null

# Recent commits
$sinceArg = $null
if ($Since) { $sinceArg = "--since=""$Since""" }
$logCmd = "git log --date=iso $sinceArg --pretty=format:'%h | %ad | %an | %d`n    %s' --decorate=short -n $CommitCount"
$recentCommits = Invoke-Expression $logCmd

# Recently changed files (dedup, last 500 entries -> unique)
$recentFiles = git log $sinceArg --name-only --pretty=format: | Where-Object { $_ -ne "" } | Select-Object -First 500 | Sort-Object -Unique

# GitHub CLI (optional) — open PRs
$hasGh = $false
try { $null = gh --version 2>$null; $hasGh = $true } catch {}
$prs = $null
if ($hasGh) {
  try {
    $prs = gh pr list --limit 30 --json number,title,headRefName,baseRefName,author,updatedAt,state,url | ConvertFrom-Json
  } catch { $prs = $null }
}

# Build Markdown
$md = @()

$md += ('# Repo Snapshot - {0}' -f $repoName)
$md += ''
$md += ('**Generated:** {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'))
$md += ('**Root:** {0}' -f $repoRoot)
$md += ''
$md += '## Head'
$md += ('- Branch: `{0}`' -f $curBranch)
$md += ('- HEAD: `{0}`' -f $headSha)
$md += ''
$md += '```'
$md += $headInfo
$md += '```'
$md += ''
$md += '## Remotes'
$md += '```'
$md += $remotes
$md += '```'
$md += ''
$md += '## Status (porcelain)'
$md += '```'
$md += ($statusRaw -join "`n")
$md += '```'
$md += ''
$md += '## Diff - Staged (stat)'
$md += '```'
$md += ($stagedStat -join "`n")
$md += '```'
$md += ''
$md += '## Diff - Staged (name-status)'
$md += '```'
$md += ($stagedNames -join "`n")
$md += '```'
$md += ''
$md += '## Diff - Unstaged (stat)'
$md += '```'
$md += ($unstagedStat -join "`n")
$md += '```'
$md += ''
$md += '## Diff - Unstaged (name-status)'
$md += '```'
$md += ($unstagedNames -join "`n")
$md += '```'
$md += ''
$md += '## Branches (vv)'
$md += '```'
$md += ($branches -join "`n")
$md += '```'
$md += ''
$md += '## Latest Tags (20)'
$md += '```'
$md += ($tags -join "`n")
$md += '```'
$md += ''

if ($submodules) {
  $md += '## Submodules'
  $md += '```'
  $md += ($submodules -join "`n")
  $md += '```'
  $md += ''
}

$md += '## Recent Commits'
if ($Since) { $md += ('_Filtered since: **{0}**_' -f $Since) }
$md += '```'
$md += ($recentCommits -join "`n")
$md += '```'
$md += ''
$md += '## Recently Changed Files'
$md += '```'
$md += ($recentFiles -join "`n")
$md += '```'
$md += ''

if ($prs) {
  $md += '## Open Pull Requests (via GitHub CLI)'
  foreach ($pr in $prs) {
    $line = ('- #{0} {1} ({2} -> {3}), by {4} — updated {5} {6}' -f `
      $pr.number, $pr.title, $pr.headRefName, $pr.baseRefName, $pr.author.login, $pr.updatedAt, $pr.url)
    $md += $line
  }
  $md += ''
}

# Write UTF-8 (no BOM)
$mdText = ($md -join "`n").TrimEnd() + "`n"
$dir = Split-Path $OutFile -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[System.Text.Encoding]::UTF8.GetBytes($mdText) | Set-Content -LiteralPath $OutFile -Encoding Byte

Write-Host ("Snapshot written to: {0}" -f $OutFile)
