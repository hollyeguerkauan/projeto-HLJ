import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  Compass,
  Crown,
  Flame,
  Gamepad2,
  Heart,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Sword,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  GameSaveState,
  HeroSkinId,
  SpecialPowerId,
  UpgradeKey,
} from './types/game';
import {
  ACHIEVEMENTS,
  ALL_LEVELS_META,
  DAILY_CHALLENGES,
  DEFAULT_SAVE_STATE,
  getWorldForLevel,
  HERO_SKINS,
  SPECIAL_POWERS,
} from './data/worldsAndLevels';
import {
  GameCanvas,
  HudTelemetry,
  LevelCompletionSummary,
} from './components/GameCanvas';
import { WorldAndLevelModal } from './components/WorldAndLevelModal';
import { ShopAndInventoryModal } from './components/ShopAndInventoryModal';
import { RewardsAndChallengesModal } from './components/RewardsAndChallengesModal';
import { soundEngine } from './audio/soundEngine';

const SAVE_STORAGE_KEY = 'lenda_mundos_perdidos_save_v1';

function loadSaveState(): GameSaveState {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_STATE,
      ...parsed,
      upgrades: { ...DEFAULT_SAVE_STATE.upgrades, ...(parsed.upgrades || {}) },
      consumables: { ...DEFAULT_SAVE_STATE.consumables, ...(parsed.consumables || {}) },
      stats: { ...DEFAULT_SAVE_STATE.stats, ...(parsed.stats || {}) },
      settings: { ...DEFAULT_SAVE_STATE.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_SAVE_STATE;
  }
}

