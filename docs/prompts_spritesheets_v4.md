# Prompts — Spritesheets & Retratos (Lote V4)

> [!NOTE]
> Este documento contém exclusivamente prompts para geração externa de imagens em IA para os novos sistemas da **Atualização V4 (10 Andares, 21 Criaturas, Qualidade de Safra, Buffs e Elevador Rúnico)**. Nenhuma imagem é gerada automaticamente pelo agente.

---

## Regras Padrão de Direção de Arte
- **Estilo:** `2D top-down 3/4 cozy fantasy RPG pixel art, Stardew Valley / 16-bit SNES style`
- **Paleta Principal:** pedra de quartzo (`#d6cfc2` / `#9c9588`), verde serrano (`#4a6b53`), índigo profundo (`#7e8ce0` / `#2a2640`), ciano arcano (`#4deeea`), âmbar runa (`#f59e0b`).
- **Grade e Recorte:** células ortogonais estritas, zero sobreposição entre quadros, contornos escuros (`#1e1b2e`), sem anti-aliasing, sem texto, fundo sólido uniforme `#FFFFFF` (ou transparente).

---

## Checklist Rápido V4

| # | Categoria | Destino Sugerido | Dimensão / Grade | Uso no Código |
| :-: | :--- | :--- | :---: | :--- |
| 1 | 4 Sheets / 12 Criaturas das Dungeons | `public/assets/sprites/enemies/<sheet>.png` | `48×48` (`4×5`, `192×240`) | `Enemy.ts` (`ENEMY_CONFIGS[*].sheetKey`) |
| 2 | 12 Bustos do Bestiário | `public/assets/portraits/<creature>.png` | `64×64` (individual) | `QuestLogModal.ts` (`ENEMY_META[*].portrait`) |
| 3 | Props do Santuário & Elevador Rúnico | `public/assets/tilesets/dungeon_sanctuary_elevator_v4.png` | `48×48` (`4×2`, `192×96`) | `DungeonScene.ts` (Andares 5 e 10 + Elevador) |
| 4 | Ícones de Qualidade, Buffs & Meteoros | `public/assets/ui/v4_quality_buff_icons.png` | `32×32` (`4×2`, `128×64`) | `HUD.ts` (Buffs) & Colheita Estelar |

---

## 1. Novas Criaturas das Dungeons (4 Biomas × 3 Criaturas = 12 Spritesheets `48×48`)

Cada arquivo usa grade estrita **`4 colunas × 5 linhas` (`192×240` px, células `48×48` px)**:
- **Linha 0:** Idle / Movimento base (4 quadros)
- **Linha 1:** Caminhada para cima / deslocamento (4 quadros)
- **Linha 2:** Windup / Telegrafia de ataque (4 quadros)
- **Linha 3:** Ataque / Impacto / Disparo (4 quadros)
- **Linha 4:** Dano (`hurt`, 2 quadros) + Derrota (`death`, 2 quadros)

### 1A. Ruínas de Machu Picchu (Elemento Terra / Pedra — `machu_picchu`)
- `enemy_escaravelho_inca.png` → `sheetKey`: `enemy_escaravelho_inca_sheet` (Andares 1–10)
- `enemy_totem_condor.png` → `sheetKey`: `enemy_totem_condor_sheet` (Andares 4–10)
- `enemy_colosso_granito.png` → `sheetKey`: `enemy_colosso_granito_sheet` (Elite, Andares 7–10)

```text
2D top-down 3/4 SNES pixel art RPG monster sprite sheet collection on strict 4 columns by 5 rows grids (each cell 48x48 pixels, total 192x240 per creature, crisp #1e1b2e outlines, zero anti-aliasing, solid white background, no text):
1) ESCARAVELHO INCA (scarab beetle with golden Andean bronze shell #fbbf24 and mossy quartz mandibles): Row 0 scurrying idle, Row 1 top-down back crawl, Row 2 glowing golden pincers windup, Row 3 lunging bite attack, Row 4 hurt flash & cracked shell dissolve.
2) TOTEM CONDOR (floating carved granite pillar shaped like an Andean condor with glowing amber solar runes #f97316): Row 0 hovering float, Row 1 back view, Row 2 wings spreading with amber sigils, Row 3 firing a rock energy wave, Row 4 hurt tremor & crumbling shards.
3) COLOSSO DE GRANITO (massive highland stone golem with thick rune-carved boulder shoulders #a8a29e and pulsing earth core): Row 0 heavy stomp walk, Row 1 back walk, Row 2 raising huge fists overhead, Row 3 seismic ground slam, Row 4 hurt cracks & collapsing rumble.
```

