# Guia de Arquitetura e Desenvolvimento — O Despertar de São Tomé dos Números (Referência: Argon Valley)

## 1. Visão Geral do Projeto
Este projeto (**O Despertar de São Tomé dos Números**) é um jogo 2D Top-Down estilo *Cozy Farming, Magic & Dungeon RPG* inspirado em **Stardew Valley**, construído sob a arquitetura web-nativa de referência **Argon Valley**, 100% em **Português do Brasil (PT-BR)**.
O jogador não é obrigado a seguir missões lineares: o jogo prioriza liberdade de ritmo, exploração relaxante, cultivo místico, coleta, criação de itens (*crafting*), pecuária mágica (ovos de mini-dragão e incubadora), combate mágico em tempo real em dungeons procedurais, relacionamento de amizade com NPCs e progressão orgânica da propriedade.

### Pilares de Gameplay
- **Liberdade de Ritmo (Cozy Loop):** Sem *game over* punitivo. O ciclo diário (`06:00` às `02:00`) estrutura as atividades sem pressa. Ao zerar o HP em dungeons, o jogador desmaia e acorda no dia seguinte na fazenda sem perder itens.
- **Interação Baseada em Grid (32×32 px):** O mundo é dividido em tiles **`32×32 px`**. Toda ação (arar, regar, plantar, colher, construir, usar ferramentas) atua sobre coordenadas discretas `(tileX, tileY)` à frente do jogador.
- **Recursos Vitais Independentes:** `HP` (combate e armadilhas), `Stamina` (ferramentas agrícolas e mineração) e `Mana` (feitiços de Lupin, sem interferir na Stamina).
- **Progressão Contínua:** Melhoria de ferramentas, desbloqueio de magias, receitas de *crafting*, pecuária mágica, atributos elementais em cajados/armas e armaduras, e metas de restauração dos portais.

---

## 2. Stack Tecnológica e Padrões Obrigatórios

- **Engine:** Phaser 3 (v3.80+) com WebGL/Canvas e física Arcade (sem gravidade, `gravity: { x: 0, y: 0 }`).
- **Linguagem:** TypeScript (`strict: true`). Proibido usar `any`; todas as entidades, itens e estados devem possuir interfaces explícitas.
- **Bundler e Testes:** Vite + **Vitest** (testes automatizados obrigatórios para sistemas puros e API).
- **Backend Próprio (Auth & Save):** API **Node.js (Fastify)** + **SQLite (`better-sqlite3`)** com autenticação obrigatória por e-mail/senha antes de iniciar o jogo e persistência versionada do progresso por conta.
- **Camada de UI (Padrão Argon Valley):**
  - **Mundo, câmera, iluminação, partículas e personagens:** Renderizados no Canvas do Phaser.
  - **Tela de Login/Registro, HUD e Menus (Hotbar, Inventário, Grimório/Missões, Baús, Lojas, Diálogos com Retrato, Relógio/Lua/Ouro/HP/Stamina/Mana):** Renderizados em **HTML5 + CSS sobreposto ao Canvas** (`#ui-layer` com `pointer-events: none` no container e `pointer-events: auto` nos elementos interativos).
- **Comunicação entre Sistemas:** Desacoplada via um `EventBus` tipado (`Phaser.Events.EventEmitter`), garantindo que a UI nunca dependa diretamente das classes internas das cenas do Phaser.

---

## 3. Estrutura de Pastas

