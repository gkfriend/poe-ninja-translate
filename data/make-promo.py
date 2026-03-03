"""
POE Ninja 繁體中文化 - 宣傳橫幅生成腳本
1400 x 560 像素，暗色 POE 奇幻風格
"""

import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_DIR  = r"C:\Users\holyg\.claude\skills\canvas-design\canvas-fonts"
FONT_ZH   = r"C:\Windows\Fonts\msjhbd.ttc"   # 微軟正黑體 Bold（支援繁體中文）
FONT_ZH_R = r"C:\Windows\Fonts\msjh.ttc"     # 微軟正黑體 Regular
OUT_PATH  = r"C:\Users\holyg\Documents\Claude\poe-ninja-tranlate\data\promo-banner.png"
LOGO_PATH = r"C:\Users\holyg\Documents\Claude\poe-ninja-tranlate\poe_logo.png"

W, H = 1400, 560

# ── 色盤 ──────────────────────────────────────────────────────────────────
BG_DEEP    = (10, 11, 15)
BG_MID     = (16, 18, 26)
BG_PANEL   = (20, 22, 32)
GOLD_BRIGHT= (232, 195, 100)
GOLD_DIM   = (160, 128, 60)
GOLD_FAINT = (90,  72, 28)
AMBER      = (200, 155, 60)
TEAL       = (50,  140, 160)
TEAL_DIM   = (30,  80,  95)
WHITE_SOFT = (220, 215, 200)
GREY_MID   = (100, 105, 120)
GREY_DARK  = (45,  48,  58)

def load_font(name, size):
    try:
        return ImageFont.truetype(f"{FONT_DIR}\\{name}", size)
    except Exception:
        return ImageFont.load_default()

def load_zh_font(size, bold=True):
    """載入支援繁體中文的系統字體"""
    try:
        path = FONT_ZH if bold else FONT_ZH_R
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))

# ── 建立基礎圖層 ─────────────────────────────────────────────────────────
img  = Image.new("RGBA", (W, H), BG_DEEP)
draw = ImageDraw.Draw(img)

# 背景漸層（左深右稍亮）
for x in range(W):
    t = x / W
    c = lerp_color(BG_DEEP, BG_MID, t * 0.6)
    draw.line([(x, 0), (x, H)], fill=c + (255,))

# ── 左側光暈（神秘光源感） ────────────────────────────────────────────────
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow_layer)

def radial_glow(layer_draw, cx, cy, radius, color, steps=60):
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        alpha = int(18 * (i / steps) ** 2)
        layer_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=color + (alpha,)
        )

radial_glow(gd, 320, 280, 380, (180, 130, 40))   # 主光源（金橙）
radial_glow(gd, 100, 480, 200, (40, 110, 130))    # 角落冷光（青藍）
radial_glow(gd, 1300, 80, 160, (120, 80, 20))     # 右上角暖光

glow_blur = glow_layer.filter(ImageFilter.GaussianBlur(radius=60))
img = Image.alpha_composite(img, glow_blur)
draw = ImageDraw.Draw(img)

# ── 幾何線條裝飾 ──────────────────────────────────────────────────────────
def thin_line(x1, y1, x2, y2, color, alpha=80):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.line([(x1, y1), (x2, y2)], fill=color + (alpha,), width=1)
    return overlay

# 水平分割線
for y_pos, alpha in [(56, 60), (504, 60)]:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.line([(60, y_pos), (W - 60, y_pos)], fill=GOLD_DIM + (alpha,), width=1)
    img = Image.alpha_composite(img, overlay)

# 垂直分隔線（左側圖騰區 / 右側文字區）
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.line([(540, 56), (540, 504)], fill=GOLD_DIM + (80,), width=1)
# 左側內框細線
od.line([(80, 72), (520, 72)], fill=GOLD_FAINT + (120,), width=1)
od.line([(80, 488), (520, 488)], fill=GOLD_FAINT + (120,), width=1)
od.line([(80, 72), (80, 488)], fill=GOLD_FAINT + (100,), width=1)
od.line([(520, 72), (520, 488)], fill=GOLD_FAINT + (100,), width=1)
img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

# ── 角落裝飾菱形 ─────────────────────────────────────────────────────────
def corner_diamond(d, cx, cy, size, color, alpha=160):
    pts = [(cx, cy - size), (cx + size, cy), (cx, cy + size), (cx - size, cy)]
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.polygon(pts, outline=color + (alpha,), fill=color + (30,))
    return overlay

for cx, cy in [(60, 56), (W-60, 56), (60, H-56), (W-60, H-56)]:
    img = Image.alpha_composite(img, corner_diamond(draw, cx, cy, 7, GOLD_DIM))

