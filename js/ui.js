/* pickpack - UI core: screens, toasts, tooltips, modals, dialogue and story scenes. */
'use strict';

/* Typewriter dialogue shared by story scenes and in-battle events. */
class Talk {
  constructor(root) {
    this.root = root;
    this.box = root.querySelector('.t-box');
    this.portrait = root.querySelector('.t-portrait');
    this.name = root.querySelector('.t-name');
    this.text = root.querySelector('.t-text');
    this.center = root.querySelector('.t-center');
    this.typing = false; this.timer = 0; this.waiter = null; this.skipped = false; this.open = false;
    this.shownAt = 0;
  }

  async run(lines, onLine) {
    this.skipped = false; this.open = true;
    for (const line of lines) {
      if (this.skipped) break;
      if (onLine) onLine(line);
      await this.say(line);
    }
    this.hideAll(); this.open = false;
    return !this.skipped;
  }

  say(line) {
    return new Promise((resolve) => {
      this.waiter = resolve; this.shownAt = performance.now();
      const mode = line.mode || 'box';
      const sp = Speakers[line.s || 'narrator'] || Speakers.narrator;
      if (line.fx === 'flash') { FX.flash(0.7); Sfx.play('whoosh'); }
      if (line.fx === 'shake') { FX.shake(14); Sfx.play('heavy'); }
      if (line.fx === 'glitch') { FX.glitch(1.2); Sfx.play('glitch'); }
      if (mode === 'box') {
        this.center.classList.remove('show');
        this.box.classList.remove('show'); void this.box.offsetWidth; this.box.classList.add('show');
        this.box.dataset.speaker = line.s || 'narrator';
        this.portrait.innerHTML = sp.portrait ? Icons.svg(sp.portrait) : '';
        this.portrait.classList.toggle('none', !sp.portrait);
        this.name.textContent = loc(sp.name);
        this.type(this.text, loc(line.t), 1);
      } else {
        this.box.classList.remove('show');
        this.center.className = `t-center mode-${mode}`;
        const label = mode === 'title' ? loc(line.sub || '') : (mode === 'whisper' ? loc(sp.name) : '');
        this.center.innerHTML = `${label ? `<small>${Cards.esc(label)}</small>` : ''}<b></b>`;
        void this.center.offsetWidth; this.center.classList.add('show');
        this.type(this.center.querySelector('b'), loc(line.t), mode === 'title' ? 0 : 0.8);
      }
    });
  }

  type(node, text, speed) {
    clearInterval(this.timer);
    this.full = text; this.node = node;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!speed || reduce) { node.textContent = text; this.typing = false; this.root.classList.add('can-next'); return; }
    this.root.classList.remove('can-next');
    this.typing = true; let i = 0;
    const perTick = Math.max(1, Math.round(2 * speed));
    this.timer = setInterval(() => {
      i += perTick; node.textContent = text.slice(0, i);
      if (i % 8 < perTick) Sfx.play('type', 45);
      if (i >= text.length) { clearInterval(this.timer); this.typing = false; this.root.classList.add('can-next'); }
    }, 26);
  }

  advance() {
    if (!this.waiter) return;
    if (performance.now() - this.shownAt < 120) return; // ignore double-clicks landing on the next line
    if (this.typing) {
      clearInterval(this.timer); this.node.textContent = this.full; this.typing = false; this.root.classList.add('can-next');
      return;
    }
    const w = this.waiter; this.waiter = null; Sfx.play('click'); w();
  }

  skip() {
    this.skipped = true; clearInterval(this.timer); this.typing = false;
    const w = this.waiter; this.waiter = null; if (w) w();
  }

  hideAll() { this.box.classList.remove('show'); this.center.classList.remove('show'); }
}