```text
client/src/
├── main.ts                  # Inicialização do AuthGate, Phaser.Game e montagem da UI
├── config/
│   └── gameConfig.ts        # Constantes globais (TILE_SIZE = 32, ZOOM, DAY_LENGTH_MS)
├── core/
│   ├── EventBus.ts          # Barramento global de eventos (Phaser <-> UI)
│   ├── GameState.ts         # Estado global centralizado (ouro, HP, stamina, mana, inventário, flags)
│   └── SaveManager.ts       # Sincronização de save autenticado com a API Node.js + SQLite
├── systems/
│   ├── TimeSystem.ts        # Relógio in-game, estações (Primavera/Verão/Outono/Inverno), Ciclo Lunar (4 fases) e clima
│   ├── DayNightSystem.ts    # Overlay de iluminação dinâmica conforme horário/clima/fase lunar
│   ├── GridSystem.ts        # Gerenciamento de coordenadas 32x32 (world <-> tile) e estados do solo
│   ├── FarmingSystem.ts     # Plantio, rega, crescimento na virada do dia e colheita
│   ├── InventorySystem.ts   # Slots da mochila, hotbar, empilhamento (stacking) e equipamentos
│   ├── ManaSystem.ts        # Reserva de Mana, regeneração e conjuração de magias (Teleporte, ataque)
│   ├── CombatSystem.ts      # Combate real-time top-down, projéteis, esquiva/dash, dano e resistências elementais
│   ├── AnimalSystem.ts      # Ovos de Mini-Dragão no porão, Incubadora e Bancada de Fundição
│   ├── QuestSystem.ts       # Rastreamento de missões principais (Atos) e secundárias
│   ├── NPCSystem.ts         # Máquina de estados, rotinas por horário, amizade/afinidade e presentes
│   ├── CraftingSystem.ts    # Verificação de ingredientes e produção de itens/máquinas
│   ├── DungeonGenerator.ts  # Geração procedural de andares usando o Tileset Tiled
│   └── AudioSystem.ts       # BGM por cena/horário (incl. Pub da Ísis) e SFX
├── entities/
│   ├── Player.ts            # Movimentação 8 direções, dash, animação, hitbox nos pés e uso de ferramentas/cajados
│   ├── NPC.ts               # Entidade de aldeão com pathfinding e gatilho de interação
│   ├── Enemy.ts             # Inimigos de dungeon e Guardião da Terra
│   └── WorldObject.ts       # Árvores, nós de minério, pontos de pesca, incubadora, baús e bancadas
├── scenes/
│   ├── BootScene.ts         # Pré-carregamento de mapas Tiled (.json), spritesheets 32x32 e fallback procedural
│   ├── WorldScene.ts        # Cena principal jogável (Fazenda, Casa, Porão, Cidade, Y-Sort)
│   ├── DungeonScene.ts      # Andares procedurais de Machu Picchu + Arena do Guardião em Tiled
│   └── DaySummaryScene.ts   # Tela de resumo financeiro e salvamento automático ao dormir/desmaiar
├── data/                    # Camada Data-Driven (100% em PT-BR, separada da lógica)
│   ├── items.ts             # Ferramentas, sementes, safras, recursos, cajados/armas elementais e armaduras
│   ├── crops.ts             # Regras de crescimento, estágios de sprite, estações e fase lunar
│   ├── recipes.ts           # Receitas de crafting, incubadora e fundição
│   ├── quests.ts            # Definições de missões principais e secundárias
│   └── npcs.ts              # Perfis, rotinas horárias e árvores de diálogo
└── ui/                      # Componentes DOM/HTML/CSS conectados ao EventBus
    ├── AuthScreen.ts        # Tela obrigatória de Login / Criação de Conta por e-mail
    ├── HUD.ts               # Relógio, estação, fase da lua, ouro, HP, Stamina e Mana
    ├── HotbarUI.ts          # Barra inferior de 12 slots com atalhos numéricos
    ├── InventoryModal.ts    # Mochila, equipamentos elementais e crafting
    ├── QuestLogModal.ts     # Grimório de Lupin / Diário de missões e magias
    └── DialogueBox.ts       # Caixa de diálogo estilo VN com retrato e opções de resposta
server/                      # API Node.js (Fastify) + SQLite (Auth por e-mail + Saves)
shared/                      # Tipos TypeScript compartilhados entre client e server
tests/                       # Suíte automatizada Vitest
```

---

## 4. Especificação dos Sistemas Principais (Core Systems)

### A. Sistema de Tempo, Lua e Virada de Dia (`TimeSystem` + `DayNightSystem`)
- **Escala:** 10 minutos in-game a cada ~7 segundos reais (configurável). O dia começa às `06:00` e vai até `02:00` (desmaio por exaustão).
- **Calendário:** 4 Estações (`Primavera`, `Verão`, `Outono`, `Inverno`) de `28` dias cada + **Ciclo Lunar** de 4 fases (`Nova`, `Crescente`, `Cheia`, `Minguante`), além de previsão do tempo para o dia seguinte.
- **Processamento Noturno (`processEndOfDay()`):** As plantas **não** crescem em tempo real. Quando o jogador dorme (ou desmaia por exaustão / HP zerado):
  1. Itens depositados na *Caixa de Remessas* (Shipping Bin) são convertidos em ouro.
  2. Para cada tile plantado no `GridSystem`: se `isWatered === true`, incrementa `daysGrown` e atualiza o frame visual da planta; em seguida, reseta `isWatered = false` (exceto em dias de chuva).
  3. Avança dia, estação e fase lunar; restaura `HP`, `Stamina` e `Mana` do jogador e salva automaticamente no backend SQLite via `SaveManager`.

### B. Sistema de Grid e Agricultura (`GridSystem` + `FarmingSystem`)
O estado de cada célula modificável do mapa é armazenado em um `Map<string, TileState>` usando a chave `"${mapId}:${tileX},${tileY}"`:

```typescript
export interface TileState {
  tileX: number;
  tileY: number;
  isTilled: boolean;       // Terra arada com enxada
  isWatered: boolean;      // Terra regada hoje
  cropId: string | null;   // ID da semente plantada (referência em data/crops.ts)
  daysGrown: number;       // Dias acumulados de crescimento
  currentStage: number;    // Índice do frame na spritesheet da planta
  isReadyToHarvest: boolean;
  placedItemId?: string;   // Baú, aspersor, espantalho ou máquina
}
```

