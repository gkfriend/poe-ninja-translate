Add-Type -AssemblyName System.Drawing

$logoPath = 'C:\Users\holyg\Documents\Claude\poe-ninja-tranlate\poe_logo.png'
$outDir   = 'C:\Users\holyg\Pictures\Screenshots'

# ---- 顏色 ----
$cBg      = [System.Drawing.Color]::FromArgb(22, 20, 16)
$cGold    = [System.Drawing.Color]::FromArgb(200, 169, 110)
$cGoldDim = [System.Drawing.Color]::FromArgb(148, 124, 78)
$cText    = [System.Drawing.Color]::FromArgb(172, 152, 108)
$cMuted   = [System.Drawing.Color]::FromArgb(88, 76, 54)
$cLine    = [System.Drawing.Color]::FromArgb(52, 44, 28)

# ---- 儲存為 JPEG 95 品質 ----
function Save-Jpeg($bmp, $path) {
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
           Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep  = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [long]95)
    $bmp.Save($path, $enc, $ep)
}

$logo = [System.Drawing.Image]::FromFile($logoPath)

# ==========================================
#  440 x 280  小型宣傳圖塊
# ==========================================
$W = 440; $H = 280
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 背景
$g.Clear($cBg)

# 上下金線
$penGold = New-Object System.Drawing.Pen($cGold, 3)
$g.DrawLine($penGold, 0, 1, $W, 1)
$g.DrawLine($penGold, 0, $H - 2, $W, $H - 2)

# Logo (80×80) 垂直置中
$lSz = 80
$g.DrawImage($logo, 24, ($H - $lSz) / 2, $lSz, $lSz)

# Logo 右側分隔線
$penLine = New-Object System.Drawing.Pen($cLine, 1)
$g.DrawLine($penLine, 118, 18, 118, $H - 18)

# 筆刷
$bGold    = New-Object System.Drawing.SolidBrush($cGold)
$bGoldDim = New-Object System.Drawing.SolidBrush($cGoldDim)
$bText    = New-Object System.Drawing.SolidBrush($cText)
$bMuted   = New-Object System.Drawing.SolidBrush($cMuted)

# 字型
$fTitle = New-Object System.Drawing.Font("Microsoft JhengHei", 17, [System.Drawing.FontStyle]::Bold)
$fSub   = New-Object System.Drawing.Font("Microsoft JhengHei", 9,  [System.Drawing.FontStyle]::Regular)
$fBody  = New-Object System.Drawing.Font("Microsoft JhengHei", 9,  [System.Drawing.FontStyle]::Regular)
$fSmall = New-Object System.Drawing.Font("Segoe UI",           8,  [System.Drawing.FontStyle]::Regular)

# 標題文字
$g.DrawString("POE Ninja 繁體中文化",      $fTitle, $bGold,    [float]132, [float]26)
$g.DrawString("Path of Exile 1 翻譯插件", $fSub,   $bGoldDim, [float]135, [float]57)
$g.DrawString("Chrome / Edge Extension",  $fSmall, $bMuted,   [float]137, [float]74)

# 功能區分隔線
$g.DrawLine($penLine, 128, 98, $W - 18, 98)

# 功能列表
$features = @(
    [char]0x25C6 + "  物品、技能、天賦全數繁體中文翻譯",
    [char]0x25C6 + "  Tooltip 雙語對照，保留英文原文",
    [char]0x25C6 + "  官方字庫來源，非機器翻譯"
)
$fy = 112
foreach ($f in $features) {
    $g.DrawString($f, $fBody, $bText, [float]132, [float]$fy)
    $fy += 24
}

# 底部統計數字（置中）
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 246, $W, 22)
$g.DrawString("物品 4,714 · 詞綴 6,764 · 天賦/寶石 2,221", $fSmall, $bMuted, $rect, $sfCenter)

Save-Jpeg $bmp "$outDir\promo-small-440x280.jpg"
$g.Dispose(); $bmp.Dispose()
Write-Host "✓ promo-small-440x280.jpg"

# ==========================================
#  1400 x 560  跑馬燈宣傳圖塊
# ==========================================
$W = 1400; $H = 560
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$g.Clear($cBg)

