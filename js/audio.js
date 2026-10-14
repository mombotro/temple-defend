// Procedural Web Audio Engine for Temple Defend
// Zero external audio files required - works 100% offline and reliably!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.drumInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // --- SOUND EFFECTS ---

  // Roman Bucina / War Horn (Wave start or Roma Invicta war cry)
  playWarHorn(pitchMultiplier = 1.0) {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const baseFreqs = [220, 277.18, 329.63, 440].map(f => f * pitchMultiplier);

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.98, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.15);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(2200, t + 0.2);
      filter.frequency.exponentialRampToValueAtTime(800, t + 1.2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  // Gladius Melee Swing Whoosh
  playSwordSwing() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Steel Clash / Flesh Slash Impact
  playSwordHit(isCrit = false) {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Metallic chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 1600 : 1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    // Noise transient for crunch
    const bufferSize = this.ctx.sampleRate * 0.1;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1400;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
    whiteNoise.start(t);
  }

  // Scutum Shield Block (Heavy wood & brass thud)
  playShieldBlock() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Heavy wooden thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    // Brass rim deflection ring
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1850, t);
    osc2.frequency.exponentialRampToValueAtTime(900, t + 0.18);

    gain2.gain.setValueAtTime(0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
    osc2.start(t);
    osc2.stop(t + 0.25);
  }

  // Pilum Javelin Throw
  playPilumThrow() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Boulder Drop & Smash Impact
  playBoulderCrash() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Low sub rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    // Stone shatter noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
    noise.start(t);
  }

  // Arrow Barrage Whoosh
  playArrowVolley() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700 + Math.random() * 300, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.25);
      }, i * 45);
    }
  }

  // Ladder Kick / Fall
  playLadderPush() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Victory Fanfare
  playVictory() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const notes = [
      { f: 261.63, d: 0.2 }, // C4
      { f: 329.63, d: 0.2 }, // E4
      { f: 392.00, d: 0.2 }, // G4
      { f: 523.25, d: 0.6 }  // C5
    ];

    let delay = 0;
    notes.forEach(note => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + note.d + 0.05);
      }, delay * 1000);
      delay += note.d * 0.85;
    });
  }

  // Defeat Chords
  playDefeat() {
    if (!this.initialized || this.isMuted) return;
    this.resume();

    const notes = [220, 174.61, 146.83]; // A3, F3, D3
    const t = this.ctx.currentTime;

    notes.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 2.0);
    });
  }

  // Background Battle Drums & March Percussion
  startBattleMusic() {
    if (!this.initialized || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    let step = 0;

    this.drumInterval = setInterval(() => {
      if (!this.initialized || this.isMuted || !this.isMusicPlaying) return;
      const t = this.ctx.currentTime;

      // Deep war drum beat on step 0, 2
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(step === 0 ? 85 : 70, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.3);
      }

      // Marching snare / shield rhythmic clap on step 1, 3
      if (step % 2 === 1) {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(t);
      }

      step = (step + 1) % 8;
    }, 280); // ~107 BPM Roman March tempo
  }

  stopBattleMusic() {
    this.isMusicPlaying = false;
    if (this.drumInterval) {
      clearInterval(this.drumInterval);
      this.drumInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
