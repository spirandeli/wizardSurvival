# Guia de Prompts v2 — Movimentação Completa, Fauna Viva, Inimigos & Bancadas Animadas (`prompts_spritesheets_movimento_v2.md`)

Este guia contém os prompts prontos para gerar as novas folhas de sprites de **movimentação em 4 direções, rotinas de trabalho faltantes, combate avançado de dungeons, pets/companheiros, fauna do mundo e bancadas animadas**, mantendo **100% de fidelidade visual, paleta, contorno e escala** em relação aos sprites já existentes no jogo.

---

## 1. Contrato de Consistência Visual (Regras de Ouro)

Para que nenhum sprite fique menor, maior ou perca as características dos que você já gerou:

1. **Tamanhos de Célula Estritos:**
   - **NPCs, Pets, Companheiros, Inimigos Comuns e Bancadas:** grade com células de **`48×48 pixels`**. Os personagens e criaturas bípedes devem ocupar **`~40 a 43 pixels` de altura**, sempre com os pés apoiados a `2px` da borda inferior (`bottom-anchored`).
   - **Chefes Colosssais (`Guardião da Terra`, `Guardião das Águas`, `Guardião dos Céus`, `Omena`):** grade com células de **`64×64 pixels`** (`~56 a 60 pixels` de altura útil).
   - **Fauna Ambiente Menor & Props Dinâmicos (`wildlife_fauna_v2.png`, `props_living_v2.png`):** grade com células de **`32×32 pixels`**.
2. **Grades Compactas (`4×4`, `4×6` ou `6×2`):**
   - Nunca ultrapassar 4 a 6 colunas por imagem. Grades compactas evitam que a IA esprema o personagem lateralmente quando ele abre os braços, asas ou ferramentas.
3. **Padrão de Contorno, Luz e Fundo:**
   - Contorno externo escuro de `1px` em ameixa-profundo (`#14121d`).
   - Iluminação top-left com sombreamento pixel art limpo (estilo *Sea of Stars / Eastward / Stardew Valley*).
   - Fundo **100% sólido magenta puro (`#FF00FF`)**, sem xadrez cinza, sem sombras projetadas desconectadas fora da célula, sem linhas de grade desenhadas e sem texto.
4. **Processamento Automático (`scripts/processSprites.py`):**
   - Todos os arquivos listados abaixo já estão pré-configurados no `scripts/processSprites.py` com `height_priority=True` (que preserva a altura exata do corpo mesmo quando o personagem estica os braços, asas ou ferramentas para os lados).
   - À medida que gerar cada imagem, salve em `assets_raw/sprites/<nome_do_arquivo>.png` e rode:
     ```bash
     python3 scripts/processSprites.py
     ```

---

## 2. Checklist de Geração (v2)

### Lote A — NPCs (Caminhada 4 Direções + Atividades Faltantes)
- [ ] `npc_celeste_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_bento_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_isis_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_lyra_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_seu_zeca_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_prefeito_arlindo_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_seu_damiao_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npc_rafael_move.png` (`4×4`, `48×48` — `192×192`)
- [ ] `npcs_activities_part2.png` (`4×4`, `48×48` — `192×192` — Lyra, Prefeito Arlindo, Seu Damião, Rafael trabalhando)

### Lote B — Inimigos de Dungeons & Chefes (Movimento Direcional, Telegrafia, Dano e Morte)
- [ ] `enemies_earth_ext.png` (`4×4`, `48×48` — `192×192` — Golem de Pedra & Espectro da Ruína)
- [ ] `enemies_crystal_sky_ext.png` (`4×4`, `48×48` — `192×192` — Serpente de Cristal & Sonda Ufológica)
- [ ] `enemies_omena_ext.png` (`4×4`, `48×48` — `192×192` — Sentinela de Omena)
- [ ] `boss_earth_guardian_ext.png` (`6×2`, `64×64` — `384×128` — Guardião da Terra expandido)
- [ ] `bosses_elemental_ext.png` (`6×2`, `64×64` — `384×128` — Guardião das Águas & Guardião dos Céus)
- [ ] `boss_omena_ext.png` (`6×2`, `64×64` — `384×128` — Omena fases finais & teleporte)

