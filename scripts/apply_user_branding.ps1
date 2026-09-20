Add-Type -AssemblyName System.Drawing

$BrainDir = "C:\Users\jhonn\.gemini\antigravity\brain\8e518388-1965-4e32-b042-a8c549df3852"
$UserUploadedDir = "$BrainDir\.user_uploaded"
$BannerSourcePath = "$UserUploadedDir\media_1789875774730.jpg"
$IconSourcePath = "$UserUploadedDir\media_1789875774738.jpg"

$DesktopKit = "C:\Users\jhonn\OneDrive\Desktop\ATHENA-GooglePlay-Kit"
if (-not (Test-Path "C:\Users\jhonn\OneDrive\Desktop")) {
    $DesktopKit = "C:\Users\jhonn\Desktop\ATHENA-GooglePlay-Kit"
}

# 1. PROCESSAR O BANNER (1024 x 500)
$srcBanner = [System.Drawing.Image]::FromFile($BannerSourcePath)
$destBanner = New-Object System.Drawing.Bitmap(1024, 500)
$gBanner = [System.Drawing.Graphics]::FromImage($destBanner)

$gBanner.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gBanner.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gBanner.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gBanner.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# O banner original tem 1024x571. Cortamos proporcionalmente 35px do topo e 36px da base para centralizar perfeitamente em 1024x500 sem distorcer
$srcRect = New-Object System.Drawing.Rectangle(0, 35, 1024, 500)
$destRect = New-Object System.Drawing.Rectangle(0, 0, 1024, 500)
$gBanner.DrawImage($srcBanner, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$destBanner.Save("$DesktopKit\2_Banner_Destaque_1024x500.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Banner de Destaque 1024x500 gerado com sucesso!"

$gBanner.Dispose()
$destBanner.Dispose()

# 2. PROCESSAR O ÍCONE OFICIAL (512 x 512)
$srcIcon = [System.Drawing.Image]::FromFile($IconSourcePath)
$destIcon512 = New-Object System.Drawing.Bitmap(512, 512)
$gIcon = [System.Drawing.Graphics]::FromImage($destIcon512)

$gIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIcon.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gIcon.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gIcon.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$gIcon.DrawImage($srcIcon, 0, 0, 512, 512)
$destIcon512.Save("$DesktopKit\1_Icone_PlayStore_512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Ícone Play Store 512x512 gerado com sucesso!"

$gIcon.Dispose()
$destIcon512.Dispose()

# 3. ATUALIZAR OS ÍCONES NATIVOS DO ANDROID NO PROJETO
$ResDir = "C:\Users\jhonn\antigravity\athena\android\app\src\main\res"

function Generate-Android-Icon {
    param([int]$Size, [string]$RelativePath)
    $targetPath = Join-Path $ResDir $RelativePath
    $parent = Split-Path -Parent $targetPath
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($srcIcon, 0, 0, $Size, $Size)
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Ícone Android criado: $RelativePath ($Size x $Size)"
}

Generate-Android-Icon 48 "mipmap-mdpi\ic_launcher.png"
Generate-Android-Icon 48 "mipmap-mdpi\ic_launcher_round.png"
Generate-Android-Icon 108 "mipmap-mdpi\ic_launcher_foreground.png"

Generate-Android-Icon 72 "mipmap-hdpi\ic_launcher.png"
Generate-Android-Icon 72 "mipmap-hdpi\ic_launcher_round.png"
Generate-Android-Icon 162 "mipmap-hdpi\ic_launcher_foreground.png"

Generate-Android-Icon 96 "mipmap-xhdpi\ic_launcher.png"
Generate-Android-Icon 96 "mipmap-xhdpi\ic_launcher_round.png"
Generate-Android-Icon 216 "mipmap-xhdpi\ic_launcher_foreground.png"

Generate-Android-Icon 144 "mipmap-xxhdpi\ic_launcher.png"
Generate-Android-Icon 144 "mipmap-xxhdpi\ic_launcher_round.png"
Generate-Android-Icon 324 "mipmap-xxhdpi\ic_launcher_foreground.png"

Generate-Android-Icon 192 "mipmap-xxxhdpi\ic_launcher.png"
Generate-Android-Icon 192 "mipmap-xxxhdpi\ic_launcher_round.png"
Generate-Android-Icon 432 "mipmap-xxxhdpi\ic_launcher_foreground.png"

# Splash Screen Android utilizando o novo banner oficial
$destSplash = New-Object System.Drawing.Bitmap(1080, 1920)
$gSplash = [System.Drawing.Graphics]::FromImage($destSplash)
$gSplash.Clear([System.Drawing.Color]::FromArgb(255, 10, 13, 20))

$gSplash.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gSplash.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gSplash.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Desenha o banner centralizado na vertical da Splash Screen
# 1080 largura -> escala mantendo proporção (1080 x 602)
$bannerH = [int](1080 * 571 / 1024)
$bannerY = [int]((1920 - $bannerH) / 2)
$gSplash.DrawImage($srcBanner, 0, $bannerY, 1080, $bannerH)

$destSplash.Save("$ResDir\drawable\splash.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Splash screen Android atualizada com sucesso!"

$gSplash.Dispose()
$destSplash.Dispose()
$srcIcon.Dispose()

# Copia também para o diretório docs/ para atualizar a Landing Page
Copy-Item "$DesktopKit\1_Icone_PlayStore_512x512.png" "C:\Users\jhonn\antigravity\athena\docs\athena-icon.png" -Force
Copy-Item "$DesktopKit\2_Banner_Destaque_1024x500.png" "C:\Users\jhonn\antigravity\athena\docs\athena-banner.png" -Force

Write-Host "Concluído com sucesso!"
