/**
 * Web Audio alert utility for SkyGuard AI.
 * Plays a discrete dual-tone chirp on genuine new HIGH or CRITICAL investigation records.
 * Unlocks AudioContext cleanly on first user interaction and supports mute/unmute toggle.
 */

class AlertSoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private unlocked: boolean = false;
  private listeners: Array<(enabled: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('skyguard_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
      const unlock = () => {
        if (!this.unlocked) {
          this.initContext();
          this.unlocked = true;
        }
      };
      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private initContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('skyguard_sound_enabled', enabled ? 'true' : 'false');
    }
    if (enabled) {
      this.initContext();
    }
    this.listeners.forEach((l) => l(enabled));
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Plays a dual-tone alert chirp.
   * tone 1: warning/critical fundamental
   * tone 2: confirmation higher harmonic chime
   */
  public playAlertChirp(isCritical: boolean = false) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = isCritical ? 'sawtooth' : 'sine';
      osc1.frequency.setValueAtTime(isCritical ? 880 : 660, now);
      osc1.frequency.exponentialRampToValueAtTime(isCritical ? 1100 : 880, now + 0.12);

      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Tone 2 (80ms later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(isCritical ? 1320 : 990, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(isCritical ? 1760 : 1320, now + 0.28);

      gain2.gain.setValueAtTime(0.06, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.29);
    } catch {
      // Audio playback blocked or unavailable
    }
  }
}

export const alertSoundService = new AlertSoundService();