### Lote C — Pets, Companheiros & Fauna ("Bixos da Fauna")
- [ ] `companions_ext.png` (`4×4`, `48×48` — `192×192` — Remo & Lupin)
- [ ] `pets_movement_ext.png` (`4×4`, `48×48` — `192×192` — Mini-Dragão & Unicórnio em 4 direções e voo/galope)
- [ ] `wildlife_fauna_v2.png` (`4×6`, `32×32` — `128×192` — Sapos, Peixes saltando, Esquilos/Coelhos, Corujas, Pássaros, Libélulas)

### Lote D — Bancadas Melhores & Objetos Vivos
- [ ] `workbenches_animated.png` (`4×4`, `48×48` — `192×192` — Incubadora Arcana, Forja Viva, Bancada de Encantamento, Caldeirão & Bigorna)
- [ ] `props_living_v2.png` (`4×3`, `32×32` — `128×96` — Aspersor Bávaro girando, Caixa de Envio Mágica, Fonte da Praça)

---

## 3. Lote A — Prompts dos 8 NPCs (Caminhada 4 Direções + Atividades)

> **Dica:** Você pode anexar `public/assets/sprites/npcs.png` como imagem de referência junto com o prompt de cada NPC para garantir 100% de identidade facial e de roupa.

### A1. `npc_celeste_move.png` — Celeste (A Boticária Estelar)
- **Arquivo de destino:** `assets_raw/sprites/npc_celeste_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, with the character standing 41 pixels tall and feet anchored 2px above the bottom of every cell. Keep exact same head-to-body proportions and height across all 16 frames.
Character (Celeste, the Star Apothecary): Young woman with long wavy dark indigo-purple hair (#2e1a47 to #4c2882) decorated with tiny gold crescent moon and star hairpins (#f5b942), wearing a flowing lavender and indigo starry dress with gold trim, white puff sleeves, and a small brown herbalist satchel at her waist.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame smooth walk cycle, arms swinging gently, starry skirt swaying.
Row 2 (4 frames): Walking UP (facing back, showing her long wavy dark indigo hair with gold star pins), 4-frame smooth walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right), 4-frame smooth stride cycle, satchel and dress hem moving naturally.
Row 4 (4 frames): Expressive idle & greeting facing front: Frame 1 breathing in, Frame 2 blinking eyes softly, Frame 3 holding up a glowing cyan potion vial with a warm smile, Frame 4 waving hand kindly.
```

### A2. `npc_bento_move.png` — Bento (O Ferreiro da Montanha)
- **Arquivo de destino:** `assets_raw/sprites/npc_bento_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, with the character standing 42 pixels tall and feet anchored 2px above the bottom of every cell. Keep identical body height and width across all 16 frames.
Character (Bento, the Mountain Blacksmith): Sturdy muscular man with messy dark brown hair, full brown beard, wearing a heavy dark brown leather blacksmith apron with brass buckles over a bare muscular torso, glowing cyan-blue arcane rune tattoos on both biceps/shoulders, leather bracers, and heavy work boots.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame heavy confident walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing crossed leather apron straps and glowing blue rune tattoos on shoulders), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right), 4-frame walk cycle with clear arm and boot stride.
Row 4 (4 frames): Expressive idle facing front: Frame 1 chest breathing, Frame 2 crossing muscular arms with rune tattoos glowing brighter, Frame 3 wiping forehead, Frame 4 friendly nod.
```

