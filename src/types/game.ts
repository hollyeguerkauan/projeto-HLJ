export type WorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type BiomeType =
  | 'forest'
  | 'desert'
  | 'ice'
  | 'volcano'
  | 'abandoned_city'
  | 'dark_world'
  | 'celestial'
  | 'final_dimension';

export interface BossConfig {
  name: string;
  title: string;
  lore: string;
  strategyTip: string;
  maxHp: number;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  size: number;
  attackPatterns: ('charge' | 'projectiles' | 'shockwave' | 'summon' | 'rain' | 'laser')[];
}

export interface WorldConfig {
  id: WorldId;
  name: string;
  subtitle: string;
  biome: BiomeType;
  startLevel: number;
  endLevel: number;
  description: string;
  mechanicHighlight: string;
  skyTop: string;
  skyBottom: string;
  accentColor: string;
  platformMain: string;
  platformTop: string;
  platformBorder: string;
  weatherType: 'fireflies' | 'sand' | 'snow' | 'embers' | 'rain' | 'void_motes' | 'feathers' | 'cosmic';
  boss: BossConfig;
  enemyNames: [string, string, string];
}

export type LevelSpecialType = 'normal' | 'bonus' | 'secret_focus' | 'boss';

export interface LevelMeta {
  levelNumber: number; // 1 to 100
  worldId: WorldId;
  indexInWorld: number; // 1 to 12/13
  title: string;
  subtitle: string;
  featureTag: string;
  specialType: LevelSpecialType;
  recommendedPower: number;
  baseCoinReward: number;
  difficultyRating: number; // 1 to 10
}

export type PlatformKind =
  | 'solid'
  | 'moving'
  | 'bouncy'
  | 'ice'
  | 'quicksand'
  | 'crumbling'
  | 'conveyor'
  | 'phasing'
  | 'secret_wall'
  | 'gate';

export interface PlatformEntity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  // For moving platforms
  startX?: number;
  startY?: number;
  moveRangeX?: number;
  moveRangeY?: number;
  moveSpeed?: number;
  movePhase?: number;
  // For conveyor
  conveyorSpeed?: number;
  // For crumbling
  crumbleTimer?: number;
  respawnTimer?: number;
  isCrumbled?: boolean;
  // For phasing platforms (Dark World / Final Dimension)
  phaseOffset?: number;
  isVisiblePhase?: boolean;
  // For secret wall
  revealed?: boolean;
  // For gate linked to lever
  gateId?: string;
  isOpen?: boolean;
}

export type HazardKind = 'spikes' | 'lava' | 'saw' | 'geyser' | 'icicle' | 'laser';

export interface HazardEntity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: HazardKind;
  damage: number;
  startX?: number;
  startY?: number;
  moveRangeX?: number;
  moveRangeY?: number;
  speed?: number;
  timer?: number;
  active?: boolean;
}

export type EnemyArchetype = 'walker' | 'flyer' | 'jumper' | 'shooter' | 'heavy';

export interface EnemyEntity {
  id: string;
  name: string;
  archetype: EnemyArchetype;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  patrolMinX: number;
  patrolMaxX: number;
  baseY: number;
  facing: 1 | -1;
  stateTimer: number;
  attackCooldown: number;
  hitFlashTimer: number;
  slowTimer: number;
  coinValue: number;
  colorPrimary: string;
  colorSecondary: string;
  isMiniBoss?: boolean;
}

export interface BossEntity {
  name: string;
  title: string;
  strategyTip: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  facing: 1 | -1;
  state: 'idle' | 'telegraph' | 'attacking' | 'recover' | 'defeated';
  currentAttack: 'charge' | 'projectiles' | 'shockwave' | 'summon' | 'rain' | 'laser';
  stateTimer: number;
  attackIndex: number;
  hitFlashTimer: number;
  invulnTimer: number;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  arenaMinX: number;
  arenaMaxX: number;
  groundY: number;
}

export interface CoinEntity {
  id: string;
  x: number;
  y: number;
  baseY: number;
  value: number;
  collected: boolean;
  isGem?: boolean;
  magnetized?: boolean;
}

