# Generates the PWA app icons (apple-touch 180, 192, 512, 512 maskable) by
# drawing a simplified version of the pixel cat sprite (js/catart.js's face:
# round head, triangle ears, big eyes, blush, nose) onto a warm cream/gold
# background with rounded safe padding, using System.Drawing (no external
# dependencies). Run: powershell -File build-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 16x16 face grid — same proportions as the in-game cat sprite's head.
$grid = @(
  "..o......o.....",
  ".oo o....o oo..",
  ".o a ooooo a o.",
  "..oaaaaaaaaao..",
  ".oaaaaaaaaaaao.",
  ".oaahaaaaahaao.",
  "oaaaeeaaaeeaao.",
  "oaaaeeaaaeeaao.",
  ".oaapaaaaapaao.",
  "..oaappaaaao...",
  "...oaaaaaaao...",
  "...oaaaaaaao...",
  "....oaaaaao....",
  ".....oaaao.....",
  "......ooo......",
  "................"
)
$palette = @{
  "o" = [System.Drawing.Color]::FromArgb(74,52,38)     # outline (warm brown, never pure black)
  "a" = [System.Drawing.Color]::FromArgb(240,174,116)  # gold coat
  "h" = [System.Drawing.Color]::FromArgb(250,224,180)  # highlight
  "e" = [System.Drawing.Color]::FromArgb(74,52,38)     # eyes
  "p" = [System.Drawing.Color]::FromArgb(242,149,126)  # blush/nose
}
$bg = [System.Drawing.Color]::FromArgb(251,241,221)    # warm cream (--bg)

function New-Icon($size, $path, [switch]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $bgBrush = New-Object System.Drawing.SolidBrush $bg
  $g.FillRectangle($bgBrush, 0, 0, $size, $size)
  # safe padding: maskable icons need more inset so the OS mask doesn't clip the art
  $paddingFrac = if ($maskable) { 0.30 } else { 0.16 }
  $usable = [double]$size * (1 - 2 * $paddingFrac)
  $cell = $usable / 16.0
  $offset = ($size - $cell * 16) / 2.0
  for ($y = 0; $y -lt 16; $y++) {
    $row = $grid[$y].PadRight(16, '.')
    for ($x = 0; $x -lt 16; $x++) {
      $ch = $row.Substring($x, 1)
      if ($ch -eq "." -or $ch -eq " ") { continue }
      $color = $palette[$ch]
      if (-not $color) { continue }
      $brush = New-Object System.Drawing.SolidBrush $color
      $px = $offset + $x * $cell
      $py = $offset + $y * $cell
      $g.FillRectangle($brush, [float]$px, [float]$py, [float]($cell + 0.6), [float]($cell + 0.6))
      $brush.Dispose()
    }
  }
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $path ($size x $size)"
}

New-Icon 180 (Join-Path $outDir "apple-touch-icon.png")
New-Icon 192 (Join-Path $outDir "icon-192.png")
New-Icon 512 (Join-Path $outDir "icon-512.png")
New-Icon 512 (Join-Path $outDir "icon-512-maskable.png") -maskable