### C. Arquitetura Data-Driven (`src/data/`)
Nenhum item, planta ou NPC deve ter lógica *hardcoded* em `if/else`. Tudo deve ser registrado por ID:

```typescript
export type ElementType = 'terra' | 'agua' | 'ar' | 'fogo' | 'arcano';
export type ItemCategory =
  | 'tool'
  | 'weapon'
  | 'armor'
  | 'seed'
  | 'crop'
  | 'resource'
  | 'consumable'
  | 'placeable'
  | 'egg';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  iconFrame: number;
  sellPrice: number;
  buyPrice?: number;
  maxStack: number;
  energyRestore?: number;
  manaRestore?: number;
  hpRestore?: number;
  cropId?: string; // Se category === 'seed'
  attackPower?: number;
  elementalDamage?: Partial<Record<ElementType, number>>; // Cajados e armas
  elementalResistance?: Partial<Record<ElementType, number>>; // Armaduras
}
```

### D. Profundidade Visual (Y-Sorting) e Câmera
- **Pixel Art Crisp:** `pixelArt: true`, `roundPixels: true`, sem antialiasing.
- **Y-Sorting:** Todas as entidades dinâmicas (Jogador, NPCs, árvores, cercas, plantas altas) atualizam `sprite.setDepth(sprite.y)` no ciclo de `update()` para que o jogador passe naturalmente por trás ou pela frente dos objetos.
- **Hitbox Realista:** O corpo físico (`Arcade.Body`) do jogador e dos NPCs deve cobrir apenas a base/pés do personagem (ex: metade inferior do tile) para permitir que a cabeça sobreponha paredes e copas de árvores.

---

## 5. Estratégia de Assets, Mapas Tiled e Fallback Procedural
Para permitir desenvolvimento contínuo sem bloqueios por falta de arte final:
1. O `BootScene` carrega mapas **Tiled JSON** (`32×32 px`) desde o início para todas as áreas fixas (Fazenda, Casa, Porão, Cidade, Lojas e Arena do Guardião), enquanto as dungeons procedurais utilizam o mesmo Tileset Tiled via `DungeonGenerator`.
2. Caso um spritesheet ainda não exista na pasta `public/assets/`, o sistema gera **texturas placeholder programáticas `32×32`** via `Phaser.GameObjects.Graphics` (`generateTexture`) com cores distintas por estado.
3. Os prompts oficiais para geração dos spritesheets definitivos em IA estão documentados em `docs/prompts_spritesheets.md`.

---

## 6. Protocolo de Execução para os Agentes (Argon & 3.8 Flash)

### Divisão de Responsabilidades
- **Modo Arquiteto (Gemini 4 Argon):** Responsável por criar/refatorar `core/`, `systems/`, interfaces TypeScript, integração de Tilemaps, lógica de `SaveManager` e máquina de estados dos NPCs.
- **Modo Executor (Gemini 3.8 Flash):** Responsável por popular `src/data/` (novas sementes, itens, receitas, diálogos), construir e estilizar os componentes de `src/ui/` (HTML/CSS), ajustar valores de balanceamento e corrigir bugs isolados.

### Regras de Qualidade de Código
1. **Nunca misture DOM com lógica de física:** A UI apenas escuta eventos do `EventBus` (ex: `INVENTORY_UPDATED`, `TIME_TICK`, `OPEN_DIALOGUE`) e dispara ações (ex: `SELECT_HOTBAR_SLOT`, `CRAFT_ITEM`).
2. **Alvo de Interação Visual:** Sempre renderize um indicador sutil (cursor de seleção no grid) mostrando exatamente qual tile `(tileX, tileY)` o jogador vai atingir antes de clicar ou pressionar a tecla de ação.
3. **Código Incremental e Funcional:** Ao implementar uma nova feature, garanta que `npm run build` (checagem do TypeScript) passe sem erros e que o jogo permaneça jogável no navegador ao final de cada etapa.

---

## 7. Roadmap de Implementação (Ordem Recomendada)
1. **Fase 1 — Fundação & Movimento:** Setup Vite + Phaser 3 + TS, mapa base com colisões, movimentação do jogador em 8 direções, câmera com zoom e cursor de seleção de tile.
2. **Fase 2 — Loop de Fazenda:** `TimeSystem` + `DayNightSystem`, `GridSystem`, uso de Enxada, Regador, Sementes e Colheita, além da cama para avançar o dia.
3. **Fase 3 — Inventário, Economia e UI:** Hotbar funcional, modal de inventário, Caixa de Remessas (*Shipping Bin*), `DaySummaryScene` e loja básica de sementes.
4. **Fase 4 — Coleta, Crafting e Save:** Árvores e pedras destrutíveis (Machado/Picareta), sistema de `Stamina`, tela de *Crafting* (baús, aspersores) e persistência via `SaveManager`.
5. **Fase 5 — Vida Social (NPCs):** Entidades de NPCs com rotinas baseadas no horário, sistema de diálogos com retratos, presentes e pontos de amizade.