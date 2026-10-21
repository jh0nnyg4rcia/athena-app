$ErrorActionPreference = 'Stop'
$java = 'C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin/java.exe'
$jar = Join-Path $env:USERPROFILE '.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar'

$proc = Start-Process -FilePath $java -ArgumentList @(
    '-jar', $jar,
    '--host', '127.0.0.1',
    '--port', '8197',
    '--project_id', 'demo-athena-client-safe'
) -WindowStyle Hidden -PassThru

$previousHost = $env:FIRESTORE_EMULATOR_HOST
try {
    node --input-type=module -e "for(let i=0;i<160;i++){try{await fetch('http://127.0.0.1:8197/',{signal:AbortSignal.timeout(300)});break;}catch{if(i===159)throw Error('Emulator unavailable');await new Promise(r=>setTimeout(r,200));}}"
    $env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8197'
    Write-Host "Running CEO version synchronization verification..."
    node node_modules/tsx/dist/cli.mjs scripts/test-ceo-version-sync.mjs
} finally {
    $env:FIRESTORE_EMULATOR_HOST = $previousHost
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
