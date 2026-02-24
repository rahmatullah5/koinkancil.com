/** @format */

// We use programmatic sounds (Web Audio API) instead of loading files
// This keeps the project self-contained with no external audio dependencies

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled = true;
  private bgMusicNode: OscillatorNode | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgMusic();
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.15,
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors
    }
  }

  private playNotes(
    notes: [number, number, number][],
    type: OscillatorType = "sine",
    volume = 0.12,
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      notes.forEach(([freq, startDelay, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(
          volume,
          ctx.currentTime + startDelay + 0.02,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + startDelay + dur,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + dur);
      });
    } catch {
      // Ignore
    }
  }

  coinCollect() {
    this.playNotes(
      [
        [880, 0, 0.1],
        [1108, 0.08, 0.1],
        [1320, 0.16, 0.15],
      ],
      "sine",
      0.12,
    );
  }

  correctAnswer() {
    this.playNotes(
      [
        [523, 0, 0.12],
        [659, 0.1, 0.12],
        [784, 0.2, 0.12],
        [1047, 0.3, 0.2],
      ],
      "sine",
      0.1,
    );
  }

  wrongAnswer() {
    this.playNotes(
      [
        [300, 0, 0.15],
        [250, 0.12, 0.2],
      ],
      "sawtooth",
      0.08,
    );
  }

  buttonClick() {
    this.playTone(660, 0.08, "sine", 0.08);
  }

  levelComplete() {
    this.playNotes(
      [
        [523, 0, 0.15],
        [659, 0.12, 0.15],
        [784, 0.24, 0.15],
        [1047, 0.36, 0.15],
        [1319, 0.48, 0.3],
      ],
      "sine",
      0.12,
    );
  }

  drumroll() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      for (let i = 0; i < 30; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(100 + Math.random() * 50, ctx.currentTime);
        const t = i * 0.05;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(
          0.06 + (i / 30) * 0.08,
          ctx.currentTime + t,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + t + 0.04,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.05);
      }
    } catch {
      // Ignore
    }
  }

  celebration() {
    this.playNotes(
      [
        [523, 0, 0.2],
        [587, 0.15, 0.2],
        [659, 0.3, 0.2],
        [784, 0.45, 0.2],
        [1047, 0.6, 0.15],
        [784, 0.72, 0.15],
        [1047, 0.84, 0.35],
      ],
      "sine",
      0.12,
    );
  }

  spinWheel() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      for (let i = 0; i < 20; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400 + i * 30, ctx.currentTime);
        const t = i * 0.08;
        gain.gain.setValueAtTime(0.06, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + t + 0.06,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.07);
      }
    } catch {
      // Ignore
    }
  }

  cardFlip() {
    this.playTone(500, 0.06, "sine", 0.06);
  }

  cardMatch() {
    this.playNotes(
      [
        [660, 0, 0.1],
        [880, 0.08, 0.15],
      ],
      "sine",
      0.1,
    );
  }

  stopBgMusic() {
    try {
      this.bgMusicNode?.stop();
    } catch {
      /* ignore */
    }
    this.bgMusicNode = null;
  }
}

export const soundManager = new SoundManager();
