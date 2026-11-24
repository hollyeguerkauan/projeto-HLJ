import { BiomeType } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmVolume = 0.35;
  private sfxVolume = 0.65;
  private muted = false;
  private bgmInterval: number | null = null;
  private currentBiome: BiomeType | 'title' | 'boss' | null = null;
  private stepIndex = 0;
  private coinComboCount = 0;
  private lastCoinTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSettings(bgmVolume: number, sfxVolume: number, muted: boolean) {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVolume));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    this.muted = muted;
    if (this.muted) {
      this.stopMusic();
    }
  }

  public playJump(isDouble = false) {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isDouble ? 'triangle' : 'sine';
    const startFreq = isDouble ? 360 : 210;
    const endFreq = isDouble ? 740 : 490;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playDash() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.13);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSwordSlash(comboStep = 1) {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = comboStep === 3 ? 'sawtooth' : 'triangle';
    const base = comboStep === 1 ? 320 : comboStep === 2 ? 410 : 540;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);

    gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playSpecialPower() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    [330, 440, 660, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + idx * 0.04 + 0.22);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.25);
    });
  }

  public playCoin(isGem = false) {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    if (now - this.lastCoinTime < 0.7) {
      this.coinComboCount = Math.min(10, this.coinComboCount + 1);
    } else {
      this.coinComboCount = 0;
    }
    this.lastCoinTime = now;

    const pitchBoost = 1 + this.coinComboCount * 0.045;
    const f1 = (isGem ? 740 : 587.33) * pitchBoost;
    const f2 = (isGem ? 1108 : 880) * pitchBoost;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + 0.055);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playEnemyHit(isKill = false) {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isKill ? 280 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(isKill ? 560 : 85, now + 0.12);

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.24);

    gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playChestOpen() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, now + i * 0.08);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.29);
    });
  }

  public playSecretDiscovered() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n, now + i * 0.06);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  public playSpringBounce() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playVictory() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.11, 0.22, 0.34, 0.5, 0.64];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + times[i]);
      gain.gain.setValueAtTime(0.26 * this.sfxVolume, now + times[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + times[i]);
      osc.stop(now + times[i] + 0.34);
    });
  }

  public playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const notes = [392, 349.23, 329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.32);
    });
  }

  public playUiClick() {
    const ctx = this.ensureContext();
    if (!ctx || this.sfxVolume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
    gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public startMusic(theme: BiomeType | 'title' | 'boss') {
    if (this.muted || this.bgmVolume <= 0) {
      this.stopMusic();
      return;
    }
    if (this.currentBiome === theme && this.bgmInterval !== null) return;

    this.stopMusic();
    this.currentBiome = theme;
    this.stepIndex = 0;

    const scales: Record<string, number[]> = {
      title: [261.63, 329.63, 392.0, 493.88, 523.25, 392.0, 329.63, 293.66],
      forest: [293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63],
      desert: [220.0, 233.08, 277.18, 329.63, 349.23, 329.63, 277.18, 233.08],
      ice: [329.63, 392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 392.0],
      volcano: [146.83, 164.81, 174.61, 220.0, 233.08, 220.0, 174.61, 164.81],
      abandoned_city: [246.94, 293.66, 329.63, 369.99, 440.0, 369.99, 329.63, 293.66],
      dark_world: [196.0, 207.65, 246.94, 293.66, 311.13, 293.66, 246.94, 207.65],
      celestial: [349.23, 440.0, 523.25, 659.25, 698.46, 659.25, 523.25, 440.0],
      final_dimension: [261.63, 311.13, 370.0, 440.0, 523.25, 440.0, 370.0, 311.13],
      boss: [164.81, 196.0, 220.0, 233.08, 261.63, 233.08, 196.0, 174.61],
    };

    const notes = scales[theme] || scales.forest;
    const intervalMs = theme === 'boss' ? 190 : 310;

    this.bgmInterval = window.setInterval(() => {
      if (this.muted || this.bgmVolume <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freq = notes[this.stepIndex % notes.length];
      this.stepIndex++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = theme === 'boss' || theme === 'volcano' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const vol = (theme === 'boss' ? 0.09 : 0.065) * this.bgmVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + (intervalMs / 1000) * 0.92);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (intervalMs / 1000));
    }, intervalMs);
  }

  public stopMusic() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBiome = null;
  }
}

export const soundEngine = new SoundEngine();
