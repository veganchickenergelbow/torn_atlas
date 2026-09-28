// Lightweight audio manager. All sound is synthesized with the Web Audio API —
// no external audio files — so the prototype stays a handful of static files.
// Music/SFX must start after a user gesture (browser autoplay rules), so
// `unlock()` is called on the first click anywhere in the app.

const Audio2 = (() => {
  let ctx = null;
  let musicOn = localStorage.getItem("atlas-music") !== "off";
  let sfxOn = localStorage.getItem("atlas-sfx") !== "off";
  let musicGain = null;
  let lookaheadTimer = null;
  let nextNoteTime = 0;
  let step = 0; // 16th-note step counter within the loop
  let phraseIdx = 0;

  const BPM = 124;
  const SIXTEENTH = 60 / BPM / 4; // seconds per 16th note
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD = 0.1; // seconds

  // I-V-vi-IV in C, two bars each (8 sixteenths per chord, loop = 32 steps)
  const CHORDS = [
    { root: 261.63, notes: [261.63, 329.63, 392.0] }, // C
    { root: 392.0, notes: [392.0, 493.88, 587.33] }, // G
    { root: 220.0, notes: [220.0, 261.63, 329.63] }, // Am
    { root: 349.23, notes: [349.23, 440.0, 523.25] }, // F
  ];

  // Melody phrases: steps are 16th-note indices 0..31 (one loop through the
  // I-V-vi-IV progression). null = rest. Frequencies in the C major scale.
  const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
  const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99;
  const PHRASE_A = [
    [0, C5], [2, B4], [4, G4], [6, A4], [8, G4], [10, E5], [12, D5], [14, B4],
    [16, A4], [18, G4], [20, E4], [22, G4], [24, C5], [26, A4], [28, F4], [30, G4],
  ];
  const PHRASE_B = [
    [0, E5], [2, D5], [3, C5], [4, B4], [6, G4], [8, A4], [10, C5], [12, B4], [14, G4],
    [16, E4], [18, G4], [20, B4], [22, D5], [24, F4], [26, A4], [28, G4], [30, E4],
  ];
  const PHRASE_C = [
    [0, G4], [1, A4], [2, B4], [4, C5], [6, D5], [8, E5], [10, D5], [12, C5], [14, A4],
    [16, F4], [17, G4], [18, A4], [20, G4], [22, E4], [24, D4], [26, E4], [28, G4], [30, C5],
  ];
  const PHRASES = [PHRASE_A, PHRASE_B, PHRASE_A, PHRASE_C];

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.06; // comfortable background level, under SFX
      musicGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // --- one-shot SFX (always straight to destination, not the music bus) ---
  function tone({ freq, start, dur, type = "sine", gain = 0.18, glideTo = null }) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + dur);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(gain, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(amp).connect(c.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function sfxClick() {
    if (!sfxOn) return;
    const c = ensureCtx();
    tone({ freq: 720, start: c.currentTime, dur: 0.06, type: "square", gain: 0.06 });
  }

  function sfxCorrect() {
    if (!sfxOn) return;
    const c = ensureCtx();
    const t = c.currentTime;
    tone({ freq: 523.25, start: t, dur: 0.14, type: "triangle", gain: 0.16 });
    tone({ freq: 659.25, start: t + 0.09, dur: 0.14, type: "triangle", gain: 0.16 });
    tone({ freq: 783.99, start: t + 0.18, dur: 0.22, type: "triangle", gain: 0.18 });
  }

  function sfxWrong() {
    if (!sfxOn) return;
    const c = ensureCtx();
    tone({ freq: 220, start: c.currentTime, dur: 0.28, type: "sawtooth", gain: 0.12, glideTo: 140 });
  }

  function sfxOpen() {
    if (!sfxOn) return;
    const c = ensureCtx();
    tone({ freq: 392, start: c.currentTime, dur: 0.1, type: "sine", gain: 0.1 });
    tone({ freq: 523.25, start: c.currentTime + 0.06, dur: 0.14, type: "sine", gain: 0.12 });
  }

  function sfxMeow() {
    if (!sfxOn) return;
    const c = ensureCtx();
    const t = c.currentTime;
    tone({ freq: 480, start: t, dur: 0.22, type: "triangle", gain: 0.14, glideTo: 780 });
    tone({ freq: 700, start: t + 0.22, dur: 0.26, type: "triangle", gain: 0.12, glideTo: 420 });
  }

  function sfxWin() {
    if (!sfxOn) return;
    const c = ensureCtx();
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, start: t + i * 0.12, dur: 0.28, type: "triangle", gain: 0.16 })
    );
  }

  // --- chiptune music: proper look-ahead scheduler ---
  function scheduleLead(freq, start, dur) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(0.5, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(amp).connect(musicGain);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  function scheduleBass(freq, start, dur) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq / 2, start);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(0.9, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(amp).connect(musicGain);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  function scheduleHat(start) {
    const c = ensureCtx();
    const bufSize = Math.floor(c.sampleRate * 0.05);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const amp = c.createGain();
    amp.gain.setValueAtTime(0.35, start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + 0.045);
    noise.connect(hp).connect(amp).connect(musicGain);
    noise.start(start);
    noise.stop(start + 0.06);
  }

  function scheduleKick(start) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, start);
    osc.frequency.exponentialRampToValueAtTime(48, start + 0.12);
    amp.gain.setValueAtTime(0.8, start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(amp).connect(musicGain);
    osc.start(start);
    osc.stop(start + 0.18);
  }

  // Schedules everything that falls on 16th-note `step` at time `t`.
  function scheduleStep(stepInLoop, t) {
    const chordIdx = Math.floor(stepInLoop / 8) % CHORDS.length;
    const chord = CHORDS[chordIdx];

    // triangle bass on the beat (every 4th 16th = quarter note)
    if (stepInLoop % 4 === 0) scheduleBass(chord.root, t, SIXTEENTH * 3.6);

    // soft kick on beats 1 and 3 of each bar (steps 0/8, 16/24 within 2-bar chord... use every 8 steps)
    if (stepInLoop % 8 === 0) scheduleKick(t);

    // hi-hat on the offbeats
    if (stepInLoop % 2 === 1) scheduleHat(t);

    // melody: look up any note scheduled at this step in the active phrase
    const phrase = PHRASES[phraseIdx % PHRASES.length];
    const hit = phrase.find(([s]) => s === stepInLoop);
    if (hit) scheduleLead(hit[1], t, SIXTEENTH * 1.8);
  }

  function schedulerTick() {
    const c = ensureCtx();
    while (nextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
      const stepInLoop = step % 32;
      scheduleStep(stepInLoop, nextNoteTime);
      if (stepInLoop === 31) phraseIdx++;
      nextNoteTime += SIXTEENTH;
      step++;
    }
    lookaheadTimer = setTimeout(schedulerTick, LOOKAHEAD_MS);
  }

  function startMusic() {
    if (lookaheadTimer || !musicOn) return;
    const c = ensureCtx();
    if (musicGain.gain.value !== 0.06) musicGain.gain.setTargetAtTime(0.06, c.currentTime, 0.05);
    step = 0;
    phraseIdx = 0;
    nextNoteTime = c.currentTime + 0.05;
    schedulerTick();
  }

  function stopMusic() {
    if (lookaheadTimer) clearTimeout(lookaheadTimer);
    lookaheadTimer = null;
    // any already-scheduled oscillators finish naturally (short envelopes);
    // muting the bus instantly avoids new notes and hanging tails.
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
  }

  function unlock() {
    ensureCtx();
    if (musicOn) startMusic();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    localStorage.setItem("atlas-music", musicOn ? "on" : "off");
    if (musicOn) startMusic(); else stopMusic();
    return musicOn;
  }

  function toggleSfx() {
    sfxOn = !sfxOn;
    localStorage.setItem("atlas-sfx", sfxOn ? "on" : "off");
    return sfxOn;
  }

  return {
    unlock, sfxClick, sfxCorrect, sfxWrong, sfxOpen, sfxWin, sfxMeow,
    toggleMusic, toggleSfx,
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
  };
})();