### 1B. Cânions da Chapada (Elemento Água / Cristal — `chapada`)
- `enemy_lodo_quartzo.png` → `sheetKey`: `enemy_lodo_quartzo_sheet` (Andares 1–10)
- `enemy_morcego_estalactite.png` → `sheetKey`: `enemy_morcego_estalactite_sheet` (Andares 4–10)
- `enemy_salamandra_abissal.png` → `sheetKey`: `enemy_salamandra_abissal_sheet` (Elite, Andares 7–10)

```text
2D top-down 3/4 SNES pixel art RPG monster sprite sheet collection on strict 4 columns by 5 rows grids (48x48 cells, 192x240 per sheet, crisp dark indigo outlines, solid white background, no text):
1) LODO DE QUARTZO ROSA (translucent rose-pink crystal slime #f472b6 with suspended quartz shards inside): Row 0 bouncy wobble, Row 1 back squish, Row 2 stretching tall to spit crystal droplet, Row 3 splash lunge, Row 4 flattened hurt & crystalline pop.
2) MORCEGO DE ESTALACTITE (cavern bat with amethyst mineral wings #c084fc and ultrasonic rings): Row 0 flapping hover, Row 1 back wings flight, Row 2 screech charge glow, Row 3 diving sonic-water burst, Row 4 stun flutter & crystal mist fade.
3) SALAMANDRA ABISSAL (agile bioluminescent cyan cave salamander #22d3ee with fin crest and aqua-flame tail): Row 0 slithering crawl, Row 1 back crawl, Row 2 coiling with glowing gills, Row 3 hydro-tail whip, Row 4 hurt recoil & vaporizing bubble burst.
```

### 1C. Céus de Varginha (Elemento Ar / Xenotecnologia — `varginha`)
- `enemy_drone_alfa.png` → `sheetKey`: `enemy_drone_alfa_sheet` (Andares 1–10)
- `enemy_androide_xenotecnico.png` → `sheetKey`: `enemy_androide_xenotecnico_sheet` (Andares 4–10)
- `enemy_anomalia_magnetica.png` → `sheetKey`: `enemy_anomalia_magnetica_sheet` (Elite, Andares 7–10)

```text
2D top-down 3/4 SNES pixel art RPG sci-fi/cozy monster sprite sheet collection on strict 4 columns by 5 rows grids (48x48 cells, 192x240 per sheet, crisp outlines, solid white background, no text):
1) DRONE ALFA DE VIGIA (compact brushed-chrome saucer drone with glowing sky-blue visor #38bdf8): Row 0 hovering thruster bob, Row 1 rear thrusters view, Row 2 laser reticle lock-on, Row 3 firing plasma wind bolt, Row 4 spark glitch & mini shutdown smoke.
2) ANDROIDE XENOTÉCNICO (humanoid alien-tech automaton in sleek lime-circuit exoplate #a3e635): Row 0 patrolling stride, Row 1 back stride, Row 2 charging forearm blade, Row 3 sweeping arc slash, Row 4 electric short-circuit & knee collapse.
3) ANOMALIA MAGNÉTICA (levitating indigo-violet storm core orb #818cf8 orbited by floating magnetized quartz shards): Row 0 orbiting shards float, Row 1 rotated rear rings, Row 2 vortex contraction windup, Row 3 electromagnetic shockwave burst, Row 4 unstable flicker & implosion.
```

### 1D. Fortaleza de Omena (Elemento Arcano / Fogo Sombrio — `fortaleza_omena`)
- `enemy_sombra_errante.png` → `sheetKey`: `enemy_sombra_errante_sheet` (Andares 1–10)
- `enemy_arauto_abismo.png` → `sheetKey`: `enemy_arauto_abismo_sheet` (Andares 4–10)
- `enemy_executor_omena.png` → `sheetKey`: `enemy_executor_omena_sheet` (Elite, Andares 7–10)

```text
2D top-down 3/4 SNES pixel art RPG dark arcane monster sprite sheet collection on strict 4 columns by 5 rows grids (48x48 cells, 192x240 per sheet, crisp outlines, solid white background, no text):
1) SOMBRA ERRANTE (hooded violet wraith cloak #a855f7 with two glowing magenta eyes and wispy bottom trail): Row 0 eerie drift, Row 1 back cloak drift, Row 2 shadowy claws extending, Row 3 spectral swipe, Row 4 destabilizing flash & shadow dissipation.
2) ARAUTO DO ABISMO (floating crimson-purple arcane bell/censer construct #f43f5e with Orbiting seal rings): Row 0 levitating sway, Row 1 back view, Row 2 glowing rune bell toll windup, Row 3 firing dark fire-arcane volley, Row 4 cracked seal & ash burst.
3) EXECUTOR DE OMENA (armored obsidian-gold elite knight #e11d48 wielding a runic greatsword): Row 0 heavy march, Row 1 back march, Row 2 greatsword overhead charge, Row 3 wide crimson cleave, Row 4 stagger parry & shattering armor runes.
```

