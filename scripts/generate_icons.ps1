Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\jhonn\.gemini\antigravity\brain\1c04ebe6-7be3-46de-bfc6-f58960b534a3\.user_uploaded\media_1789876682928.jpg"
if (!(Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Source Image Size: $($img.Width)x$($img.Height)"

$cropSize = 540
$cropX = [Math]::Max(0, [int](512 - ($cropSize / 2)))
$cropY = [Math]::Max(0, [int](279 - ($cropSize / 2)))

Write-Output "Crop rect: X=$cropX, Y=$cropY, Size=$cropSize"

$cropRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropSize, $cropSize
$cropped = New-Object System.Drawing.Bitmap $cropSize, $cropSize
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $cropSize, $cropSize), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$athenaPublic = "C:\Users\jhonn\antigravity\athena\public"
if (!(Test-Path $athenaPublic)) { New-Item -ItemType Directory -Path $athenaPublic -Force }

$apoloPublic = "C:\Users\jhonn\antigravity\Projeto-Apolo---Mentor-de-Concursos-AGU\public"
if (!(Test-Path $apoloPublic)) { New-Item -ItemType Directory -Path $apoloPublic -Force }

function Save-ResizedIcon($srcBmp, $destPath, $size) {
    $resized = New-Object System.Drawing.Bitmap $size, $size
    $gr = [System.Drawing.Graphics]::FromImage($resized)
    $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gr.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gr.DrawImage($srcBmp, 0, 0, $size, $size)
    $gr.Dispose()
    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }
    $resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Output "Generated: $destPath ($size x $size)"
}

# Web / PWA icons in athena
Save-ResizedIcon $cropped (Join-Path $athenaPublic "icon-512.png") 512
Save-ResizedIcon $cropped (Join-Path $athenaPublic "icon-192.png") 192
Save-ResizedIcon $cropped (Join-Path $athenaPublic "apple-touch-icon.png") 180
Save-ResizedIcon $cropped (Join-Path $athenaPublic "favicon.png") 64
Save-ResizedIcon $cropped (Join-Path $athenaPublic "favicon.ico") 48

# Projeto-Apolo icons
Save-ResizedIcon $cropped (Join-Path $apoloPublic "icon-512.png") 512
Save-ResizedIcon $cropped (Join-Path $apoloPublic "icon-192.png") 192
Save-ResizedIcon $cropped (Join-Path $apoloPublic "apple-touch-icon.png") 180
Save-ResizedIcon $cropped (Join-Path $apoloPublic "favicon.png") 64

# Android mipmap icons in athena
$resDir = "C:\Users\jhonn\antigravity\athena\android\app\src\main\res"
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
    $size = $densities[$d]
    $dirPath = Join-Path $resDir $d
    Save-ResizedIcon $cropped (Join-Path $dirPath "ic_launcher.png") $size
    Save-ResizedIcon $cropped (Join-Path $dirPath "ic_launcher_round.png") $size
    Save-ResizedIcon $cropped (Join-Path $dirPath "ic_launcher_foreground.png") $size
}

$cropped.Dispose()
$img.Dispose()
Write-Output "SUCCESS: All icons generated successfully!"
