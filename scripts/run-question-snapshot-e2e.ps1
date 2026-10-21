param(
 [string]$FirebaseToolsPath='C:/Users/jhonn/AppData/Local/npm-cache/_npx/7750544ccf494d8b/node_modules/firebase-tools',
 [string]$JavaPath='C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin/java.exe',
 [string]$JarPath="$env:USERPROFILE/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar",
 [string]$ReportDirectory=([IO.Path]::Combine([IO.Path]::GetTempPath(),'athena-snapshot-e2e-'+[guid]::NewGuid().ToString()))
)
$ErrorActionPreference='Stop'
$repoSnapshotTask=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
foreach($snapshotDependency in @($JavaPath,$JarPath,(Join-Path $FirebaseToolsPath 'lib/emulator/auth/server.js'))){if(!(Test-Path -LiteralPath $snapshotDependency)){throw 'Dependência local ausente; nenhuma instalação automática.'}}
# Nunca usar serviço preexistente. Não encerra processos que não pertencem a este runner.
foreach($snapshotPort in @(8189,9099)){if(Get-NetTCPConnection -State Listen -LocalPort $snapshotPort -ErrorAction SilentlyContinue){throw "Porta local $snapshotPort já ocupada"}}
New-Item -ItemType Directory -Path $ReportDirectory -Force | Out-Null
$oldSnapshotFirestoreHost=$env:FIRESTORE_EMULATOR_HOST
$oldSnapshotAuthHost=$env:FIREBASE_AUTH_EMULATOR_HOST
$snapshotFirestoreProcess=$null;$snapshotAuthProcess=$null
Push-Location -LiteralPath $repoSnapshotTask
try{
 $snapshotFirestoreProcess=Start-Process -FilePath $JavaPath -ArgumentList @('-jar',('"'+$JarPath+'"'),'--host','127.0.0.1','--port','8189','--project_id','demo-athena-question-import','--single_project_mode','true','--single_project_mode_error','true') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $ReportDirectory 'firestore.log') -RedirectStandardError (Join-Path $ReportDirectory 'firestore-error.log')
 $snapshotNode=(Get-Command node).Source
 $snapshotAuthProcess=Start-Process -FilePath $snapshotNode -ArgumentList @('scripts/start-snapshot-auth-emulator.mjs',('"'+$FirebaseToolsPath+'"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $ReportDirectory 'auth.log') -RedirectStandardError (Join-Path $ReportDirectory 'auth-error.log')
 $env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8189';$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
 node --input-type=module -e "for(const port of [8189,9099]){for(let i=0;i<240;i++){try{await fetch('http://127.0.0.1:'+port+'/',{signal:AbortSignal.timeout(300)});break;}catch{if(i===239)throw Error('Emulador indisponível');await new Promise(r=>setTimeout(r,200));}}}"
 if($LASTEXITCODE -ne 0){throw 'Inicialização local falhou'}
 foreach($snapshotProcess in @($snapshotFirestoreProcess,$snapshotAuthProcess)){$snapshotProcess.Refresh();if($snapshotProcess.HasExited){throw 'Processo proprietário encerrou durante inicialização'}}
 node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 scripts/test-question-snapshot-cli-e2e.ts | Tee-Object -FilePath (Join-Path $ReportDirectory 'tests.txt')
 if($LASTEXITCODE -ne 0){throw 'Teste anterior de snapshot falhou'}
 node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 scripts/test-admin-questions-cli-e2e.ts | Tee-Object -FilePath (Join-Path $ReportDirectory 'admin-tests.txt')
 if($LASTEXITCODE -ne 0){throw 'Teste ponta a ponta falhou'}
}finally{
 $env:FIRESTORE_EMULATOR_HOST=$oldSnapshotFirestoreHost;$env:FIREBASE_AUTH_EMULATOR_HOST=$oldSnapshotAuthHost
 foreach($snapshotProcess in @($snapshotAuthProcess,$snapshotFirestoreProcess)){if($null -ne $snapshotProcess){$snapshotProcess.Refresh();if(!$snapshotProcess.HasExited){Stop-Process -Id $snapshotProcess.Id;$snapshotProcess.WaitForExit(5000)|Out-Null}}}
 Pop-Location
}
foreach($snapshotPort in @(8189,9099)){if(Get-NetTCPConnection -State Listen -LocalPort $snapshotPort -ErrorAction SilentlyContinue){throw 'Encerramento dos emuladores não confirmado'}}
Write-Output 'Encerramento dos dois emuladores confirmado; nenhuma conexão de produção.'
