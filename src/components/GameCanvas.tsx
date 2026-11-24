import React, { useEffect, useRef } from 'react';
import {
  BossEntity,
  FloatingText,
  GameSaveState,
  HeroSkin,
  LevelBlueprint,
  Particle,
  ProjectileEntity,
} from '../types/game';
import { buildLevelBlueprint, HERO_SKINS, SPECIAL_POWERS } from '../data/worldsAndLevels';
import { soundEngine } from '../audio/soundEngine';

export interface HudTelemetry {
  hp: number;
  maxHp: number;
  coinsInLevel: number;
  totalCoinsInLevel: number;
  secretFoundInLevel: boolean;
  specialCooldownRatio: number; // 0 = ready, 1 = full cooldown
  dashCooldownRatio: number;
  powerElixirActive: boolean;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossName: string | null;
  bossTitle: string | null;
  bossPhase: 1 | 2;
  bossTip: string | null;
  activePromptText: string | null;
  comboCount: number;
}

export interface LevelCompletionSummary {
  levelNumber: number;
  coinsCollected: number;
  totalCoinsAvailable: number;
  secretFound: boolean;
  enemiesDefeated: number;
  bossDefeated: boolean;
  timeSeconds: number;
  hpRemainingRatio: number;
}

interface GameCanvasProps {
  levelNumber: number;
  saveState: GameSaveState;
  isPaused: boolean;
  isDemoMode?: boolean;
  virtualInputRef: React.MutableRefObject<{
    left: boolean;
    right: boolean;
    jump: boolean;
    attack: boolean;
    dash: boolean;
    special: boolean;
    interact: boolean;
  }>;
  consumePotionTrigger: number;
  consumeElixirTrigger: number;
  onTelemetryUpdate: (telemetry: HudTelemetry) => void;
  onLevelComplete: (summary: LevelCompletionSummary) => void;
  onPlayerDefeated: (cause: string) => void;
  onUnlockDoubleJumpAltar: () => void;
  onPhoenixReviveUsed: () => void;
  onToastMessage: (msg: string, color?: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelNumber,
  saveState,
  isPaused,
  isDemoMode = false,
  virtualInputRef,
  consumePotionTrigger,
  consumeElixirTrigger,
  onTelemetryUpdate,
  onLevelComplete,
  onPlayerDefeated,
  onUnlockDoubleJumpAltar,
  onPhoenixReviveUsed,
  onToastMessage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  const saveRef = useRef(saveState);
  saveRef.current = saveState;

  // Track external consumable triggers
  const lastPotionTriggerRef = useRef(consumePotionTrigger);
  const lastElixirTriggerRef = useRef(consumeElixirTrigger);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blueprint: LevelBlueprint = buildLevelBlueprint(levelNumber);
    const heroSkin: HeroSkin =
      HERO_SKINS.find((h) => h.id === saveRef.current.selectedHero) || HERO_SKINS[0];
    const selectedPower =
      SPECIAL_POWERS.find((p) => p.id === saveRef.current.selectedPower) || SPECIAL_POWERS[0];

    const upg = saveRef.current.upgrades;
    const computedMaxHp = Math.round(100 + upg.maxHp * 20 + heroSkin.hpBonus);
    const baseAttackDamage = Math.round(
      (22 + upg.attackDamage * 7) * (1 + heroSkin.damageBonus)
    );
    const moveSpeed = 305 * (1 + heroSkin.speedBonus);
    const jumpVelocity = -555;
    const doubleJumpVelocity = -515 * (1 + upg.doubleJump * 0.04);
    const dashCooldownMax = Math.max(0.35, (1.05 - upg.dashMastery * 0.1) * (1 - heroSkin.dashCooldownBonus));
    const specialCooldownMax = Math.max(2.5, selectedPower.cooldown * (1 - upg.specialPowerMastery * 0.07));
    const coinMagnetRadius = 65 + upg.coinMagnet * 35 + heroSkin.magnetBonus;

    // Player runtime state
    const player = {
      x: blueprint.spawnX,
      y: blueprint.spawnY,
      w: 36,
      h: 52,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      hp: computedMaxHp,
      maxHp: computedMaxHp,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsRemaining: upg.doubleJump > 0 ? 2 : 1,
      maxJumps: upg.doubleJump > 0 ? 2 : 1,
      dashTimer: 0,
      dashCooldown: 0,
      attackTimer: 0,
      attackCooldown: 0,
      comboStep: 0,
      comboResetTimer: 0,
      specialCooldown: 0,
      invulnTimer: 0,
      shieldTimer: 0,
      bladeStormTimer: 0,
      powerElixirTimer: 0,
      hitFlashTimer: 0,
      animTime: 0,
      onIce: false,
      inQuicksand: false,
      afterimages: [] as { x: number; y: number; facing: 1 | -1; alpha: number; color: string }[],
    };

    // Level runtime state
    let coinsCollectedValue = 0;
    let coinsCollectedCount = 0;
    const totalCoinsCount = blueprint.coins.length;
    let secretFound = false;
    let enemiesDefeatedCount = 0;
    let levelElapsedSeconds = 0;
    let levelFinished = false;
    let screenShake = 0;
    let hitStopTimer = 0;
    let comboHits = 0;
    let comboHitDecay = 0;

    const projectiles: ProjectileEntity[] = [];
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];

