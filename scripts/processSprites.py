#!/usr/bin/env python3
"""
Processa os spritesheets brutos em `assets_raw/sprites/` para spritesheets
alinhados (48x48 por frame, e 64x64 para o chefe colossal) com fundo transparente
limpo e sem vazamento de sprites vizinhos.
"""
from __future__ import annotations

import os
from collections import deque
from pathlib import Path
from PIL import Image

RAW_DIR = Path(__file__).resolve().parent.parent / "assets_raw" / "sprites"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "sprites"


def remove_magenta_bg(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    # 1. Remove magenta pixels and track background mask
    bg = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Magenta has high R & B, low G, and R ~= B
            if r > 170 and b > 170 and g < 115 and abs(r - b) < 75 and (min(r, b) - g) > 75:
                px[x, y] = (0, 0, 0, 0)
                bg[y][x] = True

    # 2. Defringe 1px edge touching removed magenta background
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            touches_bg = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and bg[ny][nx]:
                    touches_bg = True
                    break
            if touches_bg:
                # Suppress magenta spill (excess of min(R,B) over G)
                spill = min(r, b) - g
                if spill > 35:
                    # Reduce alpha proportional to spill and clamp R,B toward G
                    new_a = max(0, min(255, int(255 * (1.0 - (spill - 35) / 150.0))))
                    cap = max(g + 20, int((r + b) * 0.25))
                    nr = min(r, cap) if r > g + 25 else r
                    nb = min(b, cap) if b > g + 25 else b
                    if new_a < 28:
                        px[x, y] = (0, 0, 0, 0)
                    else:
                        px[x, y] = (nr, g, nb, new_a)
    return im


def remove_checkerboard_bg(im: Image.Image) -> Image.Image:
    """
    Remove o xadrez cinza/branco falso de `companions.png` preservando
    a semitransparência roxa dos frames esmaecidos do Remo.
    """
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_neutral_bg(r: int, g: int, b: int) -> bool:
        mx = max(r, g, b)
        mn = min(r, g, b)
        # Checkerboard squares are neutral gray (~200..255)
        return mn >= 190 and (mx - mn) <= 18

    # Flood fill neutral background from borders + obvious exterior regions
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_neutral_bg(*px[x, y][:3]):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_neutral_bg(*px[x, y][:3]):
                visited[y][x] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        px[cx, cy] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_neutral_bg(*px[nx, ny][:3]):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    # Also clear trapped internal neutral checkerboard pockets inside loops (e.g. Remo's tail curl, Lupin's sparkles)
    # by checking connected components of neutral-light pixels in upper half (Remo) or exterior gaps
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # Inside Remo's translucent frames (top half, especially right side x > 780)
            # light purple/lavender haze blended over white/gray checkerboard has high brightness & slight purple tint
            if y < 500:
                mx = max(r, g, b)
                mn = min(r, g, b)
                if mn >= 198 and (mx - mn) <= 18:
                    px[x, y] = (0, 0, 0, 0)
                elif mn >= 165 and b > g and r >= g and (mx - mn) < 55:
                    # Recover partial alpha from purple-over-white/gray blend
                    # Estimate opacity by how far color is from neutral gray (235)
                    chroma = (b - g) + max(0, r - g) * 0.5
                    darkness = max(0, 235 - g)
                    est_alpha = int(max(35, min(255, darkness * 2.2 + chroma * 2.4)))
                    # De-lighten color toward deep violet
                    scale = 255.0 / max(40, est_alpha)
                    nr = max(0, min(255, int(max(0, r - 235 * (1 - est_alpha / 255.0)) * scale)))
                    ng = max(0, min(255, int(max(0, g - 235 * (1 - est_alpha / 255.0)) * scale)))
                    nb = max(0, min(255, int(max(0, b - 235 * (1 - est_alpha / 255.0)) * scale)))
                    px[x, y] = (nr, ng, nb, est_alpha)

    return im


def extract_components(
    im: Image.Image,
    region: tuple[int, int, int, int] | None = None,
    alpha_thresh: int = 16,
    min_body_area: int = 1500,
    min_particle_area: int = 12,
    max_particle_dist: float = 95.0,
) -> list[tuple[tuple[int, int, int, int], Image.Image]]:
    """
    Extrai cada sprite como um componente principal + partículas próximas,
    garantindo que pixels de sprites vizinhos nunca entrem no mesmo recorte.
    """
    w, h = im.size
    rx0, ry0, rx1, ry1 = region if region else (0, 0, w, h)
    px = im.load()

    vis = [[False] * w for _ in range(h)]
    comps = []

    for y in range(ry0, ry1):
        for x in range(rx0, rx1):
            if px[x, y][3] > alpha_thresh and not vis[y][x]:
                q = deque([(x, y)])
                vis[y][x] = True
                pixels = []
                x0 = x1 = x
                y0 = y1 = y
                while q:
                    cx, cy = q.popleft()
                    pixels.append((cx, cy))
                    if cx < x0:
                        x0 = cx
                    if cx > x1:
                        x1 = cx
                    if cy < y0:
                        y0 = cy
                    if cy > y1:
                        y1 = cy
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            if dx == 0 and dy == 0:
                                continue
                            nx, ny = cx + dx, cy + dy
                            if rx0 <= nx < rx1 and ry0 <= ny < ry1 and not vis[ny][nx]:
                                if px[nx, ny][3] > alpha_thresh:
                                    vis[ny][nx] = True
                                    q.append((nx, ny))
                if len(pixels) >= min_particle_area:
                    comps.append({
                        "bbox": [x0, y0, x1 + 1, y1 + 1],
                        "area": len(pixels),
                        "pixels": pixels,
                    })

    bodies = [c for c in comps if c["area"] >= min_body_area]
    particles = [c for c in comps if c["area"] < min_body_area]

    def bbox_dist(b1: list[int], b2: list[int]) -> float:
        dx = max(0, max(b1[0] - b2[2], b2[0] - b1[2]))
        dy = max(0, max(b1[1] - b2[3], b2[1] - b1[3]))
        return (dx * dx + dy * dy) ** 0.5

    # Attach each detached particle/sparkle strictly to its single closest body
    for p in particles:
        if not bodies:
            continue
        best_b = min(bodies, key=lambda b: bbox_dist(b["bbox"], p["bbox"]))
        if bbox_dist(best_b["bbox"], p["bbox"]) <= max_particle_dist:
            best_b["pixels"].extend(p["pixels"])
            best_b["bbox"][0] = min(best_b["bbox"][0], p["bbox"][0])
            best_b["bbox"][1] = min(best_b["bbox"][1], p["bbox"][1])
            best_b["bbox"][2] = max(best_b["bbox"][2], p["bbox"][2])
            best_b["bbox"][3] = max(best_b["bbox"][3], p["bbox"][3])

    results = []
    for b in bodies:
        x0, y0, x1, y1 = b["bbox"]
        crop = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
        cpx = crop.load()
        for cx, cy in b["pixels"]:
            cpx[cx - x0, cy - y0] = px[cx, cy]
        results.append(((x0, y0, x1, y1), crop))
    return results


def sort_grid_rows(
    items: list[tuple[tuple[int, int, int, int], Image.Image]],
    row_tolerance: int = 80,
) -> list[list[tuple[tuple[int, int, int, int], Image.Image]]]:
    if not items:
        return []
    # Sort by vertical center then cluster into rows
    ordered = sorted(items, key=lambda t: (t[0][1] + t[0][3]) / 2.0)
    rows: list[list[tuple[tuple[int, int, int, int], Image.Image]]] = []
    for item in ordered:
        cy = (item[0][1] + item[0][3]) / 2.0
        if not rows:
            rows.append([item])
        else:
            prev_cy = sum((x[0][1] + x[0][3]) / 2.0 for x in rows[-1]) / len(rows[-1])
            if abs(cy - prev_cy) <= row_tolerance:
                rows[-1].append(item)
            else:
                rows.append([item])
    for row in rows:
        row.sort(key=lambda t: t[0][0])
    return rows


def paste_into_cell(
    sheet: Image.Image,
    sprite: Image.Image,
    col: int,
    row: int,
    cell_size: int,
    scale: float,
    anchor: str = "bottom",
    pad_bottom: int = 2,
) -> None:
    sw, sh = sprite.size
    nw = max(1, int(round(sw * scale)))
    nh = max(1, int(round(sh * scale)))
    # Clamp if slightly larger than usable cell area
    max_dim = cell_size - 2
    if nw > max_dim or nh > max_dim:
        fit = min(max_dim / nw, max_dim / nh)
        nw = max(1, int(round(nw * fit)))
        nh = max(1, int(round(nh * fit)))
    resized = sprite.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = col * cell_size + (cell_size - nw) // 2
    if anchor == "bottom":
        oy = row * cell_size + (cell_size - pad_bottom - nh)
    else:
        oy = row * cell_size + (cell_size - nh) // 2
    sheet.alpha_composite(resized, (ox, oy))


def build_player_sheet() -> None:
    src = remove_magenta_bg(Image.open(RAW_DIR / "player.png"))
    items = extract_components(src, min_body_area=3000, max_particle_dist=65.0)
    rows = sort_grid_rows(items, row_tolerance=70)
    assert len(rows) == 5, f"player rows={len(rows)}"
    assert [len(r) for r in rows] == [4, 4, 4, 4, 8], f"player counts={[len(r) for r in rows]}"

    cell = 48
    # Uniform scale based on tallest walk frame so character size stays consistent
    walk_h = max(crop.size[1] for r in rows[:4] for _, crop in r)
    walk_scale = 42.0 / walk_h
    action_h = max(crop.size[1] for _, crop in rows[4])
    action_w = max(crop.size[0] for _, crop in rows[4])
    action_scale = min(44.0 / action_h, 46.0 / action_w)
    # Keep character height closely matched
    scale = min(walk_scale, action_scale)

    out = Image.new("RGBA", (4 * cell, 6 * cell), (0, 0, 0, 0))
    # Rows 0..2: down, up, left
    for r_idx in range(3):
        for c_idx, (_, crop) in enumerate(rows[r_idx]):
            paste_into_cell(out, crop, c_idx, r_idx, cell, walk_scale, "bottom", pad_bottom=2)
    # Row 3: right (mirror of left so all 4 frames consistently face right)
    for c_idx, (_, crop) in enumerate(rows[2]):
        mirrored = crop.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        paste_into_cell(out, mirrored, c_idx, 3, cell, walk_scale, "bottom", pad_bottom=2)
    # Row 4: swing_right (4 frames), Row 5: cast_right (4 frames)
    for c_idx, (_, crop) in enumerate(rows[4][:4]):
        paste_into_cell(out, crop, c_idx, 4, cell, scale, "bottom", pad_bottom=2)
    for c_idx, (_, crop) in enumerate(rows[4][4:]):
        paste_into_cell(out, crop, c_idx, 5, cell, scale, "bottom", pad_bottom=2)

    out.save(OUT_DIR / "player.png")
    print("Saved player.png", out.size)


def build_npcs_sheet() -> None:
    src = Image.open(RAW_DIR / "npcs.png").convert("RGBA")
    items = extract_components(src, min_body_area=3000, max_particle_dist=40.0)
    rows = sort_grid_rows(items, row_tolerance=70)
    assert len(rows) == 5, f"npcs rows={len(rows)}"
    assert all(len(r) == 8 for r in rows), f"npcs counts={[len(r) for r in rows]}"

    cell = 48
    max_h = max(crop.size[1] for r in rows for _, crop in r)
    max_w = max(crop.size[0] for r in rows for _, crop in r)
    scale = min(44.0 / max_h, 44.0 / max_w)

    out = Image.new("RGBA", (8 * cell, 5 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(rows):
        for c_idx, (_, crop) in enumerate(row):
            paste_into_cell(out, crop, c_idx, r_idx, cell, scale, "bottom", pad_bottom=2)
    out.save(OUT_DIR / "npcs.png")
    print("Saved npcs.png", out.size)


def build_companions_sheet() -> None:
    src = remove_checkerboard_bg(Image.open(RAW_DIR / "companions.png"))
    items = extract_components(src, min_body_area=4000, max_particle_dist=85.0)
    rows = sort_grid_rows(items, row_tolerance=120)
    assert len(rows) == 2, f"companions rows={len(rows)}"
    assert [len(r) for r in rows] == [4, 4], f"companions counts={[len(r) for r in rows]}"

    cell = 48
    out = Image.new("RGBA", (4 * cell, 2 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(rows):
        max_h = max(crop.size[1] for _, crop in row)
        max_w = max(crop.size[0] for _, crop in row)
        scale = min(44.0 / max_h, 44.0 / max_w)
        for c_idx, (_, crop) in enumerate(row):
            paste_into_cell(out, crop, c_idx, r_idx, cell, scale, "center")
    out.save(OUT_DIR / "companions.png")
    print("Saved companions.png", out.size)


def build_creatures_fire_sheet() -> None:
    src = Image.open(RAW_DIR / "creatures_fire.png").convert("RGBA")
    items = extract_components(src, min_body_area=5000, max_particle_dist=60.0)
    rows = sort_grid_rows(items, row_tolerance=120)
    assert len(rows) == 3, f"creatures_fire rows={len(rows)}"
    assert [len(r) for r in rows] == [3, 4, 2], f"creatures_fire counts={[len(r) for r in rows]}"

    cell = 48
    out = Image.new("RGBA", (4 * cell, 3 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(rows):
        max_h = max(crop.size[1] for _, crop in row)
        max_w = max(crop.size[0] for _, crop in row)
        scale = min(44.0 / max_h, 44.0 / max_w)
        for c_idx, (_, crop) in enumerate(row):
            paste_into_cell(out, crop, c_idx, r_idx, cell, scale, "bottom", pad_bottom=2)
    out.save(OUT_DIR / "creatures_fire.png")
    print("Saved creatures_fire.png", out.size)


def build_enemies_earth_sheets() -> None:
    src = Image.open(RAW_DIR / "enemies_earth.png").convert("RGBA")
    # Segmenta a imagem inteira de uma vez para evitar corte retangular entre Golem/Wisp e Chefe
    all_items = extract_components(
        src, region=None, min_body_area=2000, max_particle_dist=65.0
    )

    golem_items = []
    wisp_items = []
    boss_items = []
    for bbox, crop in all_items:
        x0, y0, x1, y1 = bbox
        cx = (x0 + x1) / 2.0
        cy = (y0 + y1) / 2.0
        area_est = (x1 - x0) * (y1 - y0)
        if cy >= 565 or (y1 - y0) >= 220:
            boss_items.append((bbox, crop))
        elif cx < 860 and cy < 565:
            golem_items.append((bbox, crop))
        elif cx >= 860 and cy < 525 and area_est < 60000:
            wisp_items.append((bbox, crop))

    golem_rows = sort_grid_rows(golem_items, row_tolerance=75)
    assert len(golem_rows) == 4, f"golem rows={len(golem_rows)}"

    cell = 48
    g_cols = max(len(r) for r in golem_rows)  # 5 cols (row 2 has 5 frames)
    max_gh = max(crop.size[1] for r in golem_rows for _, crop in r)
    max_gw = max(crop.size[0] for r in golem_rows for _, crop in r)
    g_scale = min(44.0 / max_gh, 44.0 / max_gw)
    g_out = Image.new("RGBA", (g_cols * cell, 4 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(golem_rows):
        for c_idx, (_, crop) in enumerate(row):
            paste_into_cell(g_out, crop, c_idx, r_idx, cell, g_scale, "bottom", pad_bottom=2)
    g_out.save(OUT_DIR / "enemy_golem.png")
    print("Saved enemy_golem.png", g_out.size, "counts:", [len(r) for r in golem_rows])

    wisp_rows = sort_grid_rows(wisp_items, row_tolerance=75)
    assert len(wisp_rows) == 3, f"wisp rows={len(wisp_rows)}"
    assert all(len(r) == 4 for r in wisp_rows), f"wisp counts={[len(r) for r in wisp_rows]}"
    max_wh = max(crop.size[1] for r in wisp_rows for _, crop in r)
    max_ww = max(crop.size[0] for r in wisp_rows for _, crop in r)
    w_scale = min(44.0 / max_wh, 44.0 / max_ww)
    w_out = Image.new("RGBA", (4 * cell, 3 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(wisp_rows):
        for c_idx, (_, crop) in enumerate(row):
            paste_into_cell(w_out, crop, c_idx, r_idx, cell, w_scale, "center")
    w_out.save(OUT_DIR / "enemy_wisp.png")
    print("Saved enemy_wisp.png", w_out.size)

    boss_items.sort(key=lambda t: t[0][0])
    assert len(boss_items) == 6, f"boss count={len(boss_items)}"
    boss_cell = 64
    max_bh = max(crop.size[1] for _, crop in boss_items)
    max_bw = max(crop.size[0] for _, crop in boss_items)
    b_scale = min(60.0 / max_bh, 60.0 / max_bw)
    b_out = Image.new("RGBA", (6 * boss_cell, boss_cell), (0, 0, 0, 0))
    for c_idx, (_, crop) in enumerate(boss_items):
        paste_into_cell(b_out, crop, c_idx, 0, boss_cell, b_scale, "bottom", pad_bottom=2)
    b_out.save(OUT_DIR / "boss_earth_guardian.png")
    print("Saved boss_earth_guardian.png", b_out.size)


def remove_white_bg(im: Image.Image, clear_interior_holes: bool = False) -> Image.Image:
    """
    Remove fundo branco uniforme por flood-fill a partir das bordas e aplica
    suavização de 1px na borda externa para evitar halo claro em pisos escuros.
    """
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_white_bg(r: int, g: int, b: int) -> bool:
        mn = min(r, g, b)
        mx = max(r, g, b)
        return mn >= 228 and (mx - mn) <= 22

    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_white_bg(*px[x, y][:3]) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_white_bg(*px[x, y][:3]) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        px[cx, cy] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                if is_white_bg(*px[nx, ny][:3]):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    if clear_interior_holes:
        # Remove bolsões internos puramente brancos (ex.: laços da serpente / anel do chefe)
        vis = [[bg[y][x] for x in range(w)] for y in range(h)]
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a > 0 and not vis[y][x] and min(r, g, b) >= 244 and (max(r, g, b) - min(r, g, b)) <= 12:
                    comp: list[tuple[int, int]] = []
                    cq = deque([(x, y)])
                    vis[y][x] = True
                    while cq:
                        cx, cy = cq.popleft()
                        comp.append((cx, cy))
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and not vis[ny][nx]:
                                nr, ng, nb, na = px[nx, ny]
                                if na > 0 and min(nr, ng, nb) >= 238 and (max(nr, ng, nb) - min(nr, ng, nb)) <= 16:
                                    vis[ny][nx] = True
                                    cq.append((nx, ny))
                    if len(comp) >= 40:
                        for cx, cy in comp:
                            px[cx, cy] = (0, 0, 0, 0)
                            bg[cy][cx] = True

    # Defringe 1px touching removed background
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            touches_bg = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and bg[ny][nx]:
                    touches_bg = True
                    break
            if touches_bg:
                mn = min(r, g, b)
                mx = max(r, g, b)
                if mn >= 200 and (mx - mn) <= 26:
                    alpha = max(0, min(255, int(255 * (245 - mn) / 55.0)))
                    if alpha < 30:
                        px[x, y] = (0, 0, 0, 0)
                    else:
                        px[x, y] = (r, g, b, alpha)
    return im


def split_by_empty_valleys(im: Image.Image, expected_cols: int, expected_rows: int) -> list[list[Image.Image]]:
    """
    Divide uma grade ortogonal pelas faixas vazias entre linhas e colunas,
    garantindo que partículas e efeitos nunca vazem para células vizinhas.
    """
    w, h = im.size
    px = im.load()

    row_has_ink = [any(px[x, y][3] > 16 for x in range(w)) for y in range(h)]
    row_bands: list[tuple[int, int]] = []
    start = None
    for y, ink in enumerate(row_has_ink):
        if ink and start is None:
            start = y
        elif not ink and start is not None:
            if y - start >= 20:
                row_bands.append((start, y))
            start = None
    if start is not None and h - start >= 20:
        row_bands.append((start, h))

    # Fallback se duas linhas quase se tocarem em projeção global: usa divisão uniforme
    if len(row_bands) != expected_rows:
        rh = h / expected_rows
        row_bands = [(int(round(r * rh)), int(round((r + 1) * rh))) for r in range(expected_rows)]

    grid: list[list[Image.Image]] = []
    for ry0, ry1 in row_bands:
        col_has_ink = [any(px[x, y][3] > 16 for y in range(ry0, ry1)) for x in range(w)]
        col_bands: list[tuple[int, int]] = []
        cstart = None
        for x, ink in enumerate(col_has_ink):
            if ink and cstart is None:
                cstart = x
            elif not ink and cstart is not None:
                if x - cstart >= 20:
                    col_bands.append((cstart, x))
                cstart = None
        if cstart is not None and w - cstart >= 20:
            col_bands.append((cstart, w))

        if len(col_bands) != expected_cols:
            cw = w / expected_cols
            col_bands = [(int(round(c * cw)), int(round((c + 1) * cw))) for c in range(expected_cols)]

        row_crops: list[Image.Image] = []
        for cx0, cx1 in col_bands:
            cell_im = im.crop((cx0, ry0, cx1, ry1))
            # Remove tiny stray noise speckles (< 18px) far from main body
            cpx = cell_im.load()
            cw, ch = cell_im.size
            vis = [[False] * cw for _ in range(ch)]
            comps: list[list[tuple[int, int]]] = []
            for yy in range(ch):
                for xx in range(cw):
                    if cpx[xx, yy][3] > 16 and not vis[yy][xx]:
                        comp = []
                        q = deque([(xx, yy)])
                        vis[yy][xx] = True
                        while q:
                            qx, qy = q.popleft()
                            comp.append((qx, qy))
                            for dx in (-1, 0, 1):
                                for dy in (-1, 0, 1):
                                    if dx == 0 and dy == 0:
                                        continue
                                    nx, ny = qx + dx, qy + dy
                                    if 0 <= nx < cw and 0 <= ny < ch and not vis[ny][nx] and cpx[nx, ny][3] > 16:
                                        vis[ny][nx] = True
                                        q.append((nx, ny))
                        comps.append(comp)
            for comp in comps:
                if len(comp) < 16:
                    for qx, qy in comp:
                        cpx[qx, qy] = (0, 0, 0, 0)
            bbox = cell_im.getbbox()
            if bbox:
                cell_im = cell_im.crop(bbox)
            row_crops.append(cell_im)
        grid.append(row_crops)
    return grid


def split_guided_grid(
    im: Image.Image,
    expected_cols: int,
    expected_rows: int,
    strip_speckles: bool = True,
) -> list[list[Image.Image]]:
    """
    Divide uma grade ortogonal buscando os vales de menor tinta próximos às
    divisórias nominais, evitando que partículas soltas quebrem a grade.
    """
    w, h = im.size
    px = im.load()

    row_ink = [sum(1 for x in range(w) if px[x, y][3] > 16) for y in range(h)]
    y_cuts = [0]
    rh = h / expected_rows
    for r in range(1, expected_rows):
        nom = int(round(r * rh))
        lo = max(y_cuts[-1] + 10, int(round(nom - 0.18 * rh)))
        hi = min(h - 10, int(round(nom + 0.18 * rh)))
        zeros = [y for y in range(lo, hi + 1) if row_ink[y] == 0]
        if zeros:
            best_y = zeros[len(zeros) // 2]
        else:
            best_y = min(range(lo, hi + 1), key=lambda y: (row_ink[y], abs(y - nom)))
        y_cuts.append(best_y)
    y_cuts.append(h)

    cw = w / expected_cols
    grid: list[list[Image.Image]] = []
    for r in range(expected_rows):
        ry0, ry1 = y_cuts[r], y_cuts[r + 1]
        col_ink = [sum(1 for y in range(ry0, ry1) if px[x, y][3] > 16) for x in range(w)]
        x_cuts = [0]
        for c in range(1, expected_cols):
            nom = int(round(c * cw))
            lo = max(x_cuts[-1] + 10, int(round(nom - 0.18 * cw)))
            hi = min(w - 10, int(round(nom + 0.18 * cw)))
            zeros = [x for x in range(lo, hi + 1) if col_ink[x] == 0]
            if zeros:
                best_x = zeros[len(zeros) // 2]
            else:
                best_x = min(range(lo, hi + 1), key=lambda x: (col_ink[x], abs(x - nom)))
            x_cuts.append(best_x)
        x_cuts.append(w)

        row_crops: list[Image.Image] = []
        for c in range(expected_cols):
            cell_im = im.crop((x_cuts[c], ry0, x_cuts[c + 1], ry1))
            if strip_speckles:
                cpx = cell_im.load()
                cell_w, cell_h = cell_im.size
                vis = [[False] * cell_w for _ in range(cell_h)]
                comps: list[list[tuple[int, int]]] = []
                for yy in range(cell_h):
                    for xx in range(cell_w):
                        if cpx[xx, yy][3] > 16 and not vis[yy][xx]:
                            comp = []
                            q = deque([(xx, yy)])
                            vis[yy][xx] = True
                            while q:
                                qx, qy = q.popleft()
                                comp.append((qx, qy))
                                for dx in (-1, 0, 1):
                                    for dy in (-1, 0, 1):
                                        if dx == 0 and dy == 0:
                                            continue
                                        nx, ny = qx + dx, qy + dy
                                        if 0 <= nx < cell_w and 0 <= ny < cell_h and not vis[ny][nx] and cpx[nx, ny][3] > 16:
                                            vis[ny][nx] = True
                                            q.append((nx, ny))
                            comps.append(comp)
                for comp in comps:
                    if len(comp) < 16:
                        for qx, qy in comp:
                            cpx[qx, qy] = (0, 0, 0, 0)
            bbox = cell_im.getbbox()
            if bbox:
                cell_im = cell_im.crop(bbox)
            row_crops.append(cell_im)
        grid.append(row_crops)
    return grid


def build_grid_sprite_sheet(
    filename: str,
    cols: int,
    rows: int,
    cell_size: int,
    anchor: str = "bottom",
    pad_bottom: int = 2,
    clear_interior_holes: bool = False,
    flip_cells: set[tuple[int, int]] | None = None,
    bg_mode: str = "white",
    keep_rows: int | None = None,
    guided: bool = False,
    height_priority: bool = False,
) -> None:
    src_path = RAW_DIR / filename
    if not src_path.exists():
        return
    raw = Image.open(src_path)
    if bg_mode == "magenta":
        src = remove_magenta_bg(raw)
    else:
        src = remove_white_bg(raw, clear_interior_holes=clear_interior_holes)
    grid = split_guided_grid(src, cols, rows) if guided else split_by_empty_valleys(src, cols, rows)
    assert len(grid) == rows, f"{filename} rows={len(grid)}"
    assert all(len(r) == cols for r in grid), f"{filename} cols={[len(r) for r in grid]}"

    selected_grid = grid[:keep_rows] if keep_rows else grid
    out_rows = len(selected_grid)

    max_h = max(c.size[1] for r in selected_grid for c in r)
    max_w = max(c.size[0] for r in selected_grid for c in r)
    usable = float(cell_size - 4)
    scale = usable / max_h if height_priority else min(usable / max_h, usable / max_w)

    out = Image.new("RGBA", (cols * cell_size, out_rows * cell_size), (0, 0, 0, 0))
    for r_idx, row in enumerate(selected_grid):
        for c_idx, crop in enumerate(row):
            if flip_cells and (r_idx, c_idx) in flip_cells:
                crop = crop.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            cell_scale = min(scale, (cell_size - 2) / crop.size[0]) if height_priority else scale
            paste_into_cell(out, crop, c_idx, r_idx, cell_size, cell_scale, anchor, pad_bottom=pad_bottom)
    out.save(OUT_DIR / filename)
    print(f"Saved {filename} {out.size}")


def build_items_icons_sheet() -> None:
    part1 = Image.open(RAW_DIR / "items_icons_part1.png").convert("RGBA")
    part2 = Image.open(RAW_DIR / "items_icons_part2.png").convert("RGBA")

    items1 = extract_components(part1, min_body_area=2000, max_particle_dist=60.0)
    rows1 = sort_grid_rows(items1, row_tolerance=75)
    assert len(rows1) == 6 and all(len(r) == 4 for r in rows1), f"items1={[len(r) for r in rows1]}"

    items2 = extract_components(part2, min_body_area=2000, max_particle_dist=65.0)
    rows2 = sort_grid_rows(items2, row_tolerance=75)
    assert len(rows2) == 5 and all(len(r) == 4 for r in rows2), f"items2={[len(r) for r in rows2]}"

    all_icons = [crop for r in rows1 for _, crop in r] + [crop for r in rows2 for _, crop in r]
    assert len(all_icons) == 44, f"total_icons={len(all_icons)}"

    cell = 48
    cols = 8
    rows = 6
    out = Image.new("RGBA", (cols * cell, rows * cell), (0, 0, 0, 0))
    for idx, crop in enumerate(all_icons):
        col = idx % cols
        row = idx // cols
        sw, sh = crop.size
        scale = min(44.0 / sw, 44.0 / sh)
        paste_into_cell(out, crop, col, row, cell, scale, anchor="center")

    out.save(OUT_DIR / "items_icons.png")
    print("Saved items_icons.png", out.size, f"({len(all_icons)} icons)")


def build_ui_icons_sheet() -> None:
    ui_raw_dir = RAW_DIR.parent / "ui"
    ui_out_dir = OUT_DIR.parent / "ui"
    os.makedirs(ui_out_dir, exist_ok=True)

    src = Image.open(ui_raw_dir / "ui_icons.png").convert("RGBA")
    items = extract_components(src, min_body_area=5000, max_particle_dist=95.0)
    rows = sort_grid_rows(items, row_tolerance=85)
    assert len(rows) == 4 and all(len(r) == 4 for r in rows), f"ui_icons={[len(r) for r in rows]}"

    cell = 32
    out = Image.new("RGBA", (4 * cell, 4 * cell), (0, 0, 0, 0))
    for r_idx, row in enumerate(rows):
        for c_idx, (_, crop) in enumerate(row):
            sw, sh = crop.size
            scale = min(28.0 / sw, 28.0 / sh)
            paste_into_cell(out, crop, c_idx, r_idx, cell, scale, anchor="center")

    out.save(ui_out_dir / "ui_icons.png")
    print("Saved ui_icons.png", out.size)


def make_full_tile(crop: Image.Image, tile_size: int = 32, inset_frac: float = 0.065) -> Image.Image:
    w, h = crop.size
    ix = max(1, int(round(w * inset_frac)))
    iy = max(1, int(round(h * inset_frac)))
    inner = crop.crop((ix, iy, max(ix + 1, w - ix), max(iy + 1, h - iy)))
    return inner.resize((tile_size, tile_size), Image.Resampling.LANCZOS)


def make_overlay_tile(crop: Image.Image, tile_size: int = 32, pad: int = 1, anchor: str = "bottom") -> Image.Image:
    out = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))
    sw, sh = crop.size
    usable = float(tile_size - pad * 2)
    scale = min(usable / sw, usable / sh)
    nw = max(1, int(round(sw * scale)))
    nh = max(1, int(round(sh * scale)))
    resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (tile_size - nw) // 2
    oy = (tile_size - pad - nh) if anchor == "bottom" else (tile_size - nh) // 2
    out.alpha_composite(resized, (ox, oy))
    return out


def alpha_crop(im: Image.Image, box: tuple[int, int, int, int], alpha_thresh: int = 16) -> Image.Image:
    sub = im.crop(box).convert("RGBA")
    w, h = sub.size
    px = sub.load()
    x0, y0, x1, y1 = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > alpha_thresh:
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y
    if x1 < x0 or y1 < y0:
        return sub
    return sub.crop((x0, y0, x1 + 1, y1 + 1))


def make_clean_grass_tile(grass_flower_tile: Image.Image, tile_size: int = 32) -> Image.Image:
    """Remove os agrupamentos de flores roxas/brancas da grama para criar o tile base de grama."""
    base = grass_flower_tile.convert("RGBA")
    w, h = base.size
    px = base.load()
    # Collect clean lush green pixels from the tile itself
    greens: list[tuple[int, int, int, int]] = []
    is_flower = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            # Flowers are bright white/yellow/purple/violet where green isn't cleanly dominant
            if (r > g + 8) or (b > g + 5) or (r > 180 and g > 180 and b > 140):
                is_flower[y][x] = True
            elif g > r + 15 and g > b + 15:
                greens.append((r, g, b, 255))

    # Dilate flower mask by 2px to also clean outlines/centers of flowers
    dilated = [[is_flower[y][x] for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if is_flower[y][x]:
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            dilated[ny][nx] = True

    if greens:
        for y in range(h):
            for x in range(w):
                if dilated[y][x]:
                    # Deterministic sample from nearby or symmetric clean green pixel
                    sx = (x + 37) % w
                    sy = (y + 53) % h
                    if not dilated[sy][sx] and px[sx, sy][3] > 200:
                        px[x, y] = px[sx, sy]
                    else:
                        px[x, y] = greens[(x * 31 + y * 17) % len(greens)]
    return make_full_tile(base, tile_size=tile_size, inset_frac=0.07)


def remove_dark_bg(im: Image.Image, bg_rgb: tuple[int, int, int] = (25, 26, 35), tol: int = 34) -> Image.Image:
    """Remove fundo escuro uniforme por flood-fill a partir das bordas."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_bg(r: int, g: int, b: int) -> bool:
        return abs(r - bg_rgb[0]) + abs(g - bg_rgb[1]) + abs(b - bg_rgb[2]) <= tol

    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(*px[x, y][:3]) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(*px[x, y][:3]) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        px[cx, cy] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                if is_bg(*px[nx, ny][:3]):
                    bg[ny][nx] = True
                    q.append((nx, ny))
    return im


def build_tilesets() -> None:
    tiles_raw = RAW_DIR.parent / "tilesets"
    tiles_out = OUT_DIR.parent / "tilesets"
    os.makedirs(tiles_out, exist_ok=True)

    # 1. Chapada dos Veadeiros (4x2 -> 128x64)
    chapada_raw = Image.open(tiles_raw / "chapada_tileset.png").convert("RGBA")
    chap_items = extract_components(chapada_raw, min_body_area=5000)
    chap_rows = sort_grid_rows(chap_items, row_tolerance=120)
    assert len(chap_rows) == 2 and all(len(r) == 4 for r in chap_rows), f"chapada={[len(r) for r in chap_rows]}"
    chap_out = Image.new("RGBA", (128, 64), (0, 0, 0, 0))
    for r_idx, row in enumerate(chap_rows):
        for c_idx, (_, crop) in enumerate(row):
            if (r_idx, c_idx) == (0, 3):
                tile = make_overlay_tile(crop, 32, pad=1, anchor="bottom")
            else:
                tile = make_full_tile(crop, 32, inset_frac=0.07)
            chap_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    chap_out.save(tiles_out / "chapada_tileset.png")
    print("Saved chapada_tileset.png", chap_out.size)

    # 2. Serra de Varginha & Omena (4x4 -> 128x128)
    varg_raw = Image.open(tiles_raw / "varginha_tileset.png").convert("RGBA")
    varg_row_bands = [(10, 246), (258, 493), (512, 734), (746, 1010)]
    varg_col_bands = [(92, 386), (452, 746), (808, 1088), (1154, 1440)]
    varg_out = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    for r_idx, (ry0, ry1) in enumerate(varg_row_bands):
        for c_idx, (cx0, cx1) in enumerate(varg_col_bands):
            crop = alpha_crop(varg_raw, (cx0, ry0, cx1, ry1))
            tile = make_full_tile(crop, 32, inset_frac=0.075)
            varg_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    varg_out.save(tiles_out / "varginha_tileset.png")
    print("Saved varginha_tileset.png", varg_out.size)

    # 3. Missing tiles + solos agrícolas + Tileset Mestre sao_tome_tileset.png (8x4 -> 256x128)
    missing_raw = Image.open(tiles_raw / "sao_tome_missing_tiles.png").convert("RGBA")
    miss_items = extract_components(missing_raw, min_body_area=5000)
    miss_rows = sort_grid_rows(miss_items, row_tolerance=85)
    assert len(miss_rows) == 4 and all(len(r) == 4 for r in miss_rows), f"missing={[len(r) for r in miss_rows]}"

    soil_tilled = make_full_tile(miss_rows[3][0][1], 32, inset_frac=0.065)
    soil_watered = make_full_tile(miss_rows[3][1][1], 32, inset_frac=0.065)
    soil_tilled.save(OUT_DIR / "soil_tilled.png")
    soil_watered.save(OUT_DIR / "soil_watered.png")
    print("Saved soil_tilled.png and soil_watered.png (32, 32)")

    st_raw = Image.open(tiles_raw / "sao_tome_tileset.png").convert("RGBA")
    mp_raw = Image.open(tiles_raw / "machu_picchu_tileset.png").convert("RGBA")

    # 32 GIDs (8 cols x 4 rows) matching BootScene / generateTiledMaps.mjs
    tiles_32: list[Image.Image] = [None] * 32  # type: ignore[list-item]
    grass_1 = alpha_crop(st_raw, (5, 5, 150, 148))
    grass_2 = alpha_crop(st_raw, (152, 5, 300, 148))
    tiles_32[0] = make_clean_grass_tile(grass_1, 32)  # GID 1: Grama da serra
    tiles_32[1] = make_full_tile(grass_2, 32, inset_frac=0.07)  # GID 2: Grama com flores
    tiles_32[2] = make_full_tile(alpha_crop(st_raw, (756, 5, 906, 148)), 32, inset_frac=0.065)  # GID 3: Caminho de quartzo
    tiles_32[3] = make_full_tile(alpha_crop(st_raw, (5, 148, 152, 276)), 32, inset_frac=0.07)  # GID 4: Água mística
    tiles_32[4] = make_full_tile(alpha_crop(st_raw, (302, 5, 452, 148)), 32, inset_frac=0.07)  # GID 5: Solo arável

    tiles_32[5] = make_full_tile(miss_rows[0][0][1], 32, inset_frac=0.06)  # GID 6: Assoalho de madeira
    tiles_32[6] = make_full_tile(miss_rows[0][1][1], 32, inset_frac=0.06)  # GID 7: Piso pedra porão
    tiles_32[7] = make_full_tile(miss_rows[0][2][1], 32, inset_frac=0.06)  # GID 8: Tapete místico
    tiles_32[8] = make_full_tile(miss_rows[1][0][1], 32, inset_frac=0.04)  # GID 9: Parede casa c/ janela
    # Telhado contínuo (corta dentro das bordas inclinadas para não deixar frestas verdes entre tiles)
    roof_raw = miss_rows[1][1][1]
    rw, rh = roof_raw.size
    roof_core = roof_raw.crop((int(rw * 0.20), int(rh * 0.08), int(rw * 0.80), int(rh * 0.90)))
    tiles_32[9] = roof_core.resize((32, 32), Image.Resampling.LANCZOS)  # GID 10: Telhado contínuo
    tiles_32[10] = make_full_tile(miss_rows[0][3][1], 32, inset_frac=0.06)  # GID 11: Parede interna

    tiles_32[11] = make_overlay_tile(alpha_crop(st_raw, (5, 276, 152, 368)), 32, pad=1, anchor="bottom")  # GID 12: Cerca
    tiles_32[12] = make_overlay_tile(alpha_crop(st_raw, (140, 543, 275, 670)), 32, pad=1, anchor="bottom")  # GID 13: Árvore
    tiles_32[13] = make_overlay_tile(alpha_crop(st_raw, (1120, 550, 1225, 652)), 32, pad=1, anchor="bottom")  # GID 14: Rocha quartzo
    tiles_32[14] = make_overlay_tile(miss_rows[1][2][1], 32, pad=0, anchor="bottom")  # GID 15: Porta
    tiles_32[15] = make_overlay_tile(miss_rows[1][3][1], 32, pad=1, anchor="center")  # GID 16: Alçapão / Escada
    tiles_32[16] = make_overlay_tile(miss_rows[2][0][1], 32, pad=1, anchor="center")  # GID 17: Cama
    tiles_32[17] = make_overlay_tile(miss_rows[3][3][1], 32, pad=1, anchor="bottom")  # GID 18: Caixa de Remessas
    tiles_32[18] = make_overlay_tile(miss_rows[3][2][1], 32, pad=1, anchor="bottom")  # GID 19: Altar de Lupin / Fonte
    tiles_32[19] = make_overlay_tile(miss_rows[2][1][1], 32, pad=1, anchor="bottom")  # GID 20: Portal Quebrado
    tiles_32[20] = make_overlay_tile(miss_rows[2][2][1], 32, pad=1, anchor="center")  # GID 21: Ninho 3 Ovos
    tiles_32[21] = make_overlay_tile(alpha_crop(st_raw, (208, 755, 358, 862)), 32, pad=1, anchor="bottom")  # GID 22: Mesa / Bancada
    tiles_32[22] = make_full_tile(alpha_crop(st_raw, (1380, 148, 1534, 276)), 32, inset_frac=0.04)  # GID 23: Ponte madeira
    tiles_32[23] = make_overlay_tile(alpha_crop(st_raw, (1315, 275, 1405, 372)), 32, pad=1, anchor="bottom")  # GID 24: Placa

    tiles_32[24] = soil_tilled  # GID 25: Terra arada seca
    tiles_32[25] = soil_watered  # GID 26: Terra arada regada
    tiles_32[26] = make_full_tile(miss_rows[2][3][1], 32, inset_frac=0.05)  # GID 27: Runa arcana

    tiles_32[27] = make_full_tile(mp_raw.crop((496, 177, 608, 294)), 32, inset_frac=0.04)  # GID 28: Piso inca
    tiles_32[28] = make_full_tile(mp_raw.crop((180, 15, 306, 152)), 32, inset_frac=0.04)  # GID 29: Parede inca
    tiles_32[29] = make_full_tile(mp_raw.crop((990, 177, 1114, 294)), 32, inset_frac=0.04)  # GID 30: Espinhos incas
    tiles_32[30] = make_full_tile(mp_raw.crop((998, 15, 1122, 152)), 32, inset_frac=0.04)  # GID 31: Veio minério
    tiles_32[31] = make_full_tile(mp_raw.crop((816, 460, 941, 550)), 32, inset_frac=0.04)  # GID 32: Escada descida

    st_out = Image.new("RGBA", (256, 128), (0, 0, 0, 0))
    for idx, tile in enumerate(tiles_32):
        col = idx % 8
        row = idx // 8
        st_out.alpha_composite(tile, (col * 32, row * 32))
    st_out.save(tiles_out / "sao_tome_tileset.png")
    print("Saved sao_tome_tileset.png", st_out.size)

    # 4. Machu Picchu temático completo (4x4 -> 128x128)
    def mp_prop(box: tuple[int, int, int, int], pad: int = 1, anchor: str = "bottom") -> Image.Image:
        cropped = remove_dark_bg(mp_raw.crop(box), bg_rgb=(25, 26, 35), tol=36)
        comps = extract_components(cropped, min_body_area=800, max_particle_dist=25.0)
        if comps:
            main = max(comps, key=lambda c: c[1].width * c[1].height)[1]
        else:
            bb = cropped.getbbox()
            main = cropped.crop(bb) if bb else cropped
        return make_overlay_tile(main, 32, pad=pad, anchor=anchor)

    mp_tiles: list[Image.Image] = [
        # Linha 0 (GIDs 1..4): Piso, Parede, Armadilha, Veio
        make_full_tile(mp_raw.crop((520, 172, 662, 298)), 32, inset_frac=0.05),   # 1: Piso inca com musgo
        make_full_tile(mp_raw.crop((179, 10, 329, 155)), 32, inset_frac=0.05),    # 2: Parede inca
        make_full_tile(mp_raw.crop((996, 184, 1136, 300)), 32, inset_frac=0.04),  # 3: Armadilha de espinhos
        make_full_tile(mp_raw.crop((997, 12, 1136, 154)), 32, inset_frac=0.04),   # 4: Veio de minério inca
        # Linha 1 (GIDs 5..8): Escada, Runa solar, Abismo nuvens, Piso fissura solar
        make_full_tile(mp_raw.crop((818, 464, 949, 568)), 32, inset_frac=0.04),   # 5: Escadaria de descida
        make_full_tile(mp_raw.crop((1157, 184, 1283, 300)), 32, inset_frac=0.04), # 6: Runa Medalhão do Sol
        make_full_tile(mp_raw.crop((1365, 466, 1516, 570)), 32, inset_frac=0.04), # 7: Abismo / névoa das montanhas
        make_full_tile(mp_raw.crop((675, 172, 817, 298)), 32, inset_frac=0.05),   # 8: Piso inca fissuras solares
        # Linha 2 (GIDs 9..12): Pilar, Braseiro, Estátua, Parede do Sol
        mp_prop((703, 6, 799, 158), pad=1, anchor="bottom"),                      # 9: Pilar de pedra inca
        mp_prop((34, 314, 132, 444), pad=1, anchor="bottom"),                     # 10: Braseiro flamejante
        mp_prop((325, 314, 430, 444), pad=1, anchor="bottom"),                    # 11: Estátua guardiã inca
        make_full_tile(mp_raw.crop((520, 10, 674, 156)), 32, inset_frac=0.05),    # 12: Parede com Medalhão do Sol
        # Linha 3 (GIDs 13..16): Portal/Arco, Pedestal cristal, Baú, Monólito verde
        mp_prop((347, 6, 507, 158), pad=0, anchor="bottom"),                      # 13: Arco / Portal inca
        mp_prop((192, 314, 282, 444), pad=1, anchor="bottom"),                    # 14: Pedestal cristal amarelo
        mp_prop((1368, 315, 1498, 437), pad=1, anchor="bottom"),                  # 15: Baú do tesouro inca
        mp_prop((604, 314, 697, 444), pad=1, anchor="bottom"),                    # 16: Monólito de teleporte
    ]

    mp_out = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    for idx, tile in enumerate(mp_tiles):
        col = idx % 4
        row = idx // 4
        mp_out.alpha_composite(tile, (col * 32, row * 32))
    mp_out.save(tiles_out / "machu_picchu_tileset.png")
    print("Saved machu_picchu_tileset.png", mp_out.size)

    # 5. Lote 9A: Arquitetura Modular (6x4 -> 192x128)
    bld_raw = remove_white_bg(Image.open(tiles_raw / "sao_tome_buildings_modular.png"), clear_interior_holes=False)
    bld_grid = split_guided_grid(bld_raw, 6, 4)
    bld_out = Image.new("RGBA", (6 * 32, 4 * 32), (0, 0, 0, 0))
    for r_idx, row in enumerate(bld_grid):
        for c_idx, crop in enumerate(row):
            if (r_idx == 0 and c_idx in (1, 5)) or r_idx == 1 or (r_idx == 2 and c_idx in (0, 1, 2)):
                tile = make_full_tile(crop, 32, inset_frac=0.04)
            else:
                tile = make_overlay_tile(crop, 32, pad=1, anchor="bottom" if r_idx != 3 or c_idx < 4 else "center")
            bld_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    bld_out.save(tiles_out / "sao_tome_buildings_modular.png")
    print("Saved sao_tome_buildings_modular.png", bld_out.size)

    # 6. Lote 9B: Interiores Ricos (4x4 -> 128x128)
    int_raw = remove_white_bg(Image.open(tiles_raw / "sao_tome_interiors.png"), clear_interior_holes=False)
    int_grid = split_guided_grid(int_raw, 4, 4)
    int_out = Image.new("RGBA", (4 * 32, 4 * 32), (0, 0, 0, 0))
    for r_idx, row in enumerate(int_grid):
        for c_idx, crop in enumerate(row):
            if r_idx == 2 and c_idx in (0, 1, 2):
                tile = make_full_tile(crop, 32, inset_frac=0.04)
            else:
                tile = make_overlay_tile(crop, 32, pad=1, anchor="bottom")
            int_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    int_out.save(tiles_out / "sao_tome_interiors.png")
    print("Saved sao_tome_interiors.png", int_out.size)

    # 7. Lote 10A: Natureza Viva & Terreno Estendido (6x4 -> 192x128)
    nat_raw = remove_white_bg(Image.open(tiles_raw / "sao_tome_nature_extended.png"), clear_interior_holes=False)
    nat_grid = split_guided_grid(nat_raw, 6, 4)
    nat_out = Image.new("RGBA", (6 * 32, 4 * 32), (0, 0, 0, 0))
    for r_idx, row in enumerate(nat_grid):
        for c_idx, crop in enumerate(row):
            if (r_idx == 0 and c_idx < 4) or (r_idx == 1 and c_idx < 4):
                # Inset maior remove cantos arredondados contra o fundo branco para tiling contínuo
                tile = make_full_tile(crop, 32, inset_frac=0.14)
            else:
                if r_idx == 3 and c_idx < 4:
                    crop = remove_white_bg(crop, clear_interior_holes=True)
                tile = make_overlay_tile(crop, 32, pad=1, anchor="bottom")
            nat_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    nat_out.save(tiles_out / "sao_tome_nature_extended.png")
    print("Saved sao_tome_nature_extended.png", nat_out.size)

    # 8. Lote 12: Detalhes de Dungeons (4x4 -> 128x128)
    dd_raw = remove_white_bg(Image.open(tiles_raw / "dungeons_details.png"), clear_interior_holes=False)
    dd_grid = split_guided_grid(dd_raw, 4, 4)
    dd_out = Image.new("RGBA", (4 * 32, 4 * 32), (0, 0, 0, 0))
    for r_idx, row in enumerate(dd_grid):
        for c_idx, crop in enumerate(row):
            if r_idx == 2 and c_idx == 0:
                tile = make_full_tile(crop, 32, inset_frac=0.05)
            else:
                tile = make_overlay_tile(crop, 32, pad=1, anchor="bottom" if r_idx != 3 else "center")
            dd_out.alpha_composite(tile, (c_idx * 32, r_idx * 32))
    dd_out.save(tiles_out / "dungeons_details.png")
    print("Saved dungeons_details.png", dd_out.size)


def build_portraits() -> None:
    """Fatia portraits_part1.png e portraits_part2.png em retratos individuais 64x64."""
    p_raw_dir = RAW_DIR.parent / "portraits"
    p_out_dir = OUT_DIR.parent / "portraits"
    os.makedirs(p_out_dir, exist_ok=True)

    specs: list[tuple[str, list[list[str]]]] = [
        (
            "portraits_part1.png",
            [
                ["tome", "celeste", "bento", "isis"],
                ["lyra", "seu_zeca", "prefeito_arlindo", "seu_damiao"],
            ],
        ),
        (
            "portraits_part2.png",
            [
                ["rafael", "remo", "lupin", "guardiao_terra"],
                ["guardiao_aguas", "guardiao_ceus", "rafael_alegre", "celeste_surpresa"],
            ],
        ),
    ]

    size = 64
    for filename, names in specs:
        raw = remove_white_bg(Image.open(p_raw_dir / filename), clear_interior_holes=False)
        grid = split_guided_grid(raw, 4, 2)
        for r_idx, row in enumerate(grid):
            for c_idx, crop in enumerate(row):
                portrait_id = names[r_idx][c_idx]
                out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
                sw, sh = crop.size
                scale = min(60.0 / sw, 60.0 / sh)
                nw = max(1, int(round(sw * scale)))
                nh = max(1, int(round(sh * scale)))
                resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
                ox = (size - nw) // 2
                oy = size - nh if portrait_id not in ("remo", "lupin") else (size - nh) // 2
                out.alpha_composite(resized, (ox, oy))
                out.save(p_out_dir / f"{portrait_id}.png")
    print("Saved 16 portraits (64x64) in", p_out_dir)


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    build_player_sheet()
    build_npcs_sheet()
    build_companions_sheet()
    build_creatures_fire_sheet()
    build_enemies_earth_sheets()
    # Lote 1: Chapada dos Veadeiros & Varginha
    build_grid_sprite_sheet(
        "enemy_serpente.png",
        cols=4,
        rows=3,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=True,
        flip_cells={(0, 0)},
    )
    build_grid_sprite_sheet(
        "enemy_sonda.png",
        cols=4,
        rows=3,
        cell_size=48,
        anchor="center",
        clear_interior_holes=False,
    )
    build_grid_sprite_sheet(
        "boss_water_guardian.png",
        cols=6,
        rows=2,
        cell_size=64,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=True,
    )
    build_grid_sprite_sheet(
        "boss_sky_guardian.png",
        cols=6,
        rows=2,
        cell_size=64,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=True,
    )
    # Lote 2: Unicórnio, Objetos do Mundo e Safras
    build_grid_sprite_sheet(
        "pet_unicornio.png",
        cols=4,
        rows=3,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        bg_mode="magenta",
    )
    build_grid_sprite_sheet(
        "world_objects.png",
        cols=4,
        rows=3,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
    )
    build_grid_sprite_sheet(
        "crops_sheet.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=4,
        clear_interior_holes=True,
        keep_rows=3,
    )
    # Lote 3: Pilares de Cristal & VFX A
    build_grid_sprite_sheet(
        "crystal_pillars.png",
        cols=4,
        rows=2,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
    )
    build_grid_sprite_sheet(
        "combat_vfx_a.png",
        cols=4,
        rows=3,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
    )
    # Lote 3B-2 & 3C: VFX B e Entidades/Props da Fase 3 (Omena)
    build_grid_sprite_sheet(
        "combat_vfx_b.png",
        cols=4,
        rows=3,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
    )
    build_grid_sprite_sheet(
        "enemy_sentinela_omena.png",
        cols=4,
        rows=3,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=True,
        guided=True,
    )
    build_grid_sprite_sheet(
        "boss_omena.png",
        cols=6,
        rows=2,
        cell_size=64,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=True,
        guided=True,
    )
    build_grid_sprite_sheet(
        "omena_world_props.png",
        cols=4,
        rows=2,
        cell_size=48,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
    )
    # Lote 8: Personagem, Ferramentas & VFX de Ferramentas
    build_grid_sprite_sheet(
        "player_idle_sprint.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
    )
    build_grid_sprite_sheet(
        "player_tools_side.png",
        cols=4,
        rows=6,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    build_grid_sprite_sheet(
        "player_tools_vertical.png",
        cols=4,
        rows=6,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
    )
    build_grid_sprite_sheet(
        "player_empty_hands_base.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        flip_cells={(3, 2)},
        guided=True,
    )
    build_grid_sprite_sheet(
        "tools_vfx.png",
        cols=4,
        rows=4,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
    )
    # Lotes 10B & 11: Vida Ambiente, Rotinas dos NPCs & Pets Estendidos
    build_grid_sprite_sheet(
        "ambient_life_vfx.png",
        cols=4,
        rows=4,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
    )
    build_grid_sprite_sheet(
        "npcs_activities.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
    )
    build_grid_sprite_sheet(
        "pets_extended.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    # Lotes v2: Movimentação Completa de NPCs, Inimigos, Chefes, Pets, Fauna e Bancadas
    for npc_id in (
        "celeste",
        "bento",
        "isis",
        "lyra",
        "seu_zeca",
        "prefeito_arlindo",
        "seu_damiao",
        "rafael",
    ):
        build_grid_sprite_sheet(
            f"npc_{npc_id}_move.png",
            cols=4,
            rows=4,
            cell_size=48,
            anchor="bottom",
            pad_bottom=2,
            clear_interior_holes=False,
            guided=True,
            height_priority=True,
        )
    build_grid_sprite_sheet(
        "npcs_activities_part2.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    for enemy_ext_name in (
        "enemies_earth_ext.png",
        "enemies_crystal_sky_ext.png",
        "enemies_omena_ext.png",
    ):
        build_grid_sprite_sheet(
            enemy_ext_name,
            cols=4,
            rows=4,
            cell_size=48,
            anchor="bottom",
            pad_bottom=2,
            clear_interior_holes=False,
            guided=True,
            height_priority=True,
        )
    for boss_ext_name in (
        "boss_earth_guardian_ext.png",
        "bosses_elemental_ext.png",
        "boss_omena_ext.png",
    ):
        build_grid_sprite_sheet(
            boss_ext_name,
            cols=6,
            rows=2,
            cell_size=64,
            anchor="bottom",
            pad_bottom=2,
            clear_interior_holes=False,
            guided=True,
            height_priority=True,
        )
    build_grid_sprite_sheet(
        "companions_ext.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    build_grid_sprite_sheet(
        "pets_movement_ext.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    build_grid_sprite_sheet(
        "wildlife_fauna_v2.png",
        cols=4,
        rows=6,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    build_grid_sprite_sheet(
        "workbenches_animated.png",
        cols=4,
        rows=4,
        cell_size=48,
        anchor="bottom",
        pad_bottom=2,
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    build_grid_sprite_sheet(
        "props_living_v2.png",
        cols=4,
        rows=3,
        cell_size=32,
        anchor="center",
        clear_interior_holes=False,
        guided=True,
        height_priority=True,
    )
    # Lote 4, 5, 6, 7, 9, 10A & 12: Ícones, Retratos, UI e Tilesets
    build_items_icons_sheet()
    build_portraits()
    build_ui_icons_sheet()
    build_tilesets()
