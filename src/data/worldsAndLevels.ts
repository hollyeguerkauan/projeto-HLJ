import {
  Achievement,
  BossEntity,
  ChestEntity,
  CoinEntity,
  DailyChallenge,
  EnemyArchetype,
  EnemyEntity,
  GameSaveState,
  HazardEntity,
  HeroSkin,
  InteractiveProp,
  LevelBlueprint,
  LevelMeta,
  LevelSpecialType,
  PlatformEntity,
  SpecialPower,
  UpgradeDefinition,
  WorldConfig,
  WorldId,
} from '../types/game';

export const WORLDS: WorldConfig[] = [
  {
    id: 1,
    name: 'Floresta Encantada',
    subtitle: 'O Despertar das Raízes Antigas',
    biome: 'forest',
    startLevel: 1,
    endLevel: 12,
    description:
      'Um santuário ancestral de árvores colossais e ruínas musgosas, onde vagalumes dourados iluminam passagens secretas e cogumelos mágicos impulsionam os viajantes.',
    mechanicHighlight: 'Cogumelos de Super-Impulso & Paredes de Cipós Ilusórias',
    skyTop: '#071A17',
    skyBottom: '#133B2E',
    accentColor: '#10B981',
    platformMain: '#2A211B',
    platformTop: '#16A34A',
    platformBorder: '#4ADE80',
    weatherType: 'fireflies',
    enemyNames: ['Javali Espinhoso', 'Espírito Folha', 'Golem de Musgo'],
    boss: {
      name: 'Silvanus Raiz-Antiga',
      title: 'O Colosso da Floresta',
      lore: 'Corrompido pela névoa dimensional, o guardião milenar das árvores desperta com fúria sísmica.',
      strategyTip: 'Salte sobre as ondas de choque terrestres e ataque quando ele cravar os braços no solo!',
      maxHp: 320,
      primaryColor: '#15803D',
      secondaryColor: '#78350F',
      eyeColor: '#FACC15',
      size: 96,
      attackPatterns: ['charge', 'shockwave', 'projectiles'],
    },
  },
  {
    id: 2,
    name: 'Deserto das Sombras',
    subtitle: 'Império Sob o Sol Eclipsado',
    biome: 'desert',
    startLevel: 13,
    endLevel: 25,
    description:
      'Dunas douradas banhadas por um eclipse eterno. Pirâmides esquecidas escondem areia movediça, blocos que desmoronam e ventos ascendentes.',
    mechanicHighlight: 'Areia Movediça, Blocos Quebradiços & Correntes de Vento',
    skyTop: '#1E1028',
    skyBottom: '#4A2521',
    accentColor: '#F59E0B',
    platformMain: '#78350F',
    platformTop: '#D97706',
    platformBorder: '#FBBF24',
    weatherType: 'sand',
    enemyNames: ['Escaravelho Sombrio', 'Vulto das Dunas', 'Múmia Lanceira'],
    boss: {
      name: 'Khepri de Obsidiana',
      title: 'O Faraó Escorpião',
      lore: 'Forjado em vidro vulcânico e ouro amaldiçoado, reina sobre as tempestades de areia do templo solar.',
      strategyTip: 'Use o Dash para atravessar sua investida de ferrão e cuidado com a chuva de dardos solares!',
      maxHp: 520,
      primaryColor: '#B45309',
      secondaryColor: '#311042',
      eyeColor: '#F43F5E',
      size: 102,
      attackPatterns: ['charge', 'projectiles', 'rain'],
    },
  },
  {
    id: 3,
    name: 'Reino Congelado',
    subtitle: 'Cidadela da Aurora Eterna',
    biome: 'ice',
    startLevel: 26,
    endLevel: 38,
    description:
      'Picos glaciais sob a dança da aurora boreal. O gelo escorregadio exige controle preciso enquanto estalactites afiadas guardam cavernas de cristal.',
    mechanicHighlight: 'Pisos de Gelo Escorregadio & Estalactites Glaciais',
    skyTop: '#08182B',
    skyBottom: '#163D5C',
    accentColor: '#38BDF8',
    platformMain: '#1E3A5F',
    platformTop: '#38BDF8',
    platformBorder: '#BAE6FD',
    weatherType: 'snow',
    enemyNames: ['Lobo Glacial', 'Espectro da Geada', 'Sentinela Nórdica'],
    boss: {
      name: 'Freya Gelo-Eterno',
      title: 'A Valquíria da Tempestade',
      lore: 'Sua lança de cristal congelou o próprio tempo no trono do norte.',
      strategyTip: 'Mantenha-se em movimento no piso congelado para desviar das lanças cadentes do céu!',
      maxHp: 740,
      primaryColor: '#0284C7',
      secondaryColor: '#E0F2FE',
      eyeColor: '#22D3EE',
      size: 98,
      attackPatterns: ['rain', 'projectiles', 'shockwave'],
    },
  },
  {
    id: 4,
    name: 'Vulcão de Fogo',
    subtitle: 'A Forja do Núcleo Ardente',
    biome: 'volcano',
    startLevel: 39,
    endLevel: 50,
    description:
      'Rios de magma fervente e pontes basálticas sobre o abismo. Gêiseres vulcânicos entram em erupção em intervalos rítmicos.',
    mechanicHighlight: 'Gêiseres de Lava Temporizados & Brasas Explosivas',
    skyTop: '#1A0808',
    skyBottom: '#45120B',
    accentColor: '#EF4444',
    platformMain: '#27171A',
    platformTop: '#DC2626',
    platformBorder: '#FB923C',
    weatherType: 'embers',
    enemyNames: ['Salamandra Ígnea', 'Crânio Flamejante', 'Cavaleiro de Cinzas'],
    boss: {
      name: 'Ignis Magma-Rei',
      title: 'O Titã da Cratera',
      lore: 'Nascido no coração incandescente do planeta, cada golpe seu faz o vulcão inteiro tremer.',
      strategyTip: 'Use as plataformas elevadas laterais quando o chão se encher de ondas de magma!',
      maxHp: 980,
      primaryColor: '#B91C1C',
      secondaryColor: '#F97316',
      eyeColor: '#FEF08A',
      size: 112,
      attackPatterns: ['shockwave', 'rain', 'charge'],
    },
  },
  {
    id: 5,
    name: 'Cidade Abandonada',
    subtitle: 'Metrópole das Engrenagens Silenciosas',
    biome: 'abandoned_city',
    startLevel: 51,
    endLevel: 63,
    description:
      'Uma grandiosa civilização mecânica tomada pela ferrugem e energia arcana. Esteiras rolantes, serras em trilhos e portões com alavancas testam sua agilidade.',
    mechanicHighlight: 'Esteiras Mecânicas, Serras Giratórias & Alavancas de Portão',
    skyTop: '#111827',
    skyBottom: '#293548',
    accentColor: '#FBBF24',
    platformMain: '#334155',
    platformTop: '#64748B',
    platformBorder: '#F59E0B',
    weatherType: 'rain',
    enemyNames: ['Autômato de Lâmina', 'Drone Sentinela', 'Golem Hidráulico'],
    boss: {
      name: 'Cronos-IX',
      title: 'O Regente Mecânico',
      lore: 'A inteligência central da cidade que ainda executa seu protocolo final de defesa.',
      strategyTip: 'Salte sobre os feixes de laser varredores e golpeie seu núcleo dourado durante o resfriamento!',
      maxHp: 1240,
      primaryColor: '#475569',
      secondaryColor: '#D97706',
      eyeColor: '#38BDF8',
      size: 106,
      attackPatterns: ['laser', 'projectiles', 'charge'],
    },
  },
  {
    id: 6,
    name: 'Mundo das Trevas',
    subtitle: 'Bastião do Eclipse Abissal',
    biome: 'dark_world',
    startLevel: 64,
    endLevel: 75,
    description:
      'Castelos góticos suspensos no vazio sob uma lua carmesim. Plataformas espectrais alternam entre o plano físico e etéreo.',
    mechanicHighlight: 'Plataformas Fantasmas Faseadas & Portais Sombrios',
    skyTop: '#090514',
    skyBottom: '#240E38',
    accentColor: '#A855F7',
    platformMain: '#1F1235',
    platformTop: '#7E22CE',
    platformBorder: '#C084FC',
    weatherType: 'void_motes',
    enemyNames: ['Ceifador Sombrio', 'Gárgula de Sangue', 'Cavaleiro do Vazio'],
    boss: {
      name: 'Malakor',
      title: 'O Senhor do Abismo',
      lore: 'Tecelão das sombras que aprisionou a luz de sete reinos em sua coroa negra.',
      strategyTip: 'Observe o brilho de seus olhos antes do teletransporte e contra-ataque com seu Poder Especial!',
      maxHp: 1520,
      primaryColor: '#581C87',
      secondaryColor: '#111827',
      eyeColor: '#EC4899',
      size: 104,
      attackPatterns: ['projectiles', 'shockwave', 'summon', 'laser'],
    },
  },
  {
    id: 7,
    name: 'Reino Celestial',
    subtitle: 'Santuário Acima das Nuvens Douradas',
    biome: 'celestial',
    startLevel: 76,
    endLevel: 88,
    description:
      'Templos flutuantes de mármore branco e ouro puro. Correntes de vento divino e anéis de luz elevam o herói a alturas impressionantes.',
    mechanicHighlight: 'Correntes de Vento Divino & Anéis de Impulso Solar',
    skyTop: '#172554',
    skyBottom: '#3B82F6',
    accentColor: '#FDE047',
    platformMain: '#E2E8F0',
    platformTop: '#F59E0B',
    platformBorder: '#FEF08A',
    weatherType: 'feathers',
    enemyNames: ['Guardião Alado', 'Orbe de Luz Pura', 'Paladino Astral'],
    boss: {
      name: 'Solarius',
      title: 'O Arcanjo do Zênite',
      lore: 'Julga todos os mortais que ousam cruzar os portões dourados rumo à Dimensão Final.',
      strategyTip: 'Use os anéis de impulso celeste para alcançar Solarius no ar e escapar das colunas solares!',
      maxHp: 1850,
      primaryColor: '#F59E0B',
      secondaryColor: '#F8FAFC',
      eyeColor: '#38BDF8',
      size: 108,
      attackPatterns: ['rain', 'laser', 'projectiles', 'shockwave'],
    },
  },
  {
    id: 8,
    name: 'Dimensão Final',
    subtitle: 'O Nexo do Espaço-Tempo',
    biome: 'final_dimension',
    startLevel: 89,
    endLevel: 100,
    description:
      'Onde todos os mundos colidem. Fragmentos cristalinos flutuam entre nebulosas cósmicas, reunindo todos os desafios para o confronto definitivo na Fase 100!',
    mechanicHighlight: 'Fenda Dimensional, Portais Cósmicos & Desafio Supremo',
    skyTop: '#05040A',
    skyBottom: '#1E1B4B',
    accentColor: '#EC4899',
    platformMain: '#1E1B4B',
    platformTop: '#EC4899',
    platformBorder: '#38BDF8',
    weatherType: 'cosmic',
    enemyNames: ['Anomalia Astral', 'Draconiano Cósmico', 'Sentinela do Caos'],
    boss: {
      name: 'Aetherion',
      title: 'O Devorador de Mundos',
      lore: 'A entidade primordial que fragmentou os Mundos Perdidos. Derrotá-lo restaurará o equilíbrio de todo o universo!',
      strategyTip: 'Domine o Pulo Duplo, o Dash Sombrio e seu Poder Especial para superar todas as suas 4 formas de ataque!',
      maxHp: 2400,
      primaryColor: '#BE185D',
      secondaryColor: '#4F46E5',
      eyeColor: '#FDE047',
      size: 120,
      attackPatterns: ['charge', 'projectiles', 'shockwave', 'rain', 'laser'],
    },
  },
];

