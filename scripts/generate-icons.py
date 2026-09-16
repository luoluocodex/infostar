"""
scripts/generate-icons.py · 离线生成 PWA 图标（一次性工具，可重复执行）

设计：暖橙渐变底 + 三级向上的台阶（递推/爬楼梯）+ 一颗星。
产出：
  public/icons/icon-192.png
  public/icons/icon-512.png
  public/icons/icon-maskable-512.png   （留安全边距，适配 Android 圆形裁剪）
  public/icons/apple-touch-icon.png    （180×180，不透明）
用法：
  python scripts/generate-icons.py
"""

from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "icons")

TOP = (240, 177, 49)      # --c-sun
MID = (233, 97, 47)       # --c-accent
BOTTOM = (188, 72, 32)    # --c-accent-deep
INK = (44, 33, 26)
WHITE = (255, 252, 246)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        c = lerp(TOP, MID, t / 0.62) if t < 0.62 else lerp(MID, BOTTOM, (t - 0.62) / 0.38)
        for x in range(size):
            px[x, y] = c
    return img


def star_points(cx: float, cy: float, r: float, inner: float, n: int = 5):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else inner
        a = -math.pi / 2 + i * math.pi / n
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def draw_mark(size: int, maskable: bool) -> Image.Image:
    """maskable=True 时内容缩到 62%，保证圆形/方形裁剪都不缺角。"""
    base = gradient(size)
    img = base.convert("RGBA")
    d = ImageDraw.Draw(img)

    inset = size * (0.19 if maskable else 0.10)
    box = (inset, inset, size - inset, size - inset)
    inner = box[2] - box[0]

    r = inner * 0.22
    d.rounded_rectangle(box, radius=r, fill=(255, 252, 246, 235))

    # 三级台阶
    step_h = inner * 0.155
    step_unit = inner * 0.20
    base_x = box[0] + inner * 0.16
    base_y = box[3] - inner * 0.17
    for i in range(3):
        w = step_unit * (i + 1)
        y1 = base_y - step_h * i
        y0 = y1 - step_h * 0.82
        x1 = base_x + w
        d.rounded_rectangle(
            (base_x, y0, x1, y1),
            radius=step_h * 0.30,
            fill=(MID[0], MID[1], MID[2], 255) if i < 2 else (188, 72, 32, 255),
        )

    # 星
    cx = box[0] + inner * 0.70
    cy = box[1] + inner * 0.26
    rr = inner * 0.15
    d.polygon(star_points(cx, cy, rr, rr * 0.45), fill=(TOP[0], TOP[1], TOP[2], 255))

    # 底部小刻度（「一步一步数」的暗示）
    for i in range(5):
        x = box[0] + inner * 0.17 + i * inner * 0.055
        d.rounded_rectangle(
            (x, base_y + inner * 0.06, x + inner * 0.03, base_y + inner * 0.10),
            radius=inner * 0.015,
            fill=(INK[0], INK[1], INK[2], 90),
        )

    return img.convert("RGB")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for name, size, maskable in [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),
    ]:
        img = draw_mark(size, maskable)
        img.save(os.path.join(OUT, name), "PNG", optimize=True)
        print("wrote", name, img.size)


if __name__ == "__main__":
    main()
