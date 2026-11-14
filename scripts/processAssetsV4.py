#!/usr/bin/env python3
"""
Extrai, limpa, centraliza e integra os 26 novos PNGs de `assets_v4.zip`:
- 12 spritesheets de criaturas das dungeons (192x240, 4x5 células de 48x48)
- 12 retratos bustos do Bestiário (64x64 com fundo transparente)
- 1 spritesheet de Santuário e Elevador Rúnico (192x96, 4x2 células de 48x48)
- 1 spritesheet de ícones V4 de qualidade, buffs e meteoros (128x64, 4x2 células de 32x32)
"""
from __future__ import annotations

import io
import zipfile
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ZIP_PATH = ROOT / "assets_v4.zip"


def recenter_grid_sheet(
    im: Image.Image,
    cell_w: int,
    cell_h: int,
    pad: int = 2,
    center_y: bool = False,
) -> Image.Image:
    im = im.convert("RGBA")
    cols = im.width // cell_w
    rows = im.height // cell_h
    out = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))

    for r in range(rows):
        for c in range(cols):
            cell = im.crop((c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h))
            bb = cell.getbbox()
            if not bb:
                continue
            x0, y0, x1, y1 = bb
            sprite = cell.crop((x0, y0, x1, y1))
            sw, sh = sprite.size

            max_w = cell_w - pad * 2
            max_h = cell_h - pad * 2
            if sw > max_w or sh > max_h:
                scale = min(max_w / sw, max_h / sh)
                nw = max(1, int(round(sw * scale)))
                nh = max(1, int(round(sh * scale)))
                sprite = sprite.resize((nw, nh), Image.Resampling.NEAREST)
                sw, sh = sprite.size

            dest_x = (cell_w - sw) // 2
            dest_x = max(pad, min(cell_w - pad - sw, dest_x))

            if center_y:
                dest_y = (cell_h - sh) // 2
            else:
                dest_y = y0
            dest_y = max(pad, min(cell_h - pad - sh, dest_y))

            out.paste(sprite, (c * cell_w + dest_x, r * cell_h + dest_y), sprite)

    return out


def clean_portrait_bg(im: Image.Image, tolerance: int = 16) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    br, bg, bb_ref, ba = px[0, 0]

    # Se já possuir fundo transparente, preserva e apenas centraliza se necessário
    if ba > 0:
        visited = [[False] * w for _ in range(h)]
        q: deque[tuple[int, int]] = deque()

        def matches_bg(r: int, g: int, b: int, a: int) -> bool:
            if a == 0:
                return True
            return abs(r - br) <= tolerance and abs(g - bg) <= tolerance and abs(b - bb_ref) <= tolerance

        for x in range(w):
            for y in (0, h - 1):
                if not visited[y][x] and matches_bg(*px[x, y]):
                    visited[y][x] = True
                    q.append((x, y))
        for y in range(h):
            for x in (0, w - 1):
                if not visited[y][x] and matches_bg(*px[x, y]):
                    visited[y][x] = True
                    q.append((x, y))

        while q:
            x, y = q.popleft()
            px[x, y] = (0, 0, 0, 0)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                    if matches_bg(*px[nx, ny]):
                        visited[ny][nx] = True
                        q.append((nx, ny))

    box = im.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    crop = im.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dest_x = max(0, min(w - cw, (w - cw) // 2))
    dest_y = y0 if y1 >= h - 2 else max(0, min(h - ch, (h - ch) // 2))
    out.paste(crop, (dest_x, dest_y), crop)
    return out


def main() -> None:
    if not ZIP_PATH.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {ZIP_PATH}")

    enemies_count = 0
    portraits_count = 0
    other_count = 0

    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        for info in z.infolist():
            if info.is_dir() or not info.filename.lower().endswith(".png"):
                continue

            raw_bytes = z.read(info.filename)
            im = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
            target = ROOT / info.filename
            target.parent.mkdir(parents=True, exist_ok=True)

            if "/sprites/enemies/" in info.filename:
                processed = recenter_grid_sheet(im, 48, 48, pad=2, center_y=False)
                processed.save(target, "PNG")
                enemies_count += 1
                print(f"[enemy] {info.filename} -> {processed.size}")
            elif "/portraits/" in info.filename:
                processed = clean_portrait_bg(im, tolerance=16)
                processed.save(target, "PNG")
                portraits_count += 1
                print(f"[portrait] {info.filename} -> {processed.size}, alpha_tl={processed.getpixel((0, 0))[3]}")
            elif "dungeon_sanctuary_elevator_v4.png" in info.filename:
                processed = recenter_grid_sheet(im, 48, 48, pad=2, center_y=False)
                processed.save(target, "PNG")
                other_count += 1
                print(f"[tileset] {info.filename} -> {processed.size}")
            elif "v4_quality_buff_icons.png" in info.filename:
                processed = recenter_grid_sheet(im, 32, 32, pad=2, center_y=True)
                processed.save(target, "PNG")
                other_count += 1
                print(f"[ui] {info.filename} -> {processed.size}")
            else:
                im.save(target, "PNG")
                other_count += 1
                print(f"[other] {info.filename} -> {im.size}")

    print(
        f"Concluído: {enemies_count} inimigos, {portraits_count} retratos, {other_count} outros sheets."
    )


if __name__ == "__main__":
    main()