export function getWorldForLevel(levelNumber: number): WorldConfig {
  const found = WORLDS.find((w) => levelNumber >= w.startLevel && levelNumber <= w.endLevel);
  return found || WORLDS[0];
}

// Specific level titles per world so every single one of the 100 levels feels hand-crafted and memorable
const LEVEL_TITLES_BY_WORLD: Record<WorldId, string[]> = {
  1: [
    'Clareira do Despertar',
    'Altar das Asas de Vento',
    'Trilha dos Cogumelos Dourados',
    'Pontes do Riacho Esmeralda',
    'Segredo das Raízes Ocas',
    'Santuário Bônus das Fadas',
    'Vale dos Javalis Selvagens',
    'Copa das Árvores Gigantes',
    'Ruínas do Musgo Brilhante',
    'Cânion dos Vagalumes',
    'Portão da Floresta Profunda',
    'Trono de Silvanus [CHEFÃO]',
  ],
  2: [
    'Entrada das Dunas Sombrias',
    'Oásis da Miragem Dourada',
    'Passagem da Areia Movediça',
    'Tumba dos Escaravelhos',
    'Corredor dos Ventos Quentes',
    'Câmara Secreta do Obelisco',
    'Tesouro Bônus do Faraó',
    'Pontes de Arenito Antigo',
    'Desfiladeiro do Eclipse',
    'Pirâmide dos Espinhos',
    'Salão dos Guardiões Reais',
    'Escadaria de Obsidiana',
    'Arena de Khepri [CHEFÃO]',
  ],
  3: [
    ' Fronteira da Geada',
    'Trilha do Gelo Espelhado',
    'Caverna das Estalactites',
    'Ponte da Aurora Boreal',
    'Vale dos Lobos Brancos',
    'Santuário Bônus de Cristal',
    'Abismo de Zero Absoluto',
    'Torres do Vento Norte',
    'Labirinto de Safira Glacial',
    'Passagem da Avalanche',
    'Muralha dos Sentinelas',
    'Pináculo da Tempestade',
    'Cidadela de Freya [CHEFÃO]',
  ],
  4: [
    'Encosta de Cinzas',
    'Rio de Magma Incandescente',
    'Gêiseres da Caldeira',
    'Ponte da Forja Antiga',
    'Caverna das Salamandras',
    'Câmara Bônus de Rubi',
    'Salto Sobre o Fogo',
    'Cânion das Brasas Vivas',
    'Fornalha dos Titãs',
    'Passarela de Basalto',
    'Portão do Núcleo Ardente',
    'Cratera de Ignis [CHEFÃO]',
  ],
  5: [
    'Portões de Ferro e Vapor',
    'Avenida das Esteiras',
    'Fábrica de Autômatos',
    'Torre do Relógio Quebrado',
    'Corredor das Serras',
    'Cofre Bônus da Guilda',
    'Ponte do Guindaste Arcano',
    'Subterrâneo Hidráulico',
    'Distrito dos Alquimistas',
    'Elevadores da Cidadela',
    'Sala das Alavancas Reais',
    'Passarela de Alta Tensão',
    'Núcleo de Cronos-IX [CHEFÃO]',
  ],
  6: [
    'Ponte do Véu Sombrio',
    'Jardim da Lua Carmesim',
    'Plataformas Espectrais',
    'Cripta dos Ceifadores',
    'Portais do Vazio',
    'Relicário Bônus Noturno',
    'Torres da Catedral Negra',
    'Salão das Ilusões',
    'Abismo dos Sussurros',
    'Corredor das Gárgulas',
    'Escadaria do Eclipse',
    'Trono de Malakor [CHEFÃO]',
  ],
  7: [
    'Escadaria das Nuvens',
    'Brisa do Zênite',
    'Jardins de Mármore e Ouro',
    'Anéis de Luz Solar',
    'Ponte do Arco-Íris Astral',
    'Paraíso Bônus Celestial',
    'Templo das Valquírias',
    'Correntes do Empíreo',
    'Santuário da Harmonia',
    'Colunas do Sol Nascente',
    'Portão dos Serafins',
    'Átrio da Eternidade',
    'Altar de Solarius [CHEFÃO]',
  ],
  8: [
    'Fenda do Espaço-Tempo',
    'Fragmentos da Memória',
    'Gravidade de Nebulosa',
    'Nexo dos Portais Cósmicos',
    'Corredor de Antimatéria',
    'Tesouro Bônus Astral',
    'Ecos dos Sete Mundos',
    'Tempestade de Estrelas',
    'Horizonte de Eventos',
    'Caminho do Infinito',
    'Último Bastião da Luz',
    'Confronto Final: Aetherion [CHEFÃO]',
  ],
};

