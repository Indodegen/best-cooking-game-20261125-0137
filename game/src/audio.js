// All sound is synthesised with WebAudio: no audio files, no network.
// A tiny cheerful loop (music-box arpeggio) plus one-shot effects.
export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    musicTimer: null,
    step: 0,
  };

  function ensure() {
    if (!audio.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audio.ctx = new Ctx();
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
    const ctx = ensure();
    if (!ctx || audio.muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol = 0.08, when = 0, freq = 1200) {
    const ctx = ensure();
    if (!ctx || audio.muted) return;
    const t = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
  }

  audio.unlock = function unlock() { ensure(); };
  audio.toggleMute = function toggleMute() {
    audio.muted = !audio.muted;
    return audio.muted;
  };

  audio.chop = function chop() { noise(0.09, 0.16, 0, 900); tone(180, 0.08, 'triangle', 0.1); };
  audio.pickup = function pickup() { tone(520, 0.08, 'sine', 0.08); };
  audio.place = function place() { tone(340, 0.09, 'triangle', 0.1); tone(500, 0.07, 'sine', 0.06, 0.05); };
  audio.ding = function ding() { tone(880, 0.35, 'sine', 0.12); tone(1320, 0.3, 'sine', 0.06, 0.02); };
  audio.sizzle = function sizzle() { noise(0.4, 0.05, 0, 3000); };
  audio.coin = function coin() {
    tone(988, 0.1, 'square', 0.05);
    tone(1319, 0.14, 'square', 0.05, 0.08);
    tone(1568, 0.22, 'square', 0.05, 0.16);
  };
  audio.error = function error() { tone(160, 0.22, 'sawtooth', 0.08, 0, 110); };
  audio.miss = function miss() { tone(392, 0.2, 'triangle', 0.09, 0, 262); tone(262, 0.3, 'triangle', 0.09, 0.15, 196); };
  audio.rush = function rush() {
    tone(523, 0.12, 'square', 0.06);
    tone(659, 0.12, 'square', 0.06, 0.1);
    tone(784, 0.2, 'square', 0.06, 0.2);
  };

  // Music-box loop: C major arpeggio, one note every 0.24 s, quiet by design.
  const MELODY = [523, 659, 784, 1047, 784, 659, 587, 698, 880, 1175, 880, 698, 659, 784, 988, 784];
  audio.startMusic = function startMusic() {
    if (audio.musicTimer) return;
    audio.musicTimer = setInterval(() => {
      if (audio.muted || !audio.ctx) return;
      const note = MELODY[audio.step % MELODY.length];
      tone(note, 0.5, 'sine', 0.035);
      if (audio.step % 4 === 0) tone(note / 2, 0.6, 'triangle', 0.03);
      audio.step += 1;
    }, 240);
  };
  audio.stopMusic = function stopMusic() {
    if (audio.musicTimer) { clearInterval(audio.musicTimer); audio.musicTimer = null; }
  };

  return audio;
}
