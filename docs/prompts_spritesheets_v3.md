# Prompts — Spritesheets Faltantes (Lote v3)

> [!NOTE]
> Todos os lotes anteriores (**Lotes 1–12** de [prompts_spritesheets_faltantes.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets_faltantes.md) e **Lotes v2** de [prompts_spritesheets_movimento_v2.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets_movimento_v2.md)) **já foram gerados e integrados** em `public/assets/`.
> Este documento contém **exclusivamente os 6 spritesheets novos** que ainda faltam gerar externamente.

---

## Regras Padrão para Geração (Copie junto aos prompts se necessário)
- **Estilo:** `2D top-down 3/4 cozy RPG pixel art, Stardew Valley / 16-bit SNES style`
- **Paleta:** pedra de quartzo (`#d6cfc2`/`#9c9588`), verde serrano (`#4a6b53`), índigo (`#7e8ce0`/`#2a2640`), ciano arcano (`#4deeea`), âmbar (`#f59e0b`).
- **Grade:** células ortogonais estritas, zero sobreposição entre quadros vizinhos, sem texto, sem linhas de grade, sem anti-aliasing, fundo uniforme sólido (ou transparente).

---

## Checklist Rápido

| # | Arquivo Final | Frame | Grade | Tamanho Final | Prioridade |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | `public/assets/sprites/player_item_usability.png` | `48×48` | `4×6` | `192×288` | Alta |
| 2 | `public/assets/sprites/player_equipment_overlays.png` | `48×48` | `4×6` | `192×288` | Alta |
| 3 | `public/assets/ui/ui_icons_ext.png` | `32×32` | `4×4` | `128×128` | Alta |
| 4 | `public/assets/sprites/sao_tome_trees.png` | `64×96` | `4×2` | `256×192` | Média |
| 5 | `public/assets/ui/ui_frames_9slice.png` | `48×48` | `3×1` | `144×48` | Média |
| 6 | `public/assets/portraits/portraits_expressions_v3.png` | `64×64` | `4×4` | `256×256` | Baixa |

---

## 1. `player_item_usability.png` *(Lote 8D pendente)*
- **Destino:** `public/assets/sprites/player_item_usability.png` (`48×48`, grade `4×6`, `192×288` px)
- **Uso:** Carregar itens acima da cabeça (4 direções), plantar semente, comer/beber poção, conjurar verticalmente e entregar presentes.
```text
2D 16-bit SNES/Stardew RPG character item-interaction sprite sheet on a strict 4 columns by 6 rows grid (each sprite fits comfortably inside a 48x48 cell, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel), with EMPTY OPEN HANDS ready to carry overhead items or empty/small props:
Row 1 (4 frames): CARRYING / HOLDING ITEM OVERHEAD walking DOWN (hands raised slightly above head as if carrying a crop/egg/ore/crate, facing camera).
Row 2 (4 frames): CARRYING ITEM OVERHEAD facing UP (2 walk frames back view) and facing RIGHT (2 walk frames side profile, hands raised overhead).
Row 3 (4 frames): PLANTING SEEDS / PLACING OBJECT (facing DOWN/SIDE — crouching gently -> scattering tiny golden seeds on soil -> pressing dirt -> standing up).
Row 4 (4 frames): EATING FOOD / DRINKING POTION facing DOWN (lifting hand with small food/potion bottle to mouth -> happy chewing/sipping cheeks -> satisfied sparkle glow).
Row 5 (4 frames): CASTING STAFF MAGIC vertically — 2 frames facing DOWN thrusting glowing crystal wand forward + 2 frames facing UP raising glowing staff skyward.
Row 6 (4 frames): GIVING GIFT / HARVESTING / VICTORY HOLD — extending both hands forward politely (2 frames) + joyful item-get pose holding trophy/egg high with sparkles (2 frames).
Crisp 16-bit pixel art, dark outlines, no anti-aliasing.
```

---

## 2. `player_equipment_overlays.png` *(Armaduras e Cajados no Personagem)*
- **Destino:** `public/assets/sprites/player_equipment_overlays.png` (`48×48`, grade `4×6`, `192×288` px)
- **Uso:** Camada sobreposta pixel-a-pixel ao `player.png` no mundo e no preview de "Tomé — Guardião" no Inventário.
```text
2D top-down 3/4 cozy RPG pixel art equipment overlay sprite sheet on a strict 4 columns by 6 rows orthogonal grid (48x48 cells, completely transparent background around each armor/cloak piece, aligned to a 48x48 Stardew Valley style character torso/shoulders, zero overlap, no body/face drawn, no text):
Row 1 (4 frames): Mist Tunic (sage green #4a6b53 with indigo trim #7e8ce0) facing Down, Up, Left, Right.
Row 2 (4 frames): Runic Granite Armor (stone grey #78716c with amber rune shoulder pads #f59e0b) facing Down, Up, Left, Right.
Row 3 (4 frames): Dragonscale Mantle (crimson #991b1b with gold trim #f5b942) facing Down, Up, Left, Right.
Row 4 (4 frames): 4 magical staffs held at side (Apprentice Cyan Staff, Earth Quartz Staff, Starlight Arcane Staff, World Core Scepter).
Row 5-6 (8 frames): subtle cape/cloak flutter frames for walking Down and Right for Mist Tunic and Dragonscale Mantle.
Crisp 16-bit SNES pixel art, dark indigo outlines, no anti-aliasing.
```

