// Synthesised sound for Turkey Run: no audio files, every effect is a few
// WebAudio oscillators, so the game ships no assets and plays offline.
// One clear job: bleeps, chirps and thuds, with a mute switch.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freqStart, freqEnd, seconds, type, gainValue, delay = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + seconds);
    gain.gain.setValueAtTime(gainValue, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** Unlock audio on the first user gesture (browsers require one). */
    unlock() {
      ensure();
    },
    jump() {
      tone(420, 760, 0.14, 'sine', 0.16);
    },
    doubleJump() {
      tone(560, 980, 0.14, 'sine', 0.14);
    },
    slide() {
      tone(300, 140, 0.12, 'triangle', 0.1);
    },
    corn() {
      tone(880, 1320, 0.09, 'sine', 0.14);
    },
    feather() {
      tone(660, 990, 0.1, 'sine', 0.14);
      tone(990, 1480, 0.12, 'sine', 0.12, 0.08);
    },
    pie() {
      tone(523, 523, 0.1, 'triangle', 0.14);
      tone(659, 659, 0.1, 'triangle', 0.14, 0.09);
      tone(784, 784, 0.16, 'triangle', 0.14, 0.18);
    },
    hit() {
      tone(180, 60, 0.25, 'sawtooth', 0.2);
      tone(90, 40, 0.3, 'square', 0.12, 0.02);
    },
    gobble() {
      tone(300, 180, 0.08, 'square', 0.1);
      tone(260, 150, 0.08, 'square', 0.1, 0.09);
      tone(320, 200, 0.1, 'square', 0.1, 0.18);
    },
    caught() {
      tone(392, 392, 0.16, 'sawtooth', 0.16);
      tone(311, 311, 0.16, 'sawtooth', 0.16, 0.16);
      tone(233, 155, 0.4, 'sawtooth', 0.16, 0.32);
    },
    escaped() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((note, i) => tone(note, note, 0.18, 'triangle', 0.16, i * 0.13));
      tone(1047, 1568, 0.4, 'sine', 0.12, 0.55);
    },
  };
}