    // Ambient weather particles across the viewport
    const weatherParticles = Array.from({ length: 48 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 800,
      size: 2 + Math.random() * 3.5,
      speedX: (Math.random() - 0.5) * 35,
      speedY: 15 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
    }));

    // Camera state
    const camera = {
      x: Math.max(0, player.x - 400),
      y: 0,
    };

    // Keyboard state
    const keys: Record<string, boolean> = {};
    let jumpJustPressed = false;
    let attackJustPressed = false;
    let dashJustPressed = false;
    let specialJustPressed = false;
    let interactJustPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDemoMode || pausedRef.current) return;
      const code = e.code;
      if (!keys[code]) {
        if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
          jumpJustPressed = true;
        }
        if (code === 'KeyJ' || code === 'KeyZ' || code === 'Enter') {
          attackJustPressed = true;
        }
        if (code === 'KeyK' || code === 'KeyX' || code === 'ShiftLeft' || code === 'ShiftRight') {
          dashJustPressed = true;
        }
        if (code === 'KeyL' || code === 'KeyC') {
          specialJustPressed = true;
        }
        if (code === 'KeyE') {
          interactJustPressed = true;
        }
      }
      keys[code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Helper functions for particles and floating texts
    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      count: number,
      speed = 160,
      size = 4,
      gravity = 320
    ) => {
      const mult = saveRef.current.settings.particlesQuality === 'high' ? 1 : 0.5;
      const finalCount = Math.max(2, Math.round(count * mult));
      for (let i = 0; i < finalCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 40,
          size: size * (0.7 + Math.random() * 0.6),
          color,
          alpha: 1,
          life: 0.35 + Math.random() * 0.35,
          maxLife: 0.7,
          gravity,
          glow: true,
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#FBBF24', size = 16) => {
      floatingTexts.push({
        id: `${Date.now()}_${Math.random()}`,
        x,
        y,
        vy: -55,
        text,
        color,
        size,
        life: 0.95,
        maxLife: 0.95,
      });
    };

    const applyDamageToPlayer = (amount: number, sourceName: string) => {
      if (isDemoMode || levelFinished) return;
      if (player.invulnTimer > 0 || player.dashTimer > 0 || player.shieldTimer > 0) return;

      player.hp = Math.max(0, player.hp - amount);
      player.invulnTimer = 1.15;
      player.hitFlashTimer = 0.35;
      player.vy = -260;
      player.vx = -player.facing * 210;
      if (saveRef.current.settings.screenShake) {
        screenShake = 9;
      }
      soundEngine.playPlayerHurt();
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#F43F5E', 14, 210, 5);
      addFloatingText(player.x + player.w / 2, player.y - 10, `-${amount} PV`, '#F43F5E', 18);

      if (player.hp <= 0) {
        // Check if player has a Phoenix Amulet!
        if (saveRef.current.consumables.phoenixAmulet > 0) {
          player.hp = Math.round(player.maxHp * 0.75);
          player.invulnTimer = 2.5;
          onPhoenixReviveUsed();
          soundEngine.playSpecialPower();
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#F59E0B', 32, 260, 6);
          addFloatingText(player.x + player.w / 2, player.y - 30, 'AMULETO DA FÊNIX: RENASCIDO!', '#FDE047', 20);
          onToastMessage('O Amuleto da Fênix salvou sua vida!', '#F59E0B');
        } else {
          levelFinished = true;
          soundEngine.playGameOver();
          onPlayerDefeated(sourceName);
        }
      }
    };

    // Track previous virtual button states for edge-triggered actions
    let prevVirtualJump = false;
    let prevVirtualAttack = false;
    let prevVirtualDash = false;
    let prevVirtualSpecial = false;
    let prevVirtualInteract = false;

    let lastTime = performance.now();
    let animFrameId = 0;
    let telemetryTick = 0;

    const update = (dt: number) => {
      if (pausedRef.current || levelFinished) return;

      // Handle external Potion / Elixir triggers from HUD
      if (consumePotionTrigger !== lastPotionTriggerRef.current) {
        lastPotionTriggerRef.current = consumePotionTrigger;
        if (player.hp < player.maxHp) {
          const heal = Math.round(player.maxHp * 0.55);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          soundEngine.playSpecialPower();
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#10B981', 20, 180, 5);
          addFloatingText(player.x + player.w / 2, player.y - 20, `+${heal} PV`, '#10B981', 18);
        }
      }
      if (consumeElixirTrigger !== lastElixirTriggerRef.current) {
        lastElixirTriggerRef.current = consumeElixirTrigger;
        player.powerElixirTimer = 15.0;
        soundEngine.playSpecialPower();
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#F59E0B', 22, 200, 5);
        addFloatingText(player.x + player.w / 2, player.y - 20, 'FUROR ARCANO (+50% DANO)!', '#F59E0B', 18);
      }

      if (hitStopTimer > 0) {
        hitStopTimer -= dt;
        return;
      }

      levelElapsedSeconds += dt;
      player.animTime += dt;
      if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 28);
      if (comboHitDecay > 0) {
        comboHitDecay -= dt;
        if (comboHitDecay <= 0) comboHits = 0;
      }

      // Check virtual controls edge triggers
      const vInput = virtualInputRef.current;
      if (vInput.jump && !prevVirtualJump) jumpJustPressed = true;
      if (vInput.attack && !prevVirtualAttack) attackJustPressed = true;
      if (vInput.dash && !prevVirtualDash) dashJustPressed = true;
      if (vInput.special && !prevVirtualSpecial) specialJustPressed = true;
      if (vInput.interact && !prevVirtualInteract) interactJustPressed = true;
      prevVirtualJump = vInput.jump;
      prevVirtualAttack = vInput.attack;
      prevVirtualDash = vInput.dash;
      prevVirtualSpecial = vInput.special;
      prevVirtualInteract = vInput.interact;

      // Demo AI mode for Title Screen background
      let moveLeft = keys['ArrowLeft'] || keys['KeyA'] || vInput.left;
      let moveRight = keys['ArrowRight'] || keys['KeyD'] || vInput.right;
      let jumpHeld = keys['Space'] || keys['KeyW'] || keys['ArrowUp'] || vInput.jump;

      if (isDemoMode) {
        moveRight = true;
        moveLeft = false;
        jumpHeld = true;
        if (Math.sin(levelElapsedSeconds * 3.2) > 0.85 && player.grounded) {
          jumpJustPressed = true;
        }
        if (Math.sin(levelElapsedSeconds * 5.5) > 0.92) {
          attackJustPressed = true;
        }
        if (player.x > blueprint.width - 650 || player.y > 700) {
          player.x = blueprint.spawnX;
          player.y = blueprint.spawnY;
          player.vy = 0;
        }
      }

      // Cooldown timers
      player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
      player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.dashCooldown = Math.max(0, player.dashCooldown - dt);
      player.attackTimer = Math.max(0, player.attackTimer - dt);
      player.attackCooldown = Math.max(0, player.attackCooldown - dt);
      player.comboResetTimer = Math.max(0, player.comboResetTimer - dt);
      player.specialCooldown = Math.max(0, player.specialCooldown - dt);
      player.invulnTimer = Math.max(0, player.invulnTimer - dt);
      player.shieldTimer = Math.max(0, player.shieldTimer - dt);
      player.bladeStormTimer = Math.max(0, player.bladeStormTimer - dt);
      player.powerElixirTimer = Math.max(0, player.powerElixirTimer - dt);
      player.hitFlashTimer = Math.max(0, player.hitFlashTimer - dt);

      if (jumpJustPressed) {
        player.jumpBufferTimer = 0.13;
        jumpJustPressed = false;
      }

      // Update moving, crumbling, and phasing platforms
      for (const plat of blueprint.platforms) {
        if (plat.kind === 'moving' && plat.startX !== undefined && plat.startY !== undefined) {
          const phase = (plat.movePhase || 0) + levelElapsedSeconds * (plat.moveSpeed || 1.5);
          const prevX = plat.x;
          const prevY = plat.y;
          plat.x = plat.startX + Math.sin(phase) * (plat.moveRangeX || 0);
          plat.y = plat.startY + Math.cos(phase) * (plat.moveRangeY || 0);
          // Carry player if standing on this moving platform
          if (
            player.grounded &&
            player.x + player.w > plat.x - 4 &&
            player.x < plat.x + plat.w + 4 &&
            Math.abs(player.y + player.h - prevY) < 10
          ) {
            player.x += plat.x - prevX;
            player.y += plat.y - prevY;
          }
        } else if (plat.kind === 'phasing') {
          const cycle = (levelElapsedSeconds + (plat.phaseOffset || 0)) % 3.6;
          plat.isVisiblePhase = cycle < 2.4;
        } else if (plat.kind === 'crumbling') {
          if (plat.isCrumbled) {
            plat.respawnTimer = (plat.respawnTimer || 0) - dt;
            if ((plat.respawnTimer || 0) <= 0) {
              plat.isCrumbled = false;
              plat.crumbleTimer = 0;
            }
          } else if ((plat.crumbleTimer || 0) > 0) {
            plat.crumbleTimer = (plat.crumbleTimer || 0) + dt;
            if ((plat.crumbleTimer || 0) > 0.55) {
              plat.isCrumbled = true;
              plat.respawnTimer = 2.8;
              spawnParticles(plat.x + plat.w / 2, plat.y + 10, blueprint.world.platformTop, 10, 120, 4);
            }
          }
        }
      }

      // Horizontal Movement & Dash
      if (dashJustPressed && player.dashCooldown <= 0 && player.dashTimer <= 0) {
        dashJustPressed = false;
        player.dashTimer = 0.17;
        player.dashCooldown = dashCooldownMax;
        player.vy = 0;
        player.vx = player.facing * 720;
        soundEngine.playDash();
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, heroSkin.capeColor, 10, 140, 4, 0);
      }
      dashJustPressed = false;

      if (player.dashTimer > 0) {
        player.vx = player.facing * 700;
        player.vy = 0;
        if (Math.random() < 0.65) {
          player.afterimages.push({
            x: player.x,
            y: player.y,
            facing: player.facing,
            alpha: 0.65,
            color: heroSkin.bladeColor,
          });
        }
        // Dash mastery damages enemies passed through!
        if (upg.dashMastery >= 2) {
          for (const enemy of blueprint.enemies) {
            if (
              enemy.hp > 0 &&
              enemy.hitFlashTimer <= 0 &&
              player.x < enemy.x + enemy.w &&
              player.x + player.w > enemy.x &&
              player.y < enemy.y + enemy.h &&
              player.y + player.h > enemy.y
            ) {
              const dashDmg = Math.round(baseAttackDamage * 0.55);
              enemy.hp -= dashDmg;
              enemy.hitFlashTimer = 0.22;
              addFloatingText(enemy.x + enemy.w / 2, enemy.y - 10, `-${dashDmg}`, '#C084FC', 15);
            }
          }
        }
      } else {
        const targetSpeed = player.inQuicksand ? moveSpeed * 0.52 : moveSpeed;
        const accel = player.onIce ? 6.5 : player.grounded ? 18 : 13;
        if (moveLeft && !moveRight) {
          player.facing = -1;
          player.vx += (-targetSpeed - player.vx) * Math.min(1, accel * dt);
        } else if (moveRight && !moveLeft) {
          player.facing = 1;
          player.vx += (targetSpeed - player.vx) * Math.min(1, accel * dt);
        } else {
          const friction = player.onIce ? 2.2 : player.grounded ? 16 : 6;
          player.vx *= Math.max(0, 1 - friction * dt);
          if (Math.abs(player.vx) < 4) player.vx = 0;
        }
      }

      // Jump & Double Jump Execution (with Coyote Time & Jump Buffer)
      if (player.jumpBufferTimer > 0) {
        if (player.coyoteTimer > 0 || player.inQuicksand) {
          player.vy = player.inQuicksand ? jumpVelocity * 0.85 : jumpVelocity;
          player.grounded = false;
          player.coyoteTimer = 0;
          player.jumpBufferTimer = 0;
          player.jumpsRemaining = player.maxJumps - 1;
          soundEngine.playJump(false);
          spawnParticles(player.x + player.w / 2, player.y + player.h, '#E2E8F0', 7, 90, 3, 100);
        } else if (player.jumpsRemaining > 0) {
          player.vy = doubleJumpVelocity;
          player.jumpsRemaining--;
          player.jumpBufferTimer = 0;
          soundEngine.playJump(true);
          spawnParticles(player.x + player.w / 2, player.y + player.h, '#38BDF8', 14, 150, 4, 40);
          addFloatingText(player.x + player.w / 2, player.y + player.h, 'PULO DUPLO!', '#38BDF8', 12);
        }
      }

      // Variable jump height when releasing jump key early
      if (!jumpHeld && player.vy < -220) {
        player.vy *= 0.88;
      }

      // Gravity
      if (player.dashTimer <= 0) {
        const gravity = player.inQuicksand ? 420 : 1380;
        player.vy = Math.min(860, player.vy + gravity * dt);
      }

      // Wind Uplift Zones
      for (const prop of blueprint.props) {
        if (
          prop.kind === 'wind_zone' &&
          player.x + player.w > prop.x &&
          player.x < prop.x + prop.w &&
          player.y + player.h > prop.y &&
          player.y < prop.y + prop.h
        ) {
          player.vy = Math.max(-460, player.vy - 2100 * dt);
          player.jumpsRemaining = player.maxJumps;
        }
      }

      // Apply Horizontal Velocity & Platform Collisions
      player.x += player.vx * dt;
      player.x = Math.max(16, Math.min(blueprint.width - player.w - 16, player.x));

      // Check illusory secret walls!
      for (const plat of blueprint.platforms) {
        if (plat.kind === 'secret_wall' && !plat.revealed) {
          if (
            player.x + player.w > plat.x &&
            player.x < plat.x + plat.w &&
            player.y + player.h > plat.y &&
            player.y < plat.y + plat.h
          ) {
            plat.revealed = true;
            soundEngine.playSecretDiscovered();
            spawnParticles(plat.x + plat.w / 2, plat.y + plat.h / 2, '#FDE047', 28, 220, 5);
            addFloatingText(plat.x + plat.w / 2, plat.y, 'PASSAGEM SECRETA DESCOBERTA!', '#FDE047', 17);
            onToastMessage('Você descobriu uma Passagem Secreta!', '#FDE047');
          }
        }
      }

      // Apply Vertical Velocity & Platform Landing
      const prevBottom = player.y + player.h;
      player.y += player.vy * dt;
      player.grounded = false;
      player.onIce = false;
      player.inQuicksand = false;

      for (const plat of blueprint.platforms) {
        if (plat.kind === 'secret_wall') continue;
        if (plat.kind === 'crumbling' && plat.isCrumbled) continue;
        if (plat.kind === 'phasing' && plat.isVisiblePhase === false) continue;
        if (plat.kind === 'gate' && plat.isOpen) continue;

        // Gate solid horizontal block
        if (plat.kind === 'gate' && !plat.isOpen) {
          if (
            player.x + player.w > plat.x &&
            player.x < plat.x + plat.w &&
            player.y + player.h > plat.y &&
            player.y < plat.y + plat.h
          ) {
            if (player.vx > 0) player.x = plat.x - player.w;
            else if (player.vx < 0) player.x = plat.x + plat.w;
          }
          continue;
        }

        const withinX = player.x + player.w - 4 > plat.x && player.x + 4 < plat.x + plat.w;
        if (withinX && player.vy >= 0 && prevBottom <= plat.y + 18 && player.y + player.h >= plat.y) {
          if (plat.kind === 'bouncy') {
            player.y = plat.y - player.h;
            player.vy = -790;
            player.grounded = false;
            player.jumpsRemaining = player.maxJumps;
            soundEngine.playSpringBounce();
            spawnParticles(player.x + player.w / 2, plat.y, '#4ADE80', 14, 180, 4);
            addFloatingText(plat.x + plat.w / 2, plat.y - 12, 'SUPER IMPULSO!', '#4ADE80', 13);
          } else if (plat.kind === 'quicksand') {
            player.inQuicksand = true;
            player.coyoteTimer = 0.12;
            player.jumpsRemaining = player.maxJumps;
            if (player.y + player.h > plat.y + 22) {
              player.y = plat.y + 22 - player.h;
              player.vy = 0;
              player.grounded = true;
            }
          } else {
            player.y = plat.y - player.h;
            player.vy = 0;
            player.grounded = true;
            player.coyoteTimer = 0.12;
            player.jumpsRemaining = player.maxJumps;
            if (plat.kind === 'ice') player.onIce = true;
            if (plat.kind === 'conveyor' && plat.conveyorSpeed) {
              player.x += plat.conveyorSpeed * dt;
            }
            if (plat.kind === 'crumbling' && !plat.crumbleTimer) {
              plat.crumbleTimer = 0.01;
            }
          }
        }
      }

      // Fall into bottom pit recovery or damage
      if (player.y > blueprint.height + 40) {
        player.x = Math.max(80, player.x - 160);
        player.y = 220;
        player.vy = 0;
        applyDamageToPlayer(20, 'Queda no Abismo');
      }

      // Sword Attack Combo (3-Hit Combo + Arcane Slash Wave on 3rd hit!)
      if (attackJustPressed && player.attackCooldown <= 0) {
        attackJustPressed = false;
        player.comboStep = player.comboResetTimer > 0 ? (player.comboStep % 3) + 1 : 1;
        player.comboResetTimer = 0.75;
        player.attackTimer = 0.18;
        player.attackCooldown = 0.22;
        soundEngine.playSwordSlash(player.comboStep);

        const elixirMult = player.powerElixirTimer > 0 ? 1.5 : 1;
        const comboMult = player.comboStep === 3 ? 1.55 : player.comboStep === 2 ? 1.2 : 1.0;
        const swingDamage = Math.round(baseAttackDamage * comboMult * elixirMult);

        // If 3rd combo step, also fire a short energy wave!
        if (player.comboStep === 3) {
          projectiles.push({
            id: `slash_wave_${Date.now()}`,
            x: player.facing === 1 ? player.x + player.w + 8 : player.x - 8,
            y: player.y + player.h * 0.45,
            vx: player.facing * 560,
            vy: 0,
            radius: 16,
            damage: Math.round(swingDamage * 0.65),
            fromPlayer: true,
            color: heroSkin.bladeColor,
            life: 0.45,
            piercing: true,
          });
        }

        // Melee Hitbox check against enemies, chests, levers, shrines, and boss
        const reach = 74;
        const hitX = player.facing === 1 ? player.x + player.w - 6 : player.x - reach + 6;
        const hitY = player.y - 12;
        const hitW = reach;
        const hitH = player.h + 24;

        for (const enemy of blueprint.enemies) {
          if (enemy.hp <= 0) continue;
          if (
            hitX < enemy.x + enemy.w &&
            hitX + hitW > enemy.x &&
            hitY < enemy.y + enemy.h &&
            hitY + hitH > enemy.y
          ) {
            enemy.hp -= swingDamage;
            enemy.hitFlashTimer = 0.18;
            enemy.vx = player.facing * 160;
            if (heroSkin.slowOnHit) enemy.slowTimer = 2.5;
            comboHits++;
            comboHitDecay = 2.2;
            hitStopTimer = 0.028;
            if (saveRef.current.settings.screenShake) screenShake = player.comboStep === 3 ? 6 : 3.5;

            spawnParticles(
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 2,
              heroSkin.bladeColor,
              10,
              190,
              4
            );
            addFloatingText(
              enemy.x + enemy.w / 2,
              enemy.y - 8,
              player.comboStep === 3 ? `CRÍTICO -${swingDamage}!` : `-${swingDamage}`,
              player.comboStep === 3 ? '#FDE047' : '#F8FAFC',
              player.comboStep === 3 ? 18 : 15
            );

            if (enemy.hp <= 0) {
              enemiesDefeatedCount++;
              soundEngine.playEnemyHit(true);
              spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.colorPrimary, 20, 240, 5);
              // Drop coins on defeat
              for (let c = 0; c < 3; c++) {
                blueprint.coins.push({
                  id: `drop_${enemy.id}_${c}`,
                  x: enemy.x + (c - 1) * 18,
                  y: enemy.y,
                  baseY: enemy.y,
                  value: Math.ceil(enemy.coinValue / 3),
                  collected: false,
                  magnetized: true,
                });
              }
            } else {
              soundEngine.playEnemyHit(false);
            }
          }
        }

        // Hit Boss
        if (blueprint.boss && blueprint.boss.hp > 0 && blueprint.boss.invulnTimer <= 0) {
          const b = blueprint.boss;
          if (hitX < b.x + b.w && hitX + hitW > b.x && hitY < b.y + b.h && hitY + hitH > b.y) {
            b.hp = Math.max(0, b.hp - swingDamage);
            b.hitFlashTimer = 0.16;
            comboHits++;
            comboHitDecay = 2.2;
            hitStopTimer = 0.03;
            if (saveRef.current.settings.screenShake) screenShake = 5;
            soundEngine.playEnemyHit(b.hp <= 0);
            spawnParticles(b.x + b.w / 2, b.y + b.h / 2, heroSkin.bladeColor, 14, 210, 5);
            addFloatingText(
              b.x + b.w / 2,
              b.y - 12,
              player.comboStep === 3 ? `CRÍTICO -${swingDamage}!` : `-${swingDamage}`,
              '#FDE047',
              18
            );
          }
        }

        // Sword swing also opens chests & activates levers!
        interactJustPressed = true;
      }
      attackJustPressed = false;

      // Special Power Execution (Key L / C or Button)
      if (specialJustPressed && player.specialCooldown <= 0) {
        specialJustPressed = false;
        player.specialCooldown = specialCooldownMax;
        soundEngine.playSpecialPower();
        if (saveRef.current.settings.screenShake) screenShake = 7;

        const powerMult = (1 + upg.specialPowerMastery * 0.2) * (player.powerElixirTimer > 0 ? 1.5 : 1);
        const specialDmg = Math.round(baseAttackDamage * 2.3 * powerMult);

        if (selectedPower.id === 'solar_wave') {
          projectiles.push({
            id: `solar_${Date.now()}`,
            x: player.x + player.w / 2,
            y: player.y + player.h / 2,
            vx: player.facing * 640,
            vy: 0,
            radius: 28,
            damage: specialDmg,
            fromPlayer: true,
            color: '#38BDF8',
            life: 1.2,
            piercing: true,
          });
          addFloatingText(player.x + player.w / 2, player.y - 18, 'ONDA ARCANA SOLAR!', '#38BDF8', 17);
        } else if (selectedPower.id === 'blade_storm') {
          player.bladeStormTimer = 3.5;
          addFloatingText(player.x + player.w / 2, player.y - 18, 'TEMPESTADE DE LÂMINAS!', '#F59E0B', 17);
        } else if (selectedPower.id === 'celestial_shield') {
          player.shieldTimer = 4.5;
          const heal = 30 + upg.specialPowerMastery * 6;
          player.hp = Math.min(player.maxHp, player.hp + heal);
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#10B981', 24, 190, 5);
          addFloatingText(player.x + player.w / 2, player.y - 18, `ÉGIDE CELESTIAL (+${heal} PV)!`, '#10B981', 17);
        } else if (selectedPower.id === 'star_rain') {
          addFloatingText(player.x + player.w / 2, player.y - 18, 'CHUVA DE METEOROS ASTRAIS!', '#EC4899', 17);
          for (let m = 0; m < 7; m++) {
            projectiles.push({
              id: `meteor_${Date.now()}_${m}`,
              x: camera.x + 120 + m * 155,
              y: 20 - m * 45,
              vx: (Math.random() - 0.5) * 90,
              vy: 540,
              radius: 22,
              damage: Math.round(specialDmg * 0.9),
              fromPlayer: true,
              color: '#EC4899',
              life: 1.8,
              piercing: true,
            });
          }
        }
      }
      specialJustPressed = false;

      // Active Blade Storm Aura damage
      if (player.bladeStormTimer > 0) {
        const stormRadius = 95;
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;
        for (const enemy of blueprint.enemies) {
          if (enemy.hp > 0 && enemy.hitFlashTimer <= 0) {
            const dist = Math.hypot(enemy.x + enemy.w / 2 - cx, enemy.y + enemy.h / 2 - cy);
            if (dist < stormRadius) {
              const dmg = Math.round(baseAttackDamage * 0.65);
              enemy.hp -= dmg;
              enemy.hitFlashTimer = 0.2;
              addFloatingText(enemy.x + enemy.w / 2, enemy.y - 8, `-${dmg}`, '#F59E0B', 14);
              if (enemy.hp <= 0) {
                enemiesDefeatedCount++;
                soundEngine.playEnemyHit(true);
              }
            }
          }
        }
        if (blueprint.boss && blueprint.boss.hp > 0 && blueprint.boss.hitFlashTimer <= 0) {
          const b = blueprint.boss;
          const dist = Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy);
          if (dist < stormRadius + b.w / 2) {
            const dmg = Math.round(baseAttackDamage * 0.55);
            b.hp = Math.max(0, b.hp - dmg);
            b.hitFlashTimer = 0.22;
            addFloatingText(b.x + b.w / 2, b.y - 10, `-${dmg}`, '#F59E0B', 15);
          }
        }
      }

      // Collect Coins & Magnet Attraction
      const pCenterX = player.x + player.w / 2;
      const pCenterY = player.y + player.h / 2;
      const goldMultiplier = 1 + upg.coinMagnet * 0.08;

      for (const coin of blueprint.coins) {
        if (coin.collected) continue;
        const dist = Math.hypot(coin.x - pCenterX, coin.y - pCenterY);
        if (dist < coinMagnetRadius || coin.magnetized) {
          coin.magnetized = true;
          const dx = pCenterX - coin.x;
          const dy = pCenterY - coin.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          coin.x += (dx / len) * 520 * dt;
          coin.y += (dy / len) * 520 * dt;
        } else {
          coin.y = coin.baseY + Math.sin(levelElapsedSeconds * 4 + coin.x * 0.03) * 5;
        }

        if (dist < 32) {
          coin.collected = true;
          const val = Math.round(coin.value * goldMultiplier);
          coinsCollectedValue += val;
          coinsCollectedCount++;
          soundEngine.playCoin(coin.isGem);
          spawnParticles(coin.x, coin.y, coin.isGem ? '#38BDF8' : '#FBBF24', 8, 120, 3.5);
          addFloatingText(coin.x, coin.y - 10, `+${val}`, coin.isGem ? '#38BDF8' : '#FDE047', coin.isGem ? 16 : 13);
        }
      }

      // Chests & Interactive Props (Auto-open on proximity or interact/attack)
      let promptText: string | null = null;

      for (const chest of blueprint.chests) {
        if (chest.isOpen) continue;
        const dist = Math.hypot(chest.x + chest.w / 2 - pCenterX, chest.y + chest.h / 2 - pCenterY);
        if (dist < 64) {
          chest.isOpen = true;
          const reward = Math.round(chest.coinReward * goldMultiplier);
          coinsCollectedValue += reward;
          if (chest.isSecret) {
            secretFound = true;
            onToastMessage(`Baú Secreto Aberto! +${reward} Moedas!`, '#FDE047');
          }
          soundEngine.playChestOpen();
          spawnParticles(chest.x + chest.w / 2, chest.y + chest.h / 2, '#FBBF24', 28, 230, 5);
          addFloatingText(chest.x + chest.w / 2, chest.y - 18, `${chest.hintText} +${reward} OURO!`, '#FDE047', 18);
        }
      }

      for (const prop of blueprint.props) {
        const dist = Math.hypot(prop.x + prop.w / 2 - pCenterX, prop.y + prop.h / 2 - pCenterY);
        if (dist < 85) {
          if (prop.kind === 'signpost' && prop.text) {
            promptText = prop.text;
          } else if (prop.kind === 'altar_double_jump' && !prop.activated) {
            promptText = prop.text || 'Altar das Asas de Vento';
            if (dist < 58 || interactJustPressed) {
              prop.activated = true;
              player.maxJumps = 2;
              player.jumpsRemaining = 2;
              onUnlockDoubleJumpAltar();
              soundEngine.playChestOpen();
              spawnParticles(prop.x + prop.w / 2, prop.y + prop.h / 2, '#38BDF8', 30, 240, 5);
              addFloatingText(prop.x + prop.w / 2, prop.y - 20, 'HABILIDADE DESPERTADA: PULO DUPLO!', '#38BDF8', 18);
            }
          } else if (prop.kind === 'shrine_heal' && !prop.activated) {
            promptText = 'Santuário de Cura: Aproxime-se ou Ataque para Restaurar Vida!';
            if ((dist < 52 && player.hp < player.maxHp) || interactJustPressed) {
              prop.activated = true;
              player.hp = player.maxHp;
              soundEngine.playSpecialPower();
              spawnParticles(prop.x + prop.w / 2, prop.y + prop.h / 2, '#10B981', 26, 200, 5);
              addFloatingText(prop.x + prop.w / 2, prop.y - 20, 'VIDA TOTALMENTE RESTAURADA!', '#10B981', 17);
            }
          } else if (prop.kind === 'lever' && !prop.activated) {
            promptText = 'Pressione E ou Ataque para acionar a Alavanca!';
            if (dist < 52 || interactJustPressed) {
              prop.activated = true;
              soundEngine.playSecretDiscovered();
              for (const p of blueprint.platforms) {
                if (p.gateId === prop.targetGateId) {
                  p.isOpen = true;
                  spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#FBBF24', 20, 180, 5);
                }
              }
              addFloatingText(prop.x + prop.w / 2, prop.y - 16, 'PORTÃO ABERTO!', '#FDE047', 16);
            }
          }
        }
      }
      interactJustPressed = false;

      // Update Hazards & Check Player Collision
      for (const haz of blueprint.hazards) {
        if (haz.kind === 'saw' && haz.startX !== undefined) {
          haz.x = haz.startX + Math.sin(levelElapsedSeconds * (haz.speed || 2)) * (haz.moveRangeX || 80);
        } else if (haz.kind === 'geyser') {
          const cycle = (levelElapsedSeconds + (haz.timer || 0)) % 3.2;
          haz.active = cycle < 1.35;
        }

        if (haz.kind === 'geyser' && !haz.active) continue;

        if (
          player.x + player.w - 8 > haz.x &&
          player.x + 8 < haz.x + haz.w &&
          player.y + player.h - 6 > haz.y &&
          player.y + 6 < haz.y + haz.h
        ) {
          applyDamageToPlayer(haz.damage, haz.kind === 'lava' || haz.kind === 'geyser' ? 'Magma Vulcânico' : 'Armadilha Mortal');
        }
      }

      // Update Enemies AI
      for (const enemy of blueprint.enemies) {
        if (enemy.hp <= 0) continue;
        enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
        enemy.stateTimer += dt;

        const speedMult = enemy.slowTimer > 0 ? 0.45 : 1;

        if (enemy.archetype === 'walker' || enemy.archetype === 'heavy') {
          enemy.x += enemy.vx * speedMult * dt;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.x = enemy.patrolMinX;
            enemy.vx = Math.abs(enemy.vx);
            enemy.facing = 1;
          } else if (enemy.x >= enemy.patrolMaxX) {
            enemy.x = enemy.patrolMaxX;
            enemy.vx = -Math.abs(enemy.vx);
            enemy.facing = -1;
          }
        } else if (enemy.archetype === 'flyer') {
          enemy.x += enemy.vx * speedMult * dt;
          enemy.y = enemy.baseY + Math.sin(enemy.stateTimer * 3.2) * 32;
          if (enemy.x <= enemy.patrolMinX || enemy.x >= enemy.patrolMaxX) {
            enemy.vx = -enemy.vx;
            enemy.facing = enemy.vx > 0 ? 1 : -1;
          }
        } else if (enemy.archetype === 'jumper') {
          enemy.x += enemy.vx * speedMult * dt;
          const jumpWave = Math.abs(Math.sin(enemy.stateTimer * 3.4));
          enemy.y = enemy.baseY - jumpWave * 68;
          if (enemy.x <= enemy.patrolMinX || enemy.x >= enemy.patrolMaxX) {
            enemy.vx = -enemy.vx;
            enemy.facing = enemy.vx > 0 ? 1 : -1;
          }
        } else if (enemy.archetype === 'shooter') {
          enemy.facing = pCenterX > enemy.x ? 1 : -1;
          enemy.attackCooldown -= dt * speedMult;
          if (enemy.attackCooldown <= 0 && Math.abs(pCenterX - enemy.x) < 560) {
            enemy.attackCooldown = 2.4;
            projectiles.push({
              id: `eproj_${Date.now()}_${enemy.id}`,
              x: enemy.x + enemy.w / 2,
              y: enemy.y + enemy.h * 0.45,
              vx: enemy.facing * 310,
              vy: 0,
              radius: 9,
              damage: enemy.damage,
              fromPlayer: false,
              color: '#F43F5E',
              life: 2.2,
            });
          }
        }

        // Contact damage with Player
        if (
          player.x + player.w - 6 > enemy.x &&
          player.x + 6 < enemy.x + enemy.w &&
          player.y + player.h - 6 > enemy.y &&
          player.y + 6 < enemy.y + enemy.h
        ) {
          applyDamageToPlayer(enemy.damage, enemy.name);
        }
      }

      // Update Boss State Machine
      const boss: BossEntity | null = blueprint.boss;
      if (boss && boss.hp > 0) {
        boss.hitFlashTimer = Math.max(0, boss.hitFlashTimer - dt);
        boss.invulnTimer = Math.max(0, boss.invulnTimer - dt);
        boss.stateTimer -= dt;

        // Check Phase 2 Enrage at 50% HP
        if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) {
          boss.phase = 2;
          boss.invulnTimer = 1.0;
          if (saveRef.current.settings.screenShake) screenShake = 12;
          soundEngine.playSpecialPower();
          spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.eyeColor, 40, 290, 6);
          addFloatingText(boss.x + boss.w / 2, boss.y - 30, `${boss.name}: MODO FÚRIA (FASE 2)!`, '#F43F5E', 20);
          onToastMessage(`${boss.name} entrou no Modo Fúria!`, '#F43F5E');
        }

        const phaseSpeedMult = boss.phase === 2 ? 1.35 : 1.0;

        if (boss.state === 'idle') {
          boss.facing = pCenterX > boss.x + boss.w / 2 ? 1 : -1;
          // Gently hover or patrol toward player
          const targetDir = pCenterX > boss.x + boss.w / 2 ? 1 : -1;
          boss.x += targetDir * 75 * phaseSpeedMult * dt;
          boss.x = Math.max(boss.arenaMinX, Math.min(boss.arenaMaxX - boss.w, boss.x));

          if (boss.stateTimer <= 0) {
            const patterns = blueprint.world.boss.attackPatterns;
            boss.currentAttack = patterns[boss.attackIndex % patterns.length];
            boss.attackIndex++;
            boss.state = 'telegraph';
            boss.stateTimer = boss.phase === 2 ? 0.75 : 1.05;
          }
        } else if (boss.state === 'telegraph') {
          boss.facing = pCenterX > boss.x + boss.w / 2 ? 1 : -1;
          if (boss.stateTimer <= 0) {
            boss.state = 'attacking';
            boss.stateTimer = 1.2;

            const bx = boss.x + boss.w / 2;
            const by = boss.y + boss.h / 2;

            if (boss.currentAttack === 'charge') {
              boss.vx = boss.facing * 540 * phaseSpeedMult;
              soundEngine.playDash();
            } else if (boss.currentAttack === 'projectiles') {
              const count = boss.phase === 2 ? 5 : 3;
              for (let i = 0; i < count; i++) {
                const spreadAngle = (i - (count - 1) / 2) * 0.24;
                const dirAngle = boss.facing === 1 ? spreadAngle : Math.PI - spreadAngle;
                projectiles.push({
                  id: `boss_proj_${Date.now()}_${i}`,
                  x: bx,
                  y: by,
                  vx: Math.cos(dirAngle) * 380 * phaseSpeedMult,
                  vy: Math.sin(dirAngle) * 380 * phaseSpeedMult,
                  radius: 13,
                  damage: 18 + blueprint.world.id * 3,
                  fromPlayer: false,
                  color: boss.eyeColor,
                  life: 2.8,
                });
              }
              soundEngine.playSwordSlash(3);
            } else if (boss.currentAttack === 'shockwave') {
              if (saveRef.current.settings.screenShake) screenShake = 10;
              soundEngine.playEnemyHit(true);
              [-1, 1].forEach((dir) => {
                projectiles.push({
                  id: `boss_wave_${Date.now()}_${dir}`,
                  x: bx,
                  y: boss.groundY - 18,
                  vx: dir * 420 * phaseSpeedMult,
                  vy: 0,
                  radius: 18,
                  damage: 20 + blueprint.world.id * 3,
                  fromPlayer: false,
                  color: boss.primaryColor,
                  life: 2.6,
                });
              });
            } else if (boss.currentAttack === 'rain' || boss.currentAttack === 'laser') {
              const drops = boss.phase === 2 ? 6 : 4;
              for (let r = 0; r < drops; r++) {
                projectiles.push({
                  id: `boss_rain_${Date.now()}_${r}`,
                  x: 180 + r * 260 + (Math.random() * 80 - 40),
                  y: 60,
                  vx: 0,
                  vy: 360 * phaseSpeedMult,
                  radius: 15,
                  damage: 20 + blueprint.world.id * 3,
                  fromPlayer: false,
                  color: boss.eyeColor,
                  life: 2.5,
                });
              }
              soundEngine.playSpecialPower();
            } else if (boss.currentAttack === 'summon') {
              blueprint.enemies.push({
                id: `minion_${Date.now()}`,
                name: blueprint.world.enemyNames[0],
                archetype: 'walker',
                x: Math.max(150, Math.min(1400, bx + boss.facing * 160)),
                y: boss.groundY - 42,
                w: 40,
                h: 42,
                vx: boss.facing * 110,
                vy: 0,
                hp: 45 + blueprint.world.id * 10,
                maxHp: 45 + blueprint.world.id * 10,
                damage: 15 + blueprint.world.id * 2,
                patrolMinX: 110,
                patrolMaxX: 1600,
                baseY: boss.groundY - 42,
                facing: boss.facing,
                stateTimer: 0,
                attackCooldown: 2,
                hitFlashTimer: 0,
                slowTimer: 0,
                coinValue: 15,
                colorPrimary: boss.primaryColor,
                colorSecondary: boss.eyeColor,
              });
            }
          }
        } else if (boss.state === 'attacking') {
          if (boss.currentAttack === 'charge') {
            boss.x += boss.vx * dt;
            if (boss.x <= boss.arenaMinX || boss.x + boss.w >= boss.arenaMaxX) {
              boss.vx = 0;
              boss.x = Math.max(boss.arenaMinX, Math.min(boss.arenaMaxX - boss.w, boss.x));
            }
          }
          if (boss.stateTimer <= 0) {
            boss.vx = 0;
            boss.state = 'recover';
            boss.stateTimer = boss.phase === 2 ? 0.9 : 1.35;
          }
        } else if (boss.state === 'recover') {
          if (boss.stateTimer <= 0) {
            boss.state = 'idle';
            boss.stateTimer = boss.phase === 2 ? 1.1 : 1.6;
          }
        }

        // Boss contact damage with Player
        if (
          player.x + player.w - 10 > boss.x &&
          player.x + 10 < boss.x + boss.w &&
          player.y + player.h - 10 > boss.y &&
          player.y + 10 < boss.y + boss.h
        ) {
          applyDamageToPlayer(22 + blueprint.world.id * 3, boss.name);
        }

        // Check if Boss just reached 0 HP!
        if (boss.hp <= 0 && boss.state !== 'defeated') {
          boss.state = 'defeated';
          if (saveRef.current.settings.screenShake) screenShake = 16;
          soundEngine.playVictory();
          spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FDE047', 60, 340, 7);
          addFloatingText(boss.x + boss.w / 2, boss.y - 30, `CHEFÃO DERROTADO: ${boss.name}!`, '#FDE047', 22);
          onToastMessage(`Vitória Épica! O Portal Dimensional foi aberto!`, '#10B981');
          // Shower of boss coins
          for (let c = 0; c < 18; c++) {
            blueprint.coins.push({
              id: `boss_loot_${c}`,
              x: boss.x + boss.w / 2 + (Math.random() - 0.5) * 260,
              y: boss.y + (Math.random() - 0.5) * 80,
              baseY: boss.groundY - 40,
              value: 15 + blueprint.world.id * 5,
              collected: false,
              isGem: c % 3 === 0,
              magnetized: true,
            });
          }
        }
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life -= dt;

        if (proj.fromPlayer) {
          for (const enemy of blueprint.enemies) {
            if (enemy.hp <= 0) continue;
            if (
              proj.x + proj.radius > enemy.x &&
              proj.x - proj.radius < enemy.x + enemy.w &&
              proj.y + proj.radius > enemy.y &&
              proj.y - proj.radius < enemy.y + enemy.h
            ) {
              enemy.hp -= proj.damage;
              enemy.hitFlashTimer = 0.16;
              spawnParticles(proj.x, proj.y, proj.color, 8, 150, 4);
              addFloatingText(enemy.x + enemy.w / 2, enemy.y - 10, `-${proj.damage}`, proj.color, 15);
              if (enemy.hp <= 0) {
                enemiesDefeatedCount++;
                soundEngine.playEnemyHit(true);
              }
              if (!proj.piercing) {
                proj.life = 0;
                break;
              }
            }
          }
          if (boss && boss.hp > 0 && boss.invulnTimer <= 0 && proj.life > 0) {
            if (
              proj.x + proj.radius > boss.x &&
              proj.x - proj.radius < boss.x + boss.w &&
              proj.y + proj.radius > boss.y &&
              proj.y - proj.radius < boss.y + boss.h
            ) {
              boss.hp = Math.max(0, boss.hp - proj.damage);
              boss.hitFlashTimer = 0.15;
              boss.invulnTimer = 0.12;
              spawnParticles(proj.x, proj.y, proj.color, 10, 170, 4);
              addFloatingText(boss.x + boss.w / 2, boss.y - 15, `-${proj.damage}`, proj.color, 17);
              if (!proj.piercing) proj.life = 0;
            }
          }
        } else {
          // Enemy/Boss projectile hitting Player
          if (
            proj.x + proj.radius > player.x + 6 &&
            proj.x - proj.radius < player.x + player.w - 6 &&
            proj.y + proj.radius > player.y + 6 &&
            proj.y - proj.radius < player.y + player.h - 6
          ) {
            proj.life = 0;
            applyDamageToPlayer(proj.damage, boss ? boss.name : 'Projétil Inimigo');
          }
        }

        if (proj.life <= 0) {
          projectiles.splice(i, 1);
        }
      }

      // Check Level Exit Portal (Active if not boss level OR boss is defeated!)
      const portalUnlocked = !boss || boss.hp <= 0;
      if (!isDemoMode && portalUnlocked) {
        const distToPortal = Math.hypot(
          player.x + player.w / 2 - blueprint.portalX,
          player.y + player.h / 2 - (blueprint.portalY + 45)
        );
        if (distToPortal < 58) {
          levelFinished = true;
          soundEngine.playVictory();
          onLevelComplete({
            levelNumber,
            coinsCollected: coinsCollectedValue + blueprint.meta.baseCoinReward,
            totalCoinsAvailable: Math.max(1, totalCoinsCount),
            secretFound,
            enemiesDefeated: enemiesDefeatedCount,
            bossDefeated: Boolean(boss && boss.hp <= 0),
            timeSeconds: Math.round(levelElapsedSeconds),
            hpRemainingRatio: player.hp / player.maxHp,
          });
        }
      }

      // Update Particles, Afterimages & Floating Texts
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) particles.splice(i, 1);
      }

      for (let i = player.afterimages.length - 1; i >= 0; i--) {
        player.afterimages[i].alpha -= dt * 3.8;
        if (player.afterimages[i].alpha <= 0) player.afterimages.splice(i, 1);
      }

      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      // Smooth Camera Follow with Lookahead
      const viewW = canvas.width;
      const targetCamX = player.x + player.w / 2 - viewW * 0.38 + player.facing * 85;
      camera.x += (targetCamX - camera.x) * Math.min(1, 7.5 * dt);
      camera.x = Math.max(0, Math.min(Math.max(0, blueprint.width - viewW), camera.x));

      // Throttle HUD telemetry updates to ~15fps for React HUD smoothness
      telemetryTick += dt;
      if (telemetryTick >= 0.065) {
        telemetryTick = 0;
        onTelemetryUpdate({
          hp: player.hp,
          maxHp: player.maxHp,
          coinsInLevel: coinsCollectedValue,
          totalCoinsInLevel: totalCoinsCount,
          secretFoundInLevel: secretFound,
          specialCooldownRatio: player.specialCooldown / specialCooldownMax,
          dashCooldownRatio: player.dashCooldown / dashCooldownMax,
          powerElixirActive: player.powerElixirTimer > 0,
          bossHp: boss && boss.hp > 0 ? boss.hp : null,
          bossMaxHp: boss ? boss.maxHp : null,
          bossName: boss && boss.hp > 0 ? boss.name : null,
          bossTitle: boss && boss.hp > 0 ? boss.title : null,
          bossPhase: boss ? boss.phase : 1,
          bossTip: boss && boss.hp > 0 ? boss.strategyTip : null,
          activePromptText: promptText,
          comboCount: comboHits,
        });
      }
    };

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const world = blueprint.world;

      ctx.save();

      // Screen shake offset
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake * 2, (Math.random() - 0.5) * screenShake * 2);
      }

      // 1. Sky Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, world.skyTop);
      skyGrad.addColorStop(1, world.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Celestial Body / Biome Backdrop Feature
      ctx.save();
      if (world.biome === 'desert') {
        // Solar Eclipse with golden corona
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.beginPath();
        ctx.arc(w * 0.75, h * 0.22, 76, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0B0914';
        ctx.beginPath();
        ctx.arc(w * 0.75, h * 0.22, 58, 0, Math.PI * 2);
        ctx.fill();
      } else if (world.biome === 'ice') {
        // Aurora Borealis Ribbons
        for (let a = 0; a < 3; a++) {
          ctx.strokeStyle = a === 0 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(16, 185, 129, 0.18)';
          ctx.lineWidth = 38;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 60) {
            const y = 110 + a * 45 + Math.sin(x * 0.006 + levelElapsedSeconds * 0.9 + a) * 28;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (world.biome === 'dark_world') {
        // Crimson Blood Moon
        ctx.fillStyle = 'rgba(225, 29, 72, 0.26)';
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.22, 85, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#BE123C';
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.22, 56, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Radiant Mystic Moon / Sun
        ctx.fillStyle = `${world.accentColor}28`;
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.2, 72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `${world.accentColor}66`;
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.2, 44, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Distant Parallax Mountains / Pyramids / Spires (0.18x speed)
      ctx.fillStyle = 'rgba(11, 9, 20, 0.42)';
      const bgOffset1 = -(camera.x * 0.18) % 360;
      for (let i = -1; i < Math.ceil(w / 360) + 2; i++) {
        const mx = bgOffset1 + i * 360;
        ctx.beginPath();
        ctx.moveTo(mx, h);
        ctx.lineTo(mx + 180, h - 290);
        ctx.lineTo(mx + 360, h);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Midground Parallax Silhouettes (Trees / Obelisks / Pillars / Gears at 0.38x speed)
      ctx.fillStyle = 'rgba(11, 9, 20, 0.58)';
      const bgOffset2 = -(camera.x * 0.38) % 240;
      for (let i = -1; i < Math.ceil(w / 240) + 2; i++) {
        const tx = bgOffset2 + i * 240;
        if (world.biome === 'forest') {
          ctx.fillRect(tx + 95, h - 260, 26, 260);
          ctx.beginPath();
          ctx.arc(tx + 108, h - 260, 66, 0, Math.PI * 2);
          ctx.fill();
        } else if (world.biome === 'abandoned_city') {
          ctx.beginPath();
          ctx.arc(tx + 110, h - 180, 52, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(tx + 40, h);
          ctx.lineTo(tx + 120, h - 210);
          ctx.lineTo(tx + 200, h);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Vertical world-to-screen offset so ground (580) sits comfortably on any screen height
      const worldOffsetY = h - 720;
      ctx.save();
      ctx.translate(-camera.x, worldOffsetY);

      // 5. Render Wind Uplift Zones & Interactive Props
      for (const prop of blueprint.props) {
        if (prop.kind === 'wind_zone') {
          const grad = ctx.createLinearGradient(prop.x, prop.y + prop.h, prop.x, prop.y);
          grad.addColorStop(0, `${world.accentColor}44`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
          // Rising wind streaks
          ctx.strokeStyle = `${world.accentColor}AA`;
          ctx.lineWidth = 2;
          for (let s = 0; s < 4; s++) {
            const sx = prop.x + 14 + s * 18;
            const sy = prop.y + prop.h - ((levelElapsedSeconds * 220 + s * 55) % prop.h);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy - 28);
            ctx.stroke();
          }
        } else if (prop.kind === 'signpost') {
          ctx.fillStyle = '#78350F';
          ctx.fillRect(prop.x + 20, prop.y + 18, 8, 46);
          ctx.fillStyle = '#B45309';
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.fillRect(prop.x, prop.y, 48, 26);
          ctx.strokeRect(prop.x, prop.y, 48, 26);
          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('?', prop.x + 24, prop.y + 18);
        } else if (prop.kind === 'altar_double_jump' || prop.kind === 'shrine_heal') {
          const glowColor = prop.kind === 'altar_double_jump' ? '#38BDF8' : '#10B981';
          ctx.fillStyle = '#334155';
          ctx.fillRect(prop.x + 6, prop.y + 24, prop.w - 12, prop.h - 24);
          ctx.fillStyle = prop.activated ? '#64748B' : glowColor;
          ctx.beginPath();
          ctx.arc(
            prop.x + prop.w / 2,
            prop.y + 16 + Math.sin(levelElapsedSeconds * 4) * 4,
            14,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (prop.kind === 'lever') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(prop.x + 6, prop.y + 34, 28, 14);
          ctx.strokeStyle = prop.activated ? '#10B981' : '#F59E0B';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(prop.x + 20, prop.y + 36);
          ctx.lineTo(prop.activated ? prop.x + 34 : prop.x + 6, prop.y + 8);
          ctx.stroke();
        }
      }

      // 6. Render Platforms
      for (const plat of blueprint.platforms) {
        if (plat.x + plat.w < camera.x - 80 || plat.x > camera.x + w + 80) continue;
        if (plat.kind === 'crumbling' && plat.isCrumbled) continue;

        ctx.save();
        if (plat.kind === 'phasing') {
          ctx.globalAlpha = plat.isVisiblePhase ? 0.92 : 0.2;
        } else if (plat.kind === 'secret_wall') {
          ctx.globalAlpha = plat.revealed ? 0.18 : 0.94;
        }

        if (plat.kind === 'bouncy') {
          // Glowing Bouncy Mushroom / Jump Pad
          ctx.fillStyle = '#FDE68A';
          ctx.fillRect(plat.x + plat.w * 0.35, plat.y + 10, plat.w * 0.3, plat.h - 10);
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.ellipse(plat.x + plat.w / 2, plat.y + 10, plat.w / 2, 12, 0, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = '#A7F3D0';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (plat.kind === 'gate') {
          if (!plat.isOpen) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          }
        } else {
          // Platform main body
          ctx.fillStyle =
            plat.kind === 'ice'
              ? '#0284C7'
              : plat.kind === 'quicksand'
              ? '#B45309'
              : plat.kind === 'conveyor'
              ? '#1E293B'
              : world.platformMain;
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

          // Top crust highlight
          ctx.fillStyle =
            plat.kind === 'ice'
              ? '#BAE6FD'
              : plat.kind === 'quicksand'
              ? '#FDE047'
              : plat.kind === 'crumbling'
              ? '#FB923C'
              : world.platformTop;
          ctx.fillRect(plat.x, plat.y, plat.w, 10);

          // Top subtle border
          ctx.fillStyle = world.platformBorder;
          ctx.fillRect(plat.x, plat.y, plat.w, 3);

          if (plat.kind === 'conveyor') {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            const dirChar = (plat.conveyorSpeed || 0) > 0 ? '>>>' : '<<<';
            ctx.fillText(dirChar, plat.x + plat.w / 2, plat.y + 20);
          }

          if (plat.kind === 'secret_wall' && !plat.revealed) {
            // Subtle golden rune shimmer hinting at a secret wall!
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(plat.x + 2, plat.y + 2, plat.w - 4, plat.h - 4);
            ctx.setLineDash([]);
          }
        }
        ctx.restore();
      }

      // 7. Render Hazards (Spikes, Lava, Saws, Geysers)
      for (const haz of blueprint.hazards) {
        if (haz.x + haz.w < camera.x - 80 || haz.x > camera.x + w + 80) continue;
        if (haz.kind === 'spikes') {
          ctx.fillStyle = '#94A3B8';
          const spikeCount = Math.max(2, Math.floor(haz.w / 14));
          const sw = haz.w / spikeCount;
          for (let s = 0; s < spikeCount; s++) {
            ctx.beginPath();
            ctx.moveTo(haz.x + s * sw, haz.y + haz.h);
            ctx.lineTo(haz.x + s * sw + sw / 2, haz.y);
            ctx.lineTo(haz.x + (s + 1) * sw, haz.y + haz.h);
            ctx.closePath();
            ctx.fill();
          }
        } else if (haz.kind === 'lava') {
          const lavaGrad = ctx.createLinearGradient(haz.x, haz.y, haz.x, haz.y + haz.h);
          lavaGrad.addColorStop(0, '#FACC15');
          lavaGrad.addColorStop(0.4, '#EF4444');
          lavaGrad.addColorStop(1, '#7F1D1D');
          ctx.fillStyle = lavaGrad;
          ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
        } else if (haz.kind === 'geyser') {
          if (haz.active) {
            const gGrad = ctx.createLinearGradient(haz.x, haz.y, haz.x + haz.w, haz.y);
            gGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gGrad.addColorStop(0.5, '#FACC15');
            gGrad.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
            ctx.fillStyle = gGrad;
            ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
          } else {
            ctx.fillStyle = 'rgba(251, 146, 60, 0.35)';
            ctx.fillRect(haz.x, haz.y + haz.h - 14, haz.w, 14);
          }
        } else if (haz.kind === 'saw') {
          ctx.save();
          ctx.translate(haz.x + haz.w / 2, haz.y + haz.h / 2);
          ctx.rotate(levelElapsedSeconds * 8);
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(0, 0, haz.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 8. Render Chests (Secret & Bonus Chests)
      for (const chest of blueprint.chests) {
        ctx.save();
        const cx = chest.x;
        const cy = chest.y;
        // Golden aura if closed
        if (!chest.isOpen) {
          ctx.fillStyle = chest.isSecret ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.2)';
          ctx.beginPath();
          ctx.arc(cx + chest.w / 2, cy + chest.h / 2, 32 + Math.sin(levelElapsedSeconds * 5) * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = chest.isOpen ? '#475569' : chest.isSecret ? '#B45309' : '#1E40AF';
        ctx.fillRect(cx + 4, cy + 14, chest.w - 8, chest.h - 14);
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx + 4, cy + 14, chest.w - 8, chest.h - 14);
        // Chest lid
        ctx.fillStyle = chest.isOpen ? '#64748B' : '#F59E0B';
        ctx.fillRect(cx + 2, chest.isOpen ? cy + 2 : cy + 8, chest.w - 4, 10);
        ctx.restore();
      }

      // 9. Render Coins & Gems
      for (const coin of blueprint.coins) {
        if (coin.collected) continue;
        if (coin.x < camera.x - 40 || coin.x > camera.x + w + 40) continue;
        ctx.save();
        if (coin.isGem) {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.moveTo(coin.x, coin.y - 11);
          ctx.lineTo(coin.x + 9, coin.y);
          ctx.lineTo(coin.x, coin.y + 11);
          ctx.lineTo(coin.x - 9, coin.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#E0F2FE';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          const scaleX = Math.max(0.35, Math.abs(Math.cos(levelElapsedSeconds * 4.5 + coin.x * 0.02)));
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.ellipse(coin.x, coin.y, 9 * scaleX, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 10. Render Level Exit Portal
      const portalUnlocked = !blueprint.boss || blueprint.boss.hp <= 0;
      ctx.save();
      ctx.translate(blueprint.portalX, blueprint.portalY + 54);
      const portalColor = portalUnlocked ? '#10B981' : '#64748B';
      ctx.strokeStyle = portalColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
      const pGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      pGrad.addColorStop(0, portalUnlocked ? '#A7F3D0' : '#334155');
      pGrad.addColorStop(0.6, portalUnlocked ? '#059669' : '#1E293B');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(portalUnlocked ? 'PORTAL ABERTO' : 'DERROTE O CHEFÃO', 0, -62);
      ctx.restore();

      // 11. Render Enemies
      for (const enemy of blueprint.enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.x + enemy.w < camera.x - 80 || enemy.x > camera.x + w + 80) continue;
        ctx.save();
        ctx.fillStyle =
          enemy.hitFlashTimer > 0
            ? '#FFFFFF'
            : enemy.slowTimer > 0
            ? '#38BDF8'
            : enemy.colorPrimary;

        // Distinct silhouette per archetype
        if (enemy.archetype === 'flyer') {
          // Winged spirit
          const wingFlap = Math.sin(levelElapsedSeconds * 14) * 10;
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.w / 2, enemy.y + 8);
          ctx.lineTo(enemy.x - 10, enemy.y + 16 + wingFlap);
          ctx.lineTo(enemy.x + enemy.w / 2, enemy.y + enemy.h - 6);
          ctx.lineTo(enemy.x + enemy.w + 10, enemy.y + 16 + wingFlap);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(enemy.x, enemy.y, enemy.w, enemy.h, 8);
          ctx.fill();
        }

        ctx.strokeStyle = enemy.colorSecondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x + 1, enemy.y + 1, enemy.w - 2, enemy.h - 2);

        // Glowing Eyes
        ctx.fillStyle = '#FEF08A';
        const eyeX = enemy.facing === 1 ? enemy.x + enemy.w - 12 : enemy.x + 6;
        ctx.fillRect(eyeX, enemy.y + 11, 6, 6);

        // Enemy HP Bar
        if (enemy.hp < enemy.maxHp || enemy.isMiniBoss) {
          const bw = enemy.w + 8;
          ctx.fillStyle = 'rgba(11, 9, 20, 0.75)';
          ctx.fillRect(enemy.x - 4, enemy.y - 12, bw, 6);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(enemy.x - 3, enemy.y - 11, (bw - 2) * (enemy.hp / enemy.maxHp), 4);
        }
        ctx.restore();
      }

      // 12. Render Boss
      if (blueprint.boss && blueprint.boss.hp > 0) {
        const b = blueprint.boss;
        ctx.save();

        // Telegraph warning indicator
        if (b.state === 'telegraph') {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.75 + Math.sin(levelElapsedSeconds * 20) * 8, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#FDA4AF';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('! ATAQUE IMINENTE !', b.x + b.w / 2, b.y - 22);
        }

        // Phase 2 Enrage Aura
        if (b.phase === 2) {
          ctx.fillStyle = `${b.eyeColor}33`;
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.72, 0, Math.PI * 2);
          ctx.fill();
        }

        // Boss Body
        ctx.fillStyle = b.hitFlashTimer > 0 ? '#FFFFFF' : b.primaryColor;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 16);
        ctx.fill();

        ctx.strokeStyle = b.secondaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Boss Crown / Horns
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(b.x + 16, b.y);
        ctx.lineTo(b.x + 30, b.y - 22);
        ctx.lineTo(b.x + b.w / 2, b.y - 8);
        ctx.lineTo(b.x + b.w - 30, b.y - 22);
        ctx.lineTo(b.x + b.w - 16, b.y);
        ctx.closePath();
        ctx.fill();

        // Boss Glowing Eyes
        ctx.fillStyle = b.eyeColor;
        const bEyeX = b.facing === 1 ? b.x + b.w * 0.58 : b.x + b.w * 0.16;
        ctx.fillRect(bEyeX, b.y + b.h * 0.26, 16, 12);
        ctx.restore();
      }

      // 13. Render Player Afterimages
      for (const img of player.afterimages) {
        ctx.save();
        ctx.globalAlpha = img.alpha * 0.5;
        ctx.fillStyle = img.color;
        ctx.fillRect(img.x, img.y, player.w, player.h);
        ctx.restore();
      }

      // 14. Render Hero Character
      ctx.save();
      if (player.invulnTimer > 0 && Math.floor(levelElapsedSeconds * 16) % 2 === 0) {
        ctx.globalAlpha = 0.55;
      }

      const px = player.x;
      const py = player.y;

      // Flowing Hero Cape
      ctx.fillStyle = heroSkin.capeColor;
      const capeWave = Math.sin(player.animTime * 10) * 6;
      ctx.beginPath();
      if (player.facing === 1) {
        ctx.moveTo(px + 8, py + 16);
        ctx.lineTo(px - 16 - Math.abs(player.vx) * 0.03, py + 44 + capeWave);
        ctx.lineTo(px + 12, py + 46);
      } else {
        ctx.moveTo(px + player.w - 8, py + 16);
        ctx.lineTo(px + player.w + 16 + Math.abs(player.vx) * 0.03, py + 44 + capeWave);
        ctx.lineTo(px + player.w - 12, py + 46);
      }
      ctx.closePath();
      ctx.fill();

      // Hero Armor Body
      ctx.fillStyle = player.hitFlashTimer > 0 ? '#FFFFFF' : heroSkin.armorColor;
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 16, player.w - 8, player.h - 16, 6);
      ctx.fill();
      ctx.strokeStyle = heroSkin.trimColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hero Head & Hair/Helm
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(px + player.w / 2, py + 12, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = heroSkin.hairColor;
      ctx.beginPath();
      ctx.arc(px + player.w / 2, py + 9, 11, Math.PI, 0);
      ctx.fill();

      // Hero Eyes
      ctx.fillStyle = '#0F172A';
      const heroEyeX = player.facing === 1 ? px + player.w / 2 + 3 : px + player.w / 2 - 7;
      ctx.fillRect(heroEyeX, py + 10, 4, 4);

      // Sword Slash Visual Arc
      if (player.attackTimer > 0) {
        ctx.save();
        ctx.strokeStyle = heroSkin.bladeColor;
        ctx.lineWidth = player.comboStep === 3 ? 10 : 6;
        ctx.beginPath();
        const arcCenterX = px + player.w / 2 + player.facing * 24;
        const arcCenterY = py + player.h / 2;
        if (player.facing === 1) {
          ctx.arc(arcCenterX, arcCenterY, 44, -Math.PI * 0.45, Math.PI * 0.45);
        } else {
          ctx.arc(arcCenterX, arcCenterY, 44, Math.PI * 0.55, Math.PI * 1.45);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Celestial Shield Bubble
      if (player.shieldTimer > 0) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.beginPath();
        ctx.arc(px + player.w / 2, py + player.h / 2, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Blade Storm Orbiting Swords
      if (player.bladeStormTimer > 0) {
        for (let b = 0; b < 5; b++) {
          const ang = levelElapsedSeconds * 9 + (b * Math.PI * 2) / 5;
          const bx = px + player.w / 2 + Math.cos(ang) * 65;
          const by = py + player.h / 2 + Math.sin(ang) * 65;
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // 15. Render Projectiles
      for (const proj of projectiles) {
        ctx.save();
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 16. Render Particles
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 17. Render Floating Damage / Coin Texts
      for (const ft of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
        ctx.font = `800 ${ft.size}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0B0914';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // End world space transform

      // 18. Foreground Atmospheric Weather Particles
      ctx.save();
      for (const wp of weatherParticles) {
        wp.x = (wp.x + wp.speedX * 0.016 + w) % w;
        wp.y = (wp.y + wp.speedY * 0.016 + h) % h;
        ctx.fillStyle =
          world.weatherType === 'fireflies' || world.weatherType === 'feathers'
            ? 'rgba(253, 224, 71, 0.55)'
            : world.weatherType === 'snow'
            ? 'rgba(224, 242, 254, 0.65)'
            : world.weatherType === 'embers'
            ? 'rgba(251, 146, 60, 0.65)'
            : `${world.accentColor}66`;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      update(dt);
      render();
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [levelNumber, isDemoMode]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair"
    />
  );
};
