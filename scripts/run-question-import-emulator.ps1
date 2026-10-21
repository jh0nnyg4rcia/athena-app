param(
  [string]$JavaPath = 'C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin/java.exe',
  [string]$JarPath = "$env:USERPROFILE/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar",
  [string]$ReportDirectory = ([IO.Path]::Combine([IO.Path]::GetTempPath(), 'athena-emulator-' + [guid]::NewGuid().ToString()))
)
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $JavaPath) -or !(Test-Path -LiteralPath $JarPath)) { throw 'Java 21 e JAR local são obrigatórios; este script não instala nem baixa arquivos.' }
$repoTask = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
New-Item -ItemType Directory -Path $ReportDirectory -Force | Out-Null
$previousEmulatorHost = $env:FIRESTORE_EMULATOR_HOST
$emulatorTask = $null
Push-Location -LiteralPath $repoTask
try {
  $emulatorTask = Start-Process -FilePath $JavaPath -ArgumentList @('-jar', ('"' + $JarPath + '"'), '--host', '127.0.0.1', '--port', '8189', '--project_id', 'demo-athena-question-import', '--single_project_mode', 'true', '--single_project_mode_error', 'true') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $ReportDirectory 'emulator.log') -RedirectStandardError (Join-Path $ReportDirectory 'emulator-error.log')
  $env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8189'
  node --input-type=module -e "for(let i=0;i<30;i++){try{const r=await fetch('http://127.0.0.1:8189/',{signal:AbortSignal.timeout(500)});if(r.status!==200)throw Error('Endpoint inesperado');break;}catch(e){if(i===29)throw e;await new Promise(r=>setTimeout(r,200));}}"
  if ($LASTEXITCODE -ne 0) { throw 'Emulador local não ficou disponível; testes não executados.' }
  $emulatorTask.Refresh()
  if ($emulatorTask.HasExited) { throw 'Emulador iniciado por este teste encerrou; não usar outro serviço na porta.' }
  node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 scripts/test-question-import-emulator.mjs scripts/test-question-admin-emulator.ts scripts/test-question-snapshot-emulator.ts scripts/test-admin-questions-emulator.mjs scripts/test-snapshot-schema-emulator.mjs scripts/test-external-policy-emulator.mjs | Tee-Object -FilePath (Join-Path $ReportDirectory 'tests.txt')
  if ($LASTEXITCODE -ne 0) { throw 'Testes de integração falharam.' }
} finally {
  $env:FIRESTORE_EMULATOR_HOST = $previousEmulatorHost
  if ($null -ne $emulatorTask) { $emulatorTask.Refresh(); if (!$emulatorTask.HasExited) { Stop-Process -Id $emulatorTask.Id } }
  Pop-Location
}