const MECHANIC_TAGS_CYCLE = [
  'Exploração & Moedas Guia',
  'Salto Duplo & Segredo Alto',
  'Cogumelos de Super-Impulso',
  'Plataformas Móveis Sincronizadas',
  'Parede Ilusória Secreta',
  'FASE BÔNUS: Chuva de Tesouros!',
  'Desafio de Combate & Esquiva',
  'Ventos Ascendentes & Travessia',
  'Alavancas & Portões Ocultos',
  'Rota Dupla: Caminho Superior Raro',
  'Guardião de Elite & Armadilhas',
  'Desafio Pré-Chefão',
];

export const ALL_LEVELS_META: LevelMeta[] = (() => {
  const list: LevelMeta[] = [];
  for (let lvl = 1; lvl <= 100; lvl++) {
    const world = getWorldForLevel(lvl);
    const indexInWorld = lvl - world.startLevel + 1;
    const isBoss = lvl === world.endLevel;
    const isBonus = !isBoss && indexInWorld === 6;
    const isSecretFocus = !isBoss && !isBonus && (indexInWorld === 5 || indexInWorld === 9);

    const titles = LEVEL_TITLES_BY_WORLD[world.id];
    const title = titles[indexInWorld - 1] || `${world.name} - Zona ${indexInWorld}`;

    let specialType: LevelSpecialType = 'normal';
    if (isBoss) specialType = 'boss';
    else if (isBonus) specialType = 'bonus';
    else if (isSecretFocus) specialType = 'secret_focus';

    let featureTag = MECHANIC_TAGS_CYCLE[(indexInWorld - 1) % MECHANIC_TAGS_CYCLE.length];
    if (lvl === 1) featureTag = 'Tutorial Interativo: Correr, Pular e Atacar';
    else if (lvl === 2) featureTag = 'Desbloqueie o Pulo Duplo no Altar Místico!';
    else if (isBoss) featureTag = `CHEFÃO DO MUNDO ${world.id}: ${world.boss.name}`;
    else if (isBonus) featureTag = 'FASE BÔNUS: Baús Extras e Gemas Raras!';

    list.push({
      levelNumber: lvl,
      worldId: world.id,
      indexInWorld,
      title,
      subtitle: world.name,
      featureTag,
      specialType,
      recommendedPower: Math.floor(1 + (lvl - 1) * 0.45),
      baseCoinReward: Math.round(45 + lvl * 12 + (isBoss ? 180 : isBonus ? 120 : 0)),
      difficultyRating: Math.min(10, Math.max(1, Math.ceil(lvl / 10))),
    });
  }
  return list;
})();

