/* pickpack - canvas renderer for battles and story scenes.
 * One requestAnimationFrame loop for the whole game; it can never be started twice. */
'use strict';

const FX = (() => {
  let cvs = null; let ctx = null; let W = 0; let H = 0; let dpr = 1;
  let raf = 0; let running = false; let lastT = 0;
  let ro = null;
  const resizeHooks = [];

  const S = {
    mode: 'battle', backdrop: 'sanctuary', boss: null, hero: true, lumen: false,
    t: 0, shake: 0, flash: 0, glitch: 0, bloom: 0, bloomTarget: 0,
    heroFx: { hit: 0, shield: false, stasis: false, alpha: 1 },
    bossFx: { hit: 0, alpha: 1, enter: 1, dying: 0, phase2: false, charge: false, stun: false },
    particles: [], texts: [], shots: [], rings: [], dust: []
  };

  /* ---------- setup ---------- */
  function attach(canvas) {
    if (cvs === canvas) { resize(); return; }
    if (ro) ro.disconnect();
    cvs = canvas; ctx = cvs.getContext('2d');
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(cvs); }
    resize();
  }

  function resize() {
    if (!cvs) return;
    const r = cvs.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    if (!S.dust.length || S.dust.length < 10) seedDust();
    resizeHooks.forEach((fn) => fn());
  }
  window.addEventListener('resize', resize);

  function seedDust() {
    S.dust = [];
    for (let i = 0; i < 70; i++) S.dust.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, p: Math.random() * 6.28 });
  }

  function setScene(o) {
    Object.assign(S, { mode: 'battle', backdrop: 'sanctuary', boss: null, hero: true, lumen: false }, o);
    S.particles = []; S.texts = []; S.shots = []; S.rings = [];
    S.shake = 0; S.flash = 0; S.glitch = 0;
    S.bloom = o.bloom || 0; S.bloomTarget = o.bloom || 0;
    S.heroFx = { hit: 0, shield: false, stasis: false, alpha: 1 };
    S.bossFx = { hit: 0, alpha: 1, enter: o.bossEnter ? 0 : 1, dying: 0, phase2: false, charge: false, stun: false };
    seedDust();
  }

  function start() {
    if (running) return;
    running = true; lastT = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ---------- layout ---------- */
  function heroPos() { return S.mode === 'story' ? { x: W * 0.3, y: H * 0.42 } : { x: W * 0.22, y: H * 0.58 }; }
  function bossPos() { return S.mode === 'story' ? { x: W * 0.7, y: H * 0.4 } : { x: W * 0.76, y: H * 0.52 }; }
  const pos = (who) => (who === 'hero' ? heroPos() : bossPos());
  const unit = () => Math.max(0.55, Math.min(1.25, Math.min(W / 900, H / 330)));
  /* Top edge of the boss silhouette, used to hang the intent above it. */
  function bossTop() { return bossPos().y - 56 * unit() * 1.55 - 14; }

  /* ---------- effects API ---------- */
  function spawn(p) { if (S.particles.length < 600) S.particles.push(p); }

  function burst(who, o = {}) {
    const p = pos(who); const n = o.n || 26; const sp = (o.speed || 6) * unit();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2; const s = Math.random() * sp + 1;
      spawn({ x: p.x + (o.ox || 0), y: p.y + (o.oy || 0), vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 2.6 + 1, life: 1, decay: 0.022 + Math.random() * 0.02, drag: 0.93, g: 0 });
    }
  }

  function aura(who, kind) {
    const p = pos(who); const u = unit();
    if (kind === 'heal' || kind === 'buff') {
      for (let i = 0; i < 26; i++) spawn({ x: p.x + (Math.random() - 0.5) * 70 * u, y: p.y + 30 * u, vx: 0, vy: -(Math.random() * 2.4 + 0.8), r: Math.random() * 2.2 + 1, life: 1, decay: 0.016, drag: 0.99, g: kind === 'buff' ? -0.02 : 0 });
    } else if (kind === 'debuff') {
      for (let i = 0; i < 20; i++) spawn({ x: p.x + (Math.random() - 0.5) * 60 * u, y: p.y - 30 * u, vx: 0, vy: Math.random() * 1.6 + 0.4, r: Math.random() * 2 + 1, life: 1, decay: 0.02, drag: 0.99, g: 0.03, dim: true });
    } else if (kind === 'shield') {
      S.rings.push({ x: p.x, y: p.y, r: 20 * u, vr: 3.2 * u, life: 1, decay: 0.035, hex: true });
    } else if (kind === 'charge') {
      S.rings.push({ x: p.x, y: p.y, r: 120 * u, vr: -3 * u, life: 1, decay: 0.03 });
    }
  }

  function float(who, text, kind = 'dmg') {
    const p = pos(who); const u = unit();
    S.texts.push({ x: p.x + (Math.random() - 0.5) * 30 * u, y: p.y - 58 * u, text: String(text), kind, life: 1 });
  }

  function hit(who, power = 1) {
    if (who === 'hero') S.heroFx.hit = 1; else S.bossFx.hit = 1;
    S.shake = Math.max(S.shake, Math.min(18, 3 + power));
  }

  function shake(n) { S.shake = Math.max(S.shake, n); }
  function flash(n = 0.6) { S.flash = Math.max(S.flash, n); }
  function glitch(n = 1) { S.glitch = Math.max(S.glitch, n); }
  function setHero(o) { Object.assign(S.heroFx, o); }
  function setBoss(o) { Object.assign(S.bossFx, o); }
  function setBloom(v) { S.bloomTarget = v; }

  /* Projectiles. Resolves when the first shot lands so damage can sync with the impact. */
  function volley(from, to, n = 1, o = {}) {
    return new Promise((resolve) => {
      const A = pos(from); const B = pos(to); const u = unit();
      let done = false;
      const fin = () => { if (!done) { done = true; resolve(); } };
      const dur = o.dur || 260;
      const now = performance.now();
      for (let i = 0; i < n; i++) {
        S.shots.push({
          ax: A.x, ay: A.y, bx: B.x + (Math.random() - 0.5) * 18 * u, by: B.y + (Math.random() - 0.5) * 18 * u,
          t0: now + i * (o.gap || 28), dur, curve: (Math.random() - 0.5) * (o.spread === undefined ? 90 : o.spread) * u,
          r: (o.size || 3.2) * u, big: !!o.big, onLand: i === 0 ? fin : null
        });
      }
      setTimeout(fin, dur + n * (o.gap || 28) + 250);
    });
  }

  function bossDeath() {
    return new Promise((resolve) => {
      const p = bossPos();
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2; const s = Math.random() * 7 + 1;
        spawn({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 3 + 1, life: 1, decay: 0.01 + Math.random() * 0.012, drag: 0.96, g: -0.01 });
      }
      S.bossFx.dying = 0.001; flash(0.8); shake(16);
      setTimeout(resolve, 1300);
    });
  }

  /* ---------- drawing helpers ---------- */
  const white = (a) => `rgba(255,255,255,${Math.max(0, Math.min(1, a))})`;

  function polyPath(n, r, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i * Math.PI * 2) / n;
      const x = Math.cos(a) * r; const y = Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function glowCircle(x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, white(a)); g.addColorStop(1, white(0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function strokeGlow(width, a, blur = 14) {
    ctx.lineWidth = width; ctx.strokeStyle = white(a);
    ctx.shadowBlur = blur; ctx.shadowColor = white(0.9);
  }

  /* ---------- backdrops ---------- */
  function drawBackdrop() {
    const t = S.t; const b = S.backdrop;
    // drifting dust, shared by every backdrop
    for (const d of S.dust) {
      const speed = b === 'silence' ? 0.02 : 0.06;
      d.y -= speed * d.z * 0.01; d.x += Math.sin(t * 0.004 + d.p) * 0.0002;
      if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
      let x = d.x * W; let y = d.y * H;
      if (b === 'singularity') {
        const c = bossPos(); const ang = t * 0.004 * d.z + d.p; const rad = (0.2 + d.x * 0.8) * Math.max(W, H) * 0.55 * (1 - ((t * 0.0006 * d.z + d.p) % 1));
        x = c.x + Math.cos(ang) * rad; y = c.y + Math.sin(ang) * rad * 0.45;
      }
      ctx.fillStyle = white(0.08 + d.z * 0.25 * (0.6 + 0.4 * Math.sin(t * 0.03 + d.p)));
      ctx.fillRect(x, y, d.z * 1.8, d.z * 1.8);
    }

    ctx.save();
    if (b === 'sanctuary' || b === 'dawn') {
      glowCircle(W * 0.5, H * 0.45, Math.max(W, H) * 0.5, 0.05 + S.bloom * 0.1);
      ctx.strokeStyle = white(0.05); ctx.lineWidth = 1;
      ctx.translate(W * 0.5, H * 0.45);
      for (let i = 1; i <= 4; i++) { polyPath(6, i * 70 * unit(), Math.PI / 6 + t * 0.0008 * (i % 2 ? 1 : -1)); ctx.stroke(); }
    } else if (b === 'threshold') {
      const u = unit();
      ctx.strokeStyle = white(0.06); ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const w = (140 + i * 90) * u; const h = (230 + i * 70) * u; const cx = bossPos().x; const base = H * 0.95;
        ctx.beginPath(); ctx.moveTo(cx - w / 2, base); ctx.lineTo(cx - w / 2, base - h + w / 2);
        ctx.arc(cx, base - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, base); ctx.stroke();
      }
      const fog = ctx.createLinearGradient(0, H * 0.7, 0, H); fog.addColorStop(0, white(0)); fog.addColorStop(1, white(0.06));
      ctx.fillStyle = fog; ctx.fillRect(0, H * 0.7, W, H * 0.3);
    } else if (b === 'silence') {
      const c = bossPos();
      for (let i = 0; i < 4; i++) {
        const ph = ((t * 0.004 + i / 4) % 1);
        ctx.strokeStyle = white(0.1 * (1 - ph)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(c.x, c.y, ph * Math.max(W, H) * 0.7, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (b === 'fracture') {
      ctx.fillStyle = white(0.025);
      for (let y = (t * 0.6) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 1);
      if (Math.random() < 0.08 + S.glitch * 0.5) {
        for (let i = 0; i < 3; i++) { ctx.fillStyle = white(Math.random() * 0.08); ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 180, Math.random() * 6 + 1); }
      }
    } else if (b === 'singularity') {
      const c = bossPos(); ctx.translate(c.x, c.y);
      for (let i = 1; i <= 5; i++) {
        ctx.strokeStyle = white(0.035 * (6 - i)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, i * 70 * unit(), i * 26 * unit(), -0.25, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (b === 'horizon') {
      const hy = H * 0.78;
      const g = ctx.createLinearGradient(0, hy - 60, 0, hy + 4); g.addColorStop(0, white(0)); g.addColorStop(1, white(0.1));
      ctx.fillStyle = g; ctx.fillRect(0, hy - 60, W, 64);
      ctx.strokeStyle = white(0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const x = W * (i + 0.5) / 9 + Math.sin(t * 0.01 + i) * 6;
        ctx.strokeStyle = white(0.03 + 0.03 * Math.sin(t * 0.02 + i)); ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(x + (x - W / 2) * 0.4, 0); ctx.stroke();
      }
    }
    ctx.restore();

    if (S.bloom > 0.001) {
      // the one moment colour returns: a soft dawn over the monochrome world
      const g = ctx.createLinearGradient(0, H, W, 0);
      g.addColorStop(0, `rgba(255,190,140,${0.16 * S.bloom})`);
      g.addColorStop(0.5, `rgba(255,150,190,${0.1 * S.bloom})`);
      g.addColorStop(1, `rgba(140,190,255,${0.16 * S.bloom})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  /* ---------- actors ---------- */
  function drawHero() {
    const p = heroPos(); const u = unit(); const s = 34 * u; const f = S.heroFx;
    const y = p.y + Math.sin(S.t * 0.05) * 6 * u;
    const jx = f.hit ? (Math.random() - 0.5) * 8 * f.hit : 0;
    ctx.save(); ctx.globalAlpha = f.alpha; ctx.translate(p.x + jx, y);
    glowCircle(0, 0, s * 2.4, 0.08 + f.hit * 0.25);
    strokeGlow(2.4, 0.95, 18); polyPath(6, s, Math.PI / 6); ctx.stroke();
    ctx.fillStyle = white(0.05 + f.hit * 0.45); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.4; ctx.strokeStyle = white(0.5);
    polyPath(6, s * 0.46, Math.PI / 6 + S.t * 0.012); ctx.stroke();
    if (f.shield) {
      ctx.setLineDash([6 * u, 5 * u]); ctx.strokeStyle = white(0.45 + 0.2 * Math.sin(S.t * 0.08)); ctx.lineWidth = 1.6;
      polyPath(6, s * 1.55, Math.PI / 6 - S.t * 0.006); ctx.stroke(); ctx.setLineDash([]);
    }
    if (f.stasis) {
      ctx.strokeStyle = white(0.7); ctx.lineWidth = 1.2; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.arc(0, 0, s * 1.9, S.t * 0.02, S.t * 0.02 + Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawLumen() {
    const hp = heroPos(); const u = unit();
    const x = hp.x - 70 * u + Math.sin(S.t * 0.03) * 10 * u; const y = hp.y - 80 * u + Math.cos(S.t * 0.025) * 8 * u;
    ctx.save(); ctx.translate(x, y);
    glowCircle(0, 0, 60 * u, 0.18);
    strokeGlow(1.6, 0.85, 20); ctx.beginPath(); ctx.arc(0, 0, 11 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = white(0.9); ctx.beginPath(); ctx.arc(0, 0, 3.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = white(0.4); ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + S.t * 0.01; const r1 = 16 * u; const r2 = (22 + 4 * Math.sin(S.t * 0.08 + i)) * u;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoss() {
    const kind = S.boss; if (!kind) return;
    const f = S.bossFx; const p = bossPos(); const u = unit(); const t = S.t;
    if (f.enter < 1 && f.alpha > 0) f.enter = Math.min(1, f.enter + 0.02); // entrance plays once the boss is revealed
    if (f.dying > 0) f.dying = Math.min(1, f.dying + 0.012);
    const alpha = f.alpha * f.enter * (1 - f.dying);
    if (alpha <= 0.01) return;
    const s = 56 * u * (0.7 + 0.3 * f.enter) * (1 + f.dying * 0.4);
    const jx = f.hit ? (Math.random() - 0.5) * 12 * f.hit : 0;
    const y = p.y + Math.sin(t * 0.04 + Math.PI) * 8 * u;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x + jx, y);
    glowCircle(0, 0, s * 2.6, 0.06 + f.hit * 0.3 + (f.charge ? 0.08 + 0.06 * Math.sin(t * 0.2) : 0));
    const fill = white(0.05 + f.hit * 0.5);

    if (kind === 'warden') {
      strokeGlow(2.4, 0.9); const w = s * 0.9; const h = s * 2;
      ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w / 2, -h / 2 + w / 2); ctx.arc(0, -h / 2 + w / 2, w / 2, Math.PI, 0); ctx.lineTo(w / 2, h / 2); ctx.closePath();
      ctx.stroke(); ctx.fillStyle = fill; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 1.6; ctx.strokeStyle = white(0.75);
      ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.07, 0); ctx.lineTo(-s * 0.14, s * 0.42); ctx.lineTo(s * 0.14, s * 0.42); ctx.lineTo(s * 0.07, 0); ctx.stroke();
      for (let i = 0; i < 2; i++) {
        const a = t * 0.025 + i * Math.PI; ctx.save(); ctx.translate(Math.cos(a) * s * 1.2, Math.sin(a) * s * 0.5);
        ctx.strokeStyle = white(0.7); polyPath(4, s * 0.14, 0); ctx.stroke(); ctx.restore();
      }
    } else if (kind === 'choir') {
      for (let i = -1; i <= 1; i++) {
        const bob = Math.sin(t * 0.04 + i * 1.7) * 6 * u; const hs = i === 0 ? 1.15 : 0.9;
        ctx.save(); ctx.translate(i * s * 0.85, bob + (i === 0 ? -s * 0.15 : 0));
        strokeGlow(2, 0.85); const w = s * 0.6 * hs; const h = s * 1.3 * hs;
        ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w / 2, -h / 2 + w / 2); ctx.arc(0, -h / 2 + w / 2, w / 2, Math.PI, 0); ctx.lineTo(w / 2, h / 2); ctx.stroke();
        ctx.fillStyle = fill; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = white(0.85); ctx.beginPath(); ctx.ellipse(0, -h / 2 + w / 2, w * 0.22, w * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (kind === 'fracture') {
      const shards = 6; const spread = (f.stun ? 0.35 : 0.12) + 0.1 * Math.sin(t * 0.07) + S.glitch * 0.4;
      for (let i = 0; i < shards; i++) {
        const a0 = (i / shards) * Math.PI * 2; const a1 = ((i + 1) / shards) * Math.PI * 2;
        const mid = (a0 + a1) / 2; const off = s * spread * (1 + (i % 2) * 0.6);
        const jit = Math.random() < 0.05 ? (Math.random() - 0.5) * 14 : 0;
        ctx.save(); ctx.translate(Math.cos(mid) * off + jit, Math.sin(mid) * off);
        strokeGlow(2, 0.9); ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * s * 1.1 * (i % 2 ? 1 : 0.8), Math.sin(a0) * s * 1.4);
        ctx.lineTo(Math.cos(a1) * s * 1.1 * (i % 2 ? 0.8 : 1), Math.sin(a1) * s * 1.4); ctx.closePath();
        ctx.stroke(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
      }
      ctx.shadowBlur = 0; ctx.fillStyle = white(0.9); ctx.fillRect(-3, -3, 6, 6);
    } else if (kind === 'singularity') {
      ctx.save(); ctx.rotate(-0.25);
      for (let i = 0; i < 3; i++) {
        strokeGlow(1.4, 0.55 - i * 0.12, 10);
        ctx.beginPath(); ctx.ellipse(0, 0, s * (1.5 + i * 0.35), s * (0.42 + i * 0.1), 0, t * 0.01 * (i + 1), t * 0.01 * (i + 1) + Math.PI * 1.7); ctx.stroke();
      }
      ctx.restore();
      ctx.shadowBlur = 30; ctx.shadowColor = white(1); ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2); ctx.fill();
      strokeGlow(2.2, 0.95, 24); ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 10; i++) {
        const a = t * 0.03 + i * 0.63; const r = s * (0.9 + ((t * 0.01 + i * 0.37) % 1) * 0.9);
        ctx.fillStyle = white(0.6); ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r * 0.35, 2, 2);
      }
    } else if (kind === 'void') {
      const p2 = f.phase2; const size = s * (p2 ? 1.25 : 1.05);
      ctx.save(); ctx.rotate(t * (p2 ? 0.012 : 0.006));
      for (let i = 0; i < (p2 ? 7 : 4); i++) {
        const a = (i / (p2 ? 7 : 4)) * Math.PI * 2;
        ctx.strokeStyle = white(0.25); ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = 0; k <= 20; k++) {
          const rr = size * 1.1 + k * 4 * u; const aa = a + Math.sin(t * 0.03 + k * 0.4 + i) * 0.25;
          const x = Math.cos(aa) * rr; const yy = Math.sin(aa) * rr;
          if (k) ctx.lineTo(x, yy); else ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      strokeGlow(2.6, 0.95, 24);
      ctx.beginPath(); ctx.moveTo(0, -size * 1.3); ctx.lineTo(size, 0); ctx.lineTo(0, size * 1.3); ctx.lineTo(-size, 0); ctx.closePath();
      ctx.fillStyle = p2 ? white(0.92) : fill; ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      const hp = heroPos(); const look = Math.atan2(hp.y - p.y, hp.x - p.x);
      ctx.strokeStyle = p2 ? '#000' : white(0.9); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(0, 0, size * 0.55, size * 0.24 * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.01))), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = p2 ? '#000' : white(1);
      ctx.beginPath(); ctx.arc(Math.cos(look) * size * 0.18, Math.sin(look) * size * 0.08, size * 0.09, 0, Math.PI * 2); ctx.fill();
    }

    if (f.stun) {
      ctx.shadowBlur = 0; ctx.strokeStyle = white(0.6); ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.ellipse(0, -s * 1.5, s * 0.6, s * 0.18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /* ---------- simulation ---------- */
  function update(dt, now) {
    S.t += dt;
    S.heroFx.hit = Math.max(0, S.heroFx.hit - 0.06 * dt);
    S.bossFx.hit = Math.max(0, S.bossFx.hit - 0.06 * dt);
    S.flash = Math.max(0, S.flash - 0.04 * dt);
    S.glitch = Math.max(0, S.glitch - 0.03 * dt);
    S.bloom += (S.bloomTarget - S.bloom) * 0.01 * dt;

    for (let i = S.particles.length - 1; i >= 0; i--) {
      const q = S.particles[i];
      q.vx *= Math.pow(q.drag, dt); q.vy = q.vy * Math.pow(q.drag, dt) + q.g * dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= q.decay * dt;
      if (q.life <= 0) S.particles.splice(i, 1);
    }
    for (let i = S.rings.length - 1; i >= 0; i--) {
      const r = S.rings[i]; r.r = Math.max(0, r.r + r.vr * dt); r.life -= r.decay * dt;
      if (r.life <= 0) S.rings.splice(i, 1);
    }
    for (let i = S.texts.length - 1; i >= 0; i--) {
      const x = S.texts[i]; x.y -= 0.7 * dt; x.life -= 0.016 * dt;
      if (x.life <= 0) S.texts.splice(i, 1);
    }
    for (let i = S.shots.length - 1; i >= 0; i--) {
      const s = S.shots[i]; const k = (now - s.t0) / s.dur;
      if (k >= 1) {
        if (s.onLand) s.onLand();
        for (let j = 0; j < (s.big ? 14 : 5); j++) {
          const a = Math.random() * Math.PI * 2; const sp = Math.random() * (s.big ? 6 : 3) + 1;
          spawn({ x: s.bx, y: s.by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 2 + 1, life: 1, decay: 0.05, drag: 0.9, g: 0 });
        }
        S.shots.splice(i, 1);
      }
    }
  }

  function drawFx(now) {
    for (const q of S.particles) {
      ctx.fillStyle = white(q.life * (q.dim ? 0.45 : 0.9));
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const r of S.rings) {
      ctx.save(); ctx.translate(r.x, r.y); ctx.strokeStyle = white(r.life * 0.7); ctx.lineWidth = 1.6;
      if (r.hex) polyPath(6, r.r, Math.PI / 6); else { ctx.beginPath(); ctx.arc(0, 0, r.r, 0, Math.PI * 2); }
      ctx.stroke(); ctx.restore();
    }
    for (const s of S.shots) {
      const k = (now - s.t0) / s.dur; if (k < 0) continue;
      const e = k * k * (3 - 2 * k);
      const mx = (s.ax + s.bx) / 2; const my = (s.ay + s.by) / 2 + s.curve;
      const x = (1 - e) * (1 - e) * s.ax + 2 * (1 - e) * e * mx + e * e * s.bx;
      const y = (1 - e) * (1 - e) * s.ay + 2 * (1 - e) * e * my + e * e * s.by;
      glowCircle(x, y, s.r * (s.big ? 7 : 4), 0.5);
      ctx.fillStyle = white(1); ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    const u = unit();
    for (const x of S.texts) {
      const big = x.kind === 'dmg' || x.kind === 'crit';
      const size = (x.kind === 'crit' ? 34 : big ? 28 : 17) * u;
      ctx.save(); ctx.globalAlpha = Math.min(1, x.life * 1.6);
      ctx.font = `700 ${size}px Cinzel, 'Times New Roman', serif`; ctx.textAlign = 'center';
      ctx.shadowBlur = 12; ctx.shadowColor = white(0.9);
      ctx.fillStyle = x.kind === 'heal' ? '#ffffff' : x.kind === 'self' ? '#bdbdbd' : x.kind === 'status' ? '#d8d8d8' : '#ffffff';
      ctx.fillText(x.text, x.x, x.y);
      ctx.restore();
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(3, (now - lastT) / 16.67 || 1); lastT = now;
    if (!cvs || !cvs.offsetParent) return; // hidden: skip drawing but keep one loop alive
    const r = cvs.getBoundingClientRect();
    if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) resize();
    update(dt, now);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H); // clear before shaking so no smear is left at the edges
    if (S.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
      S.shake *= Math.pow(0.88, dt);
    } else S.shake = 0;
    if (S.glitch > 0.05 && Math.random() < 0.3) ctx.translate((Math.random() - 0.5) * 14 * S.glitch, 0);
    drawBackdrop();
    if (S.lumen) drawLumen();
    if (S.hero) drawHero();
    drawBoss();
    drawFx(now);
    if (S.flash > 0.01) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = white(S.flash * 0.5); ctx.fillRect(0, 0, W, H); }
  }

  return {
    attach, start, stop, setScene, heroPos, bossPos, bossTop, onResize: (fn) => resizeHooks.push(fn), burst, aura, float, hit, shake, flash, glitch,
    setHero, setBoss, setBloom, volley, bossDeath, get state() { return S; }
  };
})();