const UI = (() => {
  const screens = {};
  let active = null;
  let modalCount = 0;
  let storyTalk = null; let dialogTalk = null;

  function init() {
    $$('.screen').forEach((s) => { screens[s.dataset.screen] = s; });
    storyTalk = new Talk($('#screen-story'));
    dialogTalk = new Talk($('#dialog'));
    initTips();
    bindTalk();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const m = $('#modal');
        if (m.classList.contains('show')) { m.dispatchEvent(new CustomEvent('dismiss')); return; }
        if (storyTalk.open) storyTalk.skip();
      }
    });
  }

  /* ---------- screens ---------- */
  function show(key) {
    for (const [k, el] of Object.entries(screens)) {
      const on = k === key;
      el.classList.toggle('active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      if ('inert' in el) el.inert = !on;
    }
    active = key;
    hideTip();
    if (key !== 'battle' && key !== 'story') FX.stop(); // no canvas on screen: stop drawing
  }
  const isActive = (key) => active === key;

  /* ---------- toasts ---------- */
  function toast(text, icon = 'info', ms = 2400) {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${Icons.svg(icon)}<span>${Cards.esc(text)}</span>`;
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
  }

  /* ---------- tooltips ---------- */
  let tipEl = null; let tipTimer = 0; let tipFor = null;
  function initTips() {
    tipEl = $('#tip');
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const t = e.target.closest('[data-tip]');
      if (t && t !== tipFor) showTip(t);
      else if (!t && tipFor) hideTip();
    });
    document.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('[data-tip]');
      if (e.pointerType === 'touch' && t) { showTip(t); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2600); }
      else if (!t) hideTip();
    });
    window.addEventListener('scroll', hideTip, true);
  }
  function showTip(target) {
    const text = target.getAttribute('data-tip'); if (!text) return;
    tipFor = target;
    const i = text.indexOf(': ');
    tipEl.innerHTML = i > 0 && i < 28 ? `<b>${Cards.esc(text.slice(0, i))}</b>${Cards.esc(text.slice(i + 2))}` : Cards.esc(text);
    tipEl.classList.add('show');
    const r = target.getBoundingClientRect(); const tw = tipEl.offsetWidth; const th = tipEl.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; let y = r.top - th - 10;
    if (y < 8) y = r.bottom + 10;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    tipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  function hideTip() { tipFor = null; if (tipEl) tipEl.classList.remove('show'); }

  /* ---------- modal ---------- */
  function modal({ title, body = '', actions = [{ label: tr('ui.close'), value: null }], wide = false, dismissValue = null }) {
    return new Promise((resolve) => {
      const m = $('#modal'); const card = m.querySelector('.m-card');
      card.classList.toggle('wide', wide);
      card.innerHTML = `<h3>${Cards.esc(title)}</h3><div class="m-body">${body}</div>
        <div class="m-actions">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}">${a.icon ? Icons.svg(a.icon) : ''}<span>${Cards.esc(a.label)}</span></button>`).join('')}</div>`;
      modalCount += 1;
      m.classList.add('show');
      const close = (v) => {
        m.classList.remove('show'); modalCount = Math.max(0, modalCount - 1);
        m.removeEventListener('dismiss', onDismiss); card.removeEventListener('click', onClick); m.removeEventListener('pointerdown', onBackdrop);
        resolve(v);
      };
      const onClick = (e) => {
        const b = e.target.closest('.m-actions .btn'); if (!b) return;
        Sfx.play('click'); close(actions[Number(b.dataset.i)].value);
      };
      const onBackdrop = (e) => { if (e.target === m) close(dismissValue); };
      const onDismiss = () => close(dismissValue);
      card.addEventListener('click', onClick);
      m.addEventListener('pointerdown', onBackdrop);
      m.addEventListener('dismiss', onDismiss);
      const first = card.querySelector('.m-actions .btn:last-child'); if (first) first.focus({ preventScroll: true });
    });
  }

  function confirm(title, text, okLabel = tr('ui.confirm'), danger = false) {
    return modal({
      title, body: `<p>${Cards.esc(text)}</p>`, dismissValue: false,
      actions: [{ label: tr('ui.cancel'), value: false, cls: 'ghost' }, { label: okLabel, value: true, cls: danger ? 'danger' : 'primary' }]
    });
  }

  function showPile(title, cards, note) {
    const list = cards.slice().sort((a, b) => Cards.name(a.id).localeCompare(Cards.name(b.id), I18N.lang));
    const body = list.length
      ? `<p class="m-note">${Cards.esc(note)}</p><div class="pile-grid">${list.map((c) => Cards.html(c.id, c.lv, { cls: 'sm' })).join('')}</div>`
      : `<p class="m-note">${Cards.esc(note)}</p><p class="empty-note">${Cards.esc(tr('ui.noCards'))}</p>`;
    return modal({ title: `${title} (${cards.length})`, body, wide: true });
  }

  const modalOpen = () => modalCount > 0 || dialogTalk.open || storyTalk.open;

  /* ---------- dialogue ---------- */
  function bindTalk() {
    const story = $('#screen-story');
    story.addEventListener('click', (e) => { if (!e.target.closest('#sSkip')) storyTalk.advance(); });
    $('#sSkip').addEventListener('click', () => { Sfx.play('click'); storyTalk.skip(); });
    $('#dialog').addEventListener('click', () => dialogTalk.advance());
    document.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if ($('#modal').classList.contains('show')) return;
      if (dialogTalk.open) { e.preventDefault(); dialogTalk.advance(); }
      else if (storyTalk.open && active === 'story') { e.preventDefault(); storyTalk.advance(); }
    });
  }

  /* Full-screen story scene. sc: { backdrop, boss, lines, bloom } */
  async function scene(sc) {
    show('story');
    FX.attach($('#sCanvas'));
    const bossShape = sc.boss ? Bosses[sc.boss].shape : null;
    const bossShown = !!sc.bossVisible;
    FX.setScene({ mode: 'story', backdrop: sc.backdrop, boss: bossShape, lumen: sc.lines.some((l) => l.s === 'lumen'), bossEnter: true, bloom: sc.bloom || 0 });
    FX.setBoss({ alpha: bossShown ? 1 : 0 });
    FX.start();
    await wait(450);
    await storyTalk.run(sc.lines, (line) => {
      if (bossShape && line.s === sc.boss) FX.setBoss({ alpha: 1 });
      if (line.act === 'fade') FX.bossDeath();
      if (line.act === 'dawn') { FX.bossDeath(); FX.setBloom(1); Sfx.play('legend'); }
    });
  }

  /* Dialogue on top of the battle. */
  async function dialogue(lines) {
    const d = $('#dialog');
    d.classList.add('show');
    await dialogTalk.run(lines);
    d.classList.remove('show');
    await wait(150);
  }

  return { init, show, isActive, toast, modal, confirm, showPile, modalOpen, scene, dialogue, hideTip,
    get active() { return active; } };
})();
