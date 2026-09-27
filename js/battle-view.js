/* pickpack - battle screen rendering (DOM side). All game rules live in battle.js. */
'use strict';

const BattleView = (() => {
  let el = null;
  let speechTimer = 0; let bannerTimer = 0;

  function bind() {
    const q = (id) => document.getElementById(id);
    el = {
      screen: q('screen-battle'), stage: q('bStage'), canvas: q('bCanvas'),
      pHpFill: q('bpHpFill'), pHpLag: q('bpHpLag'), pHpText: q('bpHpText'), pShield: q('bpShield'), pStatus: q('bpStatus'),
      fName: q('bfName'), fHpFill: q('bfHpFill'), fHpLag: q('bfHpLag'), fHpText: q('bfHpText'), fShield: q('bfShield'), fStatus: q('bfStatus'),
      code: q('bStageCode'), name: q('bStageName'), turn: q('bTurn'),
      intent: q('bIntent'), speech: q('bSpeech'), banner: q('bBanner'), ghost: q('bGhost'),
      energy: q('bEnergy'), hand: q('bHand'), end: q('bEnd'),
      draw: q('bDraw'), discard: q('bDiscard'), exhaust: q('bExhaust'),
      ov: q('bOverride'), ovCount: q('ovCount'), ovTimer: q('ovTimer'), ovTarget: q('ovTarget')
    };
    FX.onResize(() => { if (Battle.state && UI.isActive('battle')) { placeIntent(); fitHand(); } });
  }

  const pct = (a, b) => `${Math.max(0, Math.min(100, (a / b) * 100))}%`;

  function bars(B) {
    const p = B.player; const f = B.foe;
    el.pHpFill.style.width = pct(p.hp, p.maxHp); el.pHpLag.style.width = pct(p.hp, p.maxHp);
    el.pHpText.textContent = `${p.hp} / ${p.maxHp}`;
    el.fHpFill.style.width = pct(f.hp, f.maxHp); el.fHpLag.style.width = pct(f.hp, f.maxHp);
    el.fHpText.textContent = `${f.hp} / ${f.maxHp}`;
    shieldBadge(el.pShield, p.shield); shieldBadge(el.fShield, f.shield);
    el.pStatus.innerHTML = chips(p.st, []);
    el.fStatus.innerHTML = chips(f.st, B.foe.passives);
    el.turn.textContent = tr('b.turnN', { n: B.turn });
    FX.setHero({ shield: p.shield > 0, stasis: (p.st.stasis || 0) > 0 });
  }

  function shieldBadge(node, n) {
    node.classList.toggle('on', n > 0);
    node.innerHTML = n > 0 ? `${Icons.svg('shield')}<b>${n}</b>` : '';
    node.setAttribute('data-tip', tr('tip.shield', { n }));
  }

  function chips(st, passives) {
    let h = '';
    for (const k of passives) {
      const kw = Keywords[k]; if (!kw) continue;
      h += `<span class="st-chip passive" data-tip="${Cards.esc(tr('tip.passive', { name: Cards.kwName(k), desc: Cards.kwDesc(k) }))}">${Icons.svg(kw.icon)}</span>`;
    }
    for (const k of Object.keys(st)) {
      const n = st[k]; const kw = Keywords[k];
      if (!n || !kw || !kw.icon) continue;
      h += `<span class="st-chip ${kw.debuff ? 'debuff' : ''}" data-tip="${Cards.esc(Cards.kwTip(k))}">${Icons.svg(kw.icon)}<b>${n}</b></span>`;
    }
    return h;
  }

  function stage(chapter, boss) {
    el.code.textContent = loc(chapter.code);
    el.name.textContent = loc(chapter.name);
    el.fName.textContent = loc(boss.name).toUpperCase();
  }

  function energy(B) {
    el.energy.innerHTML = `<b>${B.energy}</b><span>/${B.maxEnergy}</span>`;
    el.energy.classList.toggle('empty', B.energy <= 0);
  }

  function piles(B) {
    el.draw.querySelector('b').textContent = B.drawPile.length;
    el.discard.querySelector('b').textContent = B.discard.length;
    el.exhaust.querySelector('b').textContent = B.exhausted.length;
    el.exhaust.classList.toggle('empty', B.exhausted.length === 0);
  }

  function hand(B) {
    const n = B.hand.length;
    let h = '';
    B.hand.forEach((c, i) => {
      const cost = Battle.costOf(c);
      const def = Cards.get(c.id);
      const playable = Battle.canPlay(c);
      const off = i - (n - 1) / 2;
      const rot = off * fanStep(n);
      const lift = Math.pow(Math.abs(off), 1.5) * 2.4;
      const costCls = [c.glitched ? 'glitched' : '', c.free ? 'free' : '', cost > B.energy && !def.unplayable ? 'short' : ''].join(' ');
      h += Cards.html(c.id, c.lv, {
        uid: c.uid, cost: def.cost === null ? null : cost, costCls, sealed: c.sealed,
        cls: `in-hand ${playable ? 'playable' : 'unplayable'} ${c.fresh ? 'drawn' : ''}`,
        attrs: `style="--rot:${rot.toFixed(2)}deg;--lift:${lift.toFixed(1)}px;--d:${c.fresh ? (c.freshIdx || 0) * 60 : 0}ms" tabindex="${playable ? 0 : -1}" role="button" aria-label="${Cards.esc(Cards.name(c.id))}"`,
        dmg: (x) => Battle.previewDamage(x)
      });
    });
    el.hand.innerHTML = h;
    B.hand.forEach((c) => { c.fresh = false; c.freshIdx = 0; });
    fitHand();
    el.end.classList.toggle('ready', !B.busy && !B.over && !B.hand.some((c) => Battle.canPlay(c)));
  }

  const fanStep = (n) => Math.min(window.innerWidth < 640 ? 2.5 : 4, 22 / Math.max(1, n));

  /* Overlap the cards just enough to fit the hand, including the overhang of the tilted edge cards. */
  function fitHand() {
    const cards = el.hand.children; const n = cards.length;
    if (!n) { el.hand.style.setProperty('--ov', '0px'); return; }
    const cw = cards[0].offsetWidth || 120; const ch = cards[0].offsetHeight || cw * 1.42; const gap = 8;
    const tilt = (fanStep(n) * ((n - 1) / 2) * Math.PI) / 180;
    const overhang = Math.ceil(ch * Math.sin(tilt) / 2 + cw * (1 - Math.cos(tilt)) / 2);
    const need = n * cw + (n - 1) * gap; const avail = el.hand.clientWidth - 8 - overhang * 2;
    const ov = need > avail && n > 1 ? (need - avail) / (n - 1) : 0;
    el.hand.style.setProperty('--ov', `${ov.toFixed(1)}px`);
  }

  function intent(B) {
    if (B.over || !B.foe.move) { el.intent.classList.remove('show'); return; }
    const move = B.foe.move;
    if (B.foe.st.stun) {
      el.intent.innerHTML = `<div class="it-row"><span class="it-chip">${Icons.svg('stun')}</span></div><div class="it-name">${Cards.esc(tr('f.stunned'))}</div>`;
    } else {
      const info = Intent.describe(move, (x) => Battle.previewEnemyDamage(x));
      el.intent.innerHTML = `<div class="it-row">${info.chips.map((c) =>
        `<span class="it-chip ${c.cls || ''}" ${c.tip ? `data-tip="${Cards.esc(c.tip)}"` : ''}>${Icons.svg(c.icon)}${c.text ? `<b>${c.text}</b>` : ''}</span>`).join('')}</div>
        <div class="it-name">${Cards.esc(info.name)}</div>`;
      el.intent.classList.toggle('danger', info.kind === 'attack' && info.chips.some((c) => c.cls === 'atk' && parseInt(c.text, 10) >= 20));
      el.intent.classList.toggle('charge', info.kind === 'charge');
    }
    el.intent.classList.add('show');
    placeIntent();
  }

  function placeIntent() {
    const p = FX.bossPos();
    const h = el.intent.offsetHeight || 50;
    el.intent.style.left = `${p.x}px`;
    el.intent.style.top = `${Math.max(h + 6, FX.bossTop())}px`;
  }

  /* text may be a plain string or an [English, Korean] pair */
  function speech(who, text, ms = 2800) {
    const sp = Speakers[who] || Speakers.narrator;
    el.speech.innerHTML = `${sp.portrait ? `<span class="sp-ic">${Icons.svg(sp.portrait)}</span>` : ''}<span class="sp-body"><em>${Cards.esc(loc(sp.name))}</em>${Cards.esc(loc(text))}</span>`;
    el.speech.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => el.speech.classList.remove('show'), ms);
  }

  function banner(text, sub = '') {
    el.banner.innerHTML = `<b>${Cards.esc(text)}</b>${sub ? `<span>${Cards.esc(sub)}</span>` : ''}`;
    el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 1100);
  }

  function ghost(c) {
    const node = document.createElement('div');
    node.className = 'ghost';
    node.innerHTML = Cards.html(c.id, c.lv, { cost: Battle.costOf(c) });
    el.ghost.appendChild(node);
    setTimeout(() => node.remove(), 900);
  }

  function busy(b) { el.screen.classList.toggle('busy', b); el.end.disabled = b; }

  function reset() {
    el.hand.innerHTML = ''; el.ghost.innerHTML = '';
    el.speech.classList.remove('show'); el.banner.classList.remove('show'); el.intent.classList.remove('show');
    el.ov.classList.remove('show');
  }

  /* ---------- override (mash) overlay ---------- */
  function overrideShow(target) { el.ovTarget.textContent = target; el.ovCount.textContent = '0'; el.ovTimer.style.transform = 'scaleX(1)'; el.ov.classList.add('show'); }
  function overrideUpdate(count, frac) { el.ovCount.textContent = count; el.ovTimer.style.transform = `scaleX(${Math.max(0, frac)})`; el.ov.classList.toggle('met', count >= Number(el.ovTarget.textContent)); }
  function overrideHide() { el.ov.classList.remove('show', 'met'); }

  return { bind, bars, stage, energy, piles, hand, fitHand, intent, placeIntent, speech, banner, ghost, busy, reset,
    overrideShow, overrideUpdate, overrideHide, get el() { return el; } };
})();
