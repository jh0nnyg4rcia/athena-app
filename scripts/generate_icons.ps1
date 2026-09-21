Add-Type -AssemblyName System.Drawing

$root = "C:\Users\jhonn\antigravity\athena"
$iconPath = Join-Path $root "docs\athena-icon.png"

if (!(Test-Path $iconPath)) {
    Write-Error "Arquivo de ícone não encontrado: $iconPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($iconPath)
Write-Output "Imagem fonte carregada: $($srcImg.Width)x$($srcImg.Height)"

function Save-ResizedIcon($srcBmp, $destPath, $size) {
    $resized = New-Object System.Drawing.Bitmap $size, $size
    $gr = [System.Drawing.Graphics]::FromImage($resized)
    $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gr.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gr.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gr.DrawImage($srcBmp, 0, 0, $size, $size)
    $gr.Dispose()
    
    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    
    $resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Output "Ícone gerado: $destPath ($size x $size)"
}

# 1. Ícones Web e PWA (public/)
$publicDir = Join-Path $root "public"
Save-ResizedIcon $srcImg (Join-Path $publicDir "icon-512.png") 512
Save-ResizedIcon $srcImg (Join-Path $publicDir "icon-192.png") 192
Save-ResizedIcon $srcImg (Join-Path $publicDir "apple-touch-icon.png") 180
Save-ResizedIcon $srcImg (Join-Path $publicDir "favicon.png") 64
Save-ResizedIcon $srcImg (Join-Path $publicDir "favicon.ico") 48

# 2. Ícones Nativos Android (android/app/src/main/res/mipmap-*)
$resDir = Join-Path $root "android\app\src\main\res"

$densities = @{
    "mipmap-mdpi"    = @{ Base = 48; Foreground = 108 }
    "mipmap-hdpi"    = @{ Base = 72; Foreground = 162 }
    "mipmap-xhdpi"   = @{ Base = 96; Foreground = 216 }
    "mipmap-xxhdpi"  = @{ Base = 144; Foreground = 324 }
    "mipmap-xxxhdpi" = @{ Base = 192; Foreground = 432 }
}

foreach ($d in $densities.Keys) {
    $baseSize = $densities[$d].Base
    $fgSize   = $densities[$d].Foreground
    $dirPath  = Join-Path $resDir $d
    
    Save-ResizedIcon $srcImg (Join-Path $dirPath "ic_launcher.png") $baseSize
    Save-ResizedIcon $srcImg (Join-Path $dirPath "ic_launcher_round.png") $baseSize
    Save-ResizedIcon $srcImg (Join-Path $dirPath "ic_launcher_foreground.png") $fgSize
}

# 3. Atualizar também no Kit da Área de Trabalho
$desktopKit = "C:\Users\jhonn\OneDrive\Desktop\ATHENA-GooglePlay-Kit"
if (!(Test-Path $desktopKit)) {
    $desktopKit = "C:\Users\jhonn\Desktop\ATHENA-GooglePlay-Kit"
}
if (Test-Path $desktopKit) {
    Save-ResizedIcon $srcImg (Join-Path $desktopKit "1_Icone_PlayStore_512x512.png") 512
}

$srcImg.Dispose()
Write-Output "SUCESSO: Todos os ícones do ATHENA foram gerados com a arte oficial!"
