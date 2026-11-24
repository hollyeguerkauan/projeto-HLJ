import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  KeyRound,
  Lock,
  Play,
  Sparkles,
  Star,
  Unlock,
  X,
} from 'lucide-react';
import { GameSaveState, WorldId } from '../types/game';
import { ALL_LEVELS_META, getWorldForLevel, WORLDS } from '../data/worldsAndLevels';
import { soundEngine } from '../audio/soundEngine';

interface WorldAndLevelModalProps {
  saveState: GameSaveState;
  currentLevel: number;
  onSelectLevel: (levelNumber: number) => void;
  onToggleSandboxUnlockAll: () => void;
  onClose: () => void;
}

export const WorldAndLevelModal: React.FC<WorldAndLevelModalProps> = ({
  saveState,
  currentLevel,
  onSelectLevel,
  onToggleSandboxUnlockAll,
  onClose,
}) => {
  const initialWorld = getWorldForLevel(currentLevel).id;
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(initialWorld);
  const [hoveredLevel, setHoveredLevel] = useState<number>(currentLevel);

  const activeWorld = WORLDS.find((w) => w.id === selectedWorldId) || WORLDS[0];
  const worldLevels = ALL_LEVELS_META.filter((m) => m.worldId === selectedWorldId);
  const inspectedMeta =
    ALL_LEVELS_META.find((m) => m.levelNumber === hoveredLevel) || worldLevels[0];

  const isLevelUnlocked = (lvl: number) =>
    saveState.unlockAllSandboxMode || lvl <= saveState.highestUnlockedLevel;

  // Compute total stars and secrets across all 100 levels
  const totalStarsEarned = Object.values(saveState.levelRecords).reduce(
    (acc, r) => acc + (r.stars || 0),
    0
  );
  const totalSecretsFound = Object.values(saveState.levelRecords).filter((r) => r.secretFound).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#131122]/95 border border-amber-500/35 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[#0B0914]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-amber-300 uppercase">
                Atlas dos Mundos Perdidos (100 Fases)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Explore 8 Mundos Únicos • {totalStarsEarned}/300 Estrelas • {totalSecretsFound}/100 Baús Secretos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Explorer Mode Toggle so player can test any of the 100 levels & 8 bosses immediately if desired */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onToggleSandboxUnlockAll();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                saveState.unlockAllSandboxMode
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-800/80 border-white/15 text-slate-300 hover:border-amber-400/40'
              }`}
              title="Permite acessar imediatamente qualquer uma das 100 fases e todos os 8 Chefões"
            >
              {saveState.unlockAllSandboxMode ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Todas as 100 Fases Liberadas</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Liberar Todas as 100 Fases (Modo Explorador)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              aria-label="Fechar Mapa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* World Selector Carousel (8 Worlds) */}
        <div className="px-5 py-3 bg-[#0E0C1A] border-b border-white/10 overflow-x-auto">
          <div className="flex items-center gap-2.5 min-w-max">
            {WORLDS.map((world) => {
              const worldUnlocked = isLevelUnlocked(world.startLevel);
              const isSelected = world.id === selectedWorldId;
              const completedInWorld = ALL_LEVELS_META.filter(
                (m) => m.worldId === world.id && saveState.levelRecords[m.levelNumber]?.completed
              ).length;
              const totalInWorld = world.endLevel - world.startLevel + 1;

              return (
                <button
                  key={world.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setSelectedWorldId(world.id);
                    setHoveredLevel(world.startLevel);
                  }}
                  className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all cursor-pointer min-w-[175px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/25 to-purple-900/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : worldUnlocked
                      ? 'bg-slate-900/70 border-white/10 hover:border-amber-400/40'
                      : 'bg-slate-950/60 border-white/5 opacity-65 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${world.accentColor}25`,
                        color: world.accentColor,
                      }}
                    >
                      Mundo {world.id}
                    </span>
                    <span className="font-mono-num text-xs text-slate-400">
                      {completedInWorld}/{totalInWorld}
                    </span>
                  </div>
                  <div className="font-display font-bold text-sm text-white truncate w-full text-left">
                    {world.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Fases {world.startLevel}–{world.endLevel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content: Selected World Details + Level Nodes Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: World Lore, Biome Mechanics & Inspected Level Card */}
          <div className="flex flex-col gap-4">
            <div
              className="p-4 rounded-2xl border border-white/15 relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${activeWorld.skyTop}, ${activeWorld.skyBottom})`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Mundo {activeWorld.id} • Fases {activeWorld.startLevel} a {activeWorld.endLevel}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeWorld.accentColor }}
                />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-1">
                {activeWorld.name}
              </h3>
              <p className="text-xs text-amber-200/90 font-medium mb-3">{activeWorld.subtitle}</p>
              <p className="text-xs text-slate-200/90 leading-relaxed mb-3">
                {activeWorld.description}
              </p>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                <div className="text-amber-300 font-semibold mb-0.5">Mecânicas Exclusivas:</div>
                <div className="text-slate-200">{activeWorld.mechanicHighlight}</div>
              </div>
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Chefão Final (Fase {activeWorld.endLevel}): {activeWorld.boss.name}</span>
                </div>
                <div className="text-slate-300 mt-1 text-[11px]">{activeWorld.boss.strategyTip}</div>
              </div>
            </div>

            {/* Currently Selected / Hovered Level Preview */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-num text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    FASE {inspectedMeta.levelNumber} DE 100
                  </span>
                  {inspectedMeta.specialType === 'boss' && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> CHEFÃO
                    </span>
                  )}
                  {inspectedMeta.specialType === 'bonus' && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> FASE BÔNUS
                    </span>
                  )}
                </div>

                <h4 className="font-display text-lg font-bold text-white mb-1">
                  {inspectedMeta.title}
                </h4>
                <p className="text-xs text-amber-300/90 font-medium mb-3">
                  ★ {inspectedMeta.featureTag}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-slate-400">Recompensa Base</div>
                    <div className="font-mono-num font-bold text-amber-400 text-sm mt-0.5">
                      +{inspectedMeta.baseCoinReward} Ouro
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-slate-400">Baú Secreto</div>
                    <div className="font-bold text-sm mt-0.5 flex items-center gap-1">
                      {saveState.levelRecords[inspectedMeta.levelNumber]?.secretFound ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Descoberto
                        </span>
                      ) : (
                        <span className="text-amber-300 flex items-center gap-1">
                          <KeyRound className="w-4 h-4" /> Escondido
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={!isLevelUnlocked(inspectedMeta.levelNumber)}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectLevel(inspectedMeta.levelNumber);
                }}
                className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isLevelUnlocked(inspectedMeta.levelNumber)
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.4)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLevelUnlocked(inspectedMeta.levelNumber) ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Jogar Fase {inspectedMeta.levelNumber} Agora</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Complete as fases anteriores</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right 2 Columns: Constellation Grid of Levels in Active World */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm sm:text-base font-bold text-slate-200 uppercase tracking-wider">
                Fases de {activeWorld.name} (Clique para Jogar)
              </h4>
              <span className="text-xs text-slate-400">
                Dica: Toda fase esconde 1 Baú Secreto!
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {worldLevels.map((lvlMeta) => {
                const unlocked = isLevelUnlocked(lvlMeta.levelNumber);
                const record = saveState.levelRecords[lvlMeta.levelNumber];
                const stars = record?.stars || 0;
                const isCurrent = lvlMeta.levelNumber === currentLevel;
                const isBoss = lvlMeta.specialType === 'boss';
                const isBonus = lvlMeta.specialType === 'bonus';

                return (
                  <div
                    key={lvlMeta.levelNumber}
                    onMouseEnter={() => setHoveredLevel(lvlMeta.levelNumber)}
                    onClick={() => {
                      setHoveredLevel(lvlMeta.levelNumber);
                      if (unlocked) {
                        soundEngine.playUiClick();
                        onSelectLevel(lvlMeta.levelNumber);
                      }
                    }}
                    className={`group relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[124px] ${
                      unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                    } ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : isBoss
                        ? 'bg-rose-950/45 border-rose-500/50 hover:border-rose-400'
                        : isBonus
                        ? 'bg-sky-950/40 border-sky-500/40 hover:border-sky-400'
                        : record?.completed
                        ? 'bg-emerald-950/30 border-emerald-500/35 hover:border-amber-400/60'
                        : 'bg-slate-900/80 border-white/10 hover:border-amber-400/50'
                    }`}
                  >
                    {/* Top row: Level Number & Special Icon */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num text-base font-extrabold text-white">
                        #{lvlMeta.levelNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {record?.secretFound && (
                          <span title="Baú Secreto Encontrado!">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                        {isBoss ? (
                          <Crown className="w-4 h-4 text-rose-400" />
                        ) : isBonus ? (
                          <Sparkles className="w-4 h-4 text-sky-400" />
                        ) : !unlocked ? (
                          <Lock className="w-4 h-4 text-slate-500" />
                        ) : null}
                      </div>
                    </div>

                    {/* Level Title */}
                    <div className="my-1.5">
                      <div className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {lvlMeta.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {lvlMeta.featureTag}
                      </div>
                    </div>

                    {/* Stars Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-amber-300 group-hover:translate-x-0.5 transition-transform">
                        {unlocked ? 'Jogar →' : 'Bloq.'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
