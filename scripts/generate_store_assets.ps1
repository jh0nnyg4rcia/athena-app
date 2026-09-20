Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$TargetWidth,
        [int]$TargetHeight,
        [string]$Format = "PNG"
    )

    $parentDir = Split-Path -Parent $TargetPath
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($dest)

    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($src, 0, 0, $TargetWidth, $TargetHeight)
    $graphics.Dispose()
    $src.Dispose()

    if ($Format -eq "PNG") {
        $dest.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } elseif ($Format -eq "JPEG") {
        $dest.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    }
    $dest.Dispose()
    Write-Host "Criado: $TargetPath ($TargetWidth x $TargetHeight)"
}

$BrainDir = "C:\Users\jhonn\.gemini\antigravity\brain\8e518388-1965-4e32-b042-a8c549df3852"
$IconSource = "$BrainDir\athena_app_icon_1789874177770.jpg"
$BannerSource = "$BrainDir\athena_feature_banner_1789874194913.jpg"
$Screen1 = "$BrainDir\screenshot_1_welcome_1789874218495.jpg"
$Screen2 = "$BrainDir\screenshot_2_trilha_1789874242710.jpg"
$Screen3 = "$BrainDir\screenshot_3_mentoria_1789874268872.jpg"
$Screen4 = "$BrainDir\screenshot_4_simulado_1789874299230.jpg"

$DesktopKit = "C:\Users\jhonn\OneDrive\Desktop\ATHENA-GooglePlay-Kit"
if (-not (Test-Path "C:\Users\jhonn\OneDrive\Desktop")) {
    $DesktopKit = "C:\Users\jhonn\Desktop\ATHENA-GooglePlay-Kit"
}

# 1. Gerar Assets Oficiais para a Google Play Store
Resize-Image $IconSource "$DesktopKit\1_Icone_PlayStore_512x512.png" 512 512 "PNG"
Resize-Image $BannerSource "$DesktopKit\2_Banner_Destaque_1024x500.png" 1024 500 "PNG"

Resize-Image $Screen1 "$DesktopKit\Screenshots\1_BoasVindas_1080x1920.png" 1080 1920 "PNG"
Resize-Image $Screen2 "$DesktopKit\Screenshots\2_Trilha100Dias_1080x1920.png" 1080 1920 "PNG"
Resize-Image $Screen3 "$DesktopKit\Screenshots\3_MentoriaJuridica_1080x1920.png" 1080 1920 "PNG"
Resize-Image $Screen4 "$DesktopKit\Screenshots\4_SimuladoQuestoes_1080x1920.png" 1080 1920 "PNG"

# 2. Atualizar Ícones Internos do Aplicativo Android (res/mipmap-*)
$ResDir = "C:\Users\jhonn\antigravity\athena\android\app\src\main\res"

# mdpi: 48x48
Resize-Image $IconSource "$ResDir\mipmap-mdpi\ic_launcher.png" 48 48 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-mdpi\ic_launcher_round.png" 48 48 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-mdpi\ic_launcher_foreground.png" 108 108 "PNG"

# hdpi: 72x72
Resize-Image $IconSource "$ResDir\mipmap-hdpi\ic_launcher.png" 72 72 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-hdpi\ic_launcher_round.png" 72 72 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-hdpi\ic_launcher_foreground.png" 162 162 "PNG"

# xhdpi: 96x96
Resize-Image $IconSource "$ResDir\mipmap-xhdpi\ic_launcher.png" 96 96 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xhdpi\ic_launcher_round.png" 96 96 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xhdpi\ic_launcher_foreground.png" 216 216 "PNG"

# xxhdpi: 144x144
Resize-Image $IconSource "$ResDir\mipmap-xxhdpi\ic_launcher.png" 144 144 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xxhdpi\ic_launcher_round.png" 144 144 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xxhdpi\ic_launcher_foreground.png" 324 324 "PNG"

# xxxhdpi: 192x192
Resize-Image $IconSource "$ResDir\mipmap-xxxhdpi\ic_launcher.png" 192 192 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xxxhdpi\ic_launcher_round.png" 192 192 "PNG"
Resize-Image $IconSource "$ResDir\mipmap-xxxhdpi\ic_launcher_foreground.png" 432 432 "PNG"

# Splash Screen Android
Resize-Image $BannerSource "$ResDir\drawable\splash.png" 1080 1920 "PNG"

Write-Host "Todos os assets da Google Play e ícones do Android foram gerados com sucesso!"