---

## 2. Retratos Bustos do Bestiário (12 PNGs `64×64` px)

Salvar em `public/assets/portraits/` com transparência ou moldura escura `#14121d`:
- `escaravelho_inca.png`, `totem_condor.png`, `colosso_granito.png`
- `lodo_quartzo.png`, `morcego_estalactite.png`, `salamandra_abissal.png`
- `drone_alfa.png`, `androide_xenotecnico.png`, `anomalia_magnetica.png`
- `sombra_errante.png`, `arauto_abismo.png`, `executor_omena.png`

```text
16-bit SNES RPG bestiary bust portrait pack, 64x64 pixel art square thumbnails on deep indigo-slate #14121d background, clean #1e1b2e outlines, no frame border, no text:
Dramatic head-and-shoulders close-up pixel art busts matching each of the 12 new dungeon creatures: Escaravelho Inca (golden Andean beetle), Totem Condor (glowing amber stone condor), Colosso de Granito (mossy boulder titan), Lodo de Quartzo (translucent rose slime), Morcego de Estalactite (amethyst crystal cavern bat), Salamandra Abissal (bioluminescent cyan cave lizard), Drone Alfa (chrome saucer probe), Androide Xenotecnico (lime-circuit alien construct), Anomalia Magnetica (indigo storm singularity), Sombra Errante (violet hooded wraith), Arauto do Abismo (crimson arcane bell construct), and Executor de Omena (obsidian-gold runic knight).
```

---

## 3. Props dos Santuários & Elevador Rúnico (`48×48`, grade `4×2`, `192×96` px)

- **Destino:** `public/assets/tilesets/dungeon_sanctuary_elevator_v4.png`
- **Uso:** Santuários dos andares 5 e 10 e pedestal do Elevador Rúnico para checkpoints rápidos (`f1`, `f4`, `f7`, `f10`).

```text
2D top-down 3/4 cozy fantasy RPG pixel art dungeon props sheet on a strict 4 columns by 2 rows orthogonal grid (48x48 cells, 192x96 total, transparent or solid white background, zero overlap, no text):
Row 1 (Runic Elevator Pedestal - 4 animation states): [0] dormant stone quartz floor rune circle with carved 'I / IV / VII / X' notches, [1] softly glowing cyan-gold activation ring, [2] bright levitating arcane teleport beam rim, [3] sanctuary warp portal archway.
Row 2 (Sanctuary Floor 5 & 10 Props): [4] Quartz Healing Fountain brimming with glowing cyan-emerald water, [5] Drained stone fountain basin, [6] Reinforced Golden Sanctuary Treasure Chest (closed), [7] Open Golden Sanctuary Chest with sparkling gems inside.
```

---

## 4. Ícones de Qualidade de Safra, Buffs da Sierra & Chuva de Meteoros (`32×32`, grade `4×2`, `128×64` px)

- **Destino:** `public/assets/ui/v4_quality_buff_icons.png`
- **Uso:** Estrelas de qualidade de colheita (`Prata`, `Ouro`, `Quartzo Estelar`), pílulas de buff no HUD (`brisa`, `folego`, `harmonia`) e selo da Chuva de Meteoros.

```text
2D 16-bit SNES cozy RPG UI pixel art icons sheet on a strict 4 columns by 2 rows grid (32x32 cells, 128x64 total, dark transparent padding, crisp #1e1b2e outlines, no text):
Row 1 (Crop Quality Badges & Meteor): [0] polished Silver Star crop badge, [1] gleaming Gold Star crop badge, [2] iridescent Cosmic Star-Quartz diamond star badge (cyan-violet-gold), [3] falling golden shooting star meteor icon.
Row 2 (HUD Active Buff Icons): [4] 'Brisa Veloz' cyan wind feather + boot wing icon (+15% speed), [5] 'Folego da Terra' emerald leaf + stamina drop icon (-2 stamina tool cost), [6] 'Harmonia Arcana' lotus-purple mana orb icon (passive mana regen), [7] glowing warm pink pixel heart badge for daily animal affection.
```

