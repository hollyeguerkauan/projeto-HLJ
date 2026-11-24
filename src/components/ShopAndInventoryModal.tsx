import React, { useState } from 'react';
import {
  Check,
  Coins,
  Flame,
  Heart,
  Shield,
  Sparkles,
  Sword,
  UserCheck,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import {
  GameSaveState,
  HeroSkinId,
  SpecialPowerId,
  UpgradeKey,
} from '../types/game';
import {
  HERO_SKINS,
  SPECIAL_POWERS,
  UPGRADE_DEFINITIONS,
} from '../data/worldsAndLevels';
import { soundEngine } from '../audio/soundEngine';

interface ShopAndInventoryModalProps {
  saveState: GameSaveState;
  initialTab?: 'upgrades' | 'heroes' | 'powers';
  onBuyUpgrade: (key: UpgradeKey, cost: number) => void;
  onBuyConsumable: (type: 'healthPotion' | 'phoenixAmulet' | 'powerElixir', cost: number) => void;
  onUnlockOrSelectHero: (heroId: HeroSkinId, cost: number) => void;
  onUnlockOrSelectPower: (powerId: SpecialPowerId, cost: number) => void;
  onClose: () => void;
}

export const ShopAndInventoryModal: React.FC<ShopAndInventoryModalProps> = ({
  saveState,
  initialTab = 'upgrades',
  onBuyUpgrade,
  onBuyConsumable,
  onUnlockOrSelectHero,
  onUnlockOrSelectPower,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'heroes' | 'powers'>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[#131122]/95 border border-amber-500/35 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[#0B0914]/85">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-amber-300 uppercase">
                Santuário da Forja & Inventário Real
              </h2>
              <p className="text-xs text-slate-400">
                Fortaleça seus atributos, desbloqueie novos Campeões e equipe Poderes Arcanos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="font-mono-num text-lg font-extrabold text-amber-300">
                {saveState.coins.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-amber-200/80 uppercase font-semibold">Ouro</span>
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
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 bg-[#0E0C1A] border-b border-white/10">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('upgrades');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Forja & Itens ({UPGRADE_DEFINITIONS.length})</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('heroes');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'heroes'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Heróis & Skins ({saveState.unlockedHeroes.length}/{HERO_SKINS.length})</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('powers');
            }}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'powers'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Poderes Especiais ({saveState.unlockedPowers.length}/{SPECIAL_POWERS.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'upgrades' && (
            <div className="space-y-6">
              {/* Permanent Attribute Upgrades */}
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300 mb-3">
                  Melhorias Permanentes do Herói
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {UPGRADE_DEFINITIONS.map((def) => {
                    const currentLvl = saveState.upgrades[def.key] || 0;
                    const isMax = currentLvl >= def.maxLevel;
                    const cost = Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLvl));
                    const canAfford = saveState.coins >= cost && !isMax;

                    return (
                      <div
                        key={def.key}
                        className="p-4 rounded-2xl bg-slate-900/85 border border-white/10 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-bold text-base text-white">
                              {def.name}
                            </span>
                            <span className="font-mono-num text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Nível {currentLvl}/{def.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{def.description}</p>
                          <div className="text-xs font-semibold text-emerald-400">
                            Atual: {def.valueLabel(currentLvl)}
                            {!isMax && (
                              <span className="text-amber-300 ml-2">
                                → Próximo: {def.valueLabel(currentLvl + 1)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          {/* Level pips */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: def.maxLevel }).map((_, idx) => (
                              <span
                                key={idx}
                                className={`h-2 rounded-full transition-all ${
                                  def.maxLevel > 6 ? 'w-3' : 'w-4'
                                } ${
                                  idx < currentLvl
                                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                    : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              soundEngine.playChestOpen();
                              onBuyUpgrade(def.key, cost);
                            }}
                            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                              isMax
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.35)] cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isMax ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Máximo</span>
                              </>
                            ) : (
                              <>
                                <Coins className="w-3.5 h-3.5" />
                                <span className="font-mono-num">{cost}</span>
                                <span>Evoluir</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Consumable Alchemy Items */}
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300 mb-3">
                  Alquimia & Relíquias Consumíveis (Usáveis em Combate)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Health Potion */}
                  <div className="p-4 rounded-2xl bg-slate-900/85 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-white flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-emerald-400" /> Poção de Vida
                        </span>
                        <span className="font-mono-num text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Estoque: {saveState.consumables.healthPotion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Restaura 55% da sua Vida Máxima instantaneamente durante qualquer fase (Tecla H ou botão na tela).
                      </p>
                    </div>
                    <button
                      disabled={saveState.coins < 65}
                      onClick={() => {
                        soundEngine.playCoin(true);
                        onBuyConsumable('healthPotion', 65);
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 ${
                        saveState.coins >= 65
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" /> Comprar (65 Ouro)
                    </button>
                  </div>

                  {/* Power Elixir */}
                  <div className="p-4 rounded-2xl bg-slate-900/85 border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-white flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400" /> Elixir de Furor
                        </span>
                        <span className="font-mono-num text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Estoque: {saveState.consumables.powerElixir}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Concede +50% de Dano em todos os ataques e Poderes Especiais por 15 segundos!
                      </p>
                    </div>
                    <button
                      disabled={saveState.coins < 90}
                      onClick={() => {
                        soundEngine.playCoin(true);
                        onBuyConsumable('powerElixir', 90);
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 ${
                        saveState.coins >= 90
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" /> Comprar (90 Ouro)
                    </button>
                  </div>

                  {/* Phoenix Amulet */}
                  <div className="p-4 rounded-2xl bg-slate-900/85 border border-rose-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-400" /> Amuleto da Fênix
                        </span>
                        <span className="font-mono-num text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          Estoque: {saveState.consumables.phoenixAmulet}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Renasce automaticamente com 75% de Vida caso você sofra um golpe fatal em qualquer fase!
                      </p>
                    </div>
                    <button
                      disabled={saveState.coins < 180}
                      onClick={() => {
                        soundEngine.playChestOpen();
                        onBuyConsumable('phoenixAmulet', 180);
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 ${
                        saveState.coins >= 180
                          ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" /> Comprar (180 Ouro)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heroes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HERO_SKINS.map((hero) => {
                const isUnlocked = saveState.unlockedHeroes.includes(hero.id);
                const isSelected = saveState.selectedHero === hero.id;
                const canAfford = saveState.coins >= hero.cost;

                return (
                  <div
                    key={hero.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/85 border-white/10'
                    }`}
                  >
                    <div>
                      {/* Hero Visual Avatar Preview */}
                      <div className="h-28 rounded-xl bg-[#0B0914] border border-white/10 mb-3 flex items-center justify-center relative overflow-hidden">
                        {/* Price / Status Badge */}
                        <div className="absolute top-2 right-2 z-20">
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase">
                              Desbloqueado
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono-num text-[11px] font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" />
                              {hero.cost.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <div
                          className="w-24 h-24 rounded-full blur-xl opacity-35 absolute"
                          style={{ backgroundColor: hero.capeColor }}
                        />
                        {/* Stylized SVG Hero Figure */}
                        <div className="relative flex items-center gap-3">
                          <div className="relative w-12 h-16 flex flex-col items-center">
                            {/* Cape */}
                            <div
                              className="absolute -left-3 top-4 w-8 h-11 rounded-l-full -rotate-12"
                              style={{ backgroundColor: hero.capeColor }}
                            />
                            {/* Head */}
                            <div
                              className="w-6 h-6 rounded-full z-10 border"
                              style={{
                                backgroundColor: '#FDE68A',
                                borderColor: hero.hairColor,
                              }}
                            />
                            {/* Armor */}
                            <div
                              className="w-8 h-9 rounded-lg z-10 border-2 -mt-0.5"
                              style={{
                                backgroundColor: hero.armorColor,
                                borderColor: hero.trimColor,
                              }}
                            />
                          </div>
                          {/* Blade preview */}
                          <div
                            className="w-2 h-14 rounded-full rotate-12 shadow-lg"
                            style={{
                              backgroundColor: hero.bladeColor,
                              boxShadow: `0 0 12px ${hero.bladeColor}`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-display text-lg font-bold text-white">{hero.name}</h4>
                        <span className="text-xs font-semibold text-amber-300">{hero.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2.5">{hero.description}</p>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-emerald-300 font-semibold mb-3">
                        ★ {hero.bonusText}
                      </div>
                    </div>

                    <button
                      disabled={!isUnlocked && !canAfford}
                      onClick={() => {
                        soundEngine.playChestOpen();
                        onUnlockOrSelectHero(hero.id, hero.cost);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 cursor-default'
                          : isUnlocked
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Herói Equipado</span>
                        </>
                      ) : isUnlocked ? (
                        <span>Equipar {hero.name}</span>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Desbloquear ({hero.cost.toLocaleString('pt-BR')} Moedas)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'powers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SPECIAL_POWERS.map((power) => {
                const isUnlocked = saveState.unlockedPowers.includes(power.id);
                const isSelected = saveState.selectedPower === power.id;
                const canAfford = saveState.coins >= power.cost;

                return (
                  <div
                    key={power.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/85 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border"
                            style={{
                              backgroundColor: `${power.color}22`,
                              borderColor: `${power.color}66`,
                              color: power.color,
                            }}
                          >
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-display text-lg font-bold text-white">
                              {power.name}
                            </h4>
                            <span className="text-xs text-slate-400">
                              Recarga base: {power.cooldown}s • Atalho: Tecla L ou C
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 my-3 leading-relaxed">
                        {power.description}
                      </p>
                    </div>

                    <button
                      disabled={!isUnlocked && !canAfford}
                      onClick={() => {
                        soundEngine.playSpecialPower();
                        onUnlockOrSelectPower(power.id, power.cost);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 cursor-default'
                          : isUnlocked
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Poder Equipado</span>
                        </>
                      ) : isUnlocked ? (
                        <span>Equipar Poder</span>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Desbloquear ({power.cost} Ouro)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
