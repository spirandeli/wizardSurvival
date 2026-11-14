# Guia de Prompts — Spritesheets Faltantes (*O Despertar de São Tomé dos Números*)

Este documento complementa [prompts_spritesheets.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets.md) com os prompts prontos para gerar todos os spritesheets, retratos, ícones, efeitos visuais e tilesets que ainda faltam no projeto.

## 0. Status Atual — O que já foi gerado vs. O que ainda falta

> [!NOTE]
> Os Lotes **1, 2, 3A, 3B, 3C, 4, 5, 6, 7, 8 (exceto 8D), 9, 10, 11 e 12** já foram gerados, recortados em `public/assets/` (com originais preservados em `assets_raw/`) e integrados ao código. Apenas o item marcado com `[ ]` abaixo (`player_item_usability.png`) permanece pendente.

### Já Gerados, Recortados e Integrados no Código
- `[x]` **Lote 1 completo:** `enemy_serpente.png`, `enemy_sonda.png`, `boss_water_guardian.png`, `boss_sky_guardian.png` (`assets_raw/sprites/` + `public/assets/sprites/` + `BootScene.ts` + `Enemy.ts`)
- `[x]` **Lote 2 completo:** `pet_unicornio.png`, `world_objects.png` (Bancada de Encantamento, Câmera do Rafael, Fragmento do Diário), `crops_sheet.png` (3 safras × 4 estágios) (`assets_raw/sprites/` + `public/assets/sprites/` + `BootScene.ts` + `WorldScene.ts`)
- `[x]` **Lote 3A & 3B (Partes 1 e 2):** `crystal_pillars.png`, `combat_vfx_a.png` (`arcane_bolt`, `slash_arc`, `enemy_rock_bolt`), `combat_vfx_b.png` (`water_bolt`, `wind_bolt`, `omena_bolt`) (`assets_raw/sprites/` + `public/assets/sprites/` + `BootScene.ts` + `DungeonScene.ts` + `WorldScene.ts`)
- `[x]` **Lote 3C (Fase 3 — Omena):** `enemy_sentinela_omena.png`, `boss_omena.png` (`384×128`), `omena_world_props.png` (`BootScene.ts` + `Enemy.ts` + `WorldScene.ts` + `DungeonScene.ts`)
- `[x]` **Lote 4 completo:** `items_icons.png` (`384×288`, grade `8×6` de `48×48`, 44 ícones a partir de `items_icons_part1.png` + `items_icons_part2.png`; `ItemIcon.ts` + `items.ts`)
- `[x]` **Lote 5 completo (16 Retratos `64×64`):** `portraits_part1.png` + `portraits_part2.png` recortados individualmente em `public/assets/portraits/*.png` e integrados em `DialogueBox.ts` + `main.css`
- `[x]` **Lote 6 completo:** `sao_tome_tileset.png` (`256×128`), `machu_picchu_tileset.png` (`128×128`), `soil_tilled.png` + `soil_watered.png` (`32×32`), `chapada_tileset.png` (`128×64`), `varginha_tileset.png` (`128×128`) (`BootScene.ts` + `DungeonScene.ts` + `WorldScene.ts`)
- `[x]` **Lote 7 completo:** `ui_icons.png` (`128×128`, grade `4×4` de `32×32`, 16 ícones de HUD/menu integrados em `UiIcons.ts`, `main.css` e `main.ts`)
- `[x]` **Lote 8 (8A, 8B, 8C, 8E, 8F):** `player_idle_sprint.png`, `player_tools_side.png`, `player_tools_vertical.png`, `player_empty_hands_base.png`, `tools_vfx.png` (`BootScene.ts` + `Player.ts`)
- `[x]` **Lote 9 completo:** `sao_tome_buildings_modular.png` (`192×128`), `sao_tome_interiors.png` (`128×128`) (`BootScene.ts` + `WorldScene.ts`)
- `[x]` **Lote 10 completo:** `sao_tome_nature_extended.png` (`192×128`), `ambient_life_vfx.png` (`128×128`) (`BootScene.ts` + `WorldScene.ts`)
- `[x]` **Lote 11 completo:** `npcs_activities.png` (`192×192`), `pets_extended.png` (`192×192`) (`BootScene.ts` + `NPC.ts` + `WorldScene.ts`)
- `[x]` **Lote 12 completo:** `dungeons_details.png` (`128×128`) (`BootScene.ts` + `DungeonScene.ts`)

### Lista Explícita Ainda Pendente
1. `[ ]` **Lote 8D — `player_item_usability.png`** (`4×6`, `48×48`) — carregar itens acima da cabeça (4 direções), plantar semente, comer/beber poção e conjurar verticalmente *(usando fallback com `player_empty_hands_base.png` + `showHeldToolEffect` enquanto não for gerado)*.

---

## 1. Regras Padrão para Recorte Limpo (`48×48`, `64×64`, `32×32`)

Inclua ou adapte este bloco em todos os prompts de geração de spritesheets para evitar que personagens/objetos invadam quadros vizinhos no pós-processamento (`scripts/processSprites.py`):

> **Regras de Geração:**
> `2D top-down 3/4 cozy RPG pixel art sprite sheet, Stardew Valley / modern 16-bit SNES style, São Tomé dos Números palette (quartz stone #d6cfc2/#9c9588, highland green #4a6b53, misty indigo #7e8ce0/#2a2640, arcane cyan #4deeea, forge amber #f59e0b). Strictly aligned orthogonal grid with generous padding inside every cell, ZERO overlap between adjacent sprites, crisp dark-colored outline (never pure black #000000), no anti-aliasing, no text labels, no grid lines, solid uniform dark/transparent background.`

---

## 2. Lote 1 — Inimigos e Chefes (Chapada dos Veadeiros & Varginha) — ✅ CONCLUÍDO

Todos os 4 arquivos abaixo já foram gerados, salvos em `assets_raw/sprites/`, recortados em `public/assets/sprites/` e integrados em `BootScene.ts` e `Enemy.ts`.

### 1A. Serpente de Cristal (`public/assets/sprites/enemy_serpente.png`)
- **Padrão:** `48×48` por quadro, grade **`4×3`** (`192×144` px finais).
- **Key / Anim:** `enemy_serpente_sheet` / `serpente_idle`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG pixel art sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated cells, generous spacing, zero overlap, solid uniform background, no grid lines, no text). Subject: Crystal Serpent elemental enemy from Chapada dos Veadeiros, a sleek translucent cyan-blue water serpent with glowing quartz crystal spines along its back and head.
  Row 1 (4 frames): idle slithering coil animation facing forward-left, subtle crystal shimmer.
  Row 2 (4 frames): lunge attack and water-crystal spit pose, mouth glowing cyan.
  Row 3 (4 frames): hit recoil flash and shattering into water droplets and crystal shards.
  Crisp 16-bit SNES pixel art, Stardew Valley aesthetic, dark indigo outlines, no anti-aliasing.
  ```

### 1B. Sonda Ufológica (`public/assets/sprites/enemy_sonda.png`)
- **Padrão:** `48×48` por quadro, grade **`4×3`** (`192×144` px finais).
- **Key / Anim:** `enemy_sonda_sheet` / `sonda_hover`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG pixel art sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated cells, generous spacing, zero overlap, solid uniform background, no grid lines, no text). Subject: Sonda Ufologica, a small mysterious metallic saucer drone from Serra de Varginha with brushed silver-slate hull, glowing violet-lime tractor dome, and rotating orbital ring lights.
  Row 1 (4 frames): hovering bob animation with pulsing green-cyan rim lights.
  Row 2 (4 frames): charging and firing a wind-plasma energy beam downward.
  Row 3 (4 frames): damaged sparks/short-circuit glitch and mini-explosion smoke puff.
  Crisp 16-bit SNES pixel art, Stardew Valley aesthetic, clean dark outlines, no anti-aliasing.
  ```

