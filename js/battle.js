/* pickpack - deck-building battle rules.
 * Every async step checks a battle token, so a finished or abandoned battle can never
 * keep acting in the background (the cause of the original soft locks and loop leaks). */
'use strict';

const Battle = (() => {
  const HAND_MAX = 10;
  const DRAW = 5;
  const ENERGY = 3;
  const PLAYER_HP = 80;
  const OVERRIDE_TARGET = 20;
  const OVERRIDE_MS = 5000;

  let B = null;
  let token = 0;
  let uidSeq = 1;
  let bound = false;

  const live = (tok) => !!B && tok === token && !B.over;
  const newCard = (id, lv) => ({ uid: uidSeq++, id, lv, tmpCost: null, free: false, sealed: false, glitched: false, fresh: false });
  const unit = (who) => (who === 'foe' ? B.foe : B.player);
  const fxOf = (who) => (who === 'foe' ? 'boss' : 'hero');

  /* ---------- rules helpers ---------- */
  function costOf(c) {
    const def = Cards.get(c.id);
    if (def.cost === null) return null;
    if (c.free) return 0;
    if (c.tmpCost !== null) return c.tmpCost;
    return Cards.costOf(c.id, c.lv);
  }

  function canPlay(c) {
    if (!B) return false;
    const def = Cards.get(c.id);
    if (def.unplayable || c.sealed) return false;
    return costOf(c) <= B.energy;
  }

  function calc(base, atk, def) {
    let d = base + (atk.st.resonance || 0);
    if (atk.st.dim) d = Math.floor(d * 0.75);
    if (def.st.fracture) d = Math.floor(d * 1.5);
    return Math.max(0, d);
  }
  const previewDamage = (n) => (B ? calc(n, B.player, B.foe) : n);
  const previewEnemyDamage = (n) => (B ? calc(n, B.foe, B.player) : n);

  function clearFlags(c) { c.tmpCost = null; c.free = false; c.sealed = false; c.glitched = false; }

  function decay(T) {
    for (const k of ['fracture', 'dim']) {
      if (T.st[k]) { T.st[k] -= 1; if (T.st[k] <= 0) delete T.st[k]; }
    }
  }

  /* ---------- rendering shortcuts ---------- */
  function renderAll() {
    if (!B) return;
    BattleView.bars(B); BattleView.energy(B); BattleView.piles(B); BattleView.hand(B); BattleView.intent(B);
  }
  function setBusy(v) { if (!B) return; B.busy = v; BattleView.busy(v); BattleView.hand(B); }

  /* ---------- core actions ---------- */
  function strike(who, n) {
    const T = unit(who); const f = fxOf(who);
    if (n > 0 && T.st.stasis > 0) {
      T.st.stasis -= 1; if (!T.st.stasis) delete T.st.stasis;
      FX.float(f, 'Negated', 'status'); FX.aura(f, 'shield'); Sfx.play('blocked');
      BattleView.bars(B);
      return { unblocked: 0, blocked: n, negated: true };
    }
    const blocked = Math.min(T.shield, n); T.shield -= blocked;
    const rest = n - blocked;
    T.hp = Math.max(0, T.hp - rest);
    if (rest > 0) {
      FX.hit(f, rest / 3); FX.float(f, `-${rest}`, rest >= 25 ? 'crit' : 'dmg');
      FX.burst(f, { n: Math.min(44, 8 + rest) }); Sfx.play(rest >= 20 ? 'heavy' : 'hit');
    } else { FX.float(f, 'Blocked', 'status'); FX.aura(f, 'shield'); Sfx.play('blocked'); }
    if (who === 'foe') B.stats.dealt += rest; else B.stats.taken += rest;
    BattleView.bars(B);
    return { unblocked: rest, blocked, negated: false };
  }

  function hurt(who, n) {
    if (n <= 0) return;
    const T = unit(who); const f = fxOf(who);
    T.hp = Math.max(0, T.hp - n);
    FX.hit(f, 1); FX.float(f, `-${n}`, 'self'); Sfx.play('hit');
    if (who === 'foe') B.stats.dealt += n; else B.stats.taken += n;
    BattleView.bars(B);
  }

  function heal(who, n) {
    const T = unit(who); const f = fxOf(who);
    const before = T.hp; T.hp = Math.min(T.maxHp, T.hp + n);
    const got = T.hp - before; // show what was really healed, never more
    FX.float(f, got > 0 ? `+${got}` : 'Full HP', 'heal'); FX.aura(f, 'heal'); Sfx.play('heal');
    BattleView.bars(B);
  }

  function gainShield(who, n) {
    const T = unit(who); const f = fxOf(who);
    T.shield += n;
    FX.float(f, `+${n} Shield`, 'status'); FX.aura(f, 'shield'); Sfx.play('block');
    BattleView.bars(B);
  }

  function applyStatus(who, k, n) {
    if (!n) return;
    const T = unit(who); const f = fxOf(who); const kw = Keywords[k];
    T.st[k] = (T.st[k] || 0) + n;
    FX.float(f, `${kw.name} +${n}`, 'status');
    FX.aura(f, kw.debuff ? 'debuff' : 'buff'); Sfx.play(kw.debuff ? 'debuff' : 'buff');
    BattleView.bars(B); BattleView.intent(B); BattleView.hand(B);
  }

  function checkEnd() {
    if (!B || B.over) return true;
    if (B.foe.hp <= 0) { B.over = true; finish(true); return true; }
    if (B.player.hp <= 0) { B.over = true; finish(false); return true; }
    return false;
  }

  async function draw(n, opts = {}) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (!B.drawPile.length) {
        if (!B.discard.length) break;
        B.drawPile = shuffle(B.discard); B.discard = [];
        FX.float('hero', 'Reshuffle', 'status');
      }
      const c = B.drawPile.pop();
      if (B.hand.length >= HAND_MAX) { B.discard.push(c); FX.float('hero', 'Hand full', 'status'); continue; }
      c.fresh = true; c.freshIdx = k++;
      if (opts.free) c.free = true;
      B.hand.push(c);
    }
    if (k) Sfx.play('draw');
    BattleView.hand(B); BattleView.piles(B);
    await wait(90 + k * 45);
  }

  function seal(n) {
    const cands = B.hand.filter((c) => !c.sealed && !Cards.get(c.id).unplayable);
    let done = 0;
    for (let i = 0; i < n && cands.length; i++) { cands.splice(randInt(0, cands.length - 1), 1)[0].sealed = true; done++; }
    if (done) { FX.float('hero', done > 1 ? `${done} cards sealed` : 'Card sealed', 'status'); Sfx.play('debuff'); }
  }

  function distort(n) {
    const cands = B.hand.filter((c) => Cards.get(c.id).cost !== null && !c.free);
    for (let i = 0; i < n && cands.length; i++) {
      const c = cands.splice(randInt(0, cands.length - 1), 1)[0];
      const base = Cards.costOf(c.id, c.lv); let v;
      do { v = randInt(0, 3); } while (v === base);
      c.tmpCost = v; c.glitched = true;
    }
    FX.glitch(0.8); Sfx.play('glitch');
  }

  function nextIntent(first) {
    const F = B.foe;
    if (!first) F.pi = (F.pi + 1) % F.pattern.length;
    F.moveKey = F.pattern[F.pi]; F.move = B.boss.moves[F.moveKey];
    FX.setBoss({ charge: F.move.fx.some((o) => o[0] === 'hit' && o[1] >= 25) });
  }

  /* ---------- battle flow ---------- */
  async function start(chapterIdx) {
    const tok = ++token;
    const chapter = Chapters[chapterIdx]; const boss = Bosses[chapter.boss];
    B = {
      chapterIdx, chapter, boss, replay: chapterIdx < Save.data.progress,
      player: { hp: PLAYER_HP, maxHp: PLAYER_HP, shield: 0, st: {} },
      foe: { hp: boss.hp, maxHp: boss.hp, shield: 0, st: {}, passives: boss.passives.slice(), pattern: boss.pattern, pi: 0, move: null, moveKey: null, phase: 1 },
      energy: 0, maxEnergy: ENERGY,
      drawPile: shuffle(Save.deckList().map((c) => newCard(c.id, c.lv))), hand: [], discard: [], exhausted: [],
      turn: 0, busy: true, over: false, flags: {}, events: {}, pendingSeal: 0, drawLess: 0, said: {},
      stats: { dealt: 0, taken: 0, cards: 0 }
    };
    BattleView.reset(); BattleView.stage(chapter, boss);
    FX.attach(BattleView.el.canvas);
    FX.setScene({ mode: 'battle', backdrop: chapter.backdrop, boss: boss.shape, bossEnter: true });
    FX.start();
    nextIntent(true);
    BattleView.busy(true);
    renderAll();
    await wait(800); if (!live(tok)) return;
    BattleView.speech(chapter.boss, boss.lines.start, 3400);
    await wait(600); if (!live(tok)) return;
    await playerTurn(tok);
  }

  async function playerTurn(tok) {
    const P = B.player;
    setBusy(true);
    B.turn += 1;
    P.shield = 0; // Shield fades at the start of your turn
    renderAll();
    if (P.st.ember) {
      const n = P.st.ember; P.st.ember -= 1; if (!P.st.ember) delete P.st.ember;
      hurt('hero', n); if (checkEnd()) return;
      await wait(300); if (!live(tok)) return;
    }
    if (P.st.bloom) { const n = P.st.bloom; P.st.bloom -= 1; if (!P.st.bloom) delete P.st.bloom; heal('hero', n); }
    if (P.st.solar) heal('hero', P.st.solar);
    B.energy = B.maxEnergy + (P.st.transcend || 0);
    BattleView.banner('Your Turn', `Turn ${B.turn}`); Sfx.play('turn');
    renderAll();
    await wait(380); if (!live(tok)) return;
    const n = Math.max(0, DRAW + (P.st.foresight || 0) - B.drawLess); B.drawLess = 0;
    await draw(n); if (!live(tok)) return;
    if (B.foe.passives.includes('silence')) seal(1);
    if (B.pendingSeal) { seal(B.pendingSeal); B.pendingSeal = 0; }
    if (B.foe.passives.includes('distortion')) distort(2);
    setBusy(false);
    renderAll();
  }

  async function play(uid) {
    if (!B || B.busy || B.over) return;
    const idx = B.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return;
    const c = B.hand[idx]; const def = Cards.get(c.id);
    if (!canPlay(c)) { reject(c, def); return; }
    const tok = token;
    setBusy(true);
    B.energy -= costOf(c);
    B.hand.splice(idx, 1);
    BattleView.ghost(c); Sfx.play('card');
    renderAll();
    await wait(160); if (!live(tok)) return;

    let reps = 1;
    if (def.type === 'attack' && B.player.st.echo) { reps = 2; B.player.st.echo -= 1; if (!B.player.st.echo) delete B.player.st.echo; }
    for (let r = 0; r < reps; r++) {
      if (r) { FX.float('hero', 'Echo', 'status'); Sfx.play('buff'); await wait(260); if (!live(tok)) return; }
      for (const op of Cards.effects(c.id, c.lv)) {
        await effect(op, tok);
        if (!live(tok) || checkEnd()) return;
      }
      if (def.type === 'attack' && B.player.st.inferno) applyStatus('foe', 'ember', B.player.st.inferno);
    }
    clearFlags(c);
    if (def.exhaust || def.type === 'power') B.exhausted.push(c); else B.discard.push(c);
    B.stats.cards += 1;
    renderAll();
    await runEvents(tok); if (!live(tok)) return;
    setBusy(false);
    renderAll();
  }

  function reject(c, def) {
    Sfx.play('error');
    const node = BattleView.el.hand.querySelector(`[data-uid="${c.uid}"]`);
    if (node) { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); }
    const why = def.unplayable ? `${def.name} cannot be played.` : c.sealed ? 'That card is sealed this turn.' : 'Not enough Energy.';
    UI.toast(why, def.unplayable ? 'static' : c.sealed ? 'lock' : 'bolt');
  }

  async function effect(op, tok) {
    const [k, a, b, o] = op; const P = B.player; const F = B.foe;
    switch (k) {
      case 'hit': {
        const times = b || 1;
        for (let i = 0; i < times; i++) {
          await FX.volley('hero', 'boss', 1, { big: a >= 18, spread: 40, dur: 230 });
          if (!live(tok)) return;
          const res = strike('foe', calc(a, P, F));
          if (o && o.lifesteal && res.unblocked > 0) heal('hero', res.unblocked);
          if (checkEnd()) return;
          if (times > 1) await wait(70);
        }
        break;
      }
      case 'hitRand': await effect(['hit', randInt(a, b)], tok); break;
      case 'hitPct': await effect(['hit', Math.max(1, Math.floor((F.hp * a) / 100))], tok); break;
      case 'shield': gainShield('hero', a); break;
      case 'heal': heal('hero', a); break;
      case 'loseHp': hurt('hero', a); break;
      case 'energy': B.energy += a; FX.float('hero', `+${a} Energy`, 'status'); Sfx.play('buff'); break;
      case 'draw': if (a > 0) await draw(a); break;
      case 'drawFree': await draw(a, { free: true }); break;
      case 'foe': applyStatus('foe', a, b); break;
      case 'self': applyStatus('hero', a, b); break;
      case 'doubleFoe': if (F.st[a]) applyStatus('foe', a, F.st[a]); break;
      case 'cleanse':
        for (const s of ['fracture', 'dim', 'ember']) delete P.st[s];
        FX.float('hero', 'Cleansed', 'status'); FX.aura('hero', 'buff');
        break;
      default: break;
    }
    if (B && !B.over) { BattleView.energy(B); BattleView.hand(B); BattleView.intent(B); }
    await wait(90);
  }

  async function endTurn() {
    if (!B || B.busy || B.over) return;
    const tok = token;
    setBusy(true);
    Sfx.play('click');
    const keep = [];
    for (const c of B.hand) {
      const def = Cards.get(c.id);
      clearFlags(c);
      if (def.retain) keep.push(c);
      else if (def.ethereal) B.exhausted.push(c);
      else B.discard.push(c);
    }
    B.hand = keep;
    delete B.player.st.echo;
    decay(B.player);
    renderAll();
    await wait(280); if (!live(tok)) return;
    await enemyTurn(tok); if (!live(tok)) return;
    await runEvents(tok); if (!live(tok)) return;
    await playerTurn(tok);
  }

  async function enemyTurn(tok) {
    const F = B.foe; const P = B.player;
    BattleView.banner(B.boss.short, F.phase === 2 ? 'Unmaking' : 'Enemy Turn'); Sfx.play('enemy');
    F.shield = 0;
    BattleView.bars(B);
    await wait(700); if (!live(tok)) return;

    if (F.st.ember) {
      const n = F.st.ember; F.st.ember -= 1; if (!F.st.ember) delete F.st.ember;
      hurt('foe', n); if (checkEnd()) return;
      await wait(320); if (!live(tok)) return;
    }

    if (F.st.stun) {
      F.st.stun -= 1; if (!F.st.stun) delete F.st.stun;
      FX.float('boss', 'Stunned', 'status'); FX.setBoss({ stun: false });
      await wait(800); if (!live(tok)) return;
    } else {
      const move = F.move; const key = F.moveKey;
      B.said[key] = (B.said[key] || 0) + 1;
      if (move.say && (B.said[key] === 1 || Math.random() < 0.3)) BattleView.speech(B.chapter.boss, pickOne(move.say), 2300);
      if (F.passives.includes('unmaking') && P.shield > 0) {
        const lost = Math.ceil(P.shield / 2); P.shield -= lost;
        FX.float('hero', `Unmade -${lost}`, 'status'); FX.glitch(0.6); Sfx.play('glitch');
        BattleView.bars(B);
        await wait(380); if (!live(tok)) return;
      }
      for (const op of move.fx) {
        await enemyOp(op, tok);
        if (!live(tok) || checkEnd()) return;
      }
    }
    decay(F);
    if (F.passives.includes('gravity')) applyStatus('foe', 'resonance', 1);
    nextIntent(false);
    renderAll();
    await wait(260);
  }

  async function enemyOp(op, tok) {
    const [k, a, b] = op; const F = B.foe; const P = B.player;
    switch (k) {
      case 'hit': {
        const times = b || 1;
        for (let i = 0; i < times; i++) {
          await FX.volley('boss', 'hero', times > 1 ? 3 : 7, { spread: 90, dur: 300, big: a >= 20 });
          if (!live(tok)) return;
          const res = strike('hero', calc(a, F, P));
          if (checkEnd()) return;
          if (P.st.thorns && !res.negated) {
            await wait(90); if (!live(tok)) return;
            strike('foe', P.st.thorns);
            if (checkEnd()) return;
          }
          await wait(times > 1 ? 130 : 220);
        }
        break;
      }
      case 'shield': gainShield('foe', a); await wait(320); break;
      case 'self': applyStatus('foe', a, b); await wait(320); break;
      case 'foe': applyStatus('hero', a, b); await wait(320); break;
      case 'addCard':
        for (let i = 0; i < b; i++) B.drawPile.splice(randInt(0, B.drawPile.length), 0, newCard(a, 0));
        FX.float('hero', `+${b} ${Cards.get(a).name}`, 'status'); FX.glitch(0.4); Sfx.play('glitch');
        BattleView.piles(B);
        await wait(380);
        break;
      case 'seal': B.pendingSeal += a; FX.float('hero', 'Silence looms', 'status'); Sfx.play('debuff'); await wait(320); break;
      case 'drawLess': B.drawLess += a; FX.float('hero', `Next draw -${a}`, 'status'); Sfx.play('debuff'); await wait(320); break;
      case 'charge': FX.aura('boss', 'charge'); FX.shake(5); FX.float('boss', 'Charging', 'status'); Sfx.play('whoosh'); await wait(750); break;
      default: break;
    }
  }

  /* ---------- scripted events ---------- */
  async function runEvents(tok) {
    const F = B.foe; const ratio = F.hp / F.maxHp;
    for (const ev of B.boss.events || []) {
      if (B.events[ev.id] || ratio > ev.at || F.hp <= 0) continue;
      B.events[ev.id] = true;
      if (ev.id === 'override') await eventOverride(tok);
      else if (ev.id === 'phase2') await eventPhase2(tok);
      if (!live(tok)) return;
    }
    const lines = B.boss.lines;
    if (!B.flags.half && ratio <= 0.5 && lines.half) { B.flags.half = true; BattleView.speech(B.chapter.boss, lines.half); }
    if (!B.flags.low && ratio <= 0.25 && lines.low) { B.flags.low = true; BattleView.speech(B.chapter.boss, lines.low); }
  }

  async function eventOverride(tok) {
    setBusy(true);
    FX.glitch(1.2); Sfx.play('glitch');
    await UI.dialogue(Story.events.override); if (!live(tok)) return;
    const count = await mash(tok); if (!live(tok)) return;
    const dmg = Math.min(30, count) + (count >= OVERRIDE_TARGET ? 10 : 0);
    FX.flash(0.9); FX.shake(18);
    B.foe.hp = Math.max(0, B.foe.hp - dmg); B.stats.dealt += dmg;
    FX.float('boss', `-${dmg}`, 'crit'); FX.burst('boss', { n: 70, speed: 9 }); Sfx.play('heavy');
    BattleView.bars(B);
    if (checkEnd()) return;
    await wait(500); if (!live(tok)) return;
    if (count >= OVERRIDE_TARGET) {
      applyStatus('foe', 'stun', 1); FX.setBoss({ stun: true });
      await UI.dialogue(Story.events.overrideWin);
    } else {
      await UI.dialogue(Story.events.overrideLose);
    }
    renderAll();
  }

  /* Mash clicks, taps or keys. A short grace period stops the triggering click from counting. */
  function mash(tok) {
    return new Promise((resolve) => {
      const ov = BattleView.el.ov;
      let count = 0; let done = false; let t0 = 0;
      const press = (e) => {
        if (done || (e.type === 'keydown' && e.repeat)) return;
        e.preventDefault();
        count += 1; Sfx.play('mash'); FX.burst('boss', { n: 4, speed: 5 }); FX.shake(3);
        BattleView.overrideUpdate(count, 1 - (performance.now() - t0) / OVERRIDE_MS);
      };
      const finish = () => {
        if (done) return; done = true;
        ov.removeEventListener('pointerdown', press); window.removeEventListener('keydown', press, true);
        BattleView.overrideHide(); resolve(count);
      };
      const tick = () => {
        if (done) return;
        const frac = 1 - (performance.now() - t0) / OVERRIDE_MS;
        BattleView.overrideUpdate(count, frac);
        if (frac <= 0 || !live(tok)) finish(); else requestAnimationFrame(tick);
      };
      BattleView.overrideShow(OVERRIDE_TARGET);
      setTimeout(() => {
        t0 = performance.now();
        ov.addEventListener('pointerdown', press); window.addEventListener('keydown', press, true);
        requestAnimationFrame(tick);
        setTimeout(finish, OVERRIDE_MS + 300); // fallback if the tab was hidden
      }, 450);
    });
  }

  async function eventPhase2(tok) {
    setBusy(true);
    FX.flash(1); FX.shake(20); Sfx.play('heavy');
    await UI.dialogue(Story.events.phase2); if (!live(tok)) return;
    const F = B.foe;
    F.phase = 2; F.pattern = B.boss.pattern2; F.pi = 0; F.shield = 0; F.passives = ['unmaking'];
    nextIntent(true);
    FX.setBoss({ phase2: true }); FX.flash(0.8);
    for (const s of ['fracture', 'dim', 'ember']) delete B.player.st[s];
    const light = newCard('last_light', 0); light.fresh = true;
    if (B.hand.length < HAND_MAX) B.hand.push(light); else B.drawPile.push(light);
    FX.aura('hero', 'heal'); FX.float('hero', 'Last Light', 'status'); Sfx.play('legend');
    renderAll();
    await wait(450);
  }

  async function finish(win) {
    const tok = token;
    BattleView.busy(true); BattleView.intent(B); BattleView.hand(B);
    const result = { win, chapterIdx: B.chapterIdx, replay: B.replay, turns: B.turn, stats: Object.assign({}, B.stats) };
    if (win) {
      Sfx.play('win');
      BattleView.banner('Phase Broken', B.chapter.name);
      await FX.bossDeath();
    } else {
      Sfx.play('lose');
      FX.setHero({ alpha: 0.25 }); FX.burst('hero', { n: 50 });
      if (B.boss.lines.kill) BattleView.speech(B.chapter.boss, B.boss.lines.kill, 3200);
      await wait(1500);
    }
    if (tok !== token) return;
    UI.onBattleEnd(result);
  }

  /* Leave the battle immediately (no rewards). */
  function retreat() {
    if (!B) return;
    token += 1; B.over = true;
    BattleView.overrideHide(); BattleView.busy(true);
  }

  /* ---------- input ---------- */
  function init() {
    if (bound) return; bound = true;
    BattleView.bind();
    const el = BattleView.el;
    let lastPointer = 'mouse';
    el.hand.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; });
    el.hand.addEventListener('click', (e) => {
      const card = e.target.closest('.card'); if (!card || e.target.closest('.kw')) return;
      // On touch screens the first tap lifts a card and the second tap plays it.
      if (lastPointer === 'touch' && card.classList.contains('playable') && !card.classList.contains('touch-sel')) {
        el.hand.querySelectorAll('.touch-sel').forEach((n) => n.classList.remove('touch-sel'));
        card.classList.add('touch-sel'); Sfx.play('hover');
        return;
      }
      play(Number(card.dataset.uid));
    });
    el.hand.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.card'); if (!card) return;
      e.preventDefault(); play(Number(card.dataset.uid));
    });
    el.hand.addEventListener('mouseover', (e) => { if (e.target.closest('.card.playable')) Sfx.play('hover', 60); });
    el.end.addEventListener('click', () => endTurn());
    el.draw.addEventListener('click', () => B && UI.showPile('Draw Pile', B.drawPile, 'Shown in no particular order. Cards are drawn at random.'));
    el.discard.addEventListener('click', () => B && UI.showPile('Discard Pile', B.discard, 'Shuffled back into the draw pile when it runs out.'));
    el.exhaust.addEventListener('click', () => B && UI.showPile('Exhausted', B.exhausted, 'Removed for the rest of this battle.'));
    window.addEventListener('keydown', (e) => {
      if (!B || B.over || B.busy || !UI.isActive('battle') || UI.modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= '1' && e.key <= '9') { const c = B.hand[Number(e.key) - 1]; if (c) play(c.uid); }
      else if (e.key === '0') { const c = B.hand[9]; if (c) play(c.uid); }
      else if (e.key === 'e' || e.key === 'E') endTurn();
    });
  }

  return {
    init, start, play, endTurn, retreat, costOf, canPlay, previewDamage, previewEnemyDamage,
    PLAYER_HP, get state() { return B; }
  };
})();