### A3. `npc_isis_move.png` — Ísis (A Dona do Pub & DJ de Vinil)
- **Arquivo de destino:** `assets_raw/sprites/npc_isis_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Maintain exact same height in all frames.
Character (Isis, the Rock Pub Owner): Cool young woman with short wavy black hair and a bright red headband (#e11d48), wearing a sleeveless black leather vest over a dark gray t-shirt with a tiny white skull emblem, red waist sash/belt, dark pants, fingerless gloves, and boots.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame rhythmic walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing black leather vest back and red headband knot), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right), 4-frame smooth walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 tapping foot to music, Frame 2 adjusting red headband, Frame 3 holding a black vinyl record at hip with a confident grin, Frame 4 rock hand gesture.
```

### A4. `npc_lyra_move.png` — Lyra (A Pesquisadora das Estrelas)
- **Arquivo de destino:** `assets_raw/sprites/npc_lyra_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Keep exact same height across all frames.
Character (Lyra, the Astro-Researcher): Young scholar woman with chestnut brown hair tied in a high messy bun, round gold-rimmed glasses, indigo-blue explorer jacket with gold trim, brown leather backpack, and a slender wooden staff topped with a glowing cyan crystal orb strapped vertically to her back.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame walk cycle with crystal staff tip visible over her left shoulder.
Row 2 (4 frames): Walking UP (facing back, showing brown leather backpack and crystal-topped staff strapped across it), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right, showing bun, glasses, backpack and staff), 4-frame walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 adjusting round glasses, Frame 2 blinking curiously, Frame 3 glancing up at the sky as the crystal orb on her staff glints cyan, Frame 4 smiling.
```

### A5. `npc_seu_zeca_move.png` — Seu Zeca (O Fazendeiro Veterano)
- **Arquivo de destino:** `assets_raw/sprites/npc_seu_zeca_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Keep exact same height across all frames.
Character (Seu Zeca, the Old Farmer): Stocky older man with a wide-brim golden straw hat, bushy white mustache and beard, olive-green work shirt, classic blue denim overalls with brass buttons, and muddy brown farm boots.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame sturdy farmer walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing wide straw hat and crossed blue overall straps over green shirt), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right, showing straw hat brim and white beard), 4-frame walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 thumbs tucked in overall straps, Frame 2 tipping straw hat brim in greeting, Frame 3 hearty chuckle with shoulders bobbing, Frame 4 relaxed breathing.
```

### A6. `npc_prefeito_arlindo_move.png` — Prefeito Arlindo
- **Arquivo de destino:** `assets_raw/sprites/npc_prefeito_arlindo_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Keep exact same height across all frames.
Character (Mayor Arlindo): Distinguished middle-aged man with neatly parted dark brown hair with gray temples, trimmed beard, crisp white dress shirt sleeves, dark charcoal waistcoat/vest with a gold pocket-watch chain draped across the front, red necktie, dark tailored trousers, and dress shoes.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame composed dignified walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing neat hair and dark waistcoat back), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right, showing gold pocket-watch chain and red tie), 4-frame walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 posture upright, Frame 2 adjusting red tie, Frame 3 glancing at gold pocket watch in hand, Frame 4 polite diplomatic nod.
```

### A7. `npc_seu_damiao_move.png` — Seu Damião (O Pescador das Corredeiras)
- **Arquivo de destino:** `assets_raw/sprites/npc_seu_damiao_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Keep exact same height across all frames.
Character (Seu Damiao, the Old Fisherman): Weathered old fisherman with a yellow waterproof sou'wester fisherman hat, full white beard, wooden pipe at the corner of his mouth, bright yellow oilskin raincoat over a dark sweater, dark blue trousers, and brown waterproof boots.
Row 1 (4 frames): Walking DOWN (facing front), 4-frame steady walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing yellow rain hat back brim and yellow raincoat), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right, showing white beard and wooden pipe), 4-frame walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 breathing calmly, Frame 2 puffing a tiny wisp of white smoke from his pipe, Frame 3 squinting toward the horizon, Frame 4 warm nod.
```

