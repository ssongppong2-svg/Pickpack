/* pickpack - title, lobby, archive (deck + enhance), before-pick, rewards and game flow. */
'use strict';

const Game = (() => {
  const PULL_COST = 140;
  const RATES = { L: 1, E: 5, R: 14, U: 30, C: 50 };
  const SKIP_BONUS = 50;
  let selected = 0;
  let flowLock = false;
  let pulling = false;
  let archiveFilter = 'all';
  let lastResult = null;

  const pts = () => Save.data.points;
  const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  /* ---------- boot ---------- */
  function init() {
    I18N.init(Save.data.settings.lang);
    I18N.on(onLang);
    $$('[data-icon]').forEach((el) => { el.innerHTML = Icons.svg(el.dataset.icon); el.classList.add('ic-slot'); });
    updateLangSwitch();
    Sfx.setEnabled(Save.data.settings.sound);
    updateSoundIcons();
    bindGlobal(); bindLobby(); bindArchive(); bindGacha(); bindReward(); bindBattleExtras();
    Cloud.on(onCloud); Cloud.init();
    title();
  }

  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const lang = e.target.closest('[data-lang]');
      if (lang) { Sfx.play('click'); setLanguage(lang.dataset.lang); return; }
      const go = e.target.closest('[data-go]');
      if (go) { Sfx.play('click'); navigate(go.dataset.go); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'sound') toggleSound();
      if (act.dataset.act === 'settings') settings();
    });
  }

  function navigate(where) {
    if (where === 'lobby') lobby();
    else if (where === 'archive') openArchive();
    else if (where === 'gacha') openGacha();
  }

  /* ---------- language ---------- */
  function setLanguage(l) {
    Save.data.settings.lang = l; Save.commit(); // an explicit choice always wins over auto-detection
    if (I18N.setLang(l)) UI.toast(tr('ui.langSwitched'), 'globe', 1400);
  }

  function updateLangSwitch() {
    $$('[data-lang]').forEach((b) => { const on = b.dataset.lang === I18N.lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }

  function onLang() {
    updateLangSwitch(); updateSoundIcons(); titlePrompt();
    if (UI.isActive('lobby')) renderLobby();
    else if (UI.isActive('archive')) renderArchive();
    else if (UI.isActive('gacha')) renderGachaInfo();
  }

  function updatePoints() { $$('.pts').forEach((e) => { e.textContent = pts().toLocaleString('en-US'); }); }

  function toggleSound() {
    Save.data.settings.sound = !Save.data.settings.sound;
    Sfx.setEnabled(Save.data.settings.sound); Save.commit();
    updateSoundIcons(); Sfx.play('click');
    UI.toast(tr(Save.data.settings.sound ? 'ui.soundOn' : 'ui.soundOff'), Save.data.settings.sound ? 'soundOn' : 'soundOff', 1200);
  }
  function updateSoundIcons() {
    $$('[data-act="sound"]').forEach((b) => { b.innerHTML = Icons.svg(Save.data.settings.sound ? 'soundOn' : 'soundOff'); b.setAttribute('aria-label', tr(Save.data.settings.sound ? 'ui.mute' : 'ui.unmute')); });
  }

  /* ---------- title ---------- */
  function titlePrompt() { $('#startPrompt').textContent = tr(Save.hadSave ? 'title.continue' : 'title.begin'); }

  function title() {
    UI.show('title');
    const scr = $('#screen-title');
    titlePrompt();
    let started = false;
    const go = async (e) => {
      if (started || (e.type === 'keydown' && !['Enter', ' '].includes(e.key))) return;
      // the language buttons live on the title screen and must not start the game
      if (e.type === 'click' && e.target.closest('.lang-switch')) return;
      if (e.type === 'keydown' && document.activeElement && document.activeElement.closest('.lang-switch')) return;
      started = true;
      scr.removeEventListener('click', go); document.removeEventListener('keydown', go);
      Sfx.unlock(); Sfx.play('whoosh');
      scr.classList.add('leaving');
      await wait(900);
      if (!Save.data.seenPrologue) {
        await UI.scene(Story.prologue);
        Save.data.seenPrologue = true; Save.commit();
      }
      lobby();
    };
    scr.addEventListener('click', go); document.addEventListener('keydown', go);
  }

  /* ---------- lobby ---------- */
  function lobby() {
    selected = Math.min(Save.data.progress, Chapters.length - 1);
    renderLobby();
    UI.show('lobby');
  }

  function renderLobby() {
    updatePoints();
    const prog = Save.data.progress; const done = prog >= Chapters.length;
    $('#lStatus').innerHTML = done
      ? `${Icons.svg('sparkle')}<span>${tr('lobby.complete')}</span>`
      : `${Icons.svg('portal')}<span>${tr('lobby.progress', { n: prog, total: Chapters.length })}</span>`;
    $('#lTrack').innerHTML = Chapters.map((ch, i) => {
      const state = i < prog ? 'cleared' : i === prog ? 'current' : 'locked';
      const ic = state === 'cleared' ? 'check' : state === 'locked' ? 'lock' : Bosses[ch.boss].portrait;
      return `<button class="node ${state} ${i === selected ? 'selected' : ''}" data-ch="${i}" ${state === 'locked' ? 'disabled' : ''}
        data-tip="${Cards.esc(`${loc(ch.code)}: ${state === 'locked' ? tr('lobby.sealed') : loc(ch.name)}`)}">
        <span class="n-hex">${Icons.svg(ic)}</span><span class="n-label">${String(i + 1).padStart(2, '0')}</span></button>`;
    }).join('');

    const ch = Chapters[selected]; const boss = Bosses[ch.boss];
    const first = selected >= prog;
    const reward = first ? ch.reward : Math.round(ch.reward / 20) * 10;
    $('#lChapter').innerHTML = `
      <div class="cc-head">
        <div class="cc-boss" data-tip="${Cards.esc(`${loc(boss.name)}: ${boss.passives.map((p) => Cards.kwDesc(p)).join(' ') || tr('lobby.voidTip')}`)}">${Icons.svg(boss.portrait)}</div>
        <div class="cc-titles"><small>${Cards.esc(loc(ch.code))}</small><h2>${Cards.esc(loc(ch.name))}</h2><p>${Cards.esc(loc(ch.desc))}</p></div>
        <div class="cc-reward"><small>${tr(first ? 'lobby.firstClear' : 'lobby.training')}</small><b>${Icons.svg('gem')}${reward}</b><em>${Cards.esc(loc(boss.name))}</em></div>
      </div>
      <div class="cc-hint"><span class="cc-lumen">${Icons.svg('p_lumen')}</span><p><em>${Cards.esc(loc(Speakers.lumen.name))}</em>${Cards.esc(loc(done && !first ? Story.postgame : ch.hint))}</p></div>`;

    const list = Save.deckList();
    const size = list.length;
    const ok = size >= Save.DECK_MIN;
    $('#lDeckHead').innerHTML = `${Icons.svg('cards')}<span>${tr('lobby.deck', { n: size })}</span>${ok ? '' : `<em class="warn">${tr('lobby.needs', { n: Save.DECK_MIN })}</em>`}`;
    const groups = {};
    list.forEach((c) => { groups[c.id] = groups[c.id] || { id: c.id, lv: c.lv, n: 0 }; groups[c.id].n++; });
    $('#lDeck').innerHTML = Object.values(groups).map((g) => {
      const c = Cards.get(g.id);
      return `<span class="mini r-${c.rarity}" data-tip="${Cards.esc(`${Cards.name(g.id)}${g.lv ? ' ' + '+'.repeat(g.lv) : ''}: ${plain(Cards.textHTML(g.id, g.lv))}`)}">
        <i class="mini-cost">${Cards.costOf(g.id, g.lv)}</i>${Icons.svg(c.icon)}${g.n > 1 ? `<b>x${g.n}</b>` : ''}</span>`;
    }).join('');
    const attention = Object.keys(Save.data.collection).some((id) => Save.entry(id).isNew) || Save.enhanceable().length > 0;
    $('#lArchiveDot').classList.toggle('on', attention);
    $('#lEnter span').textContent = tr(first ? 'lobby.enter' : 'lobby.train');
  }

  function bindLobby() {
    $('#lTrack').addEventListener('click', (e) => {
      const n = e.target.closest('.node'); if (!n || n.disabled) return;
      selected = Number(n.dataset.ch); Sfx.play('click'); renderLobby();
    });
    $('#lEnter').addEventListener('click', enter);
    $('#lDeckWrap').addEventListener('click', () => { Sfx.play('click'); openArchive(); });
    $('#lDeckWrap').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArchive(); } });
  }

  async function enter() {
    if (flowLock) return;
    if (Save.deckSize() < Save.DECK_MIN) {
      Sfx.play('error');
      const go = await UI.confirm(tr('lobby.deckSmallTitle'), tr('lobby.deckSmallText', { min: Save.DECK_MIN, n: Save.deckSize() }), tr('lobby.openArchiveBtn'));
      if (go) openArchive();
      return;
    }
    flowLock = true; Sfx.play('click');
    const idx = selected; const ch = Chapters[idx];
    try {
      if (idx >= Save.data.progress) await UI.scene({ backdrop: ch.backdrop, boss: ch.boss, lines: ch.intro });
      $('#bResult').classList.remove('show');
      UI.show('battle');
      Battle.start(idx);
    } finally { flowLock = false; }
  }

  /* ---------- archive: deck building and enhancement ---------- */
  function openArchive() { renderArchive(); UI.show('archive'); }

  function tileHTML(id) {
    if (!Save.owned(id)) return `<div class="tile locked" data-id="${id}">${Cards.html(id, 0, { locked: true })}</div>`;
    const e = Save.entry(id); const inDeck = Save.inDeck(id);
    const maxed = e.lv >= Cards.MAX_LV;
    const need = maxed ? 0 : Cards.UPGRADE_COST[e.lv];
    const next = maxed ? '' : tr('ar.next', { text: plain(Cards.textHTML(id, e.lv + 1)) });
    return `<div class="tile ${inDeck ? 'in' : ''}" data-id="${id}">
      ${Cards.html(id, e.lv, { inDeck, badge: e.isNew ? tr('badge.new') : '', cls: 'pickable' })}
      <div class="tile-meta">
        <span class="echo ${maxed ? 'max' : ''}" data-tip="${Cards.esc(maxed ? tr('ar.echoMax') : tr('ar.echoTip', { e: e.echo, need, next }))}">${Icons.svg('shard')}${maxed ? tr('ar.max') : `${e.echo}/${need}`}</span>
        ${Save.canEnhance(id) ? `<button class="btn tiny glow" data-enh="${id}" data-tip="${Cards.esc(tr('ar.enhanceTip', { text: plain(Cards.textHTML(id, e.lv + 1)) }))}">${Icons.svg('levelUp')}<span>${tr('ar.enhance')}</span></button>` : `<span class="lv">${tr(`ar.lv${e.lv}`)}</span>`}
      </div></div>`;
  }

  function basicHTML(id) {
    const n = Save.data.deck[id];
    return `<div class="tile basic ${n ? 'in' : ''}" data-basic="${id}">
      ${Cards.html(id, 0, { badge: `x${n}`, badgeCls: 'count' })}
      <div class="tile-meta counter">
        <button class="icon-btn tiny" data-dec="${id}" ${n <= 0 ? 'disabled' : ''} aria-label="${tr('ar.removeOne')}">${Icons.svg('minus')}</button>
        <b>${n}</b>
        <button class="icon-btn tiny" data-inc="${id}" ${n >= Save.BASIC_MAX ? 'disabled' : ''} aria-label="${tr('ar.addOne')}">${Icons.svg('plus')}</button>
      </div></div>`;
  }

  function renderArchive() {
    updatePoints();
    const f = archiveFilter;
    const rank = (id) => Rarity[Cards.get(id).rarity].rank;
    const ids = Cards.all().slice().sort((a, b) => (Save.owned(b) - Save.owned(a)) || (rank(b) - rank(a)) || Cards.name(a).localeCompare(Cards.name(b), I18N.lang));
    const match = (id) => {
      const c = Cards.get(id);
      if (f === 'deck') return Save.inDeck(id);
      if (f === 'enh') return Save.owned(id) && Save.canEnhance(id);
      return f === 'all' || c.type === f;
    };
    let html = '';
    for (const b of ['strike', 'guard']) {
      const c = Cards.get(b);
      if (f === 'all' || f === c.type || (f === 'deck' && Save.data.deck[b] > 0)) html += basicHTML(b);
    }
    html += ids.filter(match).map(tileHTML).join('');
    $('#arGrid').innerHTML = html || `<p class="empty-note">${tr('ui.nothing')}</p>`;
    const ownedN = Object.keys(Save.data.collection).length;
    const size = Save.deckSize();
    $('#arDeckCount').innerHTML = Icons.svg('cards') + tr('ar.deckCount', { cls: size < Save.DECK_MIN ? 'warn' : '', n: size, min: Save.DECK_MIN });
    $('#arCollect').innerHTML = Icons.svg('pack') + tr('ar.collected', { n: ownedN, total: Cards.all().length });
    const en = Save.enhanceable().length;
    const btn = $('#arEnhanceAll');
    btn.disabled = en === 0;
    btn.querySelector('span').textContent = en ? tr('ar.enhanceAllN', { n: en }) : tr('ar.enhanceAll');
    $$('#arTabs button').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
  }

  function bindArchive() {
    $('#arTabs').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      archiveFilter = b.dataset.f; Sfx.play('click'); renderArchive();
    });
    $('#arGrid').addEventListener('click', (e) => {
      if (e.target.closest('.kw')) return;
      const enh = e.target.closest('[data-enh]');
      if (enh) { doEnhance(enh.dataset.enh); return; }
      const inc = e.target.closest('[data-inc]'); const dec = e.target.closest('[data-dec]');
      if (inc || dec) {
        const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
        Save.setBasic(id, Save.data.deck[id] + (inc ? 1 : -1)); Save.commit(); Sfx.play('click'); renderArchive();
        return;
      }
      const tile = e.target.closest('.tile[data-id]'); if (!tile) return;
      const id = tile.dataset.id;
      if (!Save.owned(id)) { Sfx.play('error'); UI.toast(tr('ar.notOwned'), 'lock'); return; }
      Save.toggleDeck(id); Save.clearNew(id); Save.commit();
      Sfx.play(Save.inDeck(id) ? 'card' : 'click');
      renderArchive();
    });
    $('#arEnhanceAll').addEventListener('click', () => {
      let n = 0; let guard = 0;
      while (Save.enhanceable().length && guard++ < 200) { Save.enhance(Save.enhanceable()[0]); n++; }
      if (!n) return;
      Save.commit(); Sfx.play('upgrade'); renderArchive();
      UI.toast(n > 1 ? tr('ar.enhancedN', { n }) : tr('ar.enhancedOne'), 'levelUp');
    });
  }

  function doEnhance(id) {
    if (!Save.enhance(id)) return;
    Save.clearNew(id); Save.commit(); Sfx.play('upgrade'); renderArchive();
    const tile = $(`#arGrid .tile[data-id="${id}"]`); if (tile) tile.classList.add('enhanced');
    UI.toast(tr('ar.enhanced', { name: Cards.name(id), lv: '+'.repeat(Save.level(id)) }), 'levelUp');
  }

  /* ---------- before-pick (gacha) ---------- */
  function openGacha() {
    updatePoints();
    $('#gResult').classList.remove('show');
    renderGachaInfo();
    UI.show('gacha');
  }

  function renderGachaInfo() {
    updatePoints();
    const owned = Object.keys(Save.data.collection).length;
    $('#gOwned').innerHTML = `${Icons.svg('pack')}<span>${tr('g.collected', { n: owned, total: Cards.all().length })}</span>`;
    $('#gOne').classList.toggle('poor', pts() < PULL_COST);
    $('#gTen').classList.toggle('poor', pts() < PULL_COST * 10);
  }

  function bindGacha() {
    $('#gOne').addEventListener('click', () => pull(1));
    $('#gTen').addEventListener('click', () => pull(10));
    $('#gReveal').addEventListener('click', () => revealAll());
    $('#gAgain').addEventListener('click', () => { $('#gResult').classList.remove('show'); renderGachaInfo(); });
    $('#gDone').addEventListener('click', () => { Sfx.play('click'); $('#gResult').classList.remove('show'); lobby(); });
    $('#gGrid').addEventListener('click', (e) => {
      const f = e.target.closest('.flip'); if (f && !f.classList.contains('open')) flipOne(f);
    });
  }

  async function pull(times) {
    if (pulling) return;
    const cost = PULL_COST * times;
    if (pts() < cost) {
      Sfx.play('error');
      UI.toast(tr('g.poor', { cost, pts: pts() }), 'gem', 2800);
      const b = times === 1 ? $('#gOne') : $('#gTen');
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      return;
    }
    pulling = true;
    Save.data.points -= cost;
    const ids = [];
    for (let i = 0; i < times; i++) ids.push(pickOne(Cards.pool(weighted(RATES))));
    if (times >= 10 && !ids.some((id) => Rarity[Cards.get(id).rarity].rank >= 4)) ids[ids.length - 1] = pickOne(Cards.pool('E'));
    const results = ids.map((id) => ({ id, out: Save.addCard(id) }));
    Save.data.stats.pulls += times;
    Save.commit(); updatePoints();

    const best = Math.max(...ids.map((id) => Rarity[Cards.get(id).rarity].rank));
    const pack = $('#gPack');
    pack.classList.remove('opening', 'epic', 'legend'); void pack.offsetWidth;
    pack.classList.add('opening'); if (best >= 5) pack.classList.add('legend'); else if (best >= 4) pack.classList.add('epic');
    Sfx.play('whoosh');
    await wait(best >= 4 ? 1100 : 750);
    pack.classList.remove('opening', 'epic', 'legend');
    showResults(results);
    pulling = false;
  }

  function badgeFor(out) {
    if (out.kind === 'new') return { badge: tr('badge.new'), cls: 'new' };
    if (out.kind === 'refund') return { badge: tr('badge.refund', { n: out.refund }), cls: 'refund' };
    return { badge: tr(out.ready ? 'badge.ready' : 'badge.echo'), cls: out.ready ? 'ready' : 'echo' };
  }

  function showResults(results) {
    const grid = $('#gGrid');
    grid.classList.toggle('single', results.length === 1);
    grid.innerHTML = results.map((r, i) => {
      const c = Cards.get(r.id); const b = badgeFor(r.out);
      return `<div class="flip r-${c.rarity}" data-i="${i}" data-rank="${Rarity[c.rarity].rank}">
        <div class="flip-inner">
          <div class="flip-face flip-back">${Cards.back(c.rarity)}</div>
          <div class="flip-face flip-front">${Cards.html(r.id, Save.level(r.id), { badge: b.badge, badgeCls: b.cls })}</div>
        </div></div>`;
    }).join('');
    $('#gResult').classList.add('show', 'revealing');
    $('#gAgain').disabled = true; $('#gDone').disabled = true;
    const cards = $$('#gGrid .flip');
    let i = 0;
    const step = () => {
      if (!$('#gResult').classList.contains('revealing')) return;
      const next = cards.find((c) => !c.classList.contains('open'));
      if (!next) { finishReveal(); return; }
      const rank = flipOne(next);
      i++;
      setTimeout(step, rank >= 4 ? 700 : rank >= 3 ? 330 : 190);
    };
    setTimeout(step, 450);
  }

  function flipOne(node) {
    node.classList.add('open');
    const rank = Number(node.dataset.rank);
    if (rank >= 5) { Sfx.play('legend'); FX.flash(0.6); } else if (rank >= 4) Sfx.play('rare'); else if (rank >= 3) Sfx.play('rare'); else Sfx.play('flip');
    if (rank >= 4) { const r = $('#gResult'); r.classList.remove('burst'); void r.offsetWidth; r.classList.add('burst'); }
    if ($$('#gGrid .flip').every((c) => c.classList.contains('open'))) finishReveal();
    return rank;
  }

  function revealAll() {
    const rest = $$('#gGrid .flip:not(.open)');
    rest.forEach((n, k) => setTimeout(() => n.classList.add('open'), k * 40));
    if (rest.some((n) => Number(n.dataset.rank) >= 4)) Sfx.play('rare'); else if (rest.length) Sfx.play('flip');
    setTimeout(finishReveal, rest.length * 40 + 50);
  }

  function finishReveal() {
    const r = $('#gResult');
    if (!r.classList.contains('revealing')) return;
    r.classList.remove('revealing');
    $('#gAgain').disabled = false; $('#gDone').disabled = false;
    renderGachaInfo();
  }

  /* ---------- battle results ---------- */
  function rollChoices(odds, n) {
    const out = []; let guard = 0;
    while (out.length < n && guard++ < 100) {
      const id = pickOne(Cards.pool(weighted(odds)));
      if (!out.includes(id)) out.push(id);
    }
    return out;
  }

  function victory(r) {
    const ch = Chapters[r.chapterIdx]; const first = !r.replay;
    const gain = first ? ch.reward : Math.round(ch.reward / 20) * 10;
    Save.data.points += gain; Save.data.stats.wins += 1;
    if (first) Save.data.progress = Math.max(Save.data.progress, r.chapterIdx + 1);
    Save.commit();
    lastResult = r;
    const choices = rollChoices(ch.odds, 3);
    $('#rCode').textContent = loc(ch.code);
    $('#rTitle').textContent = tr(first ? 'r.broken' : 'r.training');
    $('#rStats').innerHTML = [
      ['hourglass', tr('r.turns', { n: r.turns })], ['swords', tr('r.dealt', { n: r.stats.dealt })], ['heart', tr('r.taken', { n: r.stats.taken })], ['cards', tr('r.cards', { n: r.stats.cards })]
    ].map(([i, t]) => `<span>${Icons.svg(i)}${t}</span>`).join('');
    $('#rPoints').innerHTML = `${Icons.svg('gem')}<b>+${gain}</b><span>${tr('r.points')}</span>`;
    $('#rChoices').innerHTML = choices.map((id) => {
      const owned = Save.owned(id);
      return `<button class="r-pick" data-id="${id}" aria-label="${Cards.esc(Cards.name(id))}">${Cards.html(id, Save.level(id), { badge: tr(owned ? 'badge.echo' : 'badge.new'), badgeCls: owned ? 'echo' : 'new' })}</button>`;
    }).join('');
    $('#rTake').disabled = true;
    $('#rSkip').querySelector('span').textContent = tr('r.skip', { n: SKIP_BONUS });
    UI.show('reward');
  }

  function bindReward() {
    $('#rChoices').addEventListener('click', (e) => {
      if (e.target.closest('.kw')) return;
      const b = e.target.closest('.r-pick'); if (!b) return;
      const wasSel = b.classList.contains('sel');
      $$('#rChoices .r-pick').forEach((x) => x.classList.toggle('sel', x === b));
      $('#rTake').disabled = false; Sfx.play('card');
      if (wasSel) takeReward(b.dataset.id); // second click on the same card takes it
    });
    $('#rTake').addEventListener('click', () => { const s = $('#rChoices .r-pick.sel'); if (s) takeReward(s.dataset.id); });
    $('#rSkip').addEventListener('click', () => takeReward(null));
  }

  async function takeReward(id) {
    if (flowLock || !lastResult) return;
    flowLock = true;
    const r = lastResult; lastResult = null;
    try {
      if (id) {
        const out = Save.addCard(id); const name = Cards.name(id);
        Sfx.play('upgrade');
        const msg = out.kind === 'new' ? tr('r.newCard', { name }) : out.kind === 'refund' ? tr('r.maxed', { name, n: out.refund }) : tr(out.ready ? 'r.echoReady' : 'r.echo', { name });
        UI.toast(msg, out.kind === 'new' ? 'sparkle' : 'shard');
      } else { Save.data.points += SKIP_BONUS; UI.toast(tr('r.skipToast', { n: SKIP_BONUS }), 'gem'); Sfx.play('click'); }
      Save.commit();
      const ch = Chapters[r.chapterIdx];
      if (!r.replay && ch.outro.length) await UI.scene({ backdrop: ch.backdrop, boss: ch.boss, bossVisible: true, lines: ch.outro });
      if (!r.replay && r.chapterIdx === Chapters.length - 1) {
        await UI.scene(Object.assign({ bossVisible: true }, Story.epilogue));
        Save.data.endingSeen = true; Save.commit();
      }
      lobby();
    } finally { flowLock = false; }
  }

  function defeat(r) {
    const ch = Chapters[r.chapterIdx];
    const gain = Math.round((ch.reward * 0.4) / 10) * 10;
    Save.data.points += gain; Save.data.stats.losses += 1; Save.commit();
    const res = $('#bResult');
    res.innerHTML = `<div class="res-card">
      <small>${Cards.esc(loc(ch.code))}</small><h2>${tr('d.title')}</h2>
      <div class="res-lumen"><span>${Icons.svg('p_lumen')}</span><p><em>${Cards.esc(loc(Speakers.lumen.name))}</em>${Cards.esc(loc(pickOne(Story.defeat)))}</p></div>
      <div class="res-points">${Icons.svg('gem')}<b>+${gain}</b><span>${tr('d.recovered')}</span></div>
      <div class="res-actions">
        <button class="btn ghost" data-r="lobby">${Icons.svg('arrowLeft')}<span>${tr('d.sanctuary')}</span></button>
        <button class="btn primary" data-r="retry">${Icons.svg('restart')}<span>${tr('d.retry')}</span></button>
      </div></div>`;
    res.classList.add('show');
    res.dataset.ch = r.chapterIdx;
  }

  function bindBattleExtras() {
    UI.onBattleEnd = (r) => (r.win ? victory(r) : defeat(r));
    $('#bResult').addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      Sfx.play('click');
      const res = $('#bResult'); res.classList.remove('show');
      if (b.dataset.r === 'retry') {
        if (Save.deckSize() < Save.DECK_MIN) { lobby(); return; }
        Battle.start(Number(res.dataset.ch));
      } else lobby();
    });
    $('#bMenu').addEventListener('click', async () => {
      const B = Battle.state; if (!B || B.over) return;
      Sfx.play('click');
      const v = await UI.modal({
        title: tr('p.title'), dismissValue: 'resume',
        body: `<p class="m-note">${Icons.svg('info')} ${tr('p.note')}</p>`,
        actions: [
          { label: tr('p.retreat'), value: 'retreat', cls: 'ghost danger', icon: 'arrowLeft' },
          { label: tr(Save.data.settings.sound ? 'p.mute' : 'p.unmute'), value: 'sound', cls: 'ghost', icon: Save.data.settings.sound ? 'soundOff' : 'soundOn' },
          { label: tr('p.resume'), value: 'resume', cls: 'primary', icon: 'play' }
        ]
      });
      if (v === 'sound') toggleSound();
      if (v === 'retreat') {
        const ok = await UI.confirm(tr('p.retreatTitle'), tr('p.retreatText'), tr('p.retreat'), true);
        if (ok) { Battle.retreat(); lobby(); }
      }
    });
  }

  /* ---------- settings and cloud ---------- */
  async function settings() {
    Sfx.play('click');
    const s = Save.data.stats;
    const cloud = !Cloud.configured ? tr('set.local')
      : !Cloud.available ? tr('set.cloudDown')
      : Cloud.user ? tr('set.signedIn', { name: Cards.esc(Cloud.user.displayName || loc(Speakers.picker.name)) })
      : tr('set.signInHint');
    const other = I18N.lang === 'ko' ? 'en' : 'ko';
    const actions = [{ label: other === 'ko' ? '한국어' : 'English', value: 'lang', cls: 'ghost', icon: 'globe' }];
    if (Cloud.available && !Cloud.user) actions.push({ label: tr('set.login'), value: 'login', cls: 'ghost', icon: 'user' });
    if (Cloud.available && Cloud.user) actions.push({ label: tr('set.push'), value: 'push', cls: 'ghost', icon: 'cloud' }, { label: tr('set.logout'), value: 'logout', cls: 'ghost', icon: 'logout' });
    actions.push(
      { label: tr('set.prologue'), value: 'prologue', cls: 'ghost', icon: 'play' },
      { label: tr('set.reset'), value: 'reset', cls: 'ghost danger', icon: 'restart' },
      { label: tr('ui.close'), value: null, cls: 'primary', icon: 'check' }
    );
    const v = await UI.modal({
      title: tr('set.title'), wide: true,
      body: `<div class="set-grid">
        <div><h4>${Icons.svg('globe')}${tr('set.language')}</h4><p>${tr('set.languageText')}</p></div>
        <div><h4>${Icons.svg('cloud')}${tr('set.save')}</h4><p>${cloud}</p></div>
        <div><h4>${Icons.svg('swords')}${tr('set.record')}</h4><p>${tr('set.recordText', { w: s.wins, l: s.losses, p: s.pulls })}</p></div>
        <div><h4>${Icons.svg('info')}${tr('set.controls')}</h4><p>${tr('set.controlsText')}</p></div>
      </div>`,
      actions
    });
    if (v === 'lang') { setLanguage(other); settings(); return; } // reopen so the panel shows the new language
    if (v === 'login') Cloud.login();
    if (v === 'push') Cloud.push();
    if (v === 'logout') Cloud.logout();
    if (v === 'prologue') { await UI.scene(Story.prologue); lobby(); }
    if (v === 'reset') {
      const ok = await UI.confirm(tr('set.resetTitle'), tr('set.resetText'), tr('set.resetOk'), true);
      if (ok) { Save.reset(); Sfx.setEnabled(Save.data.settings.sound); updateSoundIcons(); UI.toast(tr('set.resetDone'), 'restart'); await UI.scene(Story.prologue); Save.data.seenPrologue = true; Save.commit(); lobby(); }
    }
  }

  function onCloud(ev, detail) {
    if (ev === 'auth' && detail) UI.toast(tr('cloud.signedIn', { name: detail.displayName || loc(Speakers.picker.name) }), 'user');
    if (ev === 'loaded') {
      UI.toast(tr('cloud.loaded'), 'cloud');
      Sfx.setEnabled(Save.data.settings.sound); updateSoundIcons();
      if (Save.data.settings.lang) I18N.setLang(Save.data.settings.lang);
      if (UI.isActive('lobby')) renderLobby();
      else if (UI.isActive('archive')) renderArchive();
      else if (UI.isActive('gacha')) renderGachaInfo();
    }
    if (ev === 'error' || ev === 'info') UI.toast(detail, ev === 'error' ? 'warning' : 'cloud');
  }

  return { init, lobby, renderLobby };
})();
