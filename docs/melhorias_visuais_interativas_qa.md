# Relatório de QA Visual Sênior 2D — Melhorias Visuais e Interativas de Mundo

> **Projeto:** *O Despertar de São Tomé dos Números*  
> **Escopo desta análise:** Melhorias de **comportamento visual, coreografia de mundo, iluminação, clima, cinestesia (*game feel*), feedback de combate e polimento de interface**, construídas **em código** sobre os sprites já existentes e os que estão planejados.  
> **Filtro aplicado:** Nenhum item abaixo repete pedidos de geração de spritesheets já listados em [prompts_spritesheets_faltantes.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets_faltantes.md) ou em [prompts_spritesheets_movimento_v2.md](file:///home/spira/wizardSurvival/docs/prompts_spritesheets_movimento_v2.md).

---

## Resumo Executivo

Os Lotes 1–12 e o novo guia v2 resolvem a base estética dos sprites (personagem, NPCs em 4 direções, fauna, bancadas animadas e tilesets sem costura). Porém, em jogos 2D *top-down* estilo *Stardew Valley / Sea of Stars*, **o que torna o mundo verdadeiramente vivo não é apenas o sprite parado ou caminhando em ciclo, mas sim a coreografia entre entidades, o ambiente reativo e a resposta visual imediata a cada ação do jogador**.

Hoje, vários elementos do jogo funcionam de forma "mecânica" ou "estática no lugar" (ex.: Mini-Dragões e Unicórnios presos em órbitas senoidais de ~25px, `DayNightSystem` usando um retângulo plano uniforme que escurece até postes acesos, chuva sem gotas caindo, combate sem *hitstop*/telegrafia no chão e `DaySummaryScene` apenas com texto puro). Abaixo estão **24 pontos concretos de melhoria**, diagnosticados diretamente nos arquivos do cliente.

---

## Categoria 1 — Coreografias & Rotinas Vivas de Criaturas e Companheiros

### 1. Mini-Dragão indo até a Forja (`bancada_fundicao`) para soprar fogo
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L2675-L2712)):** Os Mini-Dragões ficam confinados a uma pequena órbita senoidal (`Math.sin(nextPhase) * 24`) ao redor do ponto inicial `(42 + i * 2, 8)`, alternando entre andar e voar no mesmo quadrado, sem interagir com o cenário.
- **Melhoria visual & interativa:** Criar uma máquina de estados simples para cada Mini-Dragão na Fazenda: se existir uma `bancada_fundicao` colocada no mapa, periodicamente (ou quando o jogador se aproxima da forja / inicia fundição), o dragão caminha/voa até a frente da forja, pousa, sopra uma pequena rajada de faíscas e brasas (`tween` + partículas laranja/âmbar) na boca da fornalha, fazendo a forja brilhar mais forte por alguns segundos antes de retornar satisfeito ao cercado.
- **Impacto:** Alto (narrativa ambiental imediata — conecta o pet à mecânica de ferraria).

### 2. Unicórnio pastando perto das flores/rio e reagindo com partículas estelares
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L2715-L2763)):** Os Unicórnios também repetem uma órbita fixa de `26px` em `(41 + i * 2, 6)`.
- **Melhoria visual & interativa:** Fazer os Unicórnios passearem entre os canteiros de flores/safras maduras e a margem do rio (para beber água com animação de inclinar a cabeça). Quando estiverem com `Leite de Unicórnio` pronto para coleta, emitir poeira estelar cintilante contínua ao redor do chifre; ao correrem pelo pasto, deixar pequenas faíscas pastel sob os cascos.
- **Impacto:** Alto.

### 3. Remo e Lupin vivos e reativos no Porão (além de flutuar no eixo Y)
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L350-L355)):** `remoSprite` e `lupinSprite` apenas oscilam verticalmente (`Math.sin`/`Math.cos`) em coordenadas fixas no Porão.
- **Melhoria visual & interativa:** Fazer Remo caminhar pelo Porão, sentar perto do portal dimensional observando-o, e ocasionalmente sumir em uma pequena nuvem roxa para reaparecer em outro ponto. Fazer Lupin abrir suas páginas e girar suavemente sobre o Altar sempre que Tomé se aproximar, projetando runas flutuantes ciano/douradas ao redor.
- **Impacto:** Médio-Alto.

