/* pickpack - progress, collection and deck persistence.
 * Progress is always saved to this browser (localStorage).
 * Google login + cloud save turn on only when a real Firebase config is filled in below. */
'use strict';

const Save = (() => {
  const KEY = 'pickpack.save.v2';
  const START_POINTS = 1400;
  const DECK_MIN = 8;
  const BASIC_MAX = 5;
  const STARTER = ['strike_protocol', 'patch_sequence', 'destruction', 'rejuvenate'];

  function fresh() {
    const collection = {};
    STARTER.forEach((id) => { collection[id] = { lv: 0, echo: 0, isNew: false }; });
    return {
      v: 2, points: START_POINTS, progress: 0, collection,
      deck: { strike: 4, guard: 4, concepts: STARTER.slice() },
      seenPrologue: false, endingSeen: false,
      settings: { sound: true, lang: null },
      stats: { wins: 0, losses: 0, pulls: 0 },
      updatedAt: 0
    };
  }

  const int = (n, lo, hi, dflt) => {
    n = Math.floor(Number(n));
    if (!Number.isFinite(n)) return dflt;
    return Math.max(lo, Math.min(hi, n));
  };

  /* Accept only well-formed data so a corrupted or outdated save can never crash the game. */
  function sanitize(d) {
    const f = fresh();
    if (!d || typeof d !== 'object') return f;
    f.points = int(d.points, 0, 1e9, START_POINTS);
    f.progress = int(d.progress, 0, Chapters.length, 0);
    if (d.collection && typeof d.collection === 'object') {
      f.collection = {};
      for (const id of Object.keys(d.collection)) {
        if (!Cards.upgradable(id)) continue;
        const e = d.collection[id] || {};
        f.collection[id] = { lv: int(e.lv, 0, Cards.MAX_LV, 0), echo: int(e.echo, 0, 99, 0), isNew: !!e.isNew };
      }
    }
    if (d.deck && typeof d.deck === 'object') {
      f.deck.strike = int(d.deck.strike, 0, BASIC_MAX, 4);
      f.deck.guard = int(d.deck.guard, 0, BASIC_MAX, 4);
      const seen = new Set();
      f.deck.concepts = (Array.isArray(d.deck.concepts) ? d.deck.concepts : [])
        .filter((id) => f.collection[id] && !seen.has(id) && seen.add(id));
    }
    f.seenPrologue = !!d.seenPrologue;
    f.endingSeen = !!d.endingSeen;
    f.settings.sound = !(d.settings && d.settings.sound === false);
    f.settings.lang = d.settings && ['en', 'ko'].includes(d.settings.lang) ? d.settings.lang : null;
    if (d.stats) for (const k of ['wins', 'losses', 'pulls']) f.stats[k] = int(d.stats[k], 0, 1e9, 0);
    f.updatedAt = int(d.updatedAt, 0, 8.64e15, 0);
    return f;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? sanitize(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  const loaded = load();
  let data = loaded || fresh();
  const hadSave = !!loaded;
  let cloudTimer = 0;

  function commit() {
    data.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked: keep playing */ }
    if (Cloud.user) { clearTimeout(cloudTimer); cloudTimer = setTimeout(() => Cloud.push(true), 2500); }
  }

  function replace(d) { data = sanitize(d); commit(); }
  function reset() { const lang = data.settings.lang; data = fresh(); data.settings.lang = lang; commit(); } // keep the chosen language

  /* ---------- collection ---------- */
  const owned = (id) => !!data.collection[id];
  const entry = (id) => data.collection[id];
  const level = (id) => (data.collection[id] ? data.collection[id].lv : 0);

  function echoesNeeded(id) {
    const e = data.collection[id];
    let need = 0;
    for (let l = e.lv; l < Cards.MAX_LV; l++) need += Cards.UPGRADE_COST[l];
    return need;
  }

  /* Add a card from a pull or reward. Duplicates become Echoes; beyond max they refund points. */
  function addCard(id) {
    const c = Cards.get(id);
    if (!owned(id)) {
      data.collection[id] = { lv: 0, echo: 0, isNew: true };
      data.deck.concepts.push(id);
      return { kind: 'new' };
    }
    const e = data.collection[id];
    if (e.echo >= echoesNeeded(id)) {
      const refund = Cards.ECHO_REFUND[c.rarity] || 20;
      data.points += refund;
      return { kind: 'refund', refund };
    }
    e.echo += 1;
    return { kind: 'echo', ready: canEnhance(id) };
  }

  function canEnhance(id) {
    const e = data.collection[id];
    return !!e && e.lv < Cards.MAX_LV && e.echo >= Cards.UPGRADE_COST[e.lv];
  }
  function enhance(id) {
    if (!canEnhance(id)) return false;
    const e = data.collection[id];
    e.echo -= Cards.UPGRADE_COST[e.lv];
    e.lv += 1;
    return true;
  }
  const enhanceable = () => Object.keys(data.collection).filter(canEnhance);
  function clearNew(id) { if (data.collection[id]) data.collection[id].isNew = false; }

  /* ---------- deck ---------- */
  const inDeck = (id) => data.deck.concepts.includes(id);
  function toggleDeck(id) {
    if (!owned(id)) return false;
    const i = data.deck.concepts.indexOf(id);
    if (i >= 0) data.deck.concepts.splice(i, 1); else data.deck.concepts.push(id);
    return true;
  }
  function setBasic(id, n) { data.deck[id] = Math.max(0, Math.min(BASIC_MAX, n)); }
  const deckSize = () => data.deck.strike + data.deck.guard + data.deck.concepts.length;

  /* The deck as [{ id, lv }] for a battle. */
  function deckList() {
    const out = [];
    for (let i = 0; i < data.deck.strike; i++) out.push({ id: 'strike', lv: 0 });
    for (let i = 0; i < data.deck.guard; i++) out.push({ id: 'guard', lv: 0 });
    data.deck.concepts.forEach((id) => out.push({ id, lv: level(id) }));
    return out;
  }

  return {
    get data() { return data; }, hadSave, DECK_MIN, BASIC_MAX,
    commit, replace, reset, sanitize,
    owned, entry, level, addCard, canEnhance, enhance, enhanceable, echoesNeeded, clearNew,
    inDeck, toggleDeck, setBasic, deckSize, deckList
  };
})();

/* Optional Google login + Firestore cloud save.
 * Replace the placeholder values with your Firebase web config to enable it.
 * While the placeholders remain, the cloud buttons stay hidden and nothing is downloaded. */
const Cloud = (() => {
  const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  };
  const SDK = 'https://www.gstatic.com/firebasejs/10.7.1/';
  const configured = !Object.values(firebaseConfig).some((v) => String(v).includes('YOUR_'));

  let fb = null; let user = null; let ready = false;
  const listeners = [];
  const emit = (ev, detail) => listeners.forEach((fn) => { try { fn(ev, detail); } catch (e) { console.error(e); } });

  async function init() {
    if (!configured) return;
    try {
      const [appM, authM, storeM] = await Promise.all([
        import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
      ]);
      const app = appM.initializeApp(firebaseConfig);
      fb = { authM, storeM, auth: authM.getAuth(app), db: storeM.getFirestore(app) };
      ready = true;
      authM.onAuthStateChanged(fb.auth, async (u) => {
        user = u || null;
        emit('auth', user);
        if (user) await pull();
      });
      emit('ready');
    } catch (e) {
      console.warn('Cloud save unavailable, playing with local saves only.', e);
      emit('unavailable');
    }
  }

  async function login() {
    if (!ready) { emit('error', tr('cloud.unavailable')); return; }
    try { await fb.authM.signInWithPopup(fb.auth, new fb.authM.GoogleAuthProvider()); }
    catch (e) { emit('error', e.code === 'auth/popup-closed-by-user' ? tr('cloud.cancelled') : tr('cloud.failed')); }
  }

  async function logout() {
    if (!ready || !user) return;
    try { await fb.authM.signOut(fb.auth); emit('info', tr('cloud.loggedOut')); }
    catch (e) { emit('error', tr('cloud.logoutFailed')); }
  }

  async function push(silent = false) {
    if (!ready || !user) return false;
    try {
      await fb.storeM.setDoc(fb.storeM.doc(fb.db, 'users', user.uid), { save: Save.data, updatedAt: Save.data.updatedAt });
      if (!silent) emit('info', tr('cloud.synced'));
      return true;
    } catch (e) { emit('error', tr('cloud.syncFailed')); return false; }
  }

  /* Take the cloud copy only when it is newer. Never changes the current screen. */
  async function pull() {
    try {
      const snap = await fb.storeM.getDoc(fb.storeM.doc(fb.db, 'users', user.uid));
      if (!snap.exists()) { await push(true); return; }
      const remote = snap.data().save || snap.data().gameState;
      if (remote && Number(remote.updatedAt || 0) > Save.data.updatedAt) {
        Save.replace(remote);
        emit('loaded');
      } else await push(true);
    } catch (e) { emit('error', tr('cloud.readFailed')); }
  }

  return { configured, init, login, logout, push, on: (fn) => listeners.push(fn), get user() { return user; }, get available() { return ready; } };
})();