### A8. `npc_rafael_move.png` — Rafael (O Fotógrafo Viajante)
- **Arquivo de destino:** `assets_raw/sprites/npc_rafael_move.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art character movement sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, character standing 41 pixels tall, feet anchored 2px above the bottom of every cell. Keep exact same height across all frames.
Character (Rafael, the Photographer): Energetic young man with messy brown hair, wearing a blue denim jacket over a teal shirt, brown hiker backpack, a black DSLR camera hanging on a neck strap over his chest, dark jeans, and sneakers.
Row 1 (4 frames): Walking DOWN (facing front, holding camera strap lightly), 4-frame brisk walk cycle.
Row 2 (4 frames): Walking UP (facing back, showing brown hiker backpack and messy brown hair), 4-frame walk cycle.
Row 3 (4 frames): Walking RIGHT (side profile facing right, showing backpack on left and black camera lens in front), 4-frame walk cycle.
Row 4 (4 frames): Expressive idle facing front: Frame 1 looking around eagerly, Frame 2 checking camera screen, Frame 3 giving a friendly wave, Frame 4 smiling.
```

### A9. `npcs_activities_part2.png` — Rotinas de Trabalho (Lyra, Prefeito Arlindo, Seu Damião, Rafael)
- **Arquivo de destino:** `assets_raw/sprites/npcs_activities_part2.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art NPC work activity sprite sheet, 16-bit/32-bit cozy mystical RPG style (Sea of Stars, Stardew Valley), crisp 1px dark plum outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total). Each cell is 48x48 pixels, characters standing 41 pixels tall anchored 2px from bottom.
Row 1 (4 frames - Lyra the Astro-Researcher with brown bun, round glasses, indigo jacket, crystal staff): Frame 1 looking through a brass spyglass angled upward, Frame 2 crystal staff beside her glowing cyan with tiny star sparkles, Frame 3 writing notes with a quill in an open star journal, Frame 4 smiling as constellation runes float above the book.
Row 2 (4 frames - Mayor Arlindo with neat dark hair, trimmed beard, dark waistcoat with gold watch chain, red tie): Frame 1 holding an official parchment scroll with gold seal, Frame 2 checking his open gold pocket watch, Frame 3 writing on a wooden clipboard with a feather pen, Frame 4 nodding approvingly while stamping a seal.
Row 3 (4 frames - Seu Damiao the Fisherman in yellow rain hat and yellow raincoat, white beard, pipe): Frame 1 holding a wooden fishing rod cast forward, Frame 2 rod tip bobbing as he reels the handle, Frame 3 inspecting a woven blue fishing net in his hands, Frame 4 puffing a small wisp of smoke from his pipe contentedly.
Row 4 (4 frames - Rafael the Photographer in blue denim jacket, brown backpack, DSLR camera): Frame 1 crouching slightly while aiming his black DSLR camera, Frame 2 raising camera to eye level, Frame 3 camera lens emitting a bright cyan-white flash sparkle, Frame 4 looking happily at the photo on the camera back.
```

---

## 4. Lote B — Inimigos de Dungeons & Chefes (Movimento, Telegrafia, Dano e Morte)

### B1. `enemies_earth_ext.png` — Golem de Pedra & Espectro da Ruína
- **Arquivo de destino:** `assets_raw/sprites/enemies_earth_ext.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art dungeon enemies extended animation sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell, ~40px tall).
Row 1 (4 frames - Mossy Stone Golem with grey-brown rock body, green moss on shoulders, glowing amber eyes, purple corruption runes): Walking UP (seen from behind, showing mossy boulder back and glowing purple rune cracks), 4-frame heavy stomping cycle.
Row 2 (4 frames - Same Mossy Stone Golem): Attack telegraph & roar: Frame 1 bracing legs wide, Frame 2 chest runes glowing bright violet, Frame 3 raising both giant rock fists high overhead with floating pebbles, Frame 4 slamming fists down with dust shockwave.
Row 3 (4 frames - Arcane Ruin Wisp, floating dark-violet spectral flame with glowing magenta rune core and orbiting shadow motes): Directional dash & charge: Frame 1 leaning left trailing purple fire, Frame 2 leaning right trailing fire, Frame 3 contracting core tightly with bright magenta telegraph rings, Frame 4 expanding into an arcane shockwave.
Row 4 (4 frames - Same Arcane Ruin Wisp hurt & death): Frame 1 jolted back with white-pink crackle, Frame 2 core fracturing into three rune shards, Frame 3 dissolving into swirling violet smoke rings, Frame 4 final fading purple embers.
```

