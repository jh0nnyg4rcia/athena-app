$ErrorActionPreference = 'Stop'
$logRoot = Join-Path $pwd 'outputs/progress-subscriptions'
if (-not (Test-Path $logRoot)) { New-Item -ItemType Directory -Path $logRoot -Force | Out-Null }
if (Get-NetTCPConnection -State Listen -LocalPort 8197 -ErrorAction SilentlyContinue) {
    throw 'Porta 8197 ja esta ocupada'
}

$java = 'C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin/java.exe'
$jar = Join-Path $env:USERPROFILE '.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar'

$stdoutPath = Join-Path $logRoot 'firestore.log'
$stderrPath = Join-Path $logRoot 'firestore-error.log'

$proc = Start-Process -FilePath $java -ArgumentList @(
    '-Duser.language=en',
    '-Duser.country=US',
    '-jar',
    $jar,
    '--host',
    '127.0.0.1',
    '--port',
    '8197',
    '--project_id',
    'demo-athena-client-safe'
) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

$previousHost = $env:FIRESTORE_EMULATOR_HOST

try {
    # Poll emulator until ready
    node --input-type=module -e "for(let i=0;i<160;i++){try{await fetch('http://127.0.0.1:8197/',{signal:AbortSignal.timeout(300)});break;}catch{if(i===159)throw Error('Emulator unavailable');await new Promise(r=>setTimeout(r,200));}}"
    $env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8197'
    Write-Host "Running REST direct rules tests..."
    node scripts/test-study-rules-emulator.mjs
    Write-Host "Running Client SDK rules tests..."
    node scripts/test-rules-client-sdk-emulator.mjs
    Write-Host "Running Candidate HTTP progression and queue tests..."
    node node_modules/tsx/dist/cli.mjs scripts/test-candidate-http-progression.mjs
} finally {
    $env:FIRESTORE_EMULATOR_HOST = $previousHost
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
