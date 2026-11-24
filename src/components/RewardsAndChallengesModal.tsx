import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Coins,
  Gamepad2,
  Gift,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { GameSaveState } from '../types/game';
import { ACHIEVEMENTS, DAILY_CHALLENGES } from '../data/worldsAndLevels';
import { soundEngine } from '../audio/soundEngine';

interface RewardsAndChallengesModalProps {
  saveState: GameSaveState;
  initialTab?: 'daily' | 'achievements' | 'settings';
  onClaimAchievement: (id: string, reward: number) => void;
  onClaimDailyChallenge: (id: string, reward: number) => void;
  onUpdateSettings: (newSettings: GameSaveState['settings']) => void;
  onResetSaveData: () => void;
  onClose: () => void;
}

export const RewardsAndChallengesModal: React.FC<RewardsAndChallengesModalProps> = ({
  saveState,
  initialTab = 'daily',
  onClaimAchievement,
  onClaimDailyChallenge,
  onUpdateSettings,
  onResetSaveData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'achievements' | 'settings'>(initialTab);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#131122]/95 border border-amber-500/35 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0B0914]/85">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-amber-300 uppercase">
                Salão de Recompensas & Configurações
              </h2>
              <p className="text-xs text-slate-400">
                Complete Desafios Diários, desbloqueie Conquistas e personalize sua experiência
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 bg-[#0E0C1A] border-b border-white/10">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('daily');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Desafios Diários</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('achievements');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Conquistas ({saveState.claimedAchievements.length}/{ACHIEVEMENTS.length})</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('settings');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Controles</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'daily' && (
            <div className="space-y-3.5">
              {DAILY_CHALLENGES.map((ch) => {
                const currentVal = saveState.stats[ch.statKey] || 0;
                const progress = Math.min(1, currentVal / ch.target);
                const isCompleted = currentVal >= ch.target;
                const isClaimed = saveState.claimedDailyChallenges.includes(ch.id);

                return (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-slate-900/85 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-400" />
                          <span>{ch.title}</span>
                        </h4>
                        <span className="font-mono-num text-xs text-slate-300">
                          {Math.min(currentVal, ch.target)} / {ch.target}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{ch.description}</p>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>

                    <button
                      disabled={!isCompleted || isClaimed}
                      onClick={() => {
                        soundEngine.playChestOpen();
                        onClaimDailyChallenge(ch.id, ch.rewardCoins);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isCompleted
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.4)] cursor-pointer'
                          : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Resgatado</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 text-amber-300" />
                          <span>Resgatar +{ch.rewardCoins}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = ach.checkUnlocked(saveState);
                const isClaimed = saveState.claimedAchievements.includes(ach.id);

                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-400/40'
                        : 'bg-slate-900/75 border-white/10 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-display font-bold text-base text-white">
                          {ach.title}
                        </h4>
                        <span className="font-mono-num text-xs font-bold text-amber-300">
                          +{ach.rewardCoins} Ouro
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{ach.description}</p>
                    </div>

                    <button
                      disabled={!isUnlocked || isClaimed}
                      onClick={() => {
                        soundEngine.playChestOpen();
                        onClaimAchievement(ach.id, ach.rewardCoins);
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isUnlocked
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.4)] cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Recompensa Resgatada</span>
                        </>
                      ) : isUnlocked ? (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Resgatar +{ach.rewardCoins} Ouro</span>
                        </>
                      ) : (
                        <span>Em Progresso</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Audio Settings */}
              <div className="p-4 rounded-2xl bg-slate-900/85 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white flex items-center gap-2">
                    {saveState.settings.muted ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-amber-400" />
                    )}
                    <span>Áudio Geral do Jogo</span>
                  </span>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...saveState.settings,
                        muted: !saveState.settings.muted,
                      })
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                      saveState.settings.muted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {saveState.settings.muted ? 'Silenciado (Mudo)' : 'Som Ativado'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Volume da Música de Fundo</span>
                    <span className="font-mono-num">{Math.round(saveState.settings.bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveState.settings.bgmVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveState.settings,
                        bgmVolume: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Volume dos Efeitos Sonoros (Combate / Moedas)</span>
                    <span className="font-mono-num">{Math.round(saveState.settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveState.settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveState.settings,
                        sfxVolume: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Controls & Visual Settings */}
              <div className="p-4 rounded-2xl bg-slate-900/85 border border-white/10 space-y-3">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <span>Controles & Efeitos Visuais</span>
                </h4>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-300">Botões Virtuais na Tela (Celular / Touch)</span>
                  <div className="flex gap-1.5">
                    {(['auto', 'always', 'off'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          onUpdateSettings({
                            ...saveState.settings,
                            showTouchControls: mode,
                          })
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                          saveState.settings.showTouchControls === mode
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mode === 'auto' ? 'Auto' : mode === 'always' ? 'Sempre' : 'Ocultar'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-300">Impacto de Câmera (Screen Shake)</span>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...saveState.settings,
                        screenShake: !saveState.settings.screenShake,
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                      saveState.settings.screenShake
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {saveState.settings.screenShake ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                {/* Keyboard Reference Card */}
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-300 mb-1">Resumo dos Controles (Computador):</div>
                  <div>• <strong>Correr:</strong> Setas Esquerda/Direita ou Teclas A / D</div>
                  <div>• <strong>Pular / Pulo Duplo:</strong> Barra de Espaço, W ou Seta Cima</div>
                  <div>• <strong>Atacar com Espada (Combo):</strong> Tecla J, Z ou Enter</div>
                  <div>• <strong>Dash Sombrio (Esquiva):</strong> Tecla K, X ou Shift</div>
                  <div>• <strong>Poder Especial Arcano:</strong> Tecla L ou C</div>
                  <div>• <strong>Usar Poção de Vida:</strong> Tecla H</div>
                </div>
              </div>

              {/* Save Data Reset */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-sm text-rose-300">
                    Gerenciamento de Progresso Salvo
                  </div>
                  <div className="text-xs text-slate-400">
                    O progresso é salvo automaticamente no seu navegador a cada ação.
                  </div>
                </div>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Reiniciar Jogo do Zero
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onResetSaveData();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