# 上下金線
$penGold2 = New-Object System.Drawing.Pen($cGold, 4)
$g.DrawLine($penGold2, 0, 2, $W, 2)
$g.DrawLine($penGold2, 0, $H - 3, $W, $H - 3)

# Logo 140×140 垂直置中
$lSz2 = 140
$g.DrawImage($logo, 60, ($H - $lSz2) / 2, $lSz2, $lSz2)

# Logo 右側金色分隔線
$penAccent = New-Object System.Drawing.Pen($cGold, 2)
$g.DrawLine($penAccent, 228, 60, 228, $H - 60)

# 筆刷（重建，避免跨圖污染）
$bGold2    = New-Object System.Drawing.SolidBrush($cGold)
$bGoldDim2 = New-Object System.Drawing.SolidBrush($cGoldDim)
$bText2    = New-Object System.Drawing.SolidBrush($cText)
$bMuted2   = New-Object System.Drawing.SolidBrush($cMuted)

# 字型
$fT2    = New-Object System.Drawing.Font("Microsoft JhengHei", 36, [System.Drawing.FontStyle]::Bold)
$fS2    = New-Object System.Drawing.Font("Microsoft JhengHei", 14, [System.Drawing.FontStyle]::Regular)
$fSub2  = New-Object System.Drawing.Font("Segoe UI",           11, [System.Drawing.FontStyle]::Regular)
$fH2    = New-Object System.Drawing.Font("Microsoft JhengHei", 11, [System.Drawing.FontStyle]::Bold)
$fF2    = New-Object System.Drawing.Font("Microsoft JhengHei", 13, [System.Drawing.FontStyle]::Regular)
$fStat2 = New-Object System.Drawing.Font("Microsoft JhengHei", 11, [System.Drawing.FontStyle]::Regular)

# 左側主標題
$g.DrawString("POE Ninja 繁體中文化",                                $fT2,   $bGold2,    [float]258, [float]108)
$g.DrawString("為 poe.ninja 打造的 Path of Exile 1 繁體中文翻譯插件", $fS2,   $bGoldDim2, [float]264, [float]178)
$g.DrawString("Chrome & Edge Browser Extension",                     $fSub2, $bMuted2,   [float]268, [float]210)

# 左右分界（中央垂直線）
$penMid = New-Object System.Drawing.Pen($cLine, 1)
$g.DrawLine($penMid, 760, 60, 760, $H - 80)

# 右側功能清單
$g.DrawString("翻譯涵蓋範圍", $fH2, $bGold2, [float]792, [float]108)
$g.DrawLine($penMid, 792, 138, $W - 60, 138)

$features2 = @(
    [char]0x25C6 + "  物品名稱（裝備 / 通貨 / 地圖 / 寶石）",
    [char]0x25C6 + "  技能詞綴 Tooltip 雙語對照顯示",
    [char]0x25C6 + "  天賦 / 輿圖天賦 / 技能寶石名稱",
    [char]0x25C6 + "  官方字庫，非機器翻譯"
)
$fy2 = 156
foreach ($f in $features2) {
    $g.DrawString($f, $fF2, $bText2, [float]792, [float]$fy2)
    $fy2 += 40
}

# 底部統計數字（置中）
$g.DrawLine($penMid, 60, 448, $W - 60, 448)
$sfCenter2 = New-Object System.Drawing.StringFormat
$sfCenter2.Alignment = [System.Drawing.StringAlignment]::Center
$rect2 = New-Object System.Drawing.RectangleF(0, 462, $W, 40)
$g.DrawString("物品 4,714 筆  ·  詞綴 6,764 筆  ·  天賦 / 技能寶石 2,221 筆", $fStat2, $bMuted2, $rect2, $sfCenter2)

Save-Jpeg $bmp "$outDir\promo-marquee-1400x560.jpg"
$g.Dispose(); $bmp.Dispose()

$logo.Dispose()
Write-Host "✓ promo-marquee-1400x560.jpg"
Write-Host ""
Write-Host "完成！檔案儲存至 C:\Users\holyg\Pictures\Screenshots\"