---

## 3. `ui_icons_ext.png` *(Substituir Emojis & SVGs de Fallback da UI/HUD)*
- **Destino:** `public/assets/ui/ui_icons_ext.png` (`32×32`, grade `4×4`, `128×128` px)
- **Uso:** Ícones das abas Moradores, Grimório, Compêndio, Pino de Missão, Som On/Off, Salvar, Lixeira, Mini-Dragão, Unicórnio, Ovo, Estrela Endgame e os 4 Elementos.
```text
2D cozy fantasy RPG pixel art UI icons sprite sheet on a strict 4 columns by 4 rows orthogonal grid (32x32 cells, solid dark/transparent background, generous padding, zero overlap, no text):
Row 1: [0] warm crimson heart villager friendship icon, [1] glowing cyan-purple arcane grimoire spellbook, [2] open golden-bound compendium encyclopedia book, [3] golden map/quest pin marker.
Row 2: [4] speaker sound-on icon with cyan waves, [5] muted speaker with red X, [6] mystical save rune crystal/scroll icon, [7] wooden recycle/trash bin icon.
Row 3: [8] cute red mini-dragon head badge, [9] cute pearl-white unicorn head badge, [10] speckled mystical dragon egg icon, [11] radiant golden guardian star emblem.
Row 4: [12] Earth element amber quartz diamond, [13] Water element cyan droplet gem, [14] Air element indigo wind swirl, [15] Arcane element violet star orb.
Crisp 16-bit SNES pixel art, clean dark outlines, no anti-aliasing.
```

---

## 4. `sao_tome_trees.png` *(Árvores Multi-Tile em Escala Real)*
- **Destino:** `public/assets/sprites/sao_tome_trees.png` (`64×96`, grade `4×2`, `256×192` px)
- **Uso:** Substituir árvores `32×32` de `sao_tome_nature_extended.png`, dando copas altas com *Y-sorting* natural.
```text
2D top-down 3/4 cozy RPG pixel art trees sprite sheet on a strict 4 columns by 2 rows orthogonal grid (64x96 tall cells, solid uniform background, zero overlap, no text):
Row 1 (4 full tall trees with lush rounded canopies and sturdy trunks anchored at bottom center): [0] highland oak tree A (lush green #4a6b53), [1] highland oak tree B (deeper mossy green), [2] Brazilian purple Ipe tree with vibrant lavender-magenta blossoms, [3] mystical Sao Tome quartz-blossom tree with glowing cyan crystal buds.
Row 2 (4 frames): [4-6] corresponding cut tree stumps with mossy roots, [7] misty autumn golden-amber tree.
Stardew Valley aesthetic, rich leaf clusters, warm dark brown/indigo outlines, no anti-aliasing.
```

---

## 5. `ui_frames_9slice.png` *(Molduras Orgânicas 9-Slice)*
- **Destino:** `public/assets/ui/ui_frames_9slice.png` (`48×48`, grade `3×1`, `144×48` px)
- **Uso:** `border-image` para painéis de HUD, modais e caixa de diálogo.
```text
2D cozy fantasy RPG pixel art 9-slice UI panel frames on a strict 3 columns by 1 row grid (48x48 square panel frames, solid transparent/dark background, zero overlap, no text):
[0] Dark indigo & burnished gold arcane border frame (#14121d center, #f5b942 corner rivets), [1] Warm carved oak & parchment cozy frame (#2c1810 wood, #d6cfc2 inner trim), [2] Sao Tome quartz stone & cyan crystal rune frame (#9c9588 stone, #4deeea corner gems).
Crisp 16-bit SNES pixel art, symmetrical corners, no anti-aliasing.
```

---

## 6. `portraits_expressions_v3.png` *(Expressões & Bustos do Compêndio)*
- **Destino:** `assets_raw/portraits/portraits_expressions_v3.png` → recortar para `public/assets/portraits/*.png` (`64×64`, grade `4×4`, `256×256` px)
- **Uso:** Expressões extras de diálogo para Tomé e moradores + mini-bustos de criaturas para o Compêndio.
```text
2D 16-bit cozy RPG character & creature dialogue portrait busts on a strict 4 columns by 4 rows grid (64x64 cells, dark indigo background, zero overlap, no text):
Row 1: Tome happy smile, Tome determined/serious, Bento smiling warmly, Isis mystical serene glow.
Row 2: Lyra cheerful wink, Seu Zeca hearty laugh, Prefeito Arlindo worried/sweating, Seu Damiao stern focused.
Row 3 (Creature busts for Compendium): Stone Golem, Crystal Serpent, Varginha UFO Probe, Omena Sentinel.
Row 4 (Companion busts for Compendium): Red Mini-Dragon, Pearl Unicorn, Remo black cat, Lupin arcane fox/spirit.
Stardew Valley portrait style, expressive pixel art shading, clean dark outlines.
```

---

## Como Integrar Após Gerar
1. Salve as imagens originais em `assets_raw/` (`assets_raw/sprites/`, `assets_raw/ui/`, `assets_raw/portraits/`).
2. Rode o recorte/padronização com `scripts/processSprites.py`.
3. Avise para conectarmos as chaves no `BootScene.ts`, `UiIcons.ts`, `WorldScene.ts` e `InventoryModal.ts`.