export interface ChestEntity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isOpen: boolean;
  isSecret: boolean;
  coinReward: number;
  hintText: string;
}

export interface InteractiveProp {
  id: string;
  kind: 'lever' | 'shrine_heal' | 'altar_double_jump' | 'signpost' | 'wind_zone' | 'portal_pair';
  x: number;
  y: number;
  w: number;
  h: number;
  activated: boolean;
  targetGateId?: string;
  targetX?: number;
  targetY?: number;
  text?: string;
}

export interface ProjectileEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  fromPlayer: boolean;
  color: string;
  life: number;
  piercing?: boolean;
  homing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  glow?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface LevelBlueprint {
  meta: LevelMeta;
  world: WorldConfig;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  portalX: number;
  portalY: number;
  platforms: PlatformEntity[];
  hazards: HazardEntity[];
  enemies: EnemyEntity[];
  coins: CoinEntity[];
  chests: ChestEntity[];
  props: InteractiveProp[];
  boss: BossEntity | null;
}

export type HeroSkinId = 'kael' | 'lyra' | 'auron' | 'nyx' | 'zephyr' | 'astra';

export interface HeroSkin {
  id: HeroSkinId;
  name: string;
  title: string;
  description: string;
  bonusText: string;
  cost: number;
  unlockedByDefault?: boolean;
  unlockWorldReq?: number;
  capeColor: string;
  armorColor: string;
  trimColor: string;
  bladeColor: string;
  hairColor: string;
  speedBonus: number;
  hpBonus: number;
  damageBonus: number;
  dashCooldownBonus: number;
  magnetBonus: number;
  slowOnHit?: boolean;
}

export type SpecialPowerId = 'solar_wave' | 'blade_storm' | 'celestial_shield' | 'star_rain';

export interface SpecialPower {
  id: SpecialPowerId;
  name: string;
  description: string;
  cooldown: number; // seconds
  cost: number;
  color: string;
  iconName: string;
}

export type UpgradeKey = 'maxHp' | 'attackDamage' | 'doubleJump' | 'dashMastery' | 'coinMagnet' | 'specialPowerMastery';

export interface UpgradeDefinition {
  key: UpgradeKey;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  valueLabel: (lvl: number) => string;
}

export interface LevelProgressRecord {
  completed: boolean;
  stars: number; // 0 to 3
  bestCoins: number;
  secretFound: boolean;
  bestTimeSeconds: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  icon: string;
  checkUnlocked: (save: GameSaveState) => boolean;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  statKey: 'enemiesDefeatedToday' | 'coinsCollectedToday' | 'levelsCompletedToday' | 'secretChestsToday';
}

export interface GameSaveState {
  coins: number;
  totalCoinsEarned: number;
  highestUnlockedLevel: number; // 1 to 100
  unlockAllSandboxMode: boolean; // Toggleable explorer mode to test any of the 100 levels anytime
  selectedHero: HeroSkinId;
  unlockedHeroes: HeroSkinId[];
  selectedPower: SpecialPowerId;
  unlockedPowers: SpecialPowerId[];
  upgrades: Record<UpgradeKey, number>;
  consumables: {
    healthPotion: number;
    phoenixAmulet: number;
    powerElixir: number;
  };
  levelRecords: Record<number, LevelProgressRecord>;
  claimedAchievements: string[];
  claimedDailyChallenges: string[];
  stats: {
    totalEnemiesDefeated: number;
    totalBossesDefeated: number;
    totalSecretChestsFound: number;
    totalJumps: number;
    totalDashes: number;
    totalDeaths: number;
    enemiesDefeatedToday: number;
    coinsCollectedToday: number;
    levelsCompletedToday: number;
    secretChestsToday: number;
  };
  settings: {
    bgmVolume: number;
    sfxVolume: number;
    muted: boolean;
    showTouchControls: 'auto' | 'always' | 'off';
    screenShake: boolean;
    particlesQuality: 'high' | 'normal';
  };
}