### B2. `enemies_crystal_sky_ext.png` — Serpente de Cristal & Sonda Ufológica
- **Arquivo de destino:** `assets_raw/sprites/enemies_crystal_sky_ext.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art dungeon enemies extended animation sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell, ~38-41px tall).
Row 1 (4 frames - Turquoise Crystal Serpent with faceted cyan crystal scales, sharp ice-blue dorsal crest, golden eye): Slithering DOWN (facing front) for 2 frames, and slithering UP (facing back, showing faceted crystal spine crest) for 2 frames.
Row 2 (4 frames - Same Turquoise Crystal Serpent): Lunge & tail whip: Frame 1 coiling body tightly like a spring with cyan glow, Frame 2 lunging fangs forward with frost mist, Frame 3 spinning crystal tail slash, Frame 4 recovering coil.
Row 3 (4 frames - Metallic UFO Probe with dark gunmetal saucer rim, glowing green indicator lights, translucent violet-blue glass dome): Directional flight tilt: Frame 1 banking left with thruster flare, Frame 2 banking right, Frame 3 tilting forward (approaching), Frame 4 tilting backward.
Row 4 (4 frames - Same Metallic UFO Probe): Overcharge telegraph & shield pulse: Frame 1 dome glowing bright cyan, Frame 2 spinning neon-green energy ring under saucer, Frame 3 firing dual plasma arcs downward, Frame 4 cooling vents steaming.
```

### B3. `enemies_omena_ext.png` — Sentinela de Omena (Movimento Direcional & Magia)
- **Arquivo de destino:** `assets_raw/sprites/enemies_omena_ext.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art dark mage enemy sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell, ~41px tall).
Character (Omena Sentinel): Floating hooded dark-purple wraith knight with curved dark horns on hood, glowing ruby-magenta eyes inside shadow, gold-trimmed violet mantle, dark staff with crimson orb, and floating purple crystal shards orbiting around him.
Row 1 (4 frames): Gliding DOWN (facing front, mantle billowing, crystal shards orbiting), 4-frame smooth floating cycle.
Row 2 (4 frames): Gliding UP (facing back, showing tattered gold-trimmed purple cape and dark horns on hood), 4-frame floating cycle.
Row 3 (4 frames): Teleport blink & dark shield: Frame 1 wrapping cape around body, Frame 2 shrinking into a vertical purple rift slash, Frame 3 emerging from shadow flames, Frame 4 projecting a hexagonal magenta rune barrier.
Row 4 (4 frames): Heavy dark nova telegraph & cast: Frame 1 raising staff with two hands overhead, Frame 2 dark crimson-violet sphere expanding above staff, Frame 3 unleashing shockwave rings of shadow fire, Frame 4 cloak settling.
```

### B4. `boss_earth_guardian_ext.png` — Guardião da Terra (Movimento & Fases — `64×64`)
- **Arquivo de destino:** `assets_raw/sprites/boss_earth_guardian_ext.png`
- **Grade:** `6 colunas × 2 linhas` (`64×64` por célula, `384×128` final)
- **Prompt:**
```text
Pixel art colossal boss sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 6 columns by 2 rows grid (12 frames total). Each cell is 64x64 pixels, boss standing 58 pixels tall anchored 2px above bottom.
Character (Corrupted Earth Guardian of Machu Picchu): Massive ancient Inca stone colossus with carved gold chest plates and shoulder runes, green moss patches, glowing magenta-amber eyes, and dark purple corruption crystals jutting from shoulders, surrounded by floating pebbles.
Row 1 (6 frames): Frame 1-3 heavy walking stride facing front/side with ground pebbles bouncing; Frame 4-6 walking UP (seen from behind, showing massive mossy stone back, Inca gold backplate and purple crystal spikes).
Row 2 (6 frames): Frame 1-2 earthquake telegraph (crouching low, purple-gold runes blazing across chest and fists); Frame 3-4 double-fist seismic slam sending jagged rock spikes upward; Frame 5 hit stagger recoiling with stone chips flying; Frame 6 purified golden-green spirit form with peaceful glowing eyes and flowers blooming on shoulders.
```