### 1C. Guardião das Águas — Boss (`public/assets/sprites/boss_water_guardian.png`)
- **Padrão:** `64×64` por quadro, grade **`6×2`** (`384×128` px finais).
- **Key / Anim:** `boss_water_guardian_sheet` / `boss_water_idle`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG boss pixel art sprite sheet on a strict 6 columns by 2 rows orthogonal grid (12 large isolated cells, generous padding inside each cell, zero overlap, solid uniform background, no grid lines, no text). Subject: The Water Guardian (Guardiao das Aguas), a majestic colossal elemental spirit made of swirling deep-blue waterfall currents, mossy river stones, and floating glowing cyan quartz crystals forming wide armored shoulders and a serene masked face.
  Row 1 (6 frames): floating idle animation with flowing water cloak and orbiting crystal shards.
  Row 2 (6 frames): frames 1-3 summoning tidal wave slam / casting water bolts; frames 4-6 hit stun and purification glow.
  Crisp 16-bit SNES RPG boss pixel art, rich shading, no anti-aliasing.
  ```

### 1D. Guardião dos Céus — Boss (`public/assets/sprites/boss_sky_guardian.png`)
- **Padrão:** `64×64` por quadro, grade **`6×2`** (`384×128` px finais).
- **Key / Anim:** `boss_sky_guardian_sheet` / `boss_sky_idle`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG boss pixel art sprite sheet on a strict 6 columns by 2 rows orthogonal grid (12 large isolated cells, generous padding inside each cell, zero overlap, solid uniform background, no grid lines, no text). Subject: The Sky Guardian (Guardiao dos Ceus), a towering celestial wind-and-storm entity wearing ancient floating stone-and-gold astronomical rings, glowing starlit indigo cloak, wings of pale storm clouds, and lightning-cyan core.
  Row 1 (6 frames): hovering winged idle animation with rotating star-rings and crackling static.
  Row 2 (6 frames): frames 1-3 unleashing whirlwind gale / storm lightning cast; frames 4-6 hit recoil and serene starlight awakening.
  Crisp 16-bit SNES RPG boss pixel art, rich shading, no anti-aliasing.
  ```

---

## 3. Lote 2 — Criatura da Fazenda, Objetos de Mundo e Safras — ✅ CONCLUÍDO

`pet_unicornio.png`, `world_objects.png` e `crops_sheet.png` (3 safras × 4 estágios) já foram gerados, recortados e integrados em `BootScene.ts` e `WorldScene.ts`. *(Obs.: a linha de solos `soil_tilled` / `soil_watered` será substituída pelos tiles quadrados top-down do Lote 6A para encaixe perfeito na grade `32×32`.)*

### 2A. Unicórnio da Fazenda (`public/assets/sprites/pet_unicornio.png`)
- **Padrão:** `48×48` por quadro, grade **`4×3`** (`192×144` px finais).
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG pixel art sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated cells, generous spacing, zero overlap, solid uniform background, no grid lines, no text). Subject: cute mystical white-and-pearl highland unicorn companion (Stardew Valley barn animal size) with pastel lavender-gold flowing mane and tail, and a tiny glowing spiral crystal horn.
  Row 1 (4 frames): standing idle, ear twitch and gentle mane shimmer facing slightly front-left.
  Row 2 (4 frames): cute trotting walk cycle facing right.
  Row 3 (4 frames): happy rearing/sparkle aura pose indicating Unicorn Milk is ready to collect.
  Cozy 16-bit pixel art, warm dark brown/indigo outlines, no anti-aliasing.
  ```

### 2B. Bancada de Encantamento & Colecionáveis de Mundo (`public/assets/sprites/world_objects.png`)
- **Padrão:** `48×48` por quadro, grade **`4×3`** (`192×144` px finais).
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy RPG pixel art sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated cells, generous spacing, zero overlap, solid uniform background, no grid lines, no text).
  Row 1 (4 frames): Bancada de Encantamento — carved dark-quartz arcane enchanting altar table with glowing cyan-violet floating crystal orb and pulsing runes (4-frame idle animation).
  Row 2 (4 frames): Rafael's lost high-tech DSLR camera lying on grass/ground with blinking amber-cyan lens glint (4-frame sparkle loop).
  Row 3 (4 frames): Fragmento do Diario Antigo — weathered torn parchment page from an old star journal glowing softly with arcane sky-blue runes (4-frame floating sparkle loop).
  Cozy 16-bit pixel art, Stardew Valley style, no anti-aliasing.
  ```

### 2C. Safras Místicas & Solos Agrícolas (`public/assets/sprites/crops_sheet.png`)
- **Padrão:** `32×32` (ou `48×48` para plantas mais altas) por quadro, grade **`4×4`** (`128×128` ou `192×192`).
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy farming RPG pixel art sprite sheet on a strict 4 columns by 4 rows orthogonal grid (16 isolated cells, clear separation, zero overlap, solid uniform background, no grid lines, no text).
  Row 1 (4 stages left-to-right, stage 0 to 3): Raiz de Quartzo (Quartz Root) — planted seeds, tiny green sprout, leafy bush, mature glowing pink-white crystal root emerging from foliage.
  Row 2 (4 stages left-to-right, stage 0 to 3): Lupulo Estelar (Star Hops) — planted seeds, small vine shoot, climbing hop leaves on tiny stake, mature golden-blue glowing star hops cones.
  Row 3 (4 stages left-to-right, stage 0 to 3): Flor de Sombra (Shadow Flower) — planted seeds, dark indigo sprout, budding nocturnal stem, mature bioluminescent deep-violet moonlit blossom.
  Row 4 (4 soil tiles): frame 1 dry tilled brown earth; frame 2 dark watered wet tilled earth; frame 3 tilled soil with stone border; frame 4 watered soil with subtle sparkle.
  Crisp Stardew Valley pixel art style, no anti-aliasing.
  ```

---

## 4. Lote 3 — Props de Dungeon, VFX e Entidades da Fase 3 (Omena)

### 3A. Pilares de Cristal da Chapada (`public/assets/sprites/crystal_pillars.png`) — ✅ CONCLUÍDO
*(Já gerado, recortado em `192×96` e integrado em `BootScene.ts` e `DungeonScene.ts`.)*

### 3B-1. Projéteis & VFX Parte 1 (`public/assets/sprites/combat_vfx_a.png`) — ✅ CONCLUÍDO
*(Já gerado, recortado em `128×96` para `arcane_bolt`, `slash_arc` e `enemy_rock_bolt`, e integrado em `BootScene.ts`, `DungeonScene.ts` e `WorldScene.ts`.)*

### 3B-2. Projéteis & VFX Parte 2 (`public/assets/sprites/combat_vfx_b.png`) — ❌ GERAR EM OUTRA IA - ja gerado por mim
- **Padrão:** `32×32` por quadro, grade **`4×3`** (`128×96` px finais).
- **Keys:** `water_bolt`, `wind_bolt`, `omena_bolt`
- **Prompt (EN):**
  ```text
  2D pixel art combat VFX and projectile sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated combat projectiles centered with generous whitespace, zero overlap, solid flat pure white #FFFFFF background, no checkerboard, no grid lines, no text).
  Row 1 (4 frames, left to right): water_bolt — swirling deep-cobalt and aqua pressurized water sphere projectile with splashing droplets across 4 rotation frames.
  Row 2 (4 frames, left to right): wind_bolt — sharp spinning indigo-and-mint storm-wind crescent / plasma pulse projectile across 4 frames.
  Row 3 (4 frames, left to right): omena_bolt — ominous dark-purple and crimson dimensional void energy orb crackling with rose-magenta lightning across 4 frames.
  Crisp 16-bit SNES RPG pixel art, clean dark outlines, no anti-aliasing.
  ```

### 3C. Fase 3 — Omena, Sentinela & Núcleo do Mundo — ❌ GERAR EM OUTRA IA - ja gerado por mim

#### Sentinela de Omena (`public/assets/sprites/enemy_sentinela_omena.png`, `48×48`, grade `4×3`)
- **Key / Anim:** `enemy_sentinela_sheet` / `sentinela_idle`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy 16-bit SNES RPG pixel art sprite sheet on a strict 4 columns by 3 rows orthogonal grid (12 isolated sprites, generous spacing, zero overlap, solid flat pure white #FFFFFF background, no checkerboard, no grid lines, no text). Subject: Sentinela de Omena, an ominous hooded shadow-cult sentinel armored in dark plum/violet robes with sharp horned hood, glowing crimson-rose eyes, and floating dark arcane runes.
  Row 1 (4 frames, left to right): floating/hovering idle glide facing slightly right.
  Row 2 (4 frames, left to right): raising dark-violet staff/hands to cast a crimson-purple void bolt.
  Row 3 (4 frames, left to right): hit recoil stagger and dissolving into dark purple shadow smoke wisps.
  Crisp 16-bit pixel art matching Stardew Valley / SNES RPG bosses, dark outlines, no anti-aliasing.
  ```

