$ErrorActionPreference = 'Stop'
Set-Location 'D:\Proj\Ai_Testing_Framework'

if (!(Test-Path '.\tmp')) { New-Item -ItemType Directory -Path '.\tmp' | Out-Null }

try {
  & .\finalize_module.ps1 -ModuleNumber 12 -NoteSlug planner -FeatureBranch feature/uiux-planner -PackagePaths 'qa-framework/packages/planner' -AutoReconstruct *>&1 |
    Tee-Object -FilePath '.\tmp\finalize_module_12.log'

  if ($LASTEXITCODE -eq 0) {
    'OK' | Out-File -FilePath '.\tmp\finalize_module_12.status' -Encoding utf8
  } else {
    'FAIL' | Out-File -FilePath '.\tmp\finalize_module_12.status' -Encoding utf8
  }
}
catch {
  'FAIL' | Out-File -FilePath '.\tmp\finalize_module_12.status' -Encoding utf8
  ($_ | Out-String) | Out-File -FilePath '.\tmp\finalize_module_12.log' -Encoding utf8 -Append
}


