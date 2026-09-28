# Generates the PWA app icons (apple-touch 180, 192, 512, 512 maskable) and
# favicon.png as a 32x32 pixel-art globe (round ocean disc with continents,
# dark warm outline) on a warm cream background, using System.Drawing
# (no external dependencies), scaled with nearest-neighbour so pixels stay
# crisp. Run: powershell -File build-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 32x32 globe grid: b=outline, 1=ocean highlight (upper-left), 2=ocean base,
# 3=ocean shadow (lower-right), g=Americas green, e=Africa/Europe green,
# s=sand coastline, .=transparent (background shows through).
$grid = @(
  "................................",
  "................................",
  "................................",
  "............bbbbbbbb............",
  "..........bb11111111bb..........",
  "........bb111111111s22bb........",
  ".......b1sgg111111seees2b.......",
  "......b1sgggg11111eeeee22b......",
  ".....b11gggg111112seeee222b.....",
  ".....b11ggg111112222eeee22b.....",
  "....b1111ggg11122222eees223b....",
  "....b11111ggg1222222eeee233b....",
  "...b1111111ggg222222eee23333b...",
  "...b11111111gg2222seeee33333b...",
  "...b1111111ggg22222eees33333b...",
  "...b1111112gg222222eee333333b...",
  "...b111112ggg222222eee333333b...",
  "...b111122gg2222222ee3333333b...",
  "...b11122ggg2222223eee333333b...",
  "...b11222gg22222233ee3333333b...",
  "....b2222ggg2222333see33333b....",
  "....b2222gg222233333e333333b....",
  ".....b222gg222333333333333b.....",
  ".....b222sg223333333333333b.....",
  "......b222223333333333333b......",
  ".......b2223333333333333b.......",
  "........bb333333333333bb........",
  "..........bb33333333bb..........",
  "............bbbbbbbb............",
  "................................",
  "................................",
  "................................"
)
$gridSize = 32
$palette = @{
  "b" = [System.Drawing.Color]::FromArgb(59,42,34)     # dark warm outline #3B2A22
  "1" = [System.Drawing.Color]::FromArgb(163,214,224)  # ocean highlight
  "2" = [System.Drawing.Color]::FromArgb(90,163,191)   # ocean base
  "3" = [System.Drawing.Color]::FromArgb(51,107,140)   # ocean shadow
  "g" = [System.Drawing.Color]::FromArgb(122,178,94)   # Americas green
  "e" = [System.Drawing.Color]::FromArgb(90,145,68)    # Africa/Europe green (darker)
  "s" = [System.Drawing.Color]::FromArgb(226,195,140)  # sand
}
$bg = [System.Drawing.Color]::FromArgb(251,241,221)    # warm cream (--bg) #FBF1DD

function New-Icon($size, $path, [double]$paddingFrac) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $bgBrush = New-Object System.Drawing.SolidBrush $bg
  $g.FillRectangle($bgBrush, 0, 0, $size, $size)
  $usable = [double]$size * (1 - 2 * $paddingFrac)
  $cell = $usable / $gridSize
  $offset = ($size - $cell * $gridSize) / 2.0
  for ($y = 0; $y -lt $gridSize; $y++) {
    $row = $grid[$y]
    for ($x = 0; $x -lt $gridSize; $x++) {
      $ch = $row.Substring($x, 1)
      if ($ch -eq ".") { continue }
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

# apple-touch-icon: full-bleed cream square (iOS rounds corners itself), globe fills ~80%
New-Icon 180 (Join-Path $outDir "apple-touch-icon-180.png") 0.10
New-Icon 192 (Join-Path $outDir "icon-192.png") 0.12
New-Icon 512 (Join-Path $outDir "icon-512.png") 0.12
# maskable: globe must sit inside the central 80% safe zone
New-Icon 512 (Join-Path $outDir "icon-512-maskable.png") 0.30
New-Icon 64 (Join-Path $PSScriptRoot "favicon.png") 0.10