### B5. `bosses_elemental_ext.png` — Guardião das Águas & Guardião dos Céus (`64×64`)
- **Arquivo de destino:** `assets_raw/sprites/bosses_elemental_ext.png`
- **Grade:** `6 colunas × 2 linhas` (`64×64` por célula, `384×128` final)
- **Prompt:**
```text
Pixel art colossal elemental bosses sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 6 columns by 2 rows grid (12 frames total). Each cell is 64x64 pixels, bosses standing 58 pixels tall.
Row 1 (6 frames - Water Guardian of Chapada: muscular elemental body of swirling sapphire-cyan water, mossy stone wolf-mask helmet and stone shoulder pads, waterfall flowing down chest, 5 cyan crystal droplets floating in an arc above head): Frame 1-2 surging forward as a living wave (side/front stride); Frame 3-4 facing UP (seen from behind, showing waterfall cape and stone shoulder pads); Frame 5 whirlpool charge telegraph with glowing cyan rings; Frame 6 heavy hit recoil splashing water droplets.
Row 2 (6 frames - Sky Guardian of Varginha: winged celestial knight in dark anthracite armor, golden Celtic sun-wheel halo behind head, glowing emerald-green heart gem on chest, starry dark-blue cape, large steel-grey feathered wings): Frame 1-2 high-speed aerial swoop facing side/front; Frame 3-4 facing UP (seen from behind, showing large feathered wings, starry cape and golden sun halo); Frame 5 storm-laser telegraph with golden lightning arcs between wings; Frame 6 purified serene floating pose with warm golden aura.
```

### B6. `boss_omena_ext.png` — Omena (Fase 2/3, Deslize & Tempestade Abissal — `64×64`)
- **Arquivo de destino:** `assets_raw/sprites/boss_omena_ext.png`
- **Grade:** `6 colunas × 2 linhas` (`64×64` por célula, `384×128` final)
- **Prompt:**
```text
Pixel art final boss extended sprite sheet, 16-bit/32-bit mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 6 columns by 2 rows grid (12 frames total). Each cell is 64x64 pixels, boss standing 58 pixels tall.
Character (Omena, Lord of the Abyssal Eclipse): Colossal floating dark sovereign in royal deep-purple and gold armor robes, golden horned crown, glowing crimson-magenta eyes, lower body tapering into swirling dark-violet shadow flames.
Row 1 (6 frames): Frame 1-2 gliding swiftly to the side with cape and shadow tail streaming behind; Frame 3-4 gliding UP (seen from behind, showing royal purple-gold mantle and horned crown); Frame 5-6 shadow-step teleport (collapsing into a black-purple eclipse orb and re-emerging with dark lightning).
Row 2 (6 frames - Phase 3 Enrage & Finale): Frame 1-3 Phase 3 Cataclysm (golden crown blazing crimson, four miniature dark eclipse portals orbiting behind shoulders, unleashing purple-magenta lightning beams); Frame 4 heavy stagger with cracked golden armor; Frame 5-6 final defeat dissolution as the shadow robes unravel into harmless starlight motes.
```

---

## 5. Lote C — Pets, Companheiros & Fauna ("Bixos da Fauna")

