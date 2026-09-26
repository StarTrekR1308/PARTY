// Web Audio API Synthesizer for subtle 'boing' and celebratory chime
class SoundFxService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Ensure AudioContext is unlocked upon user interaction
  public initUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  // Subtle springy 'boing' sound on wall collision
  public playBoing() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Carrier oscillator (sine / triangle for warm springy tone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';

      // Pitch-envelope creates the characteristic springy "boing" wobble
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.035);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(170, now + 0.17);

      // Subtle volume envelope (gentle, not piercing)
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio safety catch
    }
  }

  // Celebratory bell / chime arpeggio on corner jackpot hit
  public playCornerChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Bright celebratory chime chord (C5, E5, G5, B5, C6, E6)
      const notes = [
        { freq: 523.25, time: 0.00, dur: 1.2 }, // C5
        { freq: 659.25, time: 0.045, dur: 1.3 }, // E5
        { freq: 783.99, time: 0.090, dur: 1.4 }, // G5
        { freq: 987.77, time: 0.135, dur: 1.5 }, // B5
        { freq: 1046.50, time: 0.180, dur: 1.8 }, // C6
        { freq: 1318.51, time: 0.230, dur: 2.0 }, // E6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const noteStart = now + time;

        // Primary bell tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.14, noteStart + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + dur);

        // Shimmering chime harmonic overtone
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.756, noteStart); // Non-integer chime ratio for bell sparkle

        overtoneGain.gain.setValueAtTime(0.0001, noteStart);
        overtoneGain.gain.linearRampToValueAtTime(0.04, noteStart + 0.004);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur * 0.4);

        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        overtone.start(noteStart);
        overtone.stop(noteStart + dur * 0.4);
      });
    } catch {
      // Audio safety catch
    }
  }
}

export const soundFx = new SoundFxService();