export function App() {
  const [saveState, setSaveState] = useState<GameSaveState>(loadSaveState);
  const [screenMode, setScreenMode] = useState<'title' | 'playing'>('title');
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const loaded = loadSaveState();
    return Math.min(100, Math.max(1, loaded.highestUnlockedLevel));
  });
  const [runKey, setRunKey] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Modals
  const [activeModal, setActiveModal] = useState<
    null | 'map' | 'shop' | 'heroes' | 'rewards' | 'settings'
  >(null);

  // Victory / Defeat overlays
  const [victoryData, setVictoryData] = useState<{
    summary: LevelCompletionSummary;
    starsEarned: number;
  } | null>(null);
  const [defeatCause, setDefeatCause] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);
  const showToast = useCallback((text: string, color = '#FBBF24') => {
    setToast({ text, color });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Consumable triggers passed to GameCanvas
  const [potionTrigger, setPotionTrigger] = useState(0);
  const [elixirTrigger, setElixirTrigger] = useState(0);

  // Touch detection for mobile controls
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 900
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Virtual Input state for touch buttons
  const virtualInputRef = useRef({
    left: false,
    right: false,
    jump: false,
    attack: false,
    dash: false,
    special: false,
    interact: false,
  });

  // Live HUD Telemetry
  const [hud, setHud] = useState<HudTelemetry>({
    hp: 120,
    maxHp: 120,
    coinsInLevel: 0,
    totalCoinsInLevel: 25,
    secretFoundInLevel: false,
    specialCooldownRatio: 0,
    dashCooldownRatio: 0,
    powerElixirActive: false,
    bossHp: null,
    bossMaxHp: null,
    bossName: null,
    bossTitle: null,
    bossPhase: 1,
    bossTip: null,
    activePromptText: null,
    comboCount: 0,
  });

  // Auto-save whenever saveState changes
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveState));
    } catch {
      // Ignore quota errors
    }
    soundEngine.setSettings(
      saveState.settings.bgmVolume,
      saveState.settings.sfxVolume,
      saveState.settings.muted
    );
  }, [saveState]);

  // Manage background music based on screen and current world
  useEffect(() => {
    if (saveState.settings.muted) {
      soundEngine.stopMusic();
      return;
    }
    if (screenMode === 'title') {
      soundEngine.startMusic('title');
    } else {
      const meta = ALL_LEVELS_META[currentLevel - 1] || ALL_LEVELS_META[0];
      const world = getWorldForLevel(currentLevel);
      if (meta.specialType === 'boss') {
        soundEngine.startMusic('boss');
      } else {
        soundEngine.startMusic(world.biome);
      }
    }
  }, [screenMode, currentLevel, saveState.settings.muted]);

  // Global keyboard shortcuts for Pause (ESC / P) and Quick Potion (H) / Elixir (G)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenMode !== 'playing') return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (activeModal) {
          setActiveModal(null);
        } else if (!victoryData && !defeatCause) {
          setIsPaused((prev) => !prev);
        }
      } else if (e.code === 'KeyH' && !isPaused && !victoryData && !defeatCause) {
        handleUseHealthPotion();
      } else if (e.code === 'KeyG' && !isPaused && !victoryData && !defeatCause) {
        handleUsePowerElixir();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const startLevel = (lvl: number) => {
    const clamped = Math.max(1, Math.min(100, lvl));
    setCurrentLevel(clamped);
    setVictoryData(null);
    setDefeatCause(null);
    setIsPaused(false);
    setActiveModal(null);
    setScreenMode('playing');
    setRunKey((k) => k + 1);
    const meta = ALL_LEVELS_META[clamped - 1];
    if (meta) {
      showToast(`Fase ${clamped}: ${meta.title} — ${meta.featureTag}`, '#38BDF8');
    }
  };

  const handleUseHealthPotion = () => {
    if (saveState.consumables.healthPotion <= 0) {
      showToast('Sem Poções de Vida! Compre mais na Forja.', '#F43F5E');
      return;
    }
    if (hud.hp >= hud.maxHp) {
      showToast('Sua Vida já está cheia!', '#10B981');
      return;
    }
    setSaveState((prev) => ({
      ...prev,
      consumables: {
        ...prev.consumables,
        healthPotion: Math.max(0, prev.consumables.healthPotion - 1),
      },
    }));
    setPotionTrigger((t) => t + 1);
  };

  const handleUsePowerElixir = () => {
    if (saveState.consumables.powerElixir <= 0) {
      showToast('Sem Elixir de Furor! Compre mais na Forja.', '#F43F5E');
      return;
    }
    setSaveState((prev) => ({
      ...prev,
      consumables: {
        ...prev.consumables,
        powerElixir: Math.max(0, prev.consumables.powerElixir - 1),
      },
    }));
    setElixirTrigger((t) => t + 1);
  };

  const handleLevelComplete = useCallback((summary: LevelCompletionSummary) => {
    // Calculate 1 to 3 stars
    let stars = 1; // 1 star for completing the level
    if (summary.coinsCollected >= summary.totalCoinsAvailable * 3) {
      stars++;
    }
    if (summary.secretFound || summary.hpRemainingRatio >= 0.6) {
      stars++;
    }
    stars = Math.min(3, Math.max(1, stars));

    setSaveState((prev) => {
      const prevRec = prev.levelRecords[summary.levelNumber];
      const newSecretFound = Boolean(prevRec?.secretFound || summary.secretFound);
      const isNewSecret = summary.secretFound && !prevRec?.secretFound;

      return {
        ...prev,
        coins: prev.coins + summary.coinsCollected,
        totalCoinsEarned: prev.totalCoinsEarned + summary.coinsCollected,
        highestUnlockedLevel: Math.min(
          100,
          Math.max(prev.highestUnlockedLevel, summary.levelNumber + 1)
        ),
        levelRecords: {
          ...prev.levelRecords,
          [summary.levelNumber]: {
            completed: true,
            stars: Math.max(prevRec?.stars || 0, stars),
            bestCoins: Math.max(prevRec?.bestCoins || 0, summary.coinsCollected),
            secretFound: newSecretFound,
            bestTimeSeconds: prevRec?.bestTimeSeconds
              ? Math.min(prevRec.bestTimeSeconds, summary.timeSeconds)
              : summary.timeSeconds,
          },
        },
        stats: {
          ...prev.stats,
          totalEnemiesDefeated: prev.stats.totalEnemiesDefeated + summary.enemiesDefeated,
          totalBossesDefeated:
            prev.stats.totalBossesDefeated + (summary.bossDefeated ? 1 : 0),
          totalSecretChestsFound:
            prev.stats.totalSecretChestsFound + (isNewSecret ? 1 : 0),
          enemiesDefeatedToday: prev.stats.enemiesDefeatedToday + summary.enemiesDefeated,
          coinsCollectedToday: prev.stats.coinsCollectedToday + summary.coinsCollected,
          levelsCompletedToday: prev.stats.levelsCompletedToday + 1,
          secretChestsToday:
            prev.stats.secretChestsToday + (summary.secretFound ? 1 : 0),
        },
      };
    });

    setVictoryData({ summary, starsEarned: stars });
  }, []);

  const handlePlayerDefeated = useCallback((cause: string) => {
    setSaveState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalDeaths: prev.stats.totalDeaths + 1,
      },
    }));
    setDefeatCause(cause);
  }, []);

  const handleUnlockDoubleJumpAltar = useCallback(() => {
    setSaveState((prev) => ({
      ...prev,
      upgrades: {
        ...prev.upgrades,
        doubleJump: Math.max(1, prev.upgrades.doubleJump),
      },
    }));
  }, []);

  const handlePhoenixReviveUsed = useCallback(() => {
    setSaveState((prev) => ({
      ...prev,
      consumables: {
        ...prev.consumables,
        phoenixAmulet: Math.max(0, prev.consumables.phoenixAmulet - 1),
      },
    }));
  }, []);

  // Shop handlers
  const handleBuyUpgrade = (key: UpgradeKey, cost: number) => {
    setSaveState((prev) => {
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [key]: (prev.upgrades[key] || 0) + 1,
        },
      };
    });
    showToast('Atributo evoluído com sucesso!', '#10B981');
  };

  const handleBuyConsumable = (
    type: 'healthPotion' | 'phoenixAmulet' | 'powerElixir',
    cost: number
  ) => {
    setSaveState((prev) => {
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        consumables: {
          ...prev.consumables,
          [type]: prev.consumables[type] + 1,
        },
      };
    });
    showToast('Item adicionado ao seu inventário!', '#10B981');
  };

  const handleUnlockOrSelectHero = (heroId: HeroSkinId, cost: number) => {
    setSaveState((prev) => {
      const alreadyUnlocked = prev.unlockedHeroes.includes(heroId);
      if (alreadyUnlocked) {
        return { ...prev, selectedHero: heroId };
      }
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        unlockedHeroes: [...prev.unlockedHeroes, heroId],
        selectedHero: heroId,
      };
    });
    showToast('Campeão selecionado!', '#FBBF24');
  };

  const handleUnlockOrSelectPower = (powerId: SpecialPowerId, cost: number) => {
    setSaveState((prev) => {
      const alreadyUnlocked = prev.unlockedPowers.includes(powerId);
      if (alreadyUnlocked) {
        return { ...prev, selectedPower: powerId };
      }
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        unlockedPowers: [...prev.unlockedPowers, powerId],
        selectedPower: powerId,
      };
    });
    showToast('Poder Especial equipado!', '#38BDF8');
  };

  // Count unclaimed rewards for notification badge
  const unclaimedCount =
    ACHIEVEMENTS.filter(
      (a) => a.checkUnlocked(saveState) && !saveState.claimedAchievements.includes(a.id)
    ).length +
    DAILY_CHALLENGES.filter(
      (d) =>
        (saveState.stats[d.statKey] || 0) >= d.target &&
        !saveState.claimedDailyChallenges.includes(d.id)
    ).length;

  const currentMeta = ALL_LEVELS_META[currentLevel - 1] || ALL_LEVELS_META[0];
  const currentWorld = getWorldForLevel(currentLevel);
  const currentHero =
    HERO_SKINS.find((h) => h.id === saveState.selectedHero) || HERO_SKINS[0];
  const currentPower =
    SPECIAL_POWERS.find((p) => p.id === saveState.selectedPower) || SPECIAL_POWERS[0];

  const showTouchControls =
    saveState.settings.showTouchControls === 'always' ||
    (saveState.settings.showTouchControls === 'auto' && isTouchDevice);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0914] select-none">
      {/* FULL-VIEWPORT 60FPS GAME CANVAS */}
      <GameCanvas
        key={`${currentLevel}_${runKey}_${screenMode}_${saveState.selectedHero}_${saveState.selectedPower}`}
        levelNumber={currentLevel}
        saveState={saveState}
        isPaused={
          isPaused ||
          Boolean(activeModal) ||
          Boolean(victoryData) ||
          Boolean(defeatCause)
        }
        isDemoMode={screenMode === 'title'}
        virtualInputRef={virtualInputRef}
        consumePotionTrigger={potionTrigger}
        consumeElixirTrigger={elixirTrigger}
        onTelemetryUpdate={setHud}
        onLevelComplete={handleLevelComplete}
        onPlayerDefeated={handlePlayerDefeated}
        onUnlockDoubleJumpAltar={handleUnlockDoubleJumpAltar}
        onPhoenixReviveUsed={handlePhoenixReviveUsed}
        onToastMessage={showToast}
      />

      {/* FLOATING TOAST BANNER */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div
            className="px-5 py-2 rounded-full bg-[#0B0914]/90 border shadow-[0_12px_32px_rgba(0,0,0,0.75)] text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2"
            style={{ borderColor: toast.color, color: toast.color }}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TITLE SCREEN OVERLAY (TELA INICIAL IMPRESSIONANTE)                 */}
      {/* ===================================================================== */}
      {screenMode === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-8 bg-gradient-to-b from-[#0B0914]/75 via-[#0B0914]/45 to-[#0B0914]/90 backdrop-blur-[2px]">
          {/* Top Bar: Total Gold, Quick Mute & Stats */}
          <div className="w-full max-w-6xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#161329]/85 border border-amber-500/35 shadow-lg">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="font-mono-num text-base sm:text-lg font-extrabold text-amber-300">
                {saveState.coins.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">Ouro Acumulado</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setSaveState((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, muted: !prev.settings.muted },
                  }));
                }}
                className="p-2.5 rounded-xl bg-[#161329]/85 hover:bg-slate-800 border border-white/15 text-amber-300 transition-all cursor-pointer"
                title={saveState.settings.muted ? 'Ativar Som' : 'Silenciar'}
              >
                {saveState.settings.muted ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                )}
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('settings');
                }}
                className="p-2.5 rounded-xl bg-[#161329]/85 hover:bg-slate-800 border border-white/15 text-slate-200 transition-all cursor-pointer"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Heroic Emblem & Game Title */}
          <div className="flex flex-col items-center text-center max-w-3xl my-auto px-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 animate-float">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>8 Mundos Épicos • 100 Fases Jogáveis • 8 Chefões</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 drop-shadow-[0_8px_28px_rgba(245,158,11,0.45)] leading-tight">
              A Lenda dos Mundos Perdidos
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed drop-shadow">
              Domine a Lâmina Solar, desperte o Pulo Duplo e o Dash Sombrio, descubra passagens secretas e restaure o equilíbrio através de 100 fases repletas de ação!
            </p>

            {/* Primary CTA: JOGAR AGORA */}
            <div className="mt-7 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  soundEngine.playVictory();
                  startLevel(currentLevel);
                }}
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(245,158,11,0.55)] hover:scale-105 transition-all cursor-pointer animate-pulse-glow"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>
                  {saveState.highestUnlockedLevel > 1
                    ? `Continuar (Fase ${currentLevel})`
                    : 'Jogar Agora (Fase 1)'}
                </span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('map');
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#161329]/90 hover:bg-slate-800 border border-amber-400/40 text-amber-200 font-display font-bold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Compass className="w-5 h-5 text-amber-400" />
                <span>Mapa de Mundos (100 Fases)</span>
              </button>
            </div>

            {/* Secondary Action Dock (Shop, Heroes, Daily Challenges & Achievements) */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('shop');
                }}
                className="px-4 py-3 rounded-xl bg-[#161329]/85 hover:bg-slate-800/90 border border-white/15 hover:border-amber-400/50 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-100 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Forja & Loja</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('heroes');
                }}
                className="px-4 py-3 rounded-xl bg-[#161329]/85 hover:bg-slate-800/90 border border-white/15 hover:border-amber-400/50 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-100 transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Heróis ({currentHero.name})</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('rewards');
                }}
                className="relative px-4 py-3 rounded-xl bg-[#161329]/85 hover:bg-slate-800/90 border border-white/15 hover:border-amber-400/50 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-100 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Desafios & Conquistas</span>
                {unclaimedCount > 0 && (
                  <span className=" -top-1.5 -right-1.5 absolute w-5 h-5 rounded-full bg-rose-500 text-white font-mono-num text-[11px] font-bold flex items-center justify-center animate-bounce">
                    {unclaimedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('settings');
                }}
                className="px-4 py-3 rounded-xl bg-[#161329]/85 hover:bg-slate-800/90 border border-white/15 hover:border-amber-400/50 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-100 transition-all cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span>Controles</span>
              </button>
            </div>
          </div>

          {/* Bottom Quick Controls Strip */}
          <div className="w-full max-w-5xl px-4 py-2.5 rounded-2xl bg-[#0B0914]/80 border border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-300">
            <span>
              <strong className="text-amber-300">Mover:</strong> A/D ou Setas
            </span>
            <span>
              <strong className="text-amber-300">Pular / Pulo Duplo:</strong> Espaço ou W
            </span>
            <span>
              <strong className="text-amber-300">Atacar (Combo):</strong> J ou Z
            </span>
            <span>
              <strong className="text-amber-300">Dash Sombrio:</strong> K ou Shift
            </span>
            <span>
              <strong className="text-amber-300">Poder Especial:</strong> L ou C
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. IN-GAME HUD OVERLAY (QUANDO JOGANDO)                               */}
      {/* ===================================================================== */}
      {screenMode === 'playing' && (
        <>
          {/* Top HUD Bar */}
          <div className="fixed top-0 left-0 right-0 z-20 p-3 sm:p-4 pointer-events-none flex flex-wrap items-start justify-between gap-2">
            {/* Top-Left: Hero Vitality, Cooldowns & Quick Potions */}
            <div className="pointer-events-auto flex flex-col gap-2 bg-[#161329]/85 backdrop-blur-md border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-lg min-w-[230px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border"
                    style={{
                      backgroundColor: currentHero.capeColor,
                      borderColor: currentHero.trimColor,
                    }}
                  >
                    {currentHero.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">
                      {currentHero.name}
                    </div>
                    <div className="font-mono-num text-[11px] text-emerald-400 font-semibold mt-0.5">
                      {hud.hp} / {hud.maxHp} PV
                    </div>
                  </div>
                </div>

                {/* Combo counter badge */}
                {hud.comboCount > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400 text-amber-300 font-mono-num text-xs font-extrabold animate-pulse">
                    {hud.comboCount}x COMBO!
                  </span>
                )}
              </div>

              {/* Health Bar */}
              <div className="w-full h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-emerald-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }}
                />
              </div>

              {/* Cooldowns & Consumables Strip */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {/* Special Power Status */}
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px]"
                  title={`${currentPower.name} (Tecla L ou C)`}
                >
                  <Zap
                    className="w-3.5 h-3.5"
                    style={{
                      color: hud.specialCooldownRatio <= 0 ? currentPower.color : '#64748B',
                    }}
                  />
                  <span className="text-slate-300 font-semibold">
                    {hud.specialCooldownRatio <= 0
                      ? 'Magia Pronta [L]'
                      : `${Math.ceil(hud.specialCooldownRatio * currentPower.cooldown)}s`}
                  </span>
                </div>

                {/* Quick Health Potion Button */}
                <button
                  onClick={handleUseHealthPotion}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Usar Poção de Vida (Atalho: Tecla H)"
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span className="font-mono-num">{saveState.consumables.healthPotion}</span>
                  <span className="hidden sm:inline">[H]</span>
                </button>

                {/* Quick Power Elixir Button */}
                <button
                  onClick={handleUsePowerElixir}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    hud.powerElixirActive
                      ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                      : 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-500/40 text-amber-300'
                  }`}
                  title="Usar Elixir de Furor +50% Dano (Atalho: Tecla G)"
                >
                  <Flame className="w-3 h-3 fill-current" />
                  <span className="font-mono-num">{saveState.consumables.powerElixir}</span>
                  <span className="hidden sm:inline">[G]</span>
                </button>
              </div>
            </div>

            {/* Top-Center: World & Level Indicator + BOSS HEALTH BAR */}
            <div className="flex flex-col items-center gap-2 mx-auto">
              <div className="pointer-events-auto px-4 py-2 rounded-2xl bg-[#161329]/85 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-lg">
                <span
                  className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: `${currentWorld.accentColor}28`,
                    color: currentWorld.accentColor,
                  }}
                >
                  Mundo {currentWorld.id}
                </span>
                <div className="text-xs sm:text-sm font-display font-bold text-white">
                  Fase {currentLevel}/100: <span className="text-amber-300">{currentMeta.title}</span>
                </div>
              </div>

              {/* BOSS HEALTH BAR (Only on Boss Levels) */}
              {hud.bossHp !== null && hud.bossMaxHp !== null && (
                <div className="w-[300px] sm:w-[440px] p-3 rounded-2xl bg-[#1A091E]/92 border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="font-display font-bold text-xs sm:text-sm text-white uppercase">
                        {hud.bossName}
                      </span>
                      {hud.bossPhase === 2 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-extrabold text-white animate-pulse">
                          FÚRIA FASE 2
                        </span>
                      )}
                    </div>
                    <span className="font-mono-num text-xs font-bold text-rose-300">
                      {hud.bossHp} / {hud.bossMaxHp}
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-slate-950 border border-rose-400/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 transition-all duration-150"
                      style={{ width: `${Math.max(0, (hud.bossHp / hud.bossMaxHp) * 100)}%` }}
                    />
                  </div>
                  {hud.bossTip && (
                    <div className="text-[11px] text-amber-200/90 mt-1 text-center">
                      💡 {hud.bossTip}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Signpost / Altar Prompt */}
              {hud.activePromptText && (
                <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs sm:text-sm font-bold shadow-lg backdrop-blur-md">
                  {hud.activePromptText}
                </div>
              )}
            </div>

            {/* Top-Right: Coins, Secret Chest Status & Quick Action Buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-2xl bg-[#161329]/85 backdrop-blur-md border border-amber-500/30 flex items-center gap-3 shadow-lg">
                <div className="flex items-center gap-1.5" title="Ouro Total + Coletado na Fase">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="font-mono-num text-sm font-extrabold text-amber-300">
                    {(saveState.coins + hud.coinsInLevel).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="h-4 w-px bg-white/15" />

                <div
                  className="flex items-center gap-1 text-xs font-bold"
                  title="Status do Baú Secreto desta Fase"
                >
                  <KeyRound
                    className={`w-4 h-4 ${
                      hud.secretFoundInLevel ||
                      saveState.levelRecords[currentLevel]?.secretFound
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={
                      hud.secretFoundInLevel ||
                      saveState.levelRecords[currentLevel]?.secretFound
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }
                  >
                    {hud.secretFoundInLevel ||
                    saveState.levelRecords[currentLevel]?.secretFound
                      ? 'Segredo OK'
                      : '1 Segredo'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('map');
                }}
                className="p-2.5 rounded-xl bg-[#161329]/85 hover:bg-slate-800 border border-white/15 text-amber-300 cursor-pointer"
                title="Mapa de Mundos e Fases"
              >
                <Compass className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveModal('shop');
                }}
                className="p-2.5 rounded-xl bg-[#161329]/85 hover:bg-slate-800 border border-white/15 text-emerald-300 cursor-pointer"
                title="Forja e Loja de Itens"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsPaused(true);
                }}
                className="p-2.5 rounded-xl bg-[#161329]/85 hover:bg-slate-800 border border-white/15 text-white cursor-pointer"
                title="Pausar Jogo (ESC ou P)"
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* ON-SCREEN VIRTUAL TOUCH CONTROLS (MOBILE / TABLET / OPTIONAL PC)  */}
          {/* ================================================================= */}
          {showTouchControls && !isPaused && !victoryData && !defeatCause && (
            <div className="fixed bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
              {/* Left D-Pad: Left & Right */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  onPointerDown={() => {
                    virtualInputRef.current.left = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.left = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.left = false;
                  }}
                  className="w-16 h-16 rounded-2xl bg-slate-900/75 active:bg-amber-500/40 border-2 border-white/25 text-white font-bold text-2xl flex items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  ◀
                </button>
                <button
                  onPointerDown={() => {
                    virtualInputRef.current.right = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.right = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.right = false;
                  }}
                  className="w-16 h-16 rounded-2xl bg-slate-900/75 active:bg-amber-500/40 border-2 border-white/25 text-white font-bold text-2xl flex items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  ▶
                </button>
              </div>

              {/* Right Action Cluster: Attack, Jump, Dash, Special */}
              <div className="grid grid-cols-2 gap-2.5 pointer-events-auto">
                <button
                  onPointerDown={() => {
                    virtualInputRef.current.dash = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.dash = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.dash = false;
                  }}
                  className="w-16 h-14 rounded-2xl bg-purple-900/75 active:bg-purple-500 border-2 border-purple-400/50 text-purple-200 font-display font-bold text-xs uppercase flex flex-col items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <span>DASH</span>
                </button>

                <button
                  onPointerDown={() => {
                    virtualInputRef.current.special = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.special = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.special = false;
                  }}
                  className="w-16 h-14 rounded-2xl bg-sky-900/75 active:bg-sky-500 border-2 border-sky-400/50 text-sky-200 font-display font-bold text-xs uppercase flex flex-col items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <span>MAGIA</span>
                </button>

                <button
                  onPointerDown={() => {
                    virtualInputRef.current.attack = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.attack = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.attack = false;
                  }}
                  className="w-16 h-16 rounded-2xl bg-rose-900/80 active:bg-rose-500 border-2 border-rose-400/60 text-white font-display font-bold text-xs uppercase flex flex-col items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <Sword className="w-5 h-5 mb-0.5" />
                  <span>ATACAR</span>
                </button>

                <button
                  onPointerDown={() => {
                    virtualInputRef.current.jump = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.jump = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.jump = false;
                  }}
                  className="w-16 h-16 rounded-2xl bg-amber-600/85 active:bg-amber-400 border-2 border-amber-300/70 text-slate-950 font-display font-extrabold text-xs uppercase flex flex-col items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <span className="text-base leading-none">▲</span>
                  <span>PULAR</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* 3. PAUSE MODAL (TELA DE PAUSA)                                        */}
      {/* ===================================================================== */}
      {isPaused && screenMode === 'playing' && !victoryData && !defeatCause && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#131122] border border-amber-500/40 p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-amber-300 uppercase tracking-wider mb-1">
              Jogo Pausado
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Mundo {currentWorld.id}: {currentWorld.name} • Fase {currentLevel}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsPaused(false);
                }}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Continuar Aventura</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  startLevel(currentLevel);
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Fase {currentLevel}</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsPaused(false);
                  setActiveModal('map');
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Mapa de Mundos (100 Fases)</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsPaused(false);
                  setActiveModal('shop');
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Forja & Loja de Itens</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsPaused(false);
                  setScreenMode('title');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Voltar à Tela Inicial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. VICTORY MODAL (TELA DE VITÓRIA & RECOMPENSAS)                      */}
      {/* ===================================================================== */}
      {victoryData && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#131122] border-2 border-amber-400/60 p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.35)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Fase {victoryData.summary.levelNumber} Concluída!</span>
            </div>

            <h2 className="font-display text-3xl font-black text-amber-300 uppercase tracking-wider">
              {victoryData.summary.levelNumber === 100
                ? 'Lenda Suprema Consagrada!'
                : victoryData.summary.bossDefeated
                ? 'Chefão do Mundo Derrotado!'
                : 'Vitória Gloriosa!'}
            </h2>

            {/* 3 Animated Stars */}
            <div className="flex items-center justify-center gap-4 my-5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`p-3 rounded-2xl border transition-all ${
                    s <= victoryData.starsEarned
                      ? 'bg-amber-500/25 border-amber-400 scale-110 shadow-[0_0_24px_rgba(245,158,11,0.45)]'
                      : 'bg-slate-900 border-white/10 opacity-40'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= victoryData.starsEarned
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 text-left mb-6">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs text-slate-400">Ouro Conquistado</div>
                <div className="font-mono-num text-lg font-extrabold text-amber-400 flex items-center gap-1 mt-0.5">
                  <Coins className="w-4 h-4" /> +{victoryData.summary.coinsCollected}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs text-slate-400">Baú Secreto</div>
                <div className="text-sm font-bold mt-1">
                  {victoryData.summary.secretFound ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <KeyRound className="w-4 h-4" /> Encontrado!
                    </span>
                  ) : (
                    <span className="text-slate-400">Ainda Oculto</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs text-slate-400">Inimigos Derrotados</div>
                <div className="font-mono-num text-base font-bold text-white mt-0.5">
                  {victoryData.summary.enemiesDefeated}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs text-slate-400">Tempo da Fase</div>
                <div className="font-mono-num text-base font-bold text-sky-300 mt-0.5">
                  {victoryData.summary.timeSeconds}s
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {victoryData.summary.levelNumber < 100 && (
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    startLevel(victoryData.summary.levelNumber + 1);
                  }}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.45)] cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Próxima Fase ({victoryData.summary.levelNumber + 1})</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setVictoryData(null);
                  setActiveModal('shop');
                }}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Forja</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setVictoryData(null);
                  setActiveModal('map');
                }}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Mapa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DEFEAT MODAL (TELA DE DERROTA JUSTA E ORIENTADA À EVOLUÇÃO)        */}
      {/* ===================================================================== */}
      {defeatCause && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#160D1A] border-2 border-rose-500/50 p-6 text-center shadow-[0_0_50px_rgba(244,63,94,0.3)]">
            <h2 className="font-display text-3xl font-black text-rose-400 uppercase tracking-wider mb-1">
              Você Caiu em Batalha
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              Causa da derrota: <strong className="text-rose-300">{defeatCause}</strong>
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-amber-200/90 mb-6">
              💡 <strong>Dica do Guardião:</strong> Use o <strong>Dash Sombrio (K / Shift)</strong> para ficar invulnerável ao atravessar ataques ou visite a <strong>Forja</strong> para aumentar sua Vida Máxima e comprar Poções!
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  startLevel(currentLevel);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Tentar Novamente (Fase {currentLevel})</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setDefeatCause(null);
                  setActiveModal('shop');
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Evoluir Herói na Forja</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setDefeatCause(null);
                  setActiveModal('map');
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Escolher Outra Fase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODALS: MAP OF 100 LEVELS, SHOP/HEROES, REWARDS/SETTINGS           */}
      {/* ===================================================================== */}
      {activeModal === 'map' && (
        <WorldAndLevelModal
          saveState={saveState}
          currentLevel={currentLevel}
          onSelectLevel={(lvl) => startLevel(lvl)}
          onToggleSandboxUnlockAll={() => {
            setSaveState((prev) => ({
              ...prev,
              unlockAllSandboxMode: !prev.unlockAllSandboxMode,
            }));
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {(activeModal === 'shop' || activeModal === 'heroes') && (
        <ShopAndInventoryModal
          saveState={saveState}
          initialTab={activeModal === 'heroes' ? 'heroes' : 'upgrades'}
          onBuyUpgrade={handleBuyUpgrade}
          onBuyConsumable={handleBuyConsumable}
          onUnlockOrSelectHero={handleUnlockOrSelectHero}
          onUnlockOrSelectPower={handleUnlockOrSelectPower}
          onClose={() => setActiveModal(null)}
        />
      )}

      {(activeModal === 'rewards' || activeModal === 'settings') && (
        <RewardsAndChallengesModal
          saveState={saveState}
          initialTab={activeModal === 'settings' ? 'settings' : 'daily'}
          onClaimAchievement={(id, reward) => {
            setSaveState((prev) => ({
              ...prev,
              coins: prev.coins + reward,
              totalCoinsEarned: prev.totalCoinsEarned + reward,
              claimedAchievements: [...prev.claimedAchievements, id],
            }));
            showToast(`Conquista Resgatada! +${reward} Ouro!`, '#FDE047');
          }}
          onClaimDailyChallenge={(id, reward) => {
            setSaveState((prev) => ({
              ...prev,
              coins: prev.coins + reward,
              totalCoinsEarned: prev.totalCoinsEarned + reward,
              claimedDailyChallenges: [...prev.claimedDailyChallenges, id],
            }));
            showToast(`Desafio Diário Concluído! +${reward} Ouro!`, '#10B981');
          }}
          onUpdateSettings={(newSettings) => {
            setSaveState((prev) => ({
              ...prev,
              settings: newSettings,
            }));
          }}
          onResetSaveData={() => {
            localStorage.removeItem(SAVE_STORAGE_KEY);
            setSaveState(DEFAULT_SAVE_STATE);
            setCurrentLevel(1);
            showToast('Progresso reiniciado para o início da jornada!', '#F43F5E');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

export default App;