### C1. `companions_ext.png` — Remo (Gato Espectral) & Lupin (Grimório Vivo)
- **Arquivo de destino:** `assets_raw/sprites/companions_ext.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art magical companions sprite sheet, 16-bit/32-bit cozy mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell).
Row 1 (4 frames - Remo the Spectral Black Cat: cute small black-indigo cat with bright amber-gold eyes, pink inner ears, gold collar with blue gem, tail tip dissolving into purple shadow wisps): 4-frame graceful walking/prowling cycle facing right, paws stepping softly, ghostly purple tail swaying.
Row 2 (4 frames - Same Remo the Spectral Cat): Frame 1 sitting and licking front paw cutely, Frame 2 stretching front legs forward in a cat bow, Frame 3 playful spectral pounce in mid-air with purple star sparkles, Frame 4 curled up purring with glowing golden eyes half-closed.
Row 3 (4 frames - Lupin the Living Grimoire: thick ancient purple leather spellbook with gold corner clasps, glowing cyan rune crest on cover, hovering at an angle): 4-frame rapid page-flipping animation with golden and cyan rune symbols floating upward from the open parchment pages.
Row 4 (4 frames - Same Lupin the Living Grimoire): Frame 1 tilting left in flight with stardust trail, Frame 2 tilting right in flight, Frame 3 snapping shut with a bright golden-cyan magic ring burst, Frame 4 opening wide to project a glowing blue arcane compass hologram.
```

### C2. `pets_movement_ext.png` — Mini-Dragão & Unicórnio (4 Direções, Voo e Galope)
- **Arquivo de destino:** `assets_raw/sprites/pets_movement_ext.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art fantasy farm pets movement sprite sheet, 16-bit/32-bit cozy RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell, ~38-41px tall).
Row 1 (4 frames - Cute Ruby Mini-Dragon with bright red scales, cream belly, small golden horns, orange bat-like wings, and a flickering flame on tail tip): Frame 1-2 walking DOWN (facing front, waddling cutely); Frame 3-4 walking UP (facing back, showing orange wings, red back scales and flaming tail tip).
Row 2 (4 frames - Same Cute Ruby Mini-Dragon): 4-frame mid-air flying & fire-puff cycle facing right: wings flapping high up and down while hovering off the ground and puffing a cheerful little ring of orange fire sparks.
Row 3 (4 frames - Magical Pastel Unicorn with pearl-white coat, pastel cyan-lavender-gold rainbow mane and tail, cyan horn, golden hooves, purple star mark on flank): Frame 1-2 trotting DOWN (facing front); Frame 3-4 trotting UP (facing back, showing flowing pastel rainbow tail and mane).
Row 4 (4 frames - Same Magical Pastel Unicorn): 4-frame joyful gallop & leap cycle facing right, legs extended in a graceful run with cyan and pink star sparkles trailing from its horn and hooves.
```

### C3. `wildlife_fauna_v2.png` — Fauna Viva de São Tomé ("Bixos da Fauna" — `32×32`)
- **Arquivo de destino:** `assets_raw/sprites/wildlife_fauna_v2.png`
- **Grade:** `4 colunas × 6 linhas` (`32×32` por célula, `128×192` final)
- **Prompt:**
```text
Pixel art ambient wildlife creatures sprite sheet, 16-bit/32-bit cozy RPG style (Stardew Valley, Sea of Stars), crisp 1px dark outlines (#14121d), no anti-aliasing, solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 6 rows grid (24 frames total). Each cell is 32x32 pixels.
Row 1 (4 frames - Cute Emerald Pond Frog with green body, cream throat, golden eyes): Frame 1 sitting calm, Frame 2 inflating vocal sac (croaking), Frame 3 leaping upward in an arc, Frame 4 landing splash pose.
Row 2 (4 frames - Golden-Cyan Mystic River Carp / Fish): Frame 1 water ripple ring, Frame 2 fish leaping upward out of water, Frame 3 fish curving at peak of jump with water droplets, Frame 4 diving nose-first back into water splash.
Row 3 (4 frames - Cute Forest Squirrel / Bunny with warm rufous-brown fur and bushy tail): Frame 1 sitting upright sniffing nose, Frame 2 perking ears alertly, Frame 3-4 scampering/hopping swiftly to the right.
Row 4 (4 frames - Serra Barn Owl with warm tawny-brown and cream feathers, big amber eyes): Frame 1 perched blinking, Frame 2 tilting head curiouser, Frame 3-4 spreading wings wide in silent night flight.
Row 5 (4 frames - Little Brown Sparrow on ground): Frame 1 perched looking around, Frame 2-3 pecking seeds on the ground, Frame 4 taking off with wings raised.
Row 6 (4 frames - Iridescent Blue Dragonfly & Golden Monarch Butterfly): Frame 1-2 blue dragonfly hovering with shimmering double wings; Frame 3-4 golden-purple butterfly flapping wings.
```

