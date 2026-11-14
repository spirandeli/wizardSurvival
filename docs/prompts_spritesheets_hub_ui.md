# Spritesheets de UI Necessárias — Hub de Inventário, Criação & Missões

Este documento lista os spritesheets dedicados à nova interface do **Hub do Guardião** (inspirada em *Stardew Valley* e *Graveyard Keeper*), complementando [prompts_spritesheets_faltantes.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets_faltantes.md).

## 1. Status de Assets Reaproveitados vs. Novos

### Já Existentes e Reaproveitados no Hub
- `[x]` **Retratos dos Moradores (`public/assets/portraits/*.png`, `64×64`)** — usados no painel *Master-Detail* de Missões e nos cards da aba *Moradores*.
- `[x]` **Ícones de Itens (`public/assets/ui/items_icons.png`, `48×48`)** — usados na Mochila, Criação, Presentes Favoritos e Compêndio.
- `[x]` **Ícones Básicos de HUD (`public/assets/ui/ui_icons.png`, `32×32`)** — Lua, Clima, Ouro, Companheiros.

### Novos Spritesheets Recomendados para o Hub (Pendentes de Geração)
1. `[ ]` **`public/assets/ui/hub_badges_seals.png`** (`128×128`, grade `4×4` de `32×32`) — Corações de afinidade (cheio, meio, vazio), alfinete de fixar missão (`📌`), selos de cera (principal, secundária, concluída), lixeira aberta/fechada, ícone de organizar mochila e cadeado/silhueta de compêndio.
2. `[ ]` **`public/assets/ui/hub_tab_icons.png`** (`192×32`, grade `6×1` de `32×32`) — Ícones pixel-art para as 6 abas do Hub (Mochila, Criação, Missões, Moradores, Grimório, Compêndio).
3. `[ ]` **`public/assets/ui/hub_frames_9slice.png`** (`192×96`, 4 molduras `48×48` para 9-slice) — Moldura principal madeira/latão, slot chanfrado, pergaminho escuro de missão e card de tooltip.

---

## 2. Regras Padrão para Recorte Limpo (`32×32` e `48×48`)

> **Prompt Base:**
> `2D cozy RPG pixel art UI asset sheet, Stardew Valley meets Graveyard Keeper aesthetic, São Tomé dos Números palette (dark slate #171422, aged brass #e2a83b, warm oak wood #6b4423, quartz stone #d6cfc2, arcane cyan #4deeea, crimson #ef4444). Strictly aligned orthogonal grid with generous padding inside every cell, ZERO overlap between adjacent icons, crisp dark-colored outline (never pure black #000000), no anti-aliasing, no text labels, no grid lines, solid transparent/uniform background.`

---

## 3. Especificação & Prompts Prontos

### 3A. Emblemas, Corações & Selos do Hub (`public/assets/ui/hub_badges_seals.png`)
- **Padrão:** `32×32` por quadro, grade **`4×4`** (`128×128` px finais, 16 ícones).
- **Mapeamento dos quadros:**
  - **Linha 1:** `0: Coração Cheio`, `1: Meio Coração`, `2: Coração Vazio`, `3: Alfinete Dourado (Fixar Missão)`
  - **Linha 2:** `4: Selo de Cera Dourado (Campanha)`, `5: Selo de Cera Azul (Vila)`, `6: Selo Verde Check (Concluída)`, `7: Pergaminho Fechado`
  - **Linha 3:** `8: Lixeira Fechada`, `9: Lixeira Aberta (Hover)`, `10: Setas Organizar Mochila`, `11: Dividir Pilha (2 caixas)`
  - **Linha 4:** `12: Cadeado Compêndio (???)`, `13: Estrela Rara`, `14: Lupa de Busca`, `15: Chave/Atalho`
- **Prompt (EN):**
  ```text
  2D cozy RPG pixel art UI icon sheet on a strict 4 columns by 4 rows orthogonal grid (16 isolated 32x32 cells, generous padding, zero overlap, solid uniform transparent background, no grid lines, no text). Stardew Valley meets Graveyard Keeper UI style, aged brass and dark plum-slate palette.
  Row 1: full ruby pixel heart, half ruby pixel heart, empty slate heart outline, golden brass pushpin icon.
  Row 2: golden wax seal stamp with star, indigo wax seal stamp with scroll, emerald wax seal with checkmark, rolled dark parchment scroll.
  Row 3: iron-banded wooden trash can closed, iron-banded wooden trash can open lid, dual sorting arrows icon, stack-split two small crates icon.
  Row 4: dark bronze padlock for unknown compendium entry, glowing arcane star badge, brass magnifying glass, small ornate brass key.
  Crisp 16-bit pixel art, dark outlines, no anti-aliasing.
  ```

---

### 3B. Ícones das 6 Abas do Hub (`public/assets/ui/hub_tab_icons.png`)
- **Padrão:** `32×32` por quadro, grade **`6×1`** (`192×32` px finais, 6 ícones).
- **Mapeamento:** `0: Mochila`, `1: Criação/Bigorna`, `2: Missões/Pergaminho`, `3: Moradores/Coração`, `4: Grimório/Livro Arcano`, `5: Compêndio/Bestiário`.
- **Prompt (EN):**
  ```text
  2D cozy RPG pixel art UI tab icon strip on a strict 6 columns by 1 row orthogonal grid (6 isolated 32x32 cells, generous padding, zero overlap, solid uniform transparent background, no grid lines, no text). Stardew Valley and Graveyard Keeper menu tab style.
  Cell 1: leather adventurer backpack with brass buckle.
  Cell 2: blacksmith anvil and hammer with small amber spark.
  Cell 3: unrolled parchment quest scroll with wax seal.
  Cell 4: warm villager portrait silhouette with small red heart.
  Cell 5: mystical purple-indigo spellbook with glowing cyan rune.
  Cell 6: leather-bound field compendium book with leaf and sword emblem.
  Crisp 16-bit pixel art, aged brass highlights, no anti-aliasing.
  ```

---

### 3C. Molduras 9-Slice do Hub (`public/assets/ui/hub_frames_9slice.png`)
- **Padrão:** `48×48` por moldura, grade **`4×2`** ou **`4×1`** (`192×48` px finais, 4 painéis base recortáveis via CSS `border-image`).
- **Mapeamento:** `0: Painel Principal (Madeira Escura & Latão)`, `1: Slot de Inventário Chanfrado`, `2: Card Pergaminho de Missão`, `3: Moldura de Tooltip Flutuante`.
- **Prompt (EN):**
  ```text
  2D cozy RPG pixel art UI 9-slice panel frames on a strict 4 columns by 1 row grid (4 isolated 48x48 square frames, generous spacing, no text, solid transparent background). Stardew Valley meets Graveyard Keeper aesthetic.
  Frame 1: ornate dark oak and aged brass outer window border with corner rivets, hollow dark-slate center.
  Frame 2: recessed beveled inventory slot frame in warm dark stone with subtle brass rim.
  Frame 3: aged dark-parchment quest card frame with stitched leather corners.
  Frame 4: compact tooltip box frame in deep plum-indigo with thin golden-brass border.
  Crisp 16-bit pixel art, clean orthogonal edges suitable for CSS 9-slice scaling, no anti-aliasing.
  ```