#### Boss Omena, Tecelão das Sombras (`public/assets/sprites/boss_omena.png`, `64×64`, grade `6×2`) - ja gerado por mim
- **Key / Anim:** `boss_omena_sheet` / `omena_idle`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 16-bit SNES RPG final boss pixel art sprite sheet on a strict 6 columns by 2 rows orthogonal grid (12 large isolated boss sprites, generous padding, zero overlap, solid flat pure white #FFFFFF background, no checkerboard, no grid lines, no text). Subject: Omena, Weaver of Shadows (Tecelao das Sombras), towering final void sorcerer boss wearing tattered deep-indigo and imperial-purple robes, obsidian shoulder pauldrons, golden twin-horned crown, glowing crimson-rose eyes, and dark shadow tendrils swirling beneath.
  Row 1 (6 frames, left to right): floating menacing idle animation with billowing shadow cloak and pulsing violet aura.
  Row 2 (6 frames, left to right): Frames 1-3 summoning dual dimensional rifts / casting triple shadow-crimson bolts; Frames 4-6 hit recoil stagger and shattered echo pose.
  Crisp 16-bit SNES RPG boss pixel art, rich shading, no anti-aliasing.
  ```

#### Núcleo do Mundo & Portal de Omena (`public/assets/sprites/omena_world_props.png`, `48×48`, grade `4×2`) - ja gerado por mim
- **Keys:** `nucleo_mundo`, `portal_omena`
- **Prompt (EN):**
  ```text
  2D top-down 3/4 cozy 16-bit SNES RPG pixel art sprite sheet on a strict 4 columns by 2 rows orthogonal grid (8 isolated sprites, generous padding, zero overlap, solid flat pure white #FFFFFF background, no checkerboard, no grid lines, no text).
  Row 1 (4 frames, left to right): Nucleo do Mundo (World Core) — radiant hovering crystalline celestial heart/sphere glowing with cyan-aqua and golden starlight energy, pulsing softly across 4 frames.
  Row 2 (4 frames, left to right): Portal de Omena — swirling mysterious deep-purple and lavender dimensional rift vortex with bright golden-white core sparks spinning across 4 frames.
  Crisp 16-bit pixel art, dark outer ring outlines so glow stands out cleanly, no anti-aliasing.
  ```

---

## 5. Lote 4 — Ícones dos 40 Itens (`public/assets/sprites/items_icons.png`) — ✅ GERADO E INTEGRADO (`8×6`, `48×48`, 44 ícones)

> [!TIP]
> **Dica prática contra colagem desalinhada:** uma grade `8×5` (40 ícones) pode ser difícil para alguns geradores manterem alinhada. Se preferir máxima precisão, gere em **2 imagens de `4×5` (20 ícones cada)** em **`48×48`** por célula (`192×240` base) e depois unimos tudo no `items_icons.png` final (`384×240`, grade `8×5`)!

Abaixo está o mapeamento exato dos **40 itens de `client/src/data/items.ts`** preservando os índices `0..31` existentes e corrigindo os 8 duplicados nos slots `32..39`:

- **Folha 1 (Índices `0..19` — Ferramentas, Cajados iniciais, Armaduras, Sementes/Safras, Recursos):**
  - `0` Enxada Antiga | `1` Regador Simples | `2` Picareta Simples | `3` Machado Simples
  - `4` Vara de Pesca | `5` Cajado de Aprendiz (madeira + gema ciano) | `6` Túnica da Neblina | `7` Semente de Raiz de Quartzo
  - `8` Raiz de Quartzo | `9` Semente de Lúpulo Estelar | `10` Lúpulo Estelar | `11` Semente de Flor de Sombra
  - `12` Flor de Sombra | `13` Pedra | `14` Madeira | `15` Prego
  - `16` Minério de Cobre | `17` Barra de Cobre | `18` Quartzo Bruto | `19` Quartzo Refinado

- **Folha 2 (Índices `20..39` — Criaturas, Estações, Poções, Peixes, Quest & Itens Fase 2):**
  - `20` Ovo de Mini-Dragão (vermelho/âmbar rachado) | `21` Incubadora Arcana | `22` Bancada de Fundição | `23` Poção de Mana Menor (frasco azul)
  - `24` Tônico de Energia (frasco verde/âmbar) | `25` Cajado de Quartzo Telúrico (cobre + quartzo) | `26` Peitoral de Granito Rúnico | `27` Elixir da Serra (frasco vermelho)
  - `28` Truta da Névoa | `29` Peixe-Prisma (arco-íris) | `30` Moldes do Antigo Protetor (pergaminho metálico) | `31` Câmera de Alta Tecnologia (DSLR do Rafael)
  - `32` Ovo de Unicórnio (iridescente pérola-violeta) | `33` Leite de Unicórnio (garrafa branca luminosa) | `34` Liga Estelar (lingote cósmico azul-ouro) | `35` Bancada de Encantamento (mini-altar roxo/ciano)
  - `36` Tônico contra a Névoa (frasco duplo estelar ciano-violeta) | `37` Cajado Arcano Estelar (cajado liga estelar + fogo/arcano) | `38` Manto Escama de Dragão (capa/armadura escamas carmesim-douradas) | `39` Fragmento do Diário Antigo (página brilhante azul)

### Prompt 4A — Folha 1 (`items_icons_part1.png`, grade `4×5`, `48×48` por célula)
```text
2D RPG pixel art inventory icon sheet on a strict 4 columns by 5 rows orthogonal grid (20 isolated icons centered with generous margins, zero overlap, solid uniform background, no grid lines, no text). Stardew Valley crisp 16-bit pixel art style with clear dark outline:
Row 1: [1] rusty antique farm hoe, [2] rustic tin watering can, [3] iron miner pickaxe, [4] woodcutter axe.
Row 2: [5] bamboo fishing rod with glowing lure, [6] apprentice wooden magic staff with cyan gem, [7] light misty indigo traveler tunic, [8] seed packet with pink quartz sprout emblem.
Row 3: [9] harvested glowing pink-white quartz root tuber, [10] seed packet with gold star emblem, [11] golden-blue glowing star hops cones, [12] seed packet with dark purple flower emblem.
Row 4: [13] dark indigo glowing shadow flower blossom, [14] grey stone chunk, [15] tied bundle of wood logs, [16] iron carpenter nail.
Row 5: [17] rock with orange copper ore veins, [18] shiny copper ingot bar, [19] rough white quartz crystal cluster, [20] cut glowing polished quartz prism.
No anti-aliasing, clean pixel clusters.
```

### Prompt 4B — Folha 2 (`items_icons_part2.png`, grade `4×5`, `48×48` por célula)
```text
2D RPG pixel art inventory icon sheet on a strict 4 columns by 5 rows orthogonal grid (20 isolated icons centered with generous margins, zero overlap, solid uniform background, no grid lines, no text). Stardew Valley crisp 16-bit pixel art style with clear dark outline:
Row 1: [1] crimson-ember cracked dragon egg, [2] miniature stone arcane egg incubator with cyan glass, [3] miniature brick smelting forge workbench, [4] blue glass mana potion flask.
Row 2: [5] green-gold stamina tonic bottle, [6] copper-and-quartz earth magic staff, [7] heavy carved granite armor chestplate with cyan runes, [8] red glass healing elixir flask.
Row 3: [9] silver-blue misty mountain trout fish, [10] shimmering rainbow prism fish, [11] ancient rolled bronze blueprint scroll, [12] modern black DSLR camera with cyan lens reflection.
Row 4: [13] iridescent pearlescent lavender unicorn egg, [14] glowing white glass bottle of unicorn milk, [15] glowing cosmic blue-gold star alloy ingot, [16] miniature purple-cyan arcane enchanting table icon.
Row 5: [17] ornate crescent-shaped starlight mist tonic flask, [18] celestial gold-and-starfire arcane staff, [19] crimson-and-gold dragonscale armored cloak, [20] glowing torn ancient diary parchment page.
No anti-aliasing, clean pixel clusters.
```

---

## 6. Lote 5 — 14 Retratos de Diálogo `64×64` (`public/assets/portraits/`) — ❌ GERAR EM OUTRA IA

Todos podem ser gerados numa grade **`4×4`** (`64×64` por retrato = `256×256` base, ou 2 folhas `4×2`) e fatiados em `public/assets/portraits/<id>.png` para substituir as iniciais em `DialogueBox.ts`.

### Prompt 5A — Protagonista + 7 NPCs (`portraits_part1.png`, grade `4×2`, `64×64` por retrato) - ja gerado por mim
```text
Cozy 16-bit RPG dialogue bust portrait sheet on a strict 4 columns by 2 rows grid (8 square 64x64 portrait busts, shoulders up, expressive faces looking slightly right, warm lantern rim light, uniform solid background, no frames/borders, no text). Stardew Valley portrait aesthetic:
Row 1:
(1) Player Tome: young Brazilian ex-programmer turned practical wizard farmer, short messy dark hair, kind determined eyes, mossy green tunic & satchel strap;
(2) Celeste: starry apothecary woman, long dark-violet wavy hair with silver lunar hairpins, lavender robes, gentle wise smile;
(3) Bento Bigorna: muscular bearded blacksmith, warm brown skin, soot smudge on cheek, leather apron strap, friendly proud grin;
(4) Isis: energetic rock-pub bartender and DJ, short edgy dark-red dyed hair, leather vest over band tee, headphones around neck, confident wink.
Row 2:
(5) Lyra: hyperactive female sky researcher/astronomer, round glasses, messy chestnut bun with pencil, star-chart vest, excited wide eyes;
(6) Seu Zeca: grumpy older traditional Minas Gerais farmer, weathered face, white mustache, straw hat, plaid shirt & overalls, raised eyebrow;
(7) Prefeito Arlindo: friendly elderly town mayor, neat silver-grey mustache, tailored waistcoat, gold pocket-watch chain, warm welcoming expression;
(8) Seu Damiao: old misty-river fisherman, tanned wrinkled face, long grey beard, yellow-slate raincoat hat, calm mysterious smile.
Crisp pixel art, zero overlap, no anti-aliasing.
```

### Prompt 5B — Turista, Companheiros e 3 Guardiões Boss (`portraits_part2.png`, grade `4×2`, `64×64` por retrato) - ja gerado por mim
```text
Cozy 16-bit RPG dialogue bust portrait sheet on a strict 4 columns by 2 rows grid (8 square 64x64 portrait busts, shoulders up, uniform solid background, no frames/borders, no text). Stardew Valley portrait aesthetic:
Row 1:
(1) Rafael: anxious big-city tourist from Bavario Samboriu, trendy windbreaker jacket, tousled hair, glasses slightly crooked, nervous sheepish smile;
(2) Remo: sleek floating black guardian cat with glowing amber-violet eyes and faint Cheshire grin, mystical purple aura;
(3) Lupin: ancient sacred leather-bound living grimoire floating open with glowing cyan-gold rune eyes/symbols on pages;
(4) Guardiao da Terra: majestic mossy Inca granite colossus face with glowing emerald eyes and golden sun carvings.
Row 2:
(5) Guardiao das Aguas: serene elemental water-spirit mask framed by flowing cyan waterfall mane and floating river quartz crystals;
(6) Guardiao dos Ceus: noble celestial storm-spirit face framed by starlight indigo cloak and glowing gold-cyan astronomical rings;
(7) Player Tome happy/casting smile variation;
(8) Celeste surprised/starry variation.
Crisp 16-bit pixel art, zero overlap, no anti-aliasing.
```

---

## 7. Lote 6 — Tilesets Alinhados em Grade `32×32` (`public/assets/tilesets/`) — ✅ GERADO E INTEGRADO

### 6A. Tiles Faltantes de Interiores & Fazenda de São Tomé (`sao_tome_missing_tiles.png`, grade `4×4` de `32×32`)
Como [sao_tome_tileset.png](file:///home/spira/wizardSurvival/assets_raw/tilesets/sao_tome_tileset.png) já tem grama, flores, água, ponte, cercas, árvores, pedras, casas e bancadas externas, este prompt gera apenas os **tiles internos e de mecânica** que faltam para completar os GIDs `1..27` (incluindo os solos arados quadrados top-down):
```text
2D flat top-down orthogonal RPG tileset on a strict 4 columns by 4 rows grid of 32x32 square tiles (NOT isometric diamonds — every tile fills a full 32x32 top-down square, zero overlap, no grid lines, no text). Stardew Valley 16-bit pixel art matching warm wood and mystical slate tones:
Row 1: [1] seamless oak wooden cabin plank floor; [2] seamless dark-indigo slate basement stone tile floor; [3] ornate burgundy-and-gold mystic woven carpet tile; [4] seamless dark stone-and-plaster interior house wall.
Row 2: [5] cozy cottage exterior stone wall with warm glowing yellow window; [6] rustic terracotta-brown shingled house roof tile; [7] arched oak wooden cabin door with brass handle; [8] wooden basement trapdoor/stairs glowing softly cyan below.
Row 3: [9] cozy single wooden cabin bed with indigo blanket and white pillow (top-down); [10] broken ancient dark-stone dimensional portal pedestal with faint violet cracks; [11] warm straw-and-stone nest holding 3 glowing red-amber mini-dragon eggs; [12] glowing cyan arcane rune circle carved into dark slate floor.
Row 4: [13] flat square top-down dry tilled farm soil row; [14] flat square top-down dark wet watered tilled farm soil row; [15] rustic stone pedestal altar with glowing blue-gold crystal book sigil (Altar de Lupin); [16] wooden shipping crate bin with brass trim on grass.
Crisp 16-bit pixel art, no anti-aliasing.
```

### 6B. Tileset Chapada dos Veadeiros & Arena das Águas (`chapada_tileset.png`, grade `4×2` de `32×32`)
```text
2D top-down 3/4 RPG dungeon tileset on a strict 4 columns by 2 rows grid of 32x32 pixel tiles (no grid lines, no text). Theme: Chapada dos Veadeiros mystical crystal canyon & submerged ruins:
Row 1: [1] seamless damp slate-teal stone canyon floor with subtle moss; [2] tall mossy rock canyon wall embedded with glowing cyan quartz veins; [3] glowing electric-cyan shallow water hazard pool trap; [4] aquatic quartz crystal ore vein jutting from dark rock.
Row 2: [5] submerged glowing cyan stone spiral stairs descending; [6] glowing cyan rune floor circle for boss arena; [7] deep canyon waterfall mist abyss edge; [8] carved river-stone bridge/platform tile.
Crisp 16-bit SNES RPG pixel art, dark slate-blue outlines, no anti-aliasing.
```

### 6C. Tileset Serra de Varginha & Arena dos Céus (`varginha_tileset.png`, grade `4×2` de `32×32`)
```text
2D top-down 3/4 RPG dungeon tileset on a strict 4 columns by 2 rows grid of 32x32 pixel tiles (no grid lines, no text). Theme: Serra de Varginha storm-lit cosmic ridge & mysterious alien monolith ruins:
Row 1: [1] seamless dark basalt mountain rock floor with faint violet static dust; [2] dark obsidian monolith wall with glowing lime-cyan geometric alien carvings; [3] crackling storm-static lightning floor trap; [4] dark rock ore vein glowing with cosmic gold-blue Star Alloy crystals.
Row 2: [5] glowing violet-cyan dimensional rift staircase/pad; [6] glowing astronomical rune floor tile for Sky Guardian arena; [7] stormy night cloud abyss edge; [8] metallic ancient star-ring floor border.
Crisp 16-bit SNES RPG pixel art, deep indigo and neon-cyan accents, no anti-aliasing.
```

---

## 8. Lote 7 — Polimento Opcional de UI e Resumo do Dia — ✅ GERADO E INTEGRADO (`ui_icons.png`, `4×4`, `32×32`)

### 7A. Ícones de HUD (`public/assets/ui/ui_icons.png`, grade `4×3` de `32×32`)
```text
2D pixel art RPG HUD icon sheet on a strict 4 columns by 3 rows orthogonal grid (32x32 cells, generous margin, transparent/solid uniform background, no text):
Row 1 (Moon phases): New Moon, Waxing Crescent, Full Moon, Waning Crescent.
Row 2 (Weather): Sunny sun, Rain cloud, Mystical violet mist swirl, Lightning storm cloud.
Row 3 (Counters & Crest): Shiny Gold coin, Mini-Dragon head icon, Unicorn head icon, Sao Tome star-quartz town crest.
Crisp 16-bit pixel art, Stardew Valley HUD style.
```

---

## 9. Lote 8 — Personagem Mais Vivo & Usabilidade Completa de Todos os Itens (`public/assets/sprites/`) — ❌ GERAR

O `player.png` atual possui apenas 1 frame parado (`idle`) e uma picareta desenhada na linha de ação. Este lote dá respiração contínua ao personagem, anima **cada ferramenta nas 4 direções** e adiciona sprites para **segurar, carregar, plantar sementes, comer, beber poções, entregar presentes e acoplar qualquer item** nas mãos de Tomé.

### 8A. `player_idle_sprint.png` (Grade `4×4`, frames `48×48`)- ja gerado por mim
```text
2D 16-bit SNES/Stardew RPG character sprite sheet on a strict 4 columns by 4 rows grid (each sprite fits comfortably inside a 48x48 cell with 4px transparent margin, pure white #FFFFFF background, zero overlap, no text). Keep the exact character design: young wizard farmer Tome with tousled dark brown hair, emerald-green hooded traveler cloak, brown leather satchel and dark boots:
Row 1 (4 frames): Idle breathing facing DOWN (subtle cloak sway and chest breathing loop).
Row 2 (4 frames): Idle breathing facing UP (backpack strap and hood gentle sway).
Row 3 (4 frames): Idle breathing facing LEFT (side profile subtle wind in hair/cloak).
Row 4 (4 frames): Fast mystical DASH / SPRINT pose facing RIGHT (leaning forward, cloak streaming back with faint cyan wind streak).
Crisp 16-bit pixel art, dark indigo-brown outlines, no anti-aliasing.
```

### 8B. `player_tools_side.png` (Grade `4×6`, frames `48×48` — Lado E/D) - ja gerado por mim
*(Cada linha anima exclusivamente a ferramenta correspondente em 4 frames fluidos de lado, sem picareta trocada!)*
```text
2D 16-bit SNES/Stardew RPG character tool-use sprite sheet on a strict 4 columns by 6 rows grid (each sprite fits comfortably inside a 48x48 cell, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel), facing RIGHT cleanly for horizontal mirror support:
Row 1 (4 frames): HOE (Enxada) tilling soil — raising rustic iron hoe overhead -> swinging downward -> striking ground -> follow-through.
Row 2 (4 frames): WATERING CAN (Regador) pouring water — holding steel watering can forward -> tilting spout -> gentle shaking pour -> upright recover.
Row 3 (4 frames): PICKAXE (Picareta) mining rock — twisting back -> heavy diagonal overhead swing -> striking ore -> rebound recover.
Row 4 (4 frames): AXE (Machado) chopping wood — wide horizontal side windup -> strong lateral chop -> impact follow-through -> recover.
Row 5 (4 frames): FISHING ROD (Vara de Pesca) — pulling rod back -> whipping forward cast -> holding rod steady waiting -> pulling fish back excitedly.
Row 6 (4 frames): MAGIC STAFF / SCEPTER (Cajado) side swing & spell cast — raising wooden crystal staff -> glowing cyan orb surge -> thrusting spell forward -> recover.
Crisp 16-bit pixel art, clean distinct tool silhouettes, no anti-aliasing.
```

### 8C. `player_tools_vertical.png` (Grade `4×6`, frames `48×48` — Frente/Baixo & Costas/Cima) - ja gerado por mim
*(Completa o uso das ferramentas olhando para baixo e para cima no mapa!)*
```text
2D 16-bit SNES/Stardew RPG character vertical tool-use sprite sheet on a strict 4 columns by 6 rows grid (each sprite inside a 48x48 cell, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel):
Row 1 (4 frames): HOE / PICKAXE downward strike facing DOWN (toward camera — raising tool up -> smashing soil/rock -> recover).
Row 2 (4 frames): HOE / PICKAXE upward strike facing UP (back view — raising tool over head -> striking northward -> recover).
Row 3 (4 frames): WATERING CAN pouring facing DOWN (holding steel watering can in front -> tilting spout forward with gentle lean -> recover).
Row 4 (4 frames): WATERING CAN pouring facing UP (back view — extending watering can forward -> pouring -> recover).
Row 5 (4 frames): AXE / FISHING ROD facing DOWN (casting fishing line or chopping southward cleanly).
Row 6 (4 frames): AXE / FISHING ROD facing UP (casting fishing line or chopping northward cleanly).
Crisp 16-bit pixel art, consistent proportions with player.png, no anti-aliasing.
```

### 8D. `player_item_usability.png` (Grade `4×6`, frames `48×48` — Sementes, Comidas, Poções & Carregar Itens)
*(Permite que Tomé segure qualquer item acima da cabeça estilo Stardew Valley, plante sementes, coma, beba poções e entregue presentes!)*
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

### 8E. `player_empty_hands_base.png` (Grade `4×4`, frames `48×48` — Base Universal Sem Ferramentas) - ja gerado por mim
*(Base com braços animados e **mãos totalmente vazias** para acoplar qualquer novo item de `items_icons.png` por código no Phaser sem conflito!)*
```text
2D 16-bit SNES/Stardew RPG character ARMLESS/WEAPONLESS action pose sheet on a strict 4 columns by 4 rows grid (each frame 48x48, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel), HANDS COMPLETELY EMPTY (NO pickaxe, NO sword, NO staff drawn in hands):
Row 1 (4 frames): Tool swing windup-to-followthrough facing DOWN (empty gripped hands moving top-to-bottom).
Row 2 (4 frames): Tool swing windup-to-followthrough facing UP (empty hands moving cleanly from back view).
Row 3 (4 frames): Tool swing windup-to-followthrough facing RIGHT (empty hands swinging cleanly from overhead to forward).
Row 4 (4 frames): Gentle forward lean / pouring / interacting pose in 4 directions (DOWN, UP, LEFT, RIGHT) with empty outstretched hands.
Crisp 16-bit pixel art, consistent scale with player.png, no anti-aliasing.
```

### 8F. `tools_vfx.png` (Grade `4×4`, frames `32×32`) - ja gerado por mim
```text
2D 16-bit pixel art farming & tool impact VFX spritesheet on a strict 4 columns by 4 rows grid (each frame 32x32, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Dirt clod & soil splash burst when hoe tills ground.
Row 2 (4 frames): Glowing cyan water droplets & splash arc from watering can.
Row 3 (4 frames): Golden-cyan ore sparks & rock chip burst when pickaxe hits stone; wood splinters + leaves for axe.
Row 4 (4 frames): Fishing bobber floating on water ripples + sudden exclamation splash tug.
Crisp 16-bit pixel art, high-contrast colors, no anti-aliasing.
```

---

## 10. Lote 9 — Arquitetura Modular da Casa, Lojas & Interiores Ricos (`public/assets/tilesets/`) — ❌ GERAR

Resolve a repetição de telhado em "cones" e o excesso de janelas iguais na fachada, permitindo construir casas, lojas e interiores variados.

### 9A. `sao_tome_buildings_modular.png` (Grade `6×4`, tiles `32×32`) - ja gerado por mim
```text
2D flat top-down 3/4 RPG building architecture autotile sheet on a strict 6 columns by 4 rows grid of 32x32 square tiles (zero gaps, seamless tile edges for roof/walls, no grid lines, no text). Theme: Sao Tome cozy stone-and-wood mountain village cottages:
Row 1 (Modular Terracotta Roof — NO grass showing between middle tiles): [1] roof left eave edge; [2] seamless middle pitched roof shingle (tileable infinitely left/right); [3] roof right eave edge; [4] roof top ridge peak center; [5] roof tile with stone chimney top; [6] blue-slate shop roof variant (for Ferraria/Botica).
Row 2 (Modular Stone Walls & Details — NO repetitive windows on every tile): [7] solid mossy stone-and-timber cottage wall left corner; [8] plain cozy stone wall WITH NO WINDOW (for alternating between windows); [9] stone wall with climbing ivy & small wooden planter box; [10] stone wall with warm lit yellow window at night; [11] stone wall with unlit shuttered daytime window; [12] stone cottage wall right corner edge.
Row 3 (Doors, Foundations & Village Shop Signs): [13] arched oak front door embedded cleanly inside full stone wall (zero grass gaps); [14] wider shop double-door inside stone wall; [15] cobblestone doorstep shadow tile; [16] hanging iron anvil blacksmith sign; [17] hanging glowing purple potion alchemist sign; [18] hanging wooden tavern mug pub sign.
Row 4 (Chimney Smoke & Warm Window Glow Overlays — transparent/white BG): [19..22] 4 animation frames of gentle white cozy chimney smoke drifting upward; [23..24] wall lantern warm glow light pulse (2 frames).
Crisp 16-bit Stardew Valley pixel art, consistent warm lighting, no anti-aliasing.
```

### 9B. `sao_tome_interiors.png` (Grade `4×4`, tiles `32×32`) - ja gerado por mim
```text
2D top-down 3/4 cozy RPG interior furniture & props tileset on a strict 4 columns by 4 rows grid of 32x32 tiles (uniform solid dark or white background for furniture, no grid lines, no text). Warm oak wood and mystical wizard academy vibe:
Row 1 (Animated Fireplace, 4 frames): rustic stone indoor hearth fireplace with crackling warm orange-gold flames animating across frames 1..4.
Row 2 (Cooking & Books): [5] iron witch cauldron & herbal hearth stove; [6] tall oak bookcase packed with colorful spellbooks & crystals; [7] cozy oak dining table with teapot & crystal lamp; [8] cushioned wooden cabin chair facing down/side.
Row 3 (Modular Rug & Wall Decor): [9] ornate burgundy mystic rug corner; [10] rug seamless edge; [11] rug seamless center emblem; [12] framed mountain landscape painting & hanging dried herbs wall shelf.
Row 4 (Shop & Tavern Life): [13] wooden pub tavern bar counter with barrels & glowing crystal ale tap; [14] wooden wine/potion barrel & supply sack stack; [15] glass alchemist apothecary display shelf with glowing flasks; [16] double cozy wooden quilt bed with moon pillows.
Crisp 16-bit SNES RPG pixel art, rich detail, no anti-aliasing.
```

---

## 11. Lote 10 — Natureza Viva, Chão Orgânico, Águas Animadas & Efeitos Ambientais (`public/assets/tilesets/` & `sprites/`) — ❌ GERAR

Acaba com o visual quadriculado do chão, adiciona árvores grandiosas `2×2`, margens de rio naturais e vida circulando pelo cenário.

### 10A. `sao_tome_nature_extended.png` (Grade `6×4`, tiles `32×32`) - ja gerado por mim
```text
2D top-down 3/4 RPG outdoor nature & terrain autotile sheet on a strict 6 columns by 4 rows grid of 32x32 tiles (seamless edges where marked, transparent/clean cut for multi-tile trees/props, no grid lines, no text). Theme: Sao Tome dos Numeros lush mystical sierra:
Row 1 (Organic Ground Variations — seamless): [1] soft smooth meadow grass; [2] grass with tall wild blades & clover; [3] grass scattered with tiny white & lavender wildflowers; [4] warm dirt footpath center; [5] rounded organic cobblestone edge blending into grass; [6] soft mossy stone bridge rail/edge.
Row 2 (River Shoreline & Animated Water — 4 water frames + 2 banks): [7..10] 4 animation frames of shimmering deep-teal mystical water with gentle ripples; [11] grassy river bank top/left shoreline transition; [12] sandy-rocky river corner shoreline transition.
Row 3 (Multi-tile 2x2 Lush Purple Ipe Tree & Green Oak Tree + Cuttable Stumps): [13] purple ipe tree top-left canopy; [14] top-right canopy; [15] bottom-left trunk & ground shadow; [16] bottom-right trunk & fallen petals; [17] cut tree stump (left after chopping); [18] sparkling mineral boulder cluster.
Row 4 (Fences, Gates & Day/Night Streetlamps): [19] horizontal wooden fence rail; [20] vertical fence post connector; [21] wooden corner fence post; [22] cozy wooden farm gate (open/closed); [23] tall iron village lamp post UNLIT (day); [24] tall iron village lamp post LIT with warm amber lantern halo (night).
Crisp 16-bit Stardew Valley pixel art, cohesive emerald-slate palette, no anti-aliasing.
```

### 10B. `ambient_life_vfx.png` (Grade `4×4`, frames `32×32`) - ja gerado por mim
```text
2D 16-bit pixel art ambient wildlife & weather effects spritesheet on a strict 4 columns by 4 rows grid (32x32 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Fluttering blue & gold mountain butterfly flapping wings.
Row 2 (4 frames): Nighttime glowing golden-lime firefly pulsing softly.
Row 3 (4 frames): Cute small mountain sparrow hopping / flying cleanly side profile.
Row 4 (4 frames): Gentle falling blossom petal / leaf swirl & soft raindrop splash ring.
Crisp 16-bit pixel art, charming cozy vibe, no anti-aliasing.
```

---

## 12. Lote 11 — Rotinas Animadas dos NPCs & Vida dos Pets (`public/assets/sprites/`) — ❌ GERAR

Dá mais vida à praça, às lojas e ao cercado da fazenda, mostrando personagens trabalhando e pets interagindo.

### 11A. `npcs_activities.png` (Grade `4×4`, frames `48×48`) - ja gerado por mim
```text
2D 16-bit pixel art RPG NPC daily activity animations on a strict 4 columns by 4 rows grid (48x48 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Blacksmith Bento hammering glowing iron on a small anvil with tiny orange sparks.
Row 2 (4 frames): Alchemist Celeste stirring a bubbling glowing potion flask/mini-cauldron.
Row 3 (4 frames): Innkeeper Isis wiping a tavern counter/glass warmly and smiling.
Row 4 (4 frames): Elder farmer Seu Zeca tending crops with a wooden hoe / inspecting soil.
Crisp 16-bit pixel art matching npcs.png proportions, no anti-aliasing.
```

### 11B. `pets_extended.png` (Grade `4×4`, frames `48×48`) -ja gerado por mim
```text
2D 16-bit pixel art cozy farm companion creature animations on a strict 4 columns by 4 rows grid (48x48 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Crimson Mini-Dragon walking/fluttering left/right happily with tiny smoke puffs.
Row 2 (4 frames): Crimson Mini-Dragon curled up sleeping peacefully beside warm ember glow.
Row 3 (4 frames): Starlight Unicorn grazing grass & shaking shimmering pastel mane.
Row 4 (4 frames): Starlight Unicorn curled up sleeping peacefully with faint cosmic sparkles.
Crisp 16-bit pixel art matching creatures_fire.png & pet_unicornio.png, no anti-aliasing.
```

---

## 13. Lote 12 — Mais Detalhes, Baús & Atmosfera de Dungeons (`public/assets/tilesets/`) — ❌ GERAR

```text
2D top-down 3/4 RPG dungeon decoration & interactive props spritesheet on a strict 4 columns by 4 rows grid (32x32 cells, pure white/dark uniform background, zero overlap, no text):
Row 1 (4 frames): Flickering wall sconce dungeon torch (flames dancing 1..4).
Row 2 (4 frames): Ornate stone & gold treasure chest opening animation (closed -> cracking glow -> wide open -> empty/sparkling).
Row 3 (Breakable Props & Floor Details): [9] cracked stone dungeon floor variation; [10] mossy ancient pot/urn (destructible); [11] wooden mining supply crate; [12] glowing floor crystal crack hazard warning.
Row 4 (Animated Dimensional Portal Pads, 4 frames): swirling cyan-purple dimensional portal energy vortex for dungeon boss exits & porao portals.
Crisp 16-bit SNES RPG pixel art, clean edges, no anti-aliasing.
```

---

## 14. Próximo Passo Após Gerar as Imagens

O `player.png` atual possui apenas 1 frame parado (`idle`) e uma picareta desenhada na linha de ação. Este lote dá respiração contínua ao personagem, anima **cada ferramenta nas 4 direções** e adiciona sprites para **segurar, carregar, plantar sementes, comer, beber poções, entregar presentes e acoplar qualquer item** nas mãos de Tomé.

### 8A. `player_idle_sprint.png` (Grade `4×4`, frames `48×48`)
```text
2D 16-bit SNES/Stardew RPG character sprite sheet on a strict 4 columns by 4 rows grid (each sprite fits comfortably inside a 48x48 cell with 4px transparent margin, pure white #FFFFFF background, zero overlap, no text). Keep the exact character design: young wizard farmer Tome with tousled dark brown hair, emerald-green hooded traveler cloak, brown leather satchel and dark boots:
Row 1 (4 frames): Idle breathing facing DOWN (subtle cloak sway and chest breathing loop).
Row 2 (4 frames): Idle breathing facing UP (backpack strap and hood gentle sway).
Row 3 (4 frames): Idle breathing facing LEFT (side profile subtle wind in hair/cloak).
Row 4 (4 frames): Fast mystical DASH / SPRINT pose facing RIGHT (leaning forward, cloak streaming back with faint cyan wind streak).
Crisp 16-bit pixel art, dark indigo-brown outlines, no anti-aliasing.
```

### 8B. `player_tools_side.png` (Grade `4×6`, frames `48×48` — Lado E/D)
*(Cada linha anima exclusivamente a ferramenta correspondente em 4 frames fluidos de lado, sem picareta trocada!)*
```text
2D 16-bit SNES/Stardew RPG character tool-use sprite sheet on a strict 4 columns by 6 rows grid (each sprite fits comfortably inside a 48x48 cell, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel), facing RIGHT cleanly for horizontal mirror support:
Row 1 (4 frames): HOE (Enxada) tilling soil — raising rustic iron hoe overhead -> swinging downward -> striking ground -> follow-through.
Row 2 (4 frames): WATERING CAN (Regador) pouring water — holding steel watering can forward -> tilting spout -> gentle shaking pour -> upright recover.
Row 3 (4 frames): PICKAXE (Picareta) mining rock — twisting back -> heavy diagonal overhead swing -> striking ore -> rebound recover.
Row 4 (4 frames): AXE (Machado) chopping wood — wide horizontal side windup -> strong lateral chop -> impact follow-through -> recover.
Row 5 (4 frames): FISHING ROD (Vara de Pesca) — pulling rod back -> whipping forward cast -> holding rod steady waiting -> pulling fish back excitedly.
Row 6 (4 frames): MAGIC STAFF / SCEPTER (Cajado) side swing & spell cast — raising wooden crystal staff -> glowing cyan orb surge -> thrusting spell forward -> recover.
Crisp 16-bit pixel art, clean distinct tool silhouettes, no anti-aliasing.
```

### 8C. `player_tools_vertical.png` (Grade `4×6`, frames `48×48` — Frente/Baixo & Costas/Cima)
*(Completa o uso das ferramentas olhando para baixo e para cima no mapa!)*
```text
2D 16-bit SNES/Stardew RPG character vertical tool-use sprite sheet on a strict 4 columns by 6 rows grid (each sprite inside a 48x48 cell, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel):
Row 1 (4 frames): HOE / PICKAXE downward strike facing DOWN (toward camera — raising tool up -> smashing soil/rock -> recover).
Row 2 (4 frames): HOE / PICKAXE upward strike facing UP (back view — raising tool over head -> striking northward -> recover).
Row 3 (4 frames): WATERING CAN pouring facing DOWN (holding steel watering can in front -> tilting spout forward with gentle lean -> recover).
Row 4 (4 frames): WATERING CAN pouring facing UP (back view — extending watering can forward -> pouring -> recover).
Row 5 (4 frames): AXE / FISHING ROD facing DOWN (casting fishing line or chopping southward cleanly).
Row 6 (4 frames): AXE / FISHING ROD facing UP (casting fishing line or chopping northward cleanly).
Crisp 16-bit pixel art, consistent proportions with player.png, no anti-aliasing.
```

### 8D. `player_item_usability.png` (Grade `4×6`, frames `48×48` — Sementes, Comidas, Poções & Carregar Itens)
*(Permite que Tomé segure qualquer item acima da cabeça estilo Stardew Valley, plante sementes, coma, beba poções e entregue presentes!)*
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

### 8E. `player_empty_hands_base.png` (Grade `4×4`, frames `48×48` — Base Universal Sem Ferramentas)
*(Base com braços animados e **mãos totalmente vazias** para acoplar qualquer novo item de `items_icons.png` por código no Phaser sem conflito!)*
```text
2D 16-bit SNES/Stardew RPG character ARMLESS/WEAPONLESS action pose sheet on a strict 4 columns by 4 rows grid (each frame 48x48, pure white #FFFFFF background, zero overlap, no text). Same character Tome (brown hair, emerald cloak, satchel), HANDS COMPLETELY EMPTY (NO pickaxe, NO sword, NO staff drawn in hands):
Row 1 (4 frames): Tool swing windup-to-followthrough facing DOWN (empty gripped hands moving top-to-bottom).
Row 2 (4 frames): Tool swing windup-to-followthrough facing UP (empty hands moving cleanly from back view).
Row 3 (4 frames): Tool swing windup-to-followthrough facing RIGHT (empty hands swinging cleanly from overhead to forward).
Row 4 (4 frames): Gentle forward lean / pouring / interacting pose in 4 directions (DOWN, UP, LEFT, RIGHT) with empty outstretched hands.
Crisp 16-bit pixel art, consistent scale with player.png, no anti-aliasing.
```

### 8F. `tools_vfx.png` (Grade `4×4`, frames `32×32`)
```text
2D 16-bit pixel art farming & tool impact VFX spritesheet on a strict 4 columns by 4 rows grid (each frame 32x32, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Dirt clod & soil splash burst when hoe tills ground.
Row 2 (4 frames): Glowing cyan water droplets & splash arc from watering can.
Row 3 (4 frames): Golden-cyan ore sparks & rock chip burst when pickaxe hits stone; wood splinters + leaves for axe.
Row 4 (4 frames): Fishing bobber floating on water ripples + sudden exclamation splash tug.
Crisp 16-bit pixel art, high-contrast colors, no anti-aliasing.
```

---

## 10. Lote 9 — Arquitetura Modular da Casa, Lojas & Interiores Ricos (`public/assets/tilesets/`) — ❌ GERAR

Resolve a repetição de telhado em "cones" e o excesso de janelas iguais na fachada, permitindo construir casas, lojas e interiores variados.

### 9A. `sao_tome_buildings_modular.png` (Grade `6×4`, tiles `32×32`)
```text
2D flat top-down 3/4 RPG building architecture autotile sheet on a strict 6 columns by 4 rows grid of 32x32 square tiles (zero gaps, seamless tile edges for roof/walls, no grid lines, no text). Theme: Sao Tome cozy stone-and-wood mountain village cottages:
Row 1 (Modular Terracotta Roof — NO grass showing between middle tiles): [1] roof left eave edge; [2] seamless middle pitched roof shingle (tileable infinitely left/right); [3] roof right eave edge; [4] roof top ridge peak center; [5] roof tile with stone chimney top; [6] blue-slate shop roof variant (for Ferraria/Botica).
Row 2 (Modular Stone Walls & Details — NO repetitive windows on every tile): [7] solid mossy stone-and-timber cottage wall left corner; [8] plain cozy stone wall WITH NO WINDOW (for alternating between windows); [9] stone wall with climbing ivy & small wooden planter box; [10] stone wall with warm lit yellow window at night; [11] stone wall with unlit shuttered daytime window; [12] stone cottage wall right corner edge.
Row 3 (Doors, Foundations & Village Shop Signs): [13] arched oak front door embedded cleanly inside full stone wall (zero grass gaps); [14] wider shop double-door inside stone wall; [15] cobblestone doorstep shadow tile; [16] hanging iron anvil blacksmith sign; [17] hanging glowing purple potion alchemist sign; [18] hanging wooden tavern mug pub sign.
Row 4 (Chimney Smoke & Warm Window Glow Overlays — transparent/white BG): [19..22] 4 animation frames of gentle white cozy chimney smoke drifting upward; [23..24] wall lantern warm glow light pulse (2 frames).
Crisp 16-bit Stardew Valley pixel art, consistent warm lighting, no anti-aliasing.
```

### 9B. `sao_tome_interiors.png` (Grade `4×4`, tiles `32×32`)
```text
2D top-down 3/4 cozy RPG interior furniture & props tileset on a strict 4 columns by 4 rows grid of 32x32 tiles (uniform solid dark or white background for furniture, no grid lines, no text). Warm oak wood and mystical wizard academy vibe:
Row 1 (Animated Fireplace, 4 frames): rustic stone indoor hearth fireplace with crackling warm orange-gold flames animating across frames 1..4.
Row 2 (Cooking & Books): [5] iron witch cauldron & herbal hearth stove; [6] tall oak bookcase packed with colorful spellbooks & crystals; [7] cozy oak dining table with teapot & crystal lamp; [8] cushioned wooden cabin chair facing down/side.
Row 3 (Modular Rug & Wall Decor): [9] ornate burgundy mystic rug corner; [10] rug seamless edge; [11] rug seamless center emblem; [12] framed mountain landscape painting & hanging dried herbs wall shelf.
Row 4 (Shop & Tavern Life): [13] wooden pub tavern bar counter with barrels & glowing crystal ale tap; [14] wooden wine/potion barrel & supply sack stack; [15] glass alchemist apothecary display shelf with glowing flasks; [16] double cozy wooden quilt bed with moon pillows.
Crisp 16-bit SNES RPG pixel art, rich detail, no anti-aliasing.
```

---

## 11. Lote 10 — Natureza Viva, Chão Orgânico, Águas Animadas & Efeitos Ambientais (`public/assets/tilesets/` & `sprites/`) — ❌ GERAR

Acaba com o visual quadriculado do chão, adiciona árvores grandiosas `2×2`, margens de rio naturais e vida circulando pelo cenário.

### 10A. `sao_tome_nature_extended.png` (Grade `6×4`, tiles `32×32`)
```text
2D top-down 3/4 RPG outdoor nature & terrain autotile sheet on a strict 6 columns by 4 rows grid of 32x32 tiles (seamless edges where marked, transparent/clean cut for multi-tile trees/props, no grid lines, no text). Theme: Sao Tome dos Numeros lush mystical sierra:
Row 1 (Organic Ground Variations — seamless): [1] soft smooth meadow grass; [2] grass with tall wild blades & clover; [3] grass scattered with tiny white & lavender wildflowers; [4] warm dirt footpath center; [5] rounded organic cobblestone edge blending into grass; [6] soft mossy stone bridge rail/edge.
Row 2 (River Shoreline & Animated Water — 4 water frames + 2 banks): [7..10] 4 animation frames of shimmering deep-teal mystical water with gentle ripples; [11] grassy river bank top/left shoreline transition; [12] sandy-rocky river corner shoreline transition.
Row 3 (Multi-tile 2x2 Lush Purple Ipe Tree & Green Oak Tree + Cuttable Stumps): [13] purple ipe tree top-left canopy; [14] top-right canopy; [15] bottom-left trunk & ground shadow; [16] bottom-right trunk & fallen petals; [17] cut tree stump (left after chopping); [18] sparkling mineral boulder cluster.
Row 4 (Fences, Gates & Day/Night Streetlamps): [19] horizontal wooden fence rail; [20] vertical fence post connector; [21] wooden corner fence post; [22] cozy wooden farm gate (open/closed); [23] tall iron village lamp post UNLIT (day); [24] tall iron village lamp post LIT with warm amber lantern halo (night).
Crisp 16-bit Stardew Valley pixel art, cohesive emerald-slate palette, no anti-aliasing.
```

### 10B. `ambient_life_vfx.png` (Grade `4×4`, frames `32×32`)
```text
2D 16-bit pixel art ambient wildlife & weather effects spritesheet on a strict 4 columns by 4 rows grid (32x32 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Fluttering blue & gold mountain butterfly flapping wings.
Row 2 (4 frames): Nighttime glowing golden-lime firefly pulsing softly.
Row 3 (4 frames): Cute small mountain sparrow hopping / flying cleanly side profile.
Row 4 (4 frames): Gentle falling blossom petal / leaf swirl & soft raindrop splash ring.
Crisp 16-bit pixel art, charming cozy vibe, no anti-aliasing.
```

---

## 12. Lote 11 — Rotinas Animadas dos NPCs & Vida dos Pets (`public/assets/sprites/`) — ❌ GERAR

Dá mais vida à praça, às lojas e ao cercado da fazenda, mostrando personagens trabalhando e pets interagindo.

### 11A. `npcs_activities.png` (Grade `4×4`, frames `48×48`)
```text
2D 16-bit pixel art RPG NPC daily activity animations on a strict 4 columns by 4 rows grid (48x48 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Blacksmith Bento hammering glowing iron on a small anvil with tiny orange sparks.
Row 2 (4 frames): Alchemist Celeste stirring a bubbling glowing potion flask/mini-cauldron.
Row 3 (4 frames): Innkeeper Isis wiping a tavern counter/glass warmly and smiling.
Row 4 (4 frames): Elder farmer Seu Zeca tending crops with a wooden hoe / inspecting soil.
Crisp 16-bit pixel art matching npcs.png proportions, no anti-aliasing.
```

### 11B. `pets_extended.png` (Grade `4×4`, frames `48×48`)
```text
2D 16-bit pixel art cozy farm companion creature animations on a strict 4 columns by 4 rows grid (48x48 cells, pure white #FFFFFF background, zero overlap, no text):
Row 1 (4 frames): Crimson Mini-Dragon walking/fluttering left/right happily with tiny smoke puffs.
Row 2 (4 frames): Crimson Mini-Dragon curled up sleeping peacefully beside warm ember glow.
Row 3 (4 frames): Starlight Unicorn grazing grass & shaking shimmering pastel mane.
Row 4 (4 frames): Starlight Unicorn curled up sleeping peacefully with faint cosmic sparkles.
Crisp 16-bit pixel art matching creatures_fire.png & pet_unicornio.png, no anti-aliasing.
```

---

## 13. Lote 12 — Mais Detalhes, Baús & Atmosfera de Dungeons (`public/assets/tilesets/`) — `dungeons_details.png` ❌ GERAR - ja gerado por mim

```text
2D top-down 3/4 RPG dungeon decoration & interactive props spritesheet on a strict 4 columns by 4 rows grid (32x32 cells, pure white/dark uniform background, zero overlap, no text):
Row 1 (4 frames): Flickering wall sconce dungeon torch (flames dancing 1..4).
Row 2 (4 frames): Ornate stone & gold treasure chest opening animation (closed -> cracking glow -> wide open -> empty/sparkling).
Row 3 (Breakable Props & Floor Details): [9] cracked stone dungeon floor variation; [10] mossy ancient pot/urn (destructible); [11] wooden mining supply crate; [12] glowing floor crystal crack hazard warning.
Row 4 (Animated Dimensional Portal Pads, 4 frames): swirling cyan-purple dimensional portal energy vortex for dungeon boss exits & porao portals.
Crisp 16-bit SNES RPG pixel art, clean edges, no anti-aliasing.
```

---

## 14. Próximo Passo Após Gerar as Imagens

Assim que você gerar qualquer um desses lotes e salvar as imagens originais em `assets_raw/` (ex.: `assets_raw/sprites/`, `assets_raw/portraits/`, `assets_raw/tilesets/`):
1. Faremos o recorte/padronização com `scripts/processSprites.py` mantendo os backups intactos em `assets_raw/`.
2. Atualizaremos `BootScene.ts`, `Enemy.ts`, `WorldScene.ts`, `DungeonScene.ts`, `items.ts` (índices `32..39`) e os componentes HTML (`DialogueBox.ts`, `HotbarUI.ts`, `InventoryModal.ts`, `ShopModal.ts`).

