$ErrorActionPreference = 'Stop'
$logRoot = Join-Path $pwd 'outputs/progress-subscriptions'
if (-not (Test-Path $logRoot)) { New-Item -ItemType Directory -Path $logRoot -Force | Out-Null }
if (Get-NetTCPConnection -State Listen -LocalPort 8197 -ErrorAction SilentlyContinue) {
    throw 'Porta 8197 ja esta ocupada'
}

$java = 'C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin/java.exe'
$jar = Join-Path $env:USERPROFILE '.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar'

$stdoutPath = Join-Path $logRoot 'firestore-8197.log'
$stderrPath = Join-Path $logRoot 'firestore-8197-error.log'

$proc = Start-Process -FilePath $java -ArgumentList @(
    '-Duser.language=en',
    '-Duser.country=US',
    '-jar',
    $jar,
    '--host',
    '127.0.0.1',
    '--port',
    '8197'
) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

try {
    # Aguardar emulador estar pronto
    node --input-type=module -e "for(let i=0;i<160;i++){try{await fetch('http://127.0.0.1:8197/',{signal:AbortSignal.timeout(300)});break;}catch{if(i===159)throw Error('Emulator unavailable');await new Promise(r=>setTimeout(r,200));}}"
    Write-Host "Firestore Emulator pronto em 127.0.0.1:8197"
    Write-Host "Executando test-packaged-http-mcp-flow.mjs contra functions/lib/app.js empacotado..."
    node node_modules/tsx/dist/cli.mjs scripts/test-packaged-http-mcp-flow.mjs
} finally {
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