// Deterministic seeded pseudo-random generator so each level 1..100 is consistent every run
function createSeededRandom(seed: number) {
  let s = seed * 16807 + 1337;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildLevelBlueprint(levelNumber: number): LevelBlueprint {
  const meta = ALL_LEVELS_META[levelNumber - 1] || ALL_LEVELS_META[0];
  const world = getWorldForLevel(levelNumber);
  const rand = createSeededRandom(levelNumber * 97 + world.id * 31);

  const groundY = 580;
  const platforms: PlatformEntity[] = [];
  const hazards: HazardEntity[] = [];
  const enemies: EnemyEntity[] = [];
  const coins: CoinEntity[] = [];
  const chests: ChestEntity[] = [];
  const props: InteractiveProp[] = [];
  let boss: BossEntity | null = null;

  // Helper to add coin arcs
  const addCoinArc = (centerX: number, topY: number, count: number, spreadX: number, arcHeight: number, isGem = false) => {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const x = centerX - spreadX / 2 + t * spreadX;
      const parabola = 4 * t * (1 - t);
      const y = topY + (1 - parabola) * arcHeight;
      coins.push({
        id: `coin_${levelNumber}_${coins.length}`,
        x,
        y,
        baseY: y,
        value: isGem ? 25 : 5 + Math.floor(world.id * 1.5),
        collected: false,
        isGem,
      });
    }
  };

  // BOSS ARENA BUILDER (Levels 12, 25, 38, 50, 63, 75, 88, 100)
  if (meta.specialType === 'boss') {
    const arenaWidth = 1750;
    // Main solid floor
    platforms.push({
      id: 'boss_floor',
      x: 0,
      y: groundY,
      w: arenaWidth,
      h: 160,
      kind: world.biome === 'ice' ? 'ice' : 'solid',
    });

    // Left and right tactical elevated platforms + bouncy escape pads
    platforms.push(
      { id: 'boss_plat_l1', x: 240, y: 445, w: 210, h: 24, kind: 'solid' },
      { id: 'boss_plat_r1', x: 1260, y: 445, w: 210, h: 24, kind: 'solid' },
      { id: 'boss_plat_mid', x: 710, y: 340, w: 280, h: 24, kind: 'moving', startX: 710, startY: 340, moveRangeX: 160, moveRangeY: 0, moveSpeed: 1.5, movePhase: 0 },
      { id: 'boss_bounce_l', x: 110, y: groundY - 26, w: 76, h: 26, kind: 'bouncy' },
      { id: 'boss_bounce_r', x: 1540, y: groundY - 26, w: 76, h: 26, kind: 'bouncy' },
      // High secret rafters platform with Secret Chest!
      { id: 'boss_secret_plat', x: 750, y: 190, w: 200, h: 22, kind: 'solid' }
    );

    chests.push({
      id: `secret_chest_${levelNumber}`,
      x: 826,
      y: 142,
      w: 48,
      h: 48,
      isOpen: false,
      isSecret: true,
      coinReward: 120 + world.id * 45,
      hintText: 'Baú Real da Arena!',
    });

    // Healing shrine on left side of arena
    props.push({
      id: 'boss_heal_shrine',
      kind: 'shrine_heal',
      x: 320,
      y: 385,
      w: 44,
      h: 60,
      activated: false,
      text: 'Santuário de Cura (Pressione E ou Ataque)',
    });

    addCoinArc(345, 380, 5, 140, 25, false);
    addCoinArc(1365, 380, 5, 140, 25, false);
    addCoinArc(850, 270, 5, 180, 30, true);

    boss = {
      name: world.boss.name,
      title: world.boss.title,
      strategyTip: world.boss.strategyTip,
      x: 1180,
      y: groundY - world.boss.size,
      w: world.boss.size,
      h: world.boss.size,
      vx: 0,
      vy: 0,
      hp: world.boss.maxHp,
      maxHp: world.boss.maxHp,
      phase: 1,
      facing: -1,
      state: 'idle',
      currentAttack: world.boss.attackPatterns[0],
      stateTimer: 1.5,
      attackIndex: 0,
      hitFlashTimer: 0,
      invulnTimer: 0,
      primaryColor: world.boss.primaryColor,
      secondaryColor: world.boss.secondaryColor,
      eyeColor: world.boss.eyeColor,
      arenaMinX: 90,
      arenaMaxX: arenaWidth - 130,
      groundY,
    };

    return {
      meta,
      world,
      width: arenaWidth,
      height: 760,
      spawnX: 150,
      spawnY: groundY - 90,
      portalX: 1590, // Unlocked when boss is defeated
      portalY: groundY - 110,
      platforms,
      hazards,
      enemies,
      coins,
      chests,
      props,
      boss,
    };
  }

  // STANDARD, SECRET-FOCUS, AND BONUS LEVELS (Levels 1..100 except Bosses)
  const segmentsCount = meta.specialType === 'bonus' ? 8 : 9 + Math.min(5, Math.floor(levelNumber / 20));

  // Starting safe zone platform
  platforms.push({
    id: 'start_plat',
    x: 0,
    y: groundY,
    w: 520,
    h: 180,
    kind: 'solid',
  });

  // Interactive tutorial signposts for early levels
  if (levelNumber === 1) {
    props.push(
      {
        id: 'sign_1',
        kind: 'signpost',
        x: 220,
        y: groundY - 64,
        w: 48,
        h: 64,
        activated: true,
        text: 'Use A/D ou Setas para Correr • ESPAÇO para Pular • J ou Z para Atacar!',
      },
      {
        id: 'sign_2',
        kind: 'signpost',
        x: 920,
        y: groundY - 64,
        w: 48,
        h: 64,
        activated: true,
        text: 'Dica: Use K ou SHIFT para dar um Dash Sombrio e atravessar perigos!',
      }
    );
  } else if (levelNumber === 2) {
    props.push({
      id: 'altar_dj',
      kind: 'altar_double_jump',
      x: 330,
      y: groundY - 76,
      w: 56,
      h: 76,
      activated: false,
      text: 'Altar Ancestral: Toque ou pressione E para despertar o PULO DUPLO!',
    });
  }

  addCoinArc(320, groundY - 65, 4, 130, 20, false);

  let cursorX = 520;
  let cursorY = groundY;
  const secretSegmentIndex = Math.max(2, Math.min(segmentsCount - 2, Math.floor(rand() * (segmentsCount - 3)) + 2));

  for (let seg = 1; seg <= segmentsCount; seg++) {
    const gap = 85 + Math.floor(rand() * 65); // Always safely jumpable (85..150px)
    cursorX += gap;

    // Determine elevation change (clamped safely between 320 and 600)
    const deltaY = Math.floor((rand() - 0.48) * 140);
    cursorY = Math.max(330, Math.min(600, cursorY + deltaY));
    const platW = 280 + Math.floor(rand() * 240);

    // Choose platform kind based on biome and segment
    let platKind: PlatformEntity['kind'] = 'solid';
    const roll = rand();

    if (world.biome === 'ice' && roll < 0.55) {
      platKind = 'ice';
    } else if (world.biome === 'desert' && roll < 0.28) {
      platKind = 'quicksand';
    } else if (world.biome === 'desert' && roll >= 0.28 && roll < 0.48) {
      platKind = 'crumbling';
    } else if (world.biome === 'abandoned_city' && roll < 0.45) {
      platKind = 'conveyor';
    } else if ((world.biome === 'dark_world' || world.biome === 'final_dimension') && roll < 0.35 && seg % 2 === 0) {
      platKind = 'phasing';
    } else if (roll > 0.78 && platW < 360) {
      platKind = 'moving';
    }

    // Add pit hazard below gap or below moving platforms for excitement
    if (gap > 95) {
      const hazardKind: HazardEntity['kind'] =
        world.biome === 'volcano' ? 'lava' : world.biome === 'abandoned_city' ? 'saw' : 'spikes';
      hazards.push({
        id: `gap_haz_${seg}`,
        x: cursorX - gap + 10,
        y: 690,
        w: gap + 40,
        h: 40,
        kind: hazardKind,
        damage: 18 + world.id * 3,
      });
    }

    const mainPlat: PlatformEntity = {
      id: `plat_${seg}`,
      x: cursorX,
      y: cursorY,
      w: platW,
      h: platKind === 'moving' || platKind === 'crumbling' || platKind === 'phasing' ? 28 : 220,
      kind: platKind,
      startX: cursorX,
      startY: cursorY,
      moveRangeX: platKind === 'moving' ? 85 : 0,
      moveRangeY: platKind === 'moving' && seg % 2 === 1 ? 55 : 0,
      moveSpeed: 1.4 + (world.id * 0.1),
      movePhase: seg * 0.9,
      conveyorSpeed: platKind === 'conveyor' ? (seg % 2 === 0 ? 115 : -115) : 0,
      phaseOffset: seg * 1.3,
    };
    platforms.push(mainPlat);

    // Add Coins on or above this segment
    const isBonusLevel = meta.specialType === 'bonus';
    addCoinArc(
      cursorX + platW / 2,
      cursorY - 82,
      isBonusLevel ? 7 : 5,
      Math.min(platW - 40, 200),
      36,
      isBonusLevel && seg % 2 === 0
    );

    // Add Biome-specific features on this platform
    if (seg % 3 === 0 || world.biome === 'forest' || world.biome === 'celestial') {
      if (rand() < 0.55) {
        // Bouncy Mushroom / Jump Pad + High Reward Platform!
        const bounceX = cursorX + 36;
        platforms.push({
          id: `bounce_${seg}`,
          x: bounceX,
          y: cursorY - 24,
          w: 68,
          h: 24,
          kind: 'bouncy',
        });

        const skyPlatY = Math.max(175, cursorY - 195);
        platforms.push({
          id: `sky_plat_${seg}`,
          x: cursorX + 90,
          y: skyPlatY,
          w: 190,
          h: 22,
          kind: 'solid',
        });
        addCoinArc(cursorX + 185, skyPlatY - 58, 4, 120, 24, true);
      }
    }

    // Add Wind Uplift Zone in Desert / Celestial / Final Dimension
    if ((world.biome === 'desert' || world.biome === 'celestial' || world.biome === 'final_dimension') && seg % 4 === 2) {
      props.push({
        id: `wind_${seg}`,
        kind: 'wind_zone',
        x: cursorX + platW - 95,
        y: cursorY - 220,
        w: 80,
        h: 220,
        activated: true,
      });
    }

    // Add Timed Lava Geyser or Sawblade or Spikes on wider platforms
    if (!isBonusLevel && platW >= 340 && seg > 1 && rand() < 0.65) {
      const hazX = cursorX + platW * 0.52;
      if (world.biome === 'volcano') {
        hazards.push({
          id: `geyser_${seg}`,
          x: hazX,
          y: cursorY - 130,
          w: 44,
          h: 130,
          kind: 'geyser',
          damage: 22 + world.id * 3,
          timer: seg * 0.8,
          active: true,
        });
      } else if (world.biome === 'abandoned_city' || world.biome === 'final_dimension') {
        hazards.push({
          id: `saw_${seg}`,
          x: hazX,
          y: cursorY - 28,
          w: 48,
          h: 48,
          kind: 'saw',
          damage: 20 + world.id * 3,
          startX: hazX,
          moveRangeX: 90,
          speed: 2.2,
        });
      } else if (world.biome === 'ice') {
        hazards.push({
          id: `icicle_${seg}`,
          x: hazX,
          y: cursorY - 26,
          w: 56,
          h: 26,
          kind: 'spikes',
          damage: 16 + world.id * 3,
        });
      } else if (levelNumber > 1) {
        hazards.push({
          id: `spikes_${seg}`,
          x: hazX,
          y: cursorY - 24,
          w: 58,
          h: 24,
          kind: 'spikes',
          damage: 14 + world.id * 3,
        });
      }
    }

    // Add Lever + Gate puzzle in some segments
    if (!isBonusLevel && seg === 5 && levelNumber >= 5 && platW >= 360) {
      const gateId = `gate_${levelNumber}_${seg}`;
      props.push({
        id: `lever_${seg}`,
        kind: 'lever',
        x: cursorX + 55,
        y: cursorY - 48,
        w: 40,
        h: 48,
        activated: false,
        targetGateId: gateId,
        text: 'Alavanca Arcana: Ative para abrir o Portão de Recompensas!',
      });
      // Elevated treasure cage that opens when lever is pulled
      platforms.push({
        id: `cage_floor_${seg}`,
        x: cursorX + 165,
        y: cursorY - 135,
        w: 150,
        h: 20,
        kind: 'solid',
      });
      platforms.push({
        id: gateId,
        x: cursorX + 165,
        y: cursorY - 205,
        w: 22,
        h: 70,
        kind: 'gate',
        gateId,
        isOpen: false,
      });
      addCoinArc(cursorX + 245, cursorY - 185, 4, 90, 15, true);
    }

    // SECRET AREA & SECRET CHEST GENERATION (1 guaranteed per level!)
    if (seg === secretSegmentIndex) {
      // Build an illusory wall + hidden secret grotto platform!
      const secretY = Math.max(170, cursorY - 155);
      // Bouncy pad to reach the secret alcove
      platforms.push({
        id: `secret_bounce_${levelNumber}`,
        x: cursorX + 24,
        y: cursorY - 24,
        w: 64,
        h: 24,
        kind: 'bouncy',
      });
      // Secret alcove platform
      platforms.push({
        id: `secret_alcove_${levelNumber}`,
        x: cursorX + 60,
        y: secretY,
        w: 240,
        h: 24,
        kind: 'solid',
      });
      // Shimmering illusory wall that conceals the chest until the player walks into it!
      platforms.push({
        id: `illusory_wall_${levelNumber}`,
        x: cursorX + 70,
        y: secretY - 96,
        w: 215,
        h: 96,
        kind: 'secret_wall',
        revealed: false,
      });
      chests.push({
        id: `secret_chest_${levelNumber}`,
        x: cursorX + 155,
        y: secretY - 48,
        w: 48,
        h: 48,
        isOpen: false,
        isSecret: true,
        coinReward: 75 + levelNumber * 8,
        hintText: 'Baú Secreto Encontrado!',
      });
      addCoinArc(cursorX + 175, secretY - 70, 5, 130, 20, true);
    }

    // Bonus chest in Bonus Stages
    if (isBonusLevel && seg % 3 === 1) {
      chests.push({
        id: `bonus_chest_${levelNumber}_${seg}`,
        x: cursorX + platW / 2 - 22,
        y: cursorY - 48,
        w: 48,
        h: 48,
        isOpen: false,
        isSecret: false,
        coinReward: 60 + world.id * 15,
        hintText: 'Baú de Bônus!',
      });
    }

    // Spawn Enemies on this platform (unless Bonus Level)
    if (!isBonusLevel && platW >= 260) {
      const archetypes: EnemyArchetype[] = ['walker', 'flyer', 'jumper', 'shooter', 'heavy'];
      const archIndex = (seg + world.id) % archetypes.length;
      const archetype: EnemyArchetype =
        levelNumber === 1 ? 'walker' : levelNumber <= 3 ? (seg % 2 === 0 ? 'walker' : 'flyer') : archetypes[archIndex];

      const enemyName = world.enemyNames[seg % world.enemyNames.length];
      const baseHp = Math.round(28 + levelNumber * 5.5 + (archetype === 'heavy' ? 35 : 0));
      const enemyW = archetype === 'heavy' ? 52 : 40;
      const enemyH = archetype === 'heavy' ? 54 : 42;
      const spawnEX = cursorX + platW * 0.62;
      const spawnEY = archetype === 'flyer' ? cursorY - 115 : cursorY - enemyH;

      enemies.push({
        id: `enemy_${levelNumber}_${seg}`,
        name: enemyName,
        archetype,
        x: spawnEX,
        y: spawnEY,
        w: enemyW,
        h: enemyH,
        vx: archetype === 'shooter' ? 0 : 75 + world.id * 8,
        vy: 0,
        hp: baseHp,
        maxHp: baseHp,
        damage: Math.round(12 + world.id * 3.5),
        patrolMinX: cursorX + 24,
        patrolMaxX: cursorX + platW - enemyW - 24,
        baseY: spawnEY,
        facing: -1,
        stateTimer: rand() * 2,
        attackCooldown: 1.5 + rand(),
        hitFlashTimer: 0,
        slowTimer: 0,
        coinValue: 12 + world.id * 4,
        colorPrimary: world.accentColor,
        colorSecondary: world.platformBorder,
        isMiniBoss: seg === segmentsCount - 1 && levelNumber % 4 === 0,
      });
    }

    cursorX += platW;
  }

  // Final Exit Portal Platform
  cursorX += 90;
  const exitY = 520;
  platforms.push({
    id: 'exit_plat',
    x: cursorX,
    y: exitY,
    w: 420,
    h: 240,
    kind: 'solid',
  });

  addCoinArc(cursorX + 180, exitY - 75, 5, 160, 28, true);

  return {
    meta,
    world,
    width: cursorX + 520,
    height: 760,
    spawnX: 140,
    spawnY: groundY - 90,
    portalX: cursorX + 260,
    portalY: exitY - 108,
    platforms,
    hazards,
    enemies,
    coins,
    chests,
    props,
    boss: null,
  };
}

