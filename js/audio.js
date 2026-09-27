/* pickpack - tiny synthesized sound effects (WebAudio, no audio files). */
'use strict';

const Sfx = (() => {
  let ctx = null; let master = null; let enabled = true; let noiseBuf = null;
  const last = {};

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ f = 440, f2 = null, type = 'sine', dur = 0.12, vol = 0.5, delay = 0 }) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  function noise({ dur = 0.2, vol = 0.4, freq = 1200, f2 = null, q = 0.8, type = 'lowpass', delay = 0 }) {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(freq, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(master); src.start(t); src.stop(t + dur + 0.02);
  }

  const arp = (notes, step, opts) => notes.forEach((f, i) => tone(Object.assign({ f, delay: i * step }, opts)));

  const S = {
    click:   () => tone({ f: 620, f2: 820, type: 'triangle', dur: 0.06, vol: 0.18 }),
    hover:   () => tone({ f: 1400, type: 'sine', dur: 0.03, vol: 0.04 }),
    card:    () => { noise({ dur: 0.18, vol: 0.25, freq: 900, f2: 3200, type: 'bandpass', q: 1.2 }); tone({ f: 330, f2: 520, type: 'triangle', dur: 0.12, vol: 0.12 }); },
    hit:     () => { noise({ dur: 0.16, vol: 0.45, freq: 1800, f2: 300 }); tone({ f: 140, f2: 60, type: 'sine', dur: 0.18, vol: 0.4 }); },
    heavy:   () => { noise({ dur: 0.4, vol: 0.6, freq: 1400, f2: 120 }); tone({ f: 90, f2: 35, type: 'sine', dur: 0.45, vol: 0.6 }); },
    block:   () => { tone({ f: 880, f2: 660, type: 'square', dur: 0.08, vol: 0.06 }); tone({ f: 1320, type: 'sine', dur: 0.25, vol: 0.12, delay: 0.01 }); },
    blocked: () => { tone({ f: 1500, f2: 1200, type: 'triangle', dur: 0.2, vol: 0.14 }); noise({ dur: 0.08, vol: 0.12, freq: 4000, type: 'highpass' }); },
    heal:    () => arp([523, 659, 784], 0.06, { type: 'sine', dur: 0.22, vol: 0.13 }),
    buff:    () => tone({ f: 300, f2: 900, type: 'triangle', dur: 0.28, vol: 0.12 }),
    debuff:  () => tone({ f: 700, f2: 180, type: 'sawtooth', dur: 0.3, vol: 0.06 }),
    draw:    () => noise({ dur: 0.07, vol: 0.12, freq: 2600, type: 'bandpass', q: 2 }),
    turn:    () => arp([392, 587], 0.09, { type: 'triangle', dur: 0.3, vol: 0.12 }),
    enemy:   () => { tone({ f: 110, f2: 70, type: 'sawtooth', dur: 0.35, vol: 0.08 }); noise({ dur: 0.3, vol: 0.1, freq: 400 }); },
    flip:    () => noise({ dur: 0.14, vol: 0.2, freq: 600, f2: 4000, type: 'bandpass', q: 1 }),
    rare:    () => arp([659, 880, 1175], 0.05, { type: 'sine', dur: 0.35, vol: 0.12 }),
    legend:  () => { arp([523, 659, 784, 1047, 1319], 0.07, { type: 'triangle', dur: 0.6, vol: 0.12 }); noise({ dur: 0.9, vol: 0.08, freq: 6000, type: 'highpass' }); },
    upgrade: () => arp([440, 554, 659, 880], 0.05, { type: 'triangle', dur: 0.25, vol: 0.12 }),
    win:     () => arp([392, 523, 659, 784, 1047], 0.1, { type: 'triangle', dur: 0.5, vol: 0.13 }),
    lose:    () => arp([392, 330, 262, 196], 0.16, { type: 'sine', dur: 0.6, vol: 0.14 }),
    error:   () => tone({ f: 160, f2: 120, type: 'square', dur: 0.14, vol: 0.06 }),
    glitch:  () => { for (let i = 0; i < 5; i++) tone({ f: 200 + Math.random() * 1600, type: 'square', dur: 0.04, vol: 0.05, delay: i * 0.035 }); },
    mash:    () => tone({ f: 500 + Math.random() * 500, type: 'square', dur: 0.04, vol: 0.06 }),
    type:    () => tone({ f: 1800 + Math.random() * 300, type: 'sine', dur: 0.015, vol: 0.025 }),
    whoosh:  () => noise({ dur: 0.5, vol: 0.18, freq: 300, f2: 2400, type: 'bandpass', q: 0.7 })
  };

  function play(name, minGapMs = 0) {
    if (!enabled || !S[name]) return;
    const now = performance.now();
    if (minGapMs && last[name] && now - last[name] < minGapMs) return;
    last[name] = now;
    if (!ensure()) return;
    try { S[name](); } catch (e) { /* audio is decoration only */ }
  }

  return {
    play,
    unlock: () => { if (enabled) ensure(); },
    setEnabled(v) { enabled = !!v; if (enabled && ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    get enabled() { return enabled; }
  };
})();
