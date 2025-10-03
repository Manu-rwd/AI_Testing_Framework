$ErrorActionPreference = 'Stop'
Write-Host 'Module 16 — Manual Emitter Tuning'

# If anything fails, fix all the things until all green (gates, tests, parity thresholds), then continue.

function Invoke-Cmd($cmd) {
  Write-Host "→ $cmd"
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command",$cmd -NoNewWindow -PassThru -Wait
  if ($p.ExitCode -ne 0) { throw "Command failed: $cmd" }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $root) { $root = (Get-Location).Path }
$repo = $root

Invoke-Cmd 'git fetch --all --prune'
Invoke-Cmd 'git switch main'
Invoke-Cmd 'git pull'

# create or switch
try { Invoke-Cmd 'git switch -c feature/manual-emitter-tuning' } catch { Invoke-Cmd 'git switch feature/manual-emitter-tuning' }

Invoke-Cmd 'pnpm -C qa-framework install'
Invoke-Cmd 'pnpm -C qa-framework -r build'
Invoke-Cmd 'pnpm -C qa-framework -r test'

$plan = Join-Path $repo 'qa-framework\temp\merged_plan.json'
$modViz = Join-Path $repo 'qa-framework\docs\modules\Vizualizare_Manual.md'
$modAdd = Join-Path $repo 'qa-framework\docs\modules\Adaugare_Manual.md'
$modMod = Join-Path $repo 'qa-framework\docs\modules\Modificare_Manual.md'

New-Item -ItemType Directory -Force -Path (Split-Path $modViz) | Out-Null

$cliViz = "pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in `"$plan`" --out `"$modViz`" --filter-tip Vizualizare --include-general-only --title 'Plan de testare — Vizualizare'"
$cliAdd = "pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in `"$plan`" --out `"$modAdd`" --filter-tip Adaugare --include-general-only --title 'Plan de testare — Adaugare'"
$cliMod = "pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in `"$plan`" --out `"$modMod`" --filter-tip Modificare --include-general-only --title 'Plan de testare — Modificare'"

Invoke-Cmd $cliViz
Invoke-Cmd $cliAdd
Invoke-Cmd $cliMod

function Invoke-Parity($tip, $manual) {
  $proj = Join-Path $repo 'qa-framework\projects\example'
  $cmd = "pnpm -C qa-framework --filter @pkg/parity run cli -- --project `"$proj`" --tip `"$tip`" --manual `"$manual`""
  Write-Host "Scoring $tip"
  $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command",$cmd -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { throw "Parity threshold not met for $tip" }
}

Invoke-Parity 'Vizualizare' $modViz
Invoke-Parity 'Adaugare' $modAdd
Invoke-Parity 'Modificare' $modMod

git add -A
git commit -m 'feat: module16 manual emitter tuning'
git push --set-upstream origin feature/manual-emitter-tuning

try { Invoke-Cmd 'git switch main'; Invoke-Cmd 'git merge --ff-only feature/manual-emitter-tuning'; Invoke-Cmd 'git push' } catch { Write-Host 'Merge to main skipped (non-FF). Create PR instead.' }

$mergeNoteDir = Join-Path $repo 'qa-framework\docs\changes\merges'
New-Item -ItemType Directory -Force -Path $mergeNoteDir | Out-Null
$date = Get-Date -Format 'yyyy-MM-dd'
$notePath = Join-Path $mergeNoteDir ("${date}_module16_manual_emitter_tuning.md")
$noteLines = @(
  '# Merge: Module 16 - Manual Emitter Tuning',
  '- Branch: feature/manual-emitter-tuning',
  '- Behavior: overlay families, 2-lines/column, ASC+DESC sorting, presence + generic table elements, resilience, responsive, pagination controls, auth split, provenance',
  '- Parity: >=95% on Vizualizare/Adaugare/Modificare',
  "- CLI (example): 'pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in qa-framework\\temp\\merged_plan.json --out qa-framework\\docs\\modules\\Vizualizare_Manual.md --filter-tip Vizualizare --include-general-only --title \"Plan de testare - Vizualizare\"'"
)
$noteContent = ($noteLines -join "`n") + "`n"
Set-Content -LiteralPath $notePath -Value $noteContent -NoNewline

Write-Host 'DONE.'