### 4. Interação de Carinho (*Petting*) com feedback visual nos Pets
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L701-L725)):** A interação `[E]` com unicórnios foca apenas na coleta de leite; dragões não possuem resposta afetiva visual dedicada ao toque.
- **Melhoria visual & interativa:** Permitir acariciar Mini-Dragões e Unicórnios uma vez por dia com `[E]`, disparando um pequeno balão de coração (`♥`) subindo em fade-out, um *squash-and-stretch* elástico no sprite do pet e 4–5 partículas de afeto.
- **Impacto:** Médio (reforça o pilar *cozy*).

---

## Categoria 2 — Rotinas Reais e Vida Social dos NPCs

### 5. Deslocamento real dos NPCs entre pontos de interesse da Vila
- **Diagnóstico atual ([NPC.ts](file:///home/spira/wizardSurvival/client/src/entities/NPC.ts#L48-L57)):** Cada NPC patrulha apenas 4 *waypoints* minúsculos (`spanX = TILE_SIZE * 1.35`, `spanY = TILE_SIZE * 0.65`) ao redor da âncora de horário.
- **Melhoria visual & interativa:** Dar rotas temáticas curtas no mapa da Cidade conforme o período do dia: ex. Bento indo da Bigorna até a placa da Ferraria para conferir o movimento; Seu Damião caminhando até a ponta do rio; Lyra andando da praça até o mirante/borda do mapa olhando para o céu; e à noite, parte dos NPCs convergindo para a frente do Pub Pedra.
- **Impacto:** Alto.

### 6. Micro-emotes e balões contextuais nos NPCs
- **Diagnóstico atual ([NPC.ts](file:///home/spira/wizardSurvival/client/src/entities/NPC.ts#L70-L102)):** NPCs só exibem o nome e os marcadores `!` / `?` de missão.
- **Melhoria visual & interativa:** Quando dois NPCs se aproximam na praça ou durante suas rotinas de trabalho, exibir pequenos balões de emote temporários acima da cabeça (ex.: notas musicais `♪` perto da Ísis, gota de suor/faísca perto do Bento martelando, `★` perto da Lyra, `💤` tarde da noite), tornando a vila viva mesmo sem abrir diálogos.
- **Impacto:** Médio.

### 7. Destaque visual no alvo interagível mais próximo
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L3020-L3040)):** O jogador recebe um texto flutuante genérico de prompt, mas o NPC, porta ou bancada alvo não recebe nenhum realce próprio.
- **Melhoria visual & interativa:** Adicionar um marcador sutil (seta pequena flutuando sobre o alvo ou leve brilho/pulso de contorno) no objeto/NPC que será ativado ao apertar `[E]`, evitando ambiguidade quando há dois objetos próximos.
- **Impacto:** Médio.

---

## Categoria 3 — Iluminação Dinâmica, Sombras e Água

### 8. Iluminação Dinâmica com Recortes de Luz (*Light Mask*) à Noite e no Porão
- **Diagnóstico atual ([DayNightSystem.ts](file:///home/spira/wizardSurvival/client/src/systems/DayNightSystem.ts#L4-L47)):** A noite e o Porão usam um retângulo `this.overlay` de tela inteira (`setFillStyle`). Isso escurece **igualmente** postes acesos, lanternas de parede, lareiras, forjas e cristais, deixando a noite chapada.
- **Melhoria visual & interativa:** Substituir ou combinar o retângulo plano com uma `RenderTexture` de iluminação onde fontes de luz (postes `STREET_LAMP_LIT`, lanternas `wall_lantern_anim`, lareiras `fireplace_burn_anim`, forjas `bancada_fundicao`, Incubadora e o próprio jogador segurando cajado) **recortam a escuridão** (`erase`) e projetam halos aditivos (`BlendModes.ADD`) quentes (âmbar) ou arcanos (ciano/violeta) com leve tremulação orgânica.
- **Impacto:** Altíssimo (transforma completamente a atmosfera noturna e dos interiores).

### 9. Sombras de Contato (*Drop Shadows*) em Todas as Entidades
- **Diagnóstico atual ([Player.ts](file:///home/spira/wizardSurvival/client/src/entities/Player.ts#L51)):** O jogador só tem uma elipse colorida quando equipa uma armadura (`armorAura`). Sem armadura, Tomé, todos os NPCs, todos os pets e todos os inimigos flutuam sem sombra no chão.
- **Melhoria visual & interativa:** Criar uma sombra oval escura suave (`0x14121d`, alpha `~0.32`) ancorada nos pés do Jogador, NPCs, Pets e Inimigos. Quando o Mini-Dragão levantar voo ou o Espectro flutuar, manter a sombra no chão encolhendo levemente e ficando mais translúcida para dar leitura imediata de altura 2.5D.
- **Impacto:** Alto.

### 10. Transição Visual de Amanhecer e "Golden Hour" (Pôr-do-Sol)
- **Diagnóstico atual ([DayNightSystem.ts](file:///home/spira/wizardSurvival/client/src/systems/DayNightSystem.ts#L29-L37)):** A iluminação começa apenas às `16:30` indo para marrom (`0x5c2d1e`) e às `19:00` para azul-escuro. Manhã e meio-dia são totalmente neutros.
- **Melhoria visual & interativa:** Adicionar uma faixa de amanhecer suave (`06:00–07:30`, tom pêssego/dourado claro que dissipa gradualmente) e partículas ocasionais de pólen/poeira dourada atravessando a câmera na *Golden Hour* (`16:30–18:30`).
- **Impacto:** Médio.

### 11. Ondulações Contínuas na Água e Reflexo de Brilho no Rio
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L2643-L2661)):** A água tem saltos ocasionais de peixe/splash, mas carece de resposta contínua quando o jogador caminha na beira ou pesca.
- **Melhoria visual & interativa:** Ao lançar a vara de pesca, manter anéis concêntricos suaves expandindo ao redor da boia até a fisgada; adicionar brilhos especulares sutis (`shimmer` ciano/branco) deslizando na superfície do rio durante o dia e reflexos de lua/estrelas na água à noite.
- **Impacto:** Médio.

---

## Categoria 4 — Clima Dinâmico e Natureza Reativa

### 12. Chuva em Camadas (Linhas Diagonais + Nuvens de Sombra)
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L2552-L2571)):** Durante `'Chuva'`, apenas respingos (`rain_splash_anim`) aparecem no chão; não há chuva caindo pelo ar!
- **Melhoria visual & interativa:** Adicionar um sistema de partículas/linhas finas translúcidas caindo em diagonal (`~75°`) presas ao *viewport* da câmera, acompanhado de leve vinheta fria para que o jogador sinta imediatamente que está chovendo.
- **Impacto:** Alto.

### 13. Camada de Neblina Mística Deslizante (`'Neblina'` e Porão)
- **Diagnóstico atual ([DayNightSystem.ts](file:///home/spira/wizardSurvival/client/src/systems/DayNightSystem.ts#L41-L43)):** O clima `'Neblina'` apenas soma `0.08` de opacidade ao retângulo escuro da tela.
- **Melhoria visual & interativa:** Renderizar 2 camadas suaves de bancos de névoa translúcidos deslizando horizontalmente em velocidades diferentes (efeito paralaxe leve) sobre a Fazenda, Cidade e Porão, reforçando a identidade mística de São Tomé dos Números.
- **Impacto:** Alto.

### 14. Relâmpagos Ocasionais em Clima Chuvoso/Noturno
- **Diagnóstico atual:** Não há eventos visuais climáticos súbitos no céu/tela.
- **Melhoria visual & interativa:** Durante chuvas intensas (ou perto da subida para a Serra de Varginha), disparar flashes raros e sutis (fade rápido de branco-azulado com `alpha <= 0.25` por 120ms) que iluminam o mapa brevemente antes de voltar à penumbra.
- **Impacto:** Médio.

### 15. Safras, Flores e Árvores Reativas ao Vento e ao Toque
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L1990-L2020)):** As plantas crescem e ficam estáticas até serem colhidas.
- **Melhoria visual & interativa:** Aplicar uma oscilação muito sutil de vento (`skew`/rotação mínima ou `scaleX`) em safras crescidas e flores; quando o jogador atravessa um canteiro maduro ou colhe/rega, fazer a planta dar um leve tremor e soltar 2–3 pétalas ou gotículas.
- **Impacto:** Médio.

---

## Categoria 5 — Feedback Cinestésico (*Game Feel*) na Fazenda e Movimento

### 16. Poeira nos Pés ao Caminhar e Rastro Fantasma (*Afterimage*) no Dash
- **Diagnóstico atual ([Player.ts](file:///home/spira/wizardSurvival/client/src/entities/Player.ts#L33-L42)):** O Dash (`Shift`) apenas altera `dashSpeed` para `370`, sem rastro visual.
- **Melhoria visual & interativa:** Ao usar o Dash, gerar 3–4 silhuetas fantasmas (`afterimage`) em tom ciano arcano que desaparecem em `220ms`, dando sensação real de velocidade mágica; ao caminhar em terra/grama, soltar micro-partículas de poeira atrás dos pés a cada poucos passos.
- **Impacto:** Alto.

### 17. `tile_cursor` Inteligente (Cor e Pulso por Contexto)
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L296)):** `this.tileCursor` é exibido com aparência fixa (`alpha 0.85`).
- **Melhoria visual & interativa:** Tingir dinamicamente o cursor conforme o contexto: ciano/verde pulsante se a ferramenta/semente equipada pode agir naquele tile; âmbar se houver uma bancada/baú interagível; vermelho/cinza discreto (com menor opacidade) se o tile não aceita a ação atual.
- **Impacto:** Médio-Alto (melhora clareza e usabilidade sem adicionar texto).

### 18. *Pop* Parabólico de Itens Colhidos e *Squash & Stretch* ao Minerar/Cortar
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L1108-L1160)):** Minerar rochas ou colher safras atualiza o inventário e mostra apenas um *toast* na interface.
- **Melhoria visual & interativa:** Ao quebrar uma pedra, cortar árvore ou colher uma safra, fazer o sprite vibrar/achatar antes de sumir e spawnar o mini-ícone do item saltando em arco parabólico no mundo até ser "puxado" para Tomé (efeito magnético curto estilo *Stardew Valley*).
- **Impacto:** Alto.

### 19. Progresso Visual Vivo nas Bancadas (Incubadora, Forja e Aspersor)
- **Diagnóstico atual ([WorldScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/WorldScene.ts#L2585-L2639)):** As bancadas emitem bolhas/brasas simples a cada 1 segundo.
- **Melhoria visual & interativa:**
  - **Incubadora:** Mostrar um pequeno ícone/silhueta do ovo pulsando lá dentro e aumentar a frequência das bolhas quando faltar 1 dia para chocar, com explosão de brilho e cascas no nascimento.
  - **Aspersor Bávaro:** Além das 4 gotas isoladas, exibir um jato circular breve ao amanhecer molhando os 8 tiles ao redor em sequência.
- **Impacto:** Médio.

---

## Categoria 6 — Combate, Dungeons e Chefes mais Impactantes

### 20. *Hitstop*, Flash Branco de Dano e Partículas Direcionais em Inimigos
- **Diagnóstico atual ([DungeonScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/DungeonScene.ts#L1577-L1605)):** Ao acertar um inimigo, há apenas `camera.shake` leve e número flutuante.
- **Melhoria visual & interativa:** Adicionar um flash branco sólido (`setTintFill(0xffffff)` por ~75ms) no inimigo atingido, um *hitstop* sutil (~35ms de pausa de impacto em golpes fortes/críticos) e um leque de 4–6 faíscas voando na direção oposta ao ataque do jogador.
- **Impacto:** Altíssimo (melhora drasticamente a sensação de combate).

### 21. Telegrafia de Ataque no Chão (*Danger Zones*) para Chefes e Armadilhas
- **Diagnóstico atual ([DungeonScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/DungeonScene.ts#L1530-L1575)):** Ataques de área e projéteis dos chefes não projetam marcação prévia no piso da arena.
- **Melhoria visual & interativa:** Antes de golpes sísmicos (Guardião da Terra), ondas/gêiseres (Guardião das Águas), raios (Guardião dos Céus) e fendas (Omena), desenhar um círculo ou faixa vermelha/magenta pulsante preenchendo no chão durante `600ms` antes do impacto, dando leitura justa e visual cinematográfico.
- **Impacto:** Alto.

### 22. Entrada de Chefe e Onda de Choque nas Mudanças de Fase
- **Diagnóstico atual ([DungeonScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/DungeonScene.ts#L1630-L1655)):** A mudança de fase do Omena dispara um *toast* e spawna uma Sentinela, sem efeito visual marcante na arena.
- **Melhoria visual & interativa:** Ao entrar na sala de um Guardião/Omena, fazer um breve zoom/foco de 0.8s no chefe com faixa de título estilizada; nas transições de fase (2/3 e 3/3), disparar um anel de onda de choque expansivo no chão, flash violeta e partículas orbitais ao redor do chefe.
- **Impacto:** Alto.

### 23. Halo de Luz nas Tochas de Dungeon e Fragmentos de Destrutíveis
- **Diagnóstico atual ([DungeonScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/DungeonScene.ts#L603-L609)):** As tochas (`dungeon_torch_anim`) são colocadas nas paredes, mas não iluminam o piso/paredes ao redor.
- **Melhoria visual & interativa:** Acoplar um halo radial quente trêmulo em cada tocha e um brilho frio nos pilares de cristal (`crystal_pillars`), criando contraste dramático entre áreas iluminadas e cantos sombrios das salas; quando vasos/caixas quebram, deixar 2–3 cacos sutis no chão que somem após alguns segundos.
- **Impacto:** Médio-Alto.

---

## Categoria 7 — Polimento Visual de UI, Transições e Resumo do Dia

### 24. Remodelação Visual da Tela de Resumo do Dia (`DaySummaryScene`) + Mini-Bússola no HUD
- **Diagnóstico atual ([DaySummaryScene.ts](file:///home/spira/wizardSurvival/client/src/scenes/DaySummaryScene.ts#L23-L102) e [HUD.ts](file:///home/spira/wizardSurvival/client/src/ui/HUD.ts)):** A tela de fim de dia é um retângulo sólido `0x100e1a` com texto centralizado simples, e o HUD não mostra orientação espacial entre Fazenda, Cidade, Rio e Portais.
- **Melhoria visual & interativa:**
  - **`DaySummaryScene`:** Transformar em um almanaque noturno ilustrado com estrelas cintilando no fundo, ícone da fase da lua do dia seguinte, moldura estilo pergaminho/madeira escura, ícones dos itens vendidos e contador animado de Ouro subindo (`0 -> +X G`).
  - **`HUD`:** Adicionar uma mini-bússola ou indicador discreto de direção dos pontos principais (Vila, Casa, Porão, Portal) para ajudar a navegação sem poluir a tela.
- **Impacto:** Alto (fecha o *loop* diário com acabamento profissional).

---

## Ordem Sugerida de Implementação (Roadmap Técnico)

1. **Sprint 1 — Base de Profundidade & Atmosfera (Maior impacto visual imediato):**
   - Sombras de contato em todas as entidades (#9)
   - Iluminação dinâmica com recortes de luz à noite/porão/tochas (#8 e #23)
   - Chuva diagonal + névoa mística deslizante (#12 e #13)
2. **Sprint 2 — Mundo Vivo & Coreografias (Estilo "Dragão na Forja"):**
   - Mini-Dragão indo até a forja soprar fogo (#1)
   - Unicórnio passeando até flores/rio + carinho com corações (#2 e #4)
   - Remo e Lupin interativos no Porão (#3) + rotas reais de NPCs (#5 e #6)
3. **Sprint 3 — Cinestesia (*Game Feel*) & Combate:**
   - Poeira nos pés + *afterimage* no Dash (#16) + `tile_cursor` inteligente (#17) + *pop* parabólico de itens (#18)
   - *Hitstop*, flash branco de dano, faíscas direcionais e *danger zones* no chão das dungeons (#20, #21 e #22)
4. **Sprint 4 — Polimento Final:**
   - Vegetação reativa e reflexos na água (#11 e #15)
   - `DaySummaryScene` ilustrada + mini-bússola no HUD (#24) + destaque de alvo (#7)