draw = ImageDraw.Draw(img)

# ── 左側：POE Logo ────────────────────────────────────────────────────────
cx, cy = 300, 270

# 裝飾性外環光暈
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for ring_r, ring_alpha in [(200, 15), (180, 22), (165, 30)]:
    od.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
               outline=GOLD_DIM + (ring_alpha,), fill=None, width=1)
img = Image.alpha_composite(img, overlay)

# 主圓形底框（Logo 背景）
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.ellipse([cx - 148, cy - 148, cx + 148, cy + 148],
           outline=GOLD_BRIGHT + (180,), fill=BG_PANEL + (200,), width=2)
img = Image.alpha_composite(img, overlay)

# 貼上 poe_logo.png（放大至 260×260）
logo = Image.open(LOGO_PATH).convert("RGBA")
logo_size = 260
logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
lx = cx - logo_size // 2
ly = cy - logo_size // 2
img.paste(logo, (lx, ly), logo)

# 外圓金邊（疊在 Logo 上方，確保邊框清晰）
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.ellipse([cx - 148, cy - 148, cx + 148, cy + 148],
           outline=GOLD_BRIGHT + (210,), fill=None, width=2)
img = Image.alpha_composite(img, overlay)

draw = ImageDraw.Draw(img)

# ── 左側底部標籤 ─────────────────────────────────────────────────────────
font_mono_sm = load_font("JetBrainsMono-Regular.ttf", 13)
draw.text((cx, 470), "PATH OF EXILE · POE1", font=font_mono_sm,
          fill=GREY_MID, anchor="mm")

# ── 右側文字區 ────────────────────────────────────────────────────────────
tx = 580   # 文字起始 X
ty_start = 110

# 主標題（分兩行）
font_title  = load_font("CrimsonPro-Bold.ttf", 74)   # 英文標題
font_title2 = load_zh_font(58, bold=True)              # 中文標題

# 主標題：POE Ninja
draw.text((tx, ty_start), "POE Ninja", font=font_title, fill=GOLD_BRIGHT, anchor="lm")

# 第二行：翻譯插件
ty2 = ty_start + 70
draw.text((tx, ty2), "翻譯插件", font=font_title2, fill=WHITE_SOFT, anchor="lm")

# 主標題底部裝飾線
line_y = ty2 + 44
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.line([(tx, line_y), (tx + 600, line_y)], fill=GOLD_DIM + (120,), width=1)
# 細線上小亮點
od.ellipse([tx - 3, line_y - 3, tx + 3, line_y + 3], fill=GOLD_BRIGHT + (200,))
img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

# 副標題
font_sub = load_zh_font(19, bold=False)
sub_text = "poe.ninja 官方字庫翻譯  ·  裝備  ·  技能  ·  天賦  ·  通貨"
draw.text((tx, line_y + 28), sub_text, font=font_sub, fill=GREY_MID, anchor="lm")

# ── 功能標籤列 ────────────────────────────────────────────────────────────
font_tag = load_zh_font(14, bold=False)
tags = ["4,700+ 物品", "6,700+ 詞綴", "2,200+ 天賦/寶石", "Tooltip 雙語顯示"]
tag_x = tx
tag_y = line_y + 78

for tag in tags:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # 測量文字寬（使用 zh 字體）
    bbox = font_tag.getbbox(tag)
    tw = bbox[2] - bbox[0] + 24
    th = 30
    od.rounded_rectangle([tag_x, tag_y, tag_x + tw, tag_y + th],
                          radius=3, outline=GOLD_FAINT + (200,), fill=GOLD_FAINT + (50,))
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)
    draw.text((tag_x + tw // 2, tag_y + 15), tag,
              font=font_tag, fill=AMBER, anchor="mm")
    tag_x += tw + 12

# ── 水平分隔線（功能標籤下） ─────────────────────────────────────────────
sep_y = tag_y + 52
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.line([(tx, sep_y), (tx + 600, sep_y)], fill=GREY_DARK + (180,), width=1)
img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

# ── 底部：翻譯來源說明 ────────────────────────────────────────────────────
font_credit = load_zh_font(13, bold=False)
draw.text((tx, sep_y + 22),
          "字庫來源：SnosMe/awakened-poe-trade（cmn-Hant）",
          font=font_credit, fill=GREY_MID, anchor="lm")

# ── 最終輸出 ──────────────────────────────────────────────────────────────
final = img.convert("RGB")
final.save(OUT_PATH, "PNG", quality=95)
print(f"✓ 已輸出：{OUT_PATH}")
print(f"  尺寸：{final.size[0]} × {final.size[1]} px")
