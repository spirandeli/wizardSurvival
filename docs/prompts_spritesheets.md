# Guia de Prompts para Spritesheets (32×32 px) — O Despertar de São Tomé dos Números

Este guia padroniza os prompts para geração de spritesheets em IA (Midjourney, DALL-E, GPT Image, Stable Diffusion / PixelLab / Aseprite AI) mantendo **unidade visual** em todo o projeto.

---

## 1. Regras Globais de Direção de Arte (Incluir em todo prompt)
- **Resolução base:** `32x32 pixels` por célula/quadro (ou múltiplo limpo para pós-processamento pixel-perfect, sem anti-aliasing).
- **Perspectiva:** Top-down 3/4 estilo *Stardew Valley* / *RPG 16-bit SNES moderno*, com sombreamento suave de pixel art e contorno escuro sutil (*dark outline*, nunca preto puro `#000000` pesado).
- **Paleta de Identidade (São Tomé dos Números):**
  - Pedras quartzíticas cinza-claras e bege-douradas (`#d6cfc2`, `#9c9588`).
  - Vegetação de serra mineira e névoa mística azul-violeta (`#4a6b53`, `#7e8ce0`, `#2a2640`).
  - Detalhes arcanos em ciano luminoso e âmbar de forja (`#4deeea`, `#f59e0b`).
- **Layout:** Fundo sólido uniforme (ou transparente PNG), sprites rigorosamente centralizados em **grid ortogonal sem sobreposição**, sem texto ou marcas d'água.

---

## 2. Prompts por Categoria de Asset

### A. Protagonista (`public/assets/sprites/player.png`)
> **Prompt:** `2D top-down 3/4 cozy RPG pixel art sprite sheet of a young ex-software-developer turned practical wizard farmer, wearing a mossy green traveler tunic, leather satchel, and short dark messy hair, 32x32 pixel grid cells, 4 rows (idle/walk down, up, left, right) x 4 frames each, plus 1 row of tool swing and arcane staff cast poses, crisp pixel art, Stardew Valley style, solid magenta or transparent background, strictly aligned 32x32 grid, no anti-aliasing.`

### B. Remo (Guia Felino Voador) & Lupin (Grimório) (`public/assets/sprites/companions.png`)
> **Prompt:** `2D top-down 3/4 pixel art sprite sheet, 32x32 pixel cells, strictly aligned grid, transparent background. Row 1 (4 frames): Remo, a sleek ironic black cat with glowing amber-violet eyes, floating and Cheshire-style fading transparency animation. Row 2 (4 frames): Lupin, an ancient sacred leather-bound grimoire floating open with glowing cyan-gold rune pages and subtle mystical sparkles, cozy fantasy pixel art.`

### C. NPCs da Cidade (`public/assets/sprites/npcs.png`)
> **Prompt:** `2D top-down 3/4 pixel art character sprite sheet, 32x32 pixel grid cells, idle and 2-frame walk cycle facing down/side for 8 Brazilian mountain town NPCs: (1) Celeste: starry apothecary woman with lavender dress and lunar hairpins; (2) Bento Bigorna: muscular blacksmith with soot-stained leather apron and rune tattoos on forearms; (3) Isis: energetic female rock-pub bartender and DJ with band tee, leather vest and headphones around neck; (4) Lyra: hyperactive female astronomer with glasses, star-chart vest and copper antenna pack; (5) Seu Zeca: grumpy older traditional farmer with straw hat and overalls; (6) Prefeito Arlindo: friendly mayor in neat vest and pocket watch; (7) Seu Damião: old misty-river fisherman with raincoat hat; (8) Rafael: anxious big-city tourist with modern jacket and high-tech camera. Crisp 16-bit pixel art, transparent background.`

### D. Retratos de Diálogo 64×64 (`public/assets/portraits/*.png`)
> **Prompt:** `Cozy 16-bit pixel art character bust portrait, 64x64 pixels, expressive face looking slightly right, warm lantern lighting, transparent background, [DESCREVER PERSONAGEM CONFORME ITEM C], Stardew Valley dialogue portrait aesthetic, crisp pixels, no blur.`

### E. Mini-Dragões, Ovos e Incubadora (`public/assets/sprites/creatures_fire.png`)
> **Prompt:** `2D top-down 3/4 pixel art sprite sheet on strict 32x32 pixel grid, transparent background. Row 1 (3 frames): three distinct glowing cracked stone-and-ember mini-dragon eggs on mossy pedestals. Row 2 (4 frames): cute baby crimson-and-copper mini-dragon breathing tiny warm sparks, idle and flapping wings. Row 3 (2 frames): rustic arcane stone incubator with glowing rune glass, and a living-forge smelting workbench with ember vents. Cozy fantasy pixel art.`

### F. Tileset Fazenda, Casa, Porão e Cidade (`public/assets/tilesets/sao_tome_tileset.png`)
> **Prompt:** `2D top-down 3/4 pixel art tileset, strict 32x32 pixel tile grid, seamless tileable textures for a mystical Brazilian mountain village inspired by Sao Tome das Letras: lush highland grass, quartz cobblestone paths, dry tilled soil and dark watered soil, rustic wooden cabin walls and pulsing arcane floorboards for basement, stone pub floor, blacksmith anvil floor, wooden fences, pine/ipe trees, misty river water edges, stone altar, shipping bin. Crisp Stardew Valley inspired pixel art, no gaps between tiles.`

### G. Tileset Dungeon Machu Picchu & Inimigos (`public/assets/tilesets/machu_picchu_tileset.png` e `enemies_earth.png`)
> **Tileset:** `2D top-down 3/4 pixel art dungeon tileset, strict 32x32 pixel grid, mossy Inca ashlar granite walls, carved stone floors, pressure-plate spike traps, glowing earth-mana cracks, deep mountain mist abyss edges, ore veins with copper and quartz crystals, crisp 16-bit RPG pixel art.`
> **Inimigos & Chefe:** `2D top-down 3/4 pixel art sprite sheet, transparent background. Corrupted Inca stone golem minions (32x32 grid, 4-frame walk and smash), floating dark-purple corrupted rune wisps (32x32), and a large boss sprite (64x64): The Earth Guardian, a majestic ancient colossus made of mossy granite boulders, glowing roots, and golden Inca carvings with dark corruption cracks, 4-frame idle/attack.`

### H. Safras, Ferramentas, Cajados e Ícones (`public/assets/sprites/items_icons.png`)
> **Prompt:** `2D pixel art RPG inventory icon sheet, strict 32x32 pixel grid, transparent background, clear dark outline: hoe, watering can, axe, pickaxe, arcane fishing rod, Quartz Root (seed and 4 growth stages + harvested glowing crystal root), Star Hops (hops cone with tiny stars), Shadow Flower (dark indigo nocturnal bloom), wooden and quartz magic staffs (earth, fire, arcane), leather and rune-reinforced armor tunic, copper/quartz ores, prism rainbow fish, glowing potion flasks.`

