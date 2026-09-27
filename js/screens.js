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
    $$('[data-icon]').forEach((el) => { el.innerHTML = Icons.svg(el.dataset.icon); el.classList.add('ic-slot'); });
    Sfx.setEnabled(Save.data.settings.sound);
    updateSoundIcons();
    bindGlobal(); bindLobby(); bindArchive(); bindGacha(); bindReward(); bindBattleExtras();
    Cloud.on(onCloud); Cloud.init();
    title();
  }

  function bindGlobal() {
    document.addEventListener('click', (e) => {
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

  function updatePoints() { $$('.pts').forEach((e) => { e.textContent = pts().toLocaleString('en-US'); }); }

  function toggleSound() {
    Save.data.settings.sound = !Save.data.settings.sound;
    Sfx.setEnabled(Save.data.settings.sound); Save.commit();
    updateSoundIcons(); Sfx.play('click');
    UI.toast(Save.data.settings.sound ? 'Sound on' : 'Sound off', Save.data.settings.sound ? 'soundOn' : 'soundOff', 1200);
  }
  function updateSoundIcons() {
    $$('[data-act="sound"]').forEach((b) => { b.innerHTML = Icons.svg(Save.data.settings.sound ? 'soundOn' : 'soundOff'); b.setAttribute('aria-label', Save.data.settings.sound ? 'Mute sound' : 'Unmute sound'); });
  }

  /* ---------- title ---------- */
  function title() {
    UI.show('title');
    const scr = $('#screen-title');
    $('#startPrompt').textContent = Save.hadSave ? 'Click anywhere to continue' : 'Click anywhere to begin';
    let started = false;
    const go = async (e) => {
      if (started || (e.type === 'keydown' && !['Enter', ' '].includes(e.key))) return;
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
      ? `${Icons.svg('sparkle')}<span>Story complete. Every Phase is open for training.</span>`
      : `${Icons.svg('portal')}<span>${prog} of ${Chapters.length} Phases broken</span>`;
    $('#lTrack').innerHTML = Chapters.map((ch, i) => {
      const state = i < prog ? 'cleared' : i === prog ? 'current' : 'locked';
      const ic = state === 'cleared' ? 'check' : state === 'locked' ? 'lock' : Bosses[ch.boss].portrait;
      return `<button class="node ${state} ${i === selected ? 'selected' : ''}" data-ch="${i}" ${state === 'locked' ? 'disabled' : ''}
        data-tip="${Cards.esc(`${ch.code}: ${state === 'locked' ? 'Sealed. Break the previous Phase first.' : ch.name}`)}">
        <span class="n-hex">${Icons.svg(ic)}</span><span class="n-label">${String(i + 1).padStart(2, '0')}</span></button>`;
    }).join('');

    const ch = Chapters[selected]; const boss = Bosses[ch.boss];
    const first = selected >= prog;
    const reward = first ? ch.reward : Math.round(ch.reward / 20) * 10;
    $('#lChapter').innerHTML = `
      <div class="cc-head">
        <div class="cc-boss" data-tip="${Cards.esc(`${boss.name}: ${boss.passives.map((p) => Keywords[p].desc).join(' ') || 'Master of every Phase.'}`)}">${Icons.svg(boss.portrait)}</div>
        <div class="cc-titles"><small>${ch.code}</small><h2>${Cards.esc(ch.name)}</h2><p>${Cards.esc(ch.desc)}</p></div>
        <div class="cc-reward"><small>${first ? 'First clear' : 'Training'}</small><b>${Icons.svg('gem')}${reward}</b><em>${boss.name}</em></div>
      </div>
      <div class="cc-hint"><span class="cc-lumen">${Icons.svg('p_lumen')}</span><p><em>Lumen</em>${Cards.esc(done && !first ? Story.postgame : ch.hint)}</p></div>`;

    const list = Save.deckList();
    const size = list.length;
    const ok = size >= Save.DECK_MIN;
    $('#lDeckHead').innerHTML = `${Icons.svg('cards')}<span>Deck <b>${size}</b> cards</span>${ok ? '' : `<em class="warn">Needs ${Save.DECK_MIN}+</em>`}`;
    const groups = {};
    list.forEach((c) => { groups[c.id] = groups[c.id] || { id: c.id, lv: c.lv, n: 0 }; groups[c.id].n++; });
    $('#lDeck').innerHTML = Object.values(groups).map((g) => {
      const c = Cards.get(g.id);
      return `<span class="mini r-${c.rarity}" data-tip="${Cards.esc(`${c.name}${g.lv ? ' ' + '+'.repeat(g.lv) : ''}: ${plain(Cards.textHTML(g.id, g.lv))}`)}">
        <i class="mini-cost">${Cards.costOf(g.id, g.lv)}</i>${Icons.svg(c.icon)}${g.n > 1 ? `<b>x${g.n}</b>` : ''}</span>`;
    }).join('');
    const attention = Object.keys(Save.data.collection).some((id) => Save.entry(id).isNew) || Save.enhanceable().length > 0;
    $('#lArchiveDot').classList.toggle('on', attention);
    $('#lEnter span').textContent = first ? 'Enter Phase' : 'Train Here';
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
      const go = await UI.confirm('Deck too small', `Your deck needs at least ${Save.DECK_MIN} cards to enter a Phase (it has ${Save.deckSize()}). Open the Archive to add more?`, 'Open Archive');
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
    const next = maxed ? '' : `Next level: ${plain(Cards.textHTML(id, e.lv + 1))}`;
    return `<div class="tile ${inDeck ? 'in' : ''}" data-id="${id}">
      ${Cards.html(id, e.lv, { inDeck, badge: e.isNew ? 'NEW' : '', cls: 'pickable' })}
      <div class="tile-meta">
        <span class="echo ${maxed ? 'max' : ''}" data-tip="${Cards.esc(maxed ? 'Echoes: this concept is fully enhanced. Further duplicates return Concept Points.' : `Echoes: ${e.echo} of ${need} needed to Enhance. ${next}`)}">${Icons.svg('shard')}${maxed ? 'MAX' : `${e.echo}/${need}`}</span>
        ${Save.canEnhance(id) ? `<button class="btn tiny glow" data-enh="${id}" data-tip="${Cards.esc(`Enhance: ${next}`)}">${Icons.svg('levelUp')}<span>Enhance</span></button>` : `<span class="lv">${['Base', 'Lv +', 'Lv ++'][e.lv]}</span>`}
      </div></div>`;
  }

  function basicHTML(id) {
    const n = Save.data.deck[id];
    return `<div class="tile basic ${n ? 'in' : ''}" data-basic="${id}">
      ${Cards.html(id, 0, { badge: `x${n}`, badgeCls: 'count' })}
      <div class="tile-meta counter">
        <button class="icon-btn tiny" data-dec="${id}" ${n <= 0 ? 'disabled' : ''} aria-label="Remove one">${Icons.svg('minus')}</button>
        <b>${n}</b>
        <button class="icon-btn tiny" data-inc="${id}" ${n >= Save.BASIC_MAX ? 'disabled' : ''} aria-label="Add one">${Icons.svg('plus')}</button>
      </div></div>`;
  }

  function renderArchive() {
    updatePoints();
    const f = archiveFilter;
    const rank = (id) => Rarity[Cards.get(id).rarity].rank;
    const ids = Cards.all().slice().sort((a, b) => (Save.owned(b) - Save.owned(a)) || (rank(b) - rank(a)) || Cards.get(a).name.localeCompare(Cards.get(b).name));
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
    $('#arGrid').innerHTML = html || '<p class="empty-note">Nothing here yet.</p>';
    const ownedN = Object.keys(Save.data.collection).length;
    const size = Save.deckSize();
    $('#arDeckCount').innerHTML = `${Icons.svg('cards')}Deck <b class="${size < Save.DECK_MIN ? 'warn' : ''}">${size}</b><small>min ${Save.DECK_MIN}</small>`;
    $('#arCollect').innerHTML = `${Icons.svg('pack')}Collected <b>${ownedN}</b><small>/ ${Cards.all().length}</small>`;
    const en = Save.enhanceable().length;
    const btn = $('#arEnhanceAll');
    btn.disabled = en === 0;
    btn.querySelector('span').textContent = en ? `Enhance all (${en})` : 'Enhance all';
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
      if (!Save.owned(id)) { Sfx.play('error'); UI.toast('Not extracted yet. Find it in the Before-Pick.', 'lock'); return; }
      Save.toggleDeck(id); Save.clearNew(id); Save.commit();
      Sfx.play(Save.inDeck(id) ? 'card' : 'click');
      renderArchive();
    });
    $('#arEnhanceAll').addEventListener('click', () => {
      let n = 0; let guard = 0;
      while (Save.enhanceable().length && guard++ < 200) { Save.enhance(Save.enhanceable()[0]); n++; }
      if (!n) return;
      Save.commit(); Sfx.play('upgrade'); renderArchive();
      UI.toast(`${n} enhancement${n > 1 ? 's' : ''} applied.`, 'levelUp');
    });
  }

  function doEnhance(id) {
    if (!Save.enhance(id)) return;
    Save.clearNew(id); Save.commit(); Sfx.play('upgrade'); renderArchive();
    const tile = $(`#arGrid .tile[data-id="${id}"]`); if (tile) tile.classList.add('enhanced');
    UI.toast(`${Cards.get(id).name} enhanced to ${'+'.repeat(Save.level(id))}`, 'levelUp');
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
    $('#gOwned').innerHTML = `${Icons.svg('pack')}<span>Collected <b>${owned}</b> / ${Cards.all().length} concepts</span>`;
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
      UI.toast(`Not enough Concept Points. ${cost} p needed, you have ${pts()} p.`, 'gem', 2800);
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
    if (out.kind === 'new') return { badge: 'NEW', cls: 'new' };
    if (out.kind === 'refund') return { badge: `+${out.refund} p`, cls: 'refund' };
    return { badge: out.ready ? 'ENHANCE READY' : 'ECHO +1', cls: out.ready ? 'ready' : 'echo' };
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
    $('#rCode').textContent = ch.code;
    $('#rTitle').textContent = first ? 'Phase Broken' : 'Training Complete';
    $('#rStats').innerHTML = [
      ['hourglass', `${r.turns} turns`], ['swords', `${r.stats.dealt} damage dealt`], ['heart', `${r.stats.taken} damage taken`], ['cards', `${r.stats.cards} cards played`]
    ].map(([i, t]) => `<span>${Icons.svg(i)}${t}</span>`).join('');
    $('#rPoints').innerHTML = `${Icons.svg('gem')}<b>+${gain}</b><span>Concept Points</span>`;
    $('#rChoices').innerHTML = choices.map((id) => {
      const owned = Save.owned(id);
      return `<button class="r-pick" data-id="${id}" aria-label="${Cards.esc(Cards.get(id).name)}">${Cards.html(id, Save.level(id), { badge: owned ? 'ECHO +1' : 'NEW', badgeCls: owned ? 'echo' : 'new' })}</button>`;
    }).join('');
    $('#rTake').disabled = true;
    $('#rSkip').querySelector('span').textContent = `Skip (+${SKIP_BONUS} p)`;
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
        const out = Save.addCard(id); const name = Cards.get(id).name;
        Sfx.play('upgrade');
        UI.toast(out.kind === 'new' ? `${name} joined your deck.` : out.kind === 'refund' ? `${name} is maxed: +${out.refund} p` : `${name}: Echo +1${out.ready ? ', ready to Enhance' : ''}`, out.kind === 'new' ? 'sparkle' : 'shard');
      } else { Save.data.points += SKIP_BONUS; UI.toast(`+${SKIP_BONUS} Concept Points`, 'gem'); Sfx.play('click'); }
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
      <small>${ch.code}</small><h2>The Phase Holds</h2>
      <div class="res-lumen"><span>${Icons.svg('p_lumen')}</span><p><em>Lumen</em>${Cards.esc(pickOne(Story.defeat))}</p></div>
      <div class="res-points">${Icons.svg('gem')}<b>+${gain}</b><span>fragments recovered. Extract, rebuild, return.</span></div>
      <div class="res-actions">
        <button class="btn ghost" data-r="lobby">${Icons.svg('arrowLeft')}<span>Sanctuary</span></button>
        <button class="btn primary" data-r="retry">${Icons.svg('restart')}<span>Retry Phase</span></button>
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
        title: 'Paused', dismissValue: 'resume',
        body: `<p class="m-note">${Icons.svg('info')} Play cards with a click or keys 1-9. End your turn with E. Hover keywords and icons for details.</p>`,
        actions: [
          { label: 'Retreat', value: 'retreat', cls: 'ghost danger', icon: 'arrowLeft' },
          { label: Save.data.settings.sound ? 'Mute' : 'Unmute', value: 'sound', cls: 'ghost', icon: Save.data.settings.sound ? 'soundOff' : 'soundOn' },
          { label: 'Resume', value: 'resume', cls: 'primary', icon: 'play' }
        ]
      });
      if (v === 'sound') toggleSound();
      if (v === 'retreat') {
        const ok = await UI.confirm('Retreat?', 'You will leave this battle without any reward. Your deck and collection are kept.', 'Retreat', true);
        if (ok) { Battle.retreat(); lobby(); }
      }
    });
  }

  /* ---------- settings and cloud ---------- */
  async function settings() {
    Sfx.play('click');
    const s = Save.data.stats;
    const cloud = !Cloud.configured ? 'Progress is saved automatically in this browser.'
      : !Cloud.available ? 'Progress is saved automatically in this browser. Cloud save could not be reached right now.'
      : Cloud.user ? `Signed in as <b>${Cards.esc(Cloud.user.displayName || 'Picker')}</b>. Your progress also syncs to the cloud.`
      : 'Progress is saved in this browser. Sign in with Google to back it up to the cloud.';
    const actions = [];
    if (Cloud.available && !Cloud.user) actions.push({ label: 'Google Login', value: 'login', cls: 'ghost', icon: 'user' });
    if (Cloud.available && Cloud.user) actions.push({ label: 'Save Cloud', value: 'push', cls: 'ghost', icon: 'cloud' }, { label: 'Logout', value: 'logout', cls: 'ghost', icon: 'logout' });
    actions.push(
      { label: 'Replay Prologue', value: 'prologue', cls: 'ghost', icon: 'play' },
      { label: 'Reset Progress', value: 'reset', cls: 'ghost danger', icon: 'restart' },
      { label: 'Close', value: null, cls: 'primary', icon: 'check' }
    );
    const v = await UI.modal({
      title: 'Settings', wide: true,
      body: `<div class="set-grid">
        <div><h4>${Icons.svg('cloud')}Save</h4><p>${cloud}</p></div>
        <div><h4>${Icons.svg('swords')}Record</h4><p>${s.wins} victories · ${s.losses} defeats · ${s.pulls} extractions</p></div>
        <div><h4>${Icons.svg('info')}Controls</h4><p>Click or 1-9 to play a card · E to end the turn · Space or Enter to advance dialogue · Esc to skip a scene</p></div>
      </div>`,
      actions
    });
    if (v === 'login') Cloud.login();
    if (v === 'push') Cloud.push();
    if (v === 'logout') Cloud.logout();
    if (v === 'prologue') { await UI.scene(Story.prologue); lobby(); }
    if (v === 'reset') {
      const ok = await UI.confirm('Reset all progress?', 'Your deck, collection, points and story progress will be erased. This cannot be undone.', 'Erase everything', true);
      if (ok) { Save.reset(); Sfx.setEnabled(Save.data.settings.sound); updateSoundIcons(); UI.toast('Progress reset. A new journey begins.', 'restart'); await UI.scene(Story.prologue); Save.data.seenPrologue = true; Save.commit(); lobby(); }
    }
  }

  function onCloud(ev, detail) {
    if (ev === 'auth' && detail) UI.toast(`Signed in as ${detail.displayName || 'Picker'}.`, 'user');
    if (ev === 'loaded') {
      UI.toast('Cloud save loaded.', 'cloud');
      Sfx.setEnabled(Save.data.settings.sound); updateSoundIcons();
      if (UI.isActive('lobby')) renderLobby();
      else if (UI.isActive('archive')) renderArchive();
      else if (UI.isActive('gacha')) renderGachaInfo();
    }
    if (ev === 'error' || ev === 'info') UI.toast(detail, ev === 'error' ? 'warning' : 'cloud');
  }

  return { init, lobby, renderLobby };
})();