export const HERO_SKINS: HeroSkin[] = [
  {
    id: 'kael',
    name: 'Kael',
    title: 'O Guardião Errante',
    description: 'Guerreiro corajoso portador da Lâmina Solar e da Capa Carmesim.',
    bonusText: 'Atributos Equilibrados • +10% Dano de Combo Final',
    cost: 0,
    unlockedByDefault: true,
    capeColor: '#E11D48',
    armorColor: '#1E293B',
    trimColor: '#F59E0B',
    bladeColor: '#38BDF8',
    hairColor: '#F8FAFC',
    speedBonus: 0,
    hpBonus: 0,
    damageBonus: 0.05,
    dashCooldownBonus: 0,
    magnetBonus: 0,
  },
  {
    id: 'lyra',
    name: 'Lyra',
    title: 'Caçadora da Floresta',
    description: 'Ágil exploradora silvestre que se move como o vento entre as árvores.',
    bonusText: '+15% Velocidade de Movimento • +10% Alcance de Moedas',
    cost: 1000,
    capeColor: '#10B981',
    armorColor: '#064E3B',
    trimColor: '#A7F3D0',
    bladeColor: '#4ADE80',
    hairColor: '#FDE047',
    speedBonus: 0.15,
    hpBonus: 0,
    damageBonus: 0.08,
    dashCooldownBonus: 0.1,
    magnetBonus: 40,
  },
  {
    id: 'auron',
    name: 'Auron',
    title: 'Paladino Dourado',
    description: 'Campeão blindado da Ordem Solar com vitalidade inabalável.',
    bonusText: '+35 Vida Máxima • +15% Dano da Lâmina',
    cost: 2500,
    capeColor: '#F59E0B',
    armorColor: '#78350F',
    trimColor: '#FEF08A',
    bladeColor: '#FACC15',
    hairColor: '#FDE68A',
    speedBonus: 0.04,
    hpBonus: 35,
    damageBonus: 0.15,
    dashCooldownBonus: 0,
    magnetBonus: 20,
  },
  {
    id: 'nyx',
    name: 'Nyx',
    title: 'Lâmina das Sombras',
    description: 'Assassina dimensional capaz de executar Dashes rápidos e golpes letais.',
    bonusText: '-30% Recarga de Dash • +22% Dano de Ataque',
    cost: 5000,
    capeColor: '#9333EA',
    armorColor: '#1E1B4B',
    trimColor: '#E879F9',
    bladeColor: '#C084FC',
    hairColor: '#E2E8F0',
    speedBonus: 0.12,
    hpBonus: 15,
    damageBonus: 0.22,
    dashCooldownBonus: 0.3,
    magnetBonus: 35,
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    title: 'Mestre da Geada',
    description: 'Sábio nórdico cuja lâmina cristalina desacelera os inimigos atingidos.',
    bonusText: 'Ataques Congelam/Desaceleram Inimigos • +25 Vida',
    cost: 7500,
    capeColor: '#0284C7',
    armorColor: '#0F172A',
    trimColor: '#7DD3FC',
    bladeColor: '#22D3EE',
    hairColor: '#BAE6FD',
    speedBonus: 0.1,
    hpBonus: 25,
    damageBonus: 0.25,
    dashCooldownBonus: 0.15,
    magnetBonus: 50,
    slowOnHit: true,
  },
  {
    id: 'astra',
    name: 'Astra',
    title: 'Soberana Cósmica',
    description: 'Avatar estelar da Dimensão Final com domínio absoluto sobre relíquias e poder.',
    bonusText: '+35% Dano Total • +50 Vida • Super Ímã Astral',
    cost: 10000,
    capeColor: '#EC4899',
    armorColor: '#311042',
    trimColor: '#FDE047',
    bladeColor: '#F472B6',
    hairColor: '#FDF2F8',
    speedBonus: 0.18,
    hpBonus: 50,
    damageBonus: 0.35,
    dashCooldownBonus: 0.25,
    magnetBonus: 110,
    slowOnHit: true,
  },
];