---

## 6. Lote D — Bancadas Melhores & Objetos Vivos do Mundo

### D1. `workbenches_animated.png` — Bancadas Animadas (`48×48`)
- **Arquivo de destino:** `assets_raw/sprites/workbenches_animated.png`
- **Grade:** `4 colunas × 4 linhas` (`48×48` por célula, `192×192` final)
- **Prompt:**
```text
Pixel art animated crafting workbenches sprite sheet, 16-bit/32-bit cozy mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 4 rows grid (16 frames total, 48x48 pixels per cell, anchored 2px from bottom).
Row 1 (4 frames - Arcane Egg Incubator Active Loop: stone pedestal with mossy steps, glowing cyan glass cylinder chamber in center, purple crystals on sides, diamond rune on top cap): 4-frame animation of a spotted dragon/unicorn egg bobbing gently inside the glowing cyan liquid chamber while mana bubbles rise, side crystals pulse violet, and the top rune glows bright cyan.
Row 2 (4 frames - Living Smelting Forge Active Loop: stone furnace with chimney, leather bellows on side, molten lava trough in front, blue banner): 4-frame animation of the bellows pumping, bright orange-yellow molten metal bubbling and flowing into the mold, orange sparks flying out, and purple-gray smoke puffs rising from the chimney.
Row 3 (4 frames - Arcane Enchanting Table Active Loop: dark navy stone hexagonal table with gold trim and glowing cyan crystal orb on a brass stand): 4-frame animation where the crystal orb levitates slightly higher, a glowing ring of cyan and gold arcane runes rotates around the tabletop, and magical starlight motes rise around it.
Row 4 (4 frames - Town Shop Stations): Frame 1-2 Apothecary Cauldron on wooden tripod bubbling with glowing purple-cyan potion liquid and rising star vapor; Frame 3-4 Blacksmith Iron Anvil with a glowing red-hot sword blade on top emitting orange heat waves and sparks.
```

### D2. `props_living_v2.png` — Aspersor Bávaro, Caixa de Envio & Fonte (`32×32`)
- **Arquivo de destino:** `assets_raw/sprites/props_living_v2.png`
- **Grade:** `4 colunas × 3 linhas` (`32×32` por célula, `128×96` final)
- **Prompt:**
```text
Pixel art animated farm and town props sprite sheet, 16-bit/32-bit cozy mystical RPG style, crisp 1px dark outlines (#14121d), solid flat magenta background (#FF00FF), no grid lines, no text.
Layout: 4 columns by 3 rows grid (12 frames total, 32x32 pixels per cell).
Row 1 (4 frames - Bavarian Arcane Farm Sprinkler): Brass and blue-crystal standpipe in the center of the tile with a rotating cross-nozzle head spraying arcs of sparkling cyan water droplets in 4 rotating angles (0, 90, 180, 270 degrees).
Row 2 (4 frames - Magical Farm Shipping Bin): Rustic oak wood chest bound with iron and a golden sun emblem on front: Frame 1 closed, Frame 2 lid slightly open with golden coin sparkle peeking out, Frame 3 lid bouncing with floating gold sparkles, Frame 4 settling closed.
Row 3 (4 frames - Stone Water Basin / Mini Fountain): Circular carved stone basin filled with bright blue water: 4-frame looping water ripple and sparkling cyan light reflection animation.
```