export const SPECIAL_POWERS: SpecialPower[] = [
  {
    id: 'solar_wave',
    name: 'Onda Arcana Solar',
    description: 'Dispara um crescente de energia luminosa que atravessa vários inimigos à distância.',
    cooldown: 5.0,
    cost: 0,
    color: '#38BDF8',
    iconName: 'Sparkles',
  },
  {
    id: 'blade_storm',
    name: 'Tempestade de Lâminas',
    description: 'Cria um vórtice de espadas etéreas ao redor do herói, causando dano massivo em área.',
    cooldown: 6.5,
    cost: 600,
    color: '#F59E0B',
    iconName: 'Swords',
  },
  {
    id: 'celestial_shield',
    name: 'Égide Celestial',
    description: 'Restaura 25 de Vida instantaneamente e concede um escudo invulnerável por 4 segundos.',
    cooldown: 9.0,
    cost: 1200,
    color: '#10B981',
    iconName: 'Shield',
  },
  {
    id: 'star_rain',
    name: 'Chuva de Meteoros Astrais',
    description: 'Invoca 7 estrelas cadentes que atingem todos os inimigos e chefões visíveis na tela!',
    cooldown: 8.0,
    cost: 2200,
    color: '#EC4899',
    iconName: 'Flame',
  },
];

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    key: 'maxHp',
    name: 'Vitalidade Ancestral',
    description: 'Aumenta a Vida Máxima do herói para resistir aos mundos mais perigosos.',
    maxLevel: 10,
    baseCost: 80,
    costMultiplier: 1.45,
    valueLabel: (lvl) => `${100 + lvl * 20} PV`,
  },
  {
    key: 'attackDamage',
    name: 'Lâmina Forjada em Estrelas',
    description: 'Aumenta o dano dos ataques de espada e do golpe crítico do combo.',
    maxLevel: 10,
    baseCost: 90,
    costMultiplier: 1.5,
    valueLabel: (lvl) => `${22 + lvl * 7} Dano`,
  },
  {
    key: 'doubleJump',
    name: 'Asas de Vento (Pulo Duplo)',
    description: 'Nível 1+: Permite Pulo Duplo no ar! Níveis superiores aumentam o impulso aéreo.',
    maxLevel: 5,
    baseCost: 100,
    costMultiplier: 1.6,
    valueLabel: (lvl) => (lvl === 0 ? 'Bloqueado (ou Altar Fase 2)' : `Nível ${lvl} (+${lvl * 6}% Impulso)`),
  },
  {
    key: 'dashMastery',
    name: 'Passo das Sombras (Dash)',
    description: 'Reduz o tempo de recarga do Dash e causa dano sombrio ao atravessar inimigos.',
    maxLevel: 5,
    baseCost: 120,
    costMultiplier: 1.55,
    valueLabel: (lvl) => `Nível ${lvl} (${(1.1 - lvl * 0.1).toFixed(1)}s recarga)`,
  },
  {
    key: 'coinMagnet',
    name: 'Amuleto da Fortuna',
    description: 'Atrai moedas automaticamente de longe e aumenta o bônus de ouro coletado.',
    maxLevel: 5,
    baseCost: 110,
    costMultiplier: 1.5,
    valueLabel: (lvl) => `Raio ${60 + lvl * 35}px (+${lvl * 8}% Ouro)`,
  },
  {
    key: 'specialPowerMastery',
    name: 'Maestria Arcana',
    description: 'Aumenta o dano dos Poderes Especiais e reduz seu tempo de recarga.',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 1.6,
    valueLabel: (lvl) => `+${lvl * 20}% Poder`,
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'O Início da Lenda',
    description: 'Complete a primeira fase na Floresta Encantada.',
    rewardCoins: 100,
    icon: 'Compass',
    checkUnlocked: (save) => Object.values(save.levelRecords).some((r) => r.completed),
  },
  {
    id: 'secret_hunter_1',
    title: 'Olhos de Águia',
    description: 'Encontre seu primeiro Baú Secreto escondido.',
    rewardCoins: 150,
    icon: 'Key',
    checkUnlocked: (save) => save.stats.totalSecretChestsFound >= 1,
  },
  {
    id: 'slayer_25',
    title: 'Caçador de Monstros',
    description: 'Derrote 25 inimigos ao longo da jornada.',
    rewardCoins: 200,
    icon: 'Sword',
    checkUnlocked: (save) => save.stats.totalEnemiesDefeated >= 25,
  },
  {
    id: 'boss_1',
    title: 'Libertador da Floresta',
    description: 'Derrote o primeiro Chefão (Fase 12) ou qualquer Chefão de Mundo.',
    rewardCoins: 350,
    icon: 'Crown',
    checkUnlocked: (save) => save.stats.totalBossesDefeated >= 1 || Boolean(save.levelRecords[12]?.completed),
  },
  {
    id: 'rich_1000',
    title: 'Tesoureiro Real',
    description: 'Acumule um total de 1.000 moedas ganhas.',
    rewardCoins: 250,
    icon: 'Coins',
    checkUnlocked: (save) => save.totalCoinsEarned >= 1000,
  },
  {
    id: 'secret_hunter_10',
    title: 'Mestre dos Segredos',
    description: 'Descubra 10 Baús Secretos em fases diferentes.',
    rewardCoins: 500,
    icon: 'Sparkles',
    checkUnlocked: (save) => save.stats.totalSecretChestsFound >= 10,
  },
  {
    id: 'hero_collector',
    title: 'Ordem dos Campeões',
    description: 'Desbloqueie pelo menos 3 Heróis/Skins diferentes.',
    rewardCoins: 400,
    icon: 'Users',
    checkUnlocked: (save) => save.unlockedHeroes.length >= 3,
  },
  {
    id: 'legend_100',
    title: 'Herói dos Mundos Perdidos',
    description: 'Vença a Fase 100 na Dimensão Final!',
    rewardCoins: 2000,
    icon: 'Trophy',
    checkUnlocked: (save) => Boolean(save.levelRecords[100]?.completed),
  },
];

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'daily_enemies',
    title: 'Patrulha Diária',
    description: 'Derrote 15 inimigos em qualquer mundo.',
    target: 15,
    rewardCoins: 180,
    statKey: 'enemiesDefeatedToday',
  },
  {
    id: 'daily_coins',
    title: 'Colheita Dourada',
    description: 'Colete 150 moedas durante as fases.',
    target: 150,
    rewardCoins: 200,
    statKey: 'coinsCollectedToday',
  },
  {
    id: 'daily_levels',
    title: 'Desbravador Incansável',
    description: 'Complete 3 fases com sucesso.',
    target: 3,
    rewardCoins: 240,
    statKey: 'levelsCompletedToday',
  },
  {
    id: 'daily_secrets',
    title: 'Caça às Relíquias',
    description: 'Abra 2 Baús Secretos escondidos.',
    target: 2,
    rewardCoins: 300,
    statKey: 'secretChestsToday',
  },
];

export const DEFAULT_SAVE_STATE: GameSaveState = {
  coins: 150,
  totalCoinsEarned: 150,
  highestUnlockedLevel: 1,
  unlockAllSandboxMode: false,
  selectedHero: 'kael',
  unlockedHeroes: ['kael'],
  selectedPower: 'solar_wave',
  unlockedPowers: ['solar_wave'],
  upgrades: {
    maxHp: 1,
    attackDamage: 1,
    doubleJump: 1, // Unlocked from start so player can immediately enjoy double jump + upgrade it further!
    dashMastery: 1,
    coinMagnet: 1,
    specialPowerMastery: 1,
  },
  consumables: {
    healthPotion: 2,
    phoenixAmulet: 1,
    powerElixir: 1,
  },
  levelRecords: {},
  claimedAchievements: [],
  claimedDailyChallenges: [],
  stats: {
    totalEnemiesDefeated: 0,
    totalBossesDefeated: 0,
    totalSecretChestsFound: 0,
    totalJumps: 0,
    totalDashes: 0,
    totalDeaths: 0,
    enemiesDefeatedToday: 0,
    coinsCollectedToday: 0,
    levelsCompletedToday: 0,
    secretChestsToday: 0,
  },
  settings: {
    bgmVolume: 0.35,
    sfxVolume: 0.65,
    muted: false,
    showTouchControls: 'auto',
    screenShake: true,
    particlesQuality: 'high',
  },
};
