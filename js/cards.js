/* pickpack - keywords, rarities, card database and card renderer. */
'use strict';

const Keywords = {
  shield:     { name: 'Shield',     icon: 'shield',   desc: 'Blocks incoming damage. Fades at the start of the owner\'s next turn.' },
  fracture:   { name: 'Fracture',   icon: 'fracture', desc: 'Takes 50% more damage from attacks. Drops by 1 each turn.', debuff: true },
  dim:        { name: 'Dim',        icon: 'dim',      desc: 'Deals 25% less attack damage. Drops by 1 each turn.', debuff: true },
  resonance:  { name: 'Resonance',  icon: 'wave',     desc: 'Every hit deals +1 damage per stack.' },
  ember:      { name: 'Ember',      icon: 'ember',    desc: 'Loses HP equal to Ember at the start of its turn, then Ember drops by 1.', debuff: true },
  bloom:      { name: 'Bloom',      icon: 'bloom',    desc: 'Heals HP equal to Bloom at the start of its turn, then Bloom drops by 1.' },
  thorns:     { name: 'Thorns',     icon: 'thorns',   desc: 'Whenever it is hit by an attack, the attacker takes this much damage.' },
  stasis:     { name: 'Stasis',     icon: 'stasis',   desc: 'Completely negates the next incoming hit. One stack per hit.' },
  echo:       { name: 'Echo',       icon: 'echo',     desc: 'The next Attack played this turn resolves twice.' },
  solar:      { name: 'Solar',      icon: 'sun',      desc: 'Heals this much HP at the start of each turn.' },
  transcend:  { name: 'Transcend',  icon: 'orbit',    desc: 'Gains this much extra Energy at the start of each turn.' },
  foresight:  { name: 'Foresight',  icon: 'eye',      desc: 'Draws this many extra cards at the start of each turn.' },
  inferno:    { name: 'Inferno',    icon: 'vow',      desc: 'Whenever an Attack is played, applies this much Ember.' },
  gravity:    { name: 'Gravity',    icon: 'gravity',  desc: 'Gains 1 Resonance at the end of each of its turns.' },
  silence:    { name: 'Silence',    icon: 'silence',  desc: 'Seals 1 random card in your hand at the start of your turn.' },
  distortion: { name: 'Distortion', icon: 'glitch',   desc: 'Scrambles the cost of 2 cards in your hand every turn.' },
  oblivion:   { name: 'Oblivion',   icon: 'static',   desc: 'Some of its moves slip Static into your draw pile.' },
  unmaking:   { name: 'Unmaking',   icon: 'p_void',   desc: 'At the end of its turn, removes half of your Shield. Its hits grow heavier.' },
  stun:       { name: 'Stunned',    icon: 'stun',     desc: 'Skips its next action.', debuff: true },
  exhaust:    { name: 'Exhaust',    desc: 'Removed from this battle after it is played.' },
  retain:     { name: 'Retain',     desc: 'Stays in your hand at the end of your turn.' },
  ethereal:   { name: 'Ethereal',   desc: 'If it is still in your hand at the end of your turn, it fades away.' },
  unplayable: { name: 'Unplayable', desc: 'Cannot be played.' },
  sealed:     { name: 'Sealed',     icon: 'lock',     desc: 'Silenced by the Choir. Cannot be played this turn.' },
  energy:     { name: 'Energy',     desc: 'Spent to play cards. Refills at the start of your turn.' }
};

const Rarity = {
  B: { name: 'Basic',     rank: 0 },
  C: { name: 'Common',    rank: 1, rate: 50 },
  U: { name: 'Uncommon',  rank: 2, rate: 30 },
  R: { name: 'Rare',      rank: 3, rate: 14 },
  E: { name: 'Epic',      rank: 4, rate: 5 },
  L: { name: 'Legendary', rank: 5, rate: 1 },
  S: { name: 'Status',    rank: 0 },
  X: { name: 'Story',     rank: 5 }
};

const Cards = (() => {
  const DB = {};
  const MAX_LV = 2;
  const UPGRADE_COST = [1, 2];            // echoes needed for Lv0->1 and Lv1->2
  const ECHO_REFUND = { C: 20, U: 35, R: 60, E: 120, L: 250 }; // points for echoes past max level
  const TYPE_NAME = { attack: 'Attack', skill: 'Skill', power: 'Power', status: 'Status' };

  function def(id, o) {
    DB[id] = Object.assign({ id, pool: true, exhaust: false, retain: false, ethereal: false, unplayable: false, v: {} }, o);
  }

  /* ---------------- basics ---------------- */
  def('strike', { name: 'Strike', rarity: 'B', type: 'attack', icon: 'sword', cost: 1, pool: false,
    v: { d: 6 }, text: 'Deal {d} damage.', fx: (v) => [['hit', v.d]],
    flavor: 'The first concept every Picker learns: push back.' });
  def('guard', { name: 'Guard', rarity: 'B', type: 'skill', icon: 'shield', cost: 1, pool: false,
    v: { s: 5 }, text: 'Gain {s} [shield].', fx: (v) => [['shield', v.s]],
    flavor: 'Hold your shape.' });

  /* ---------------- common ---------------- */
  def('strike_protocol', { name: 'Strike Protocol', rarity: 'C', type: 'attack', icon: 'dagger', cost: 1,
    v: { d: [9, 12, 15] }, text: 'Deal {d} damage.', fx: (v) => [['hit', v.d]],
    flavor: 'Basic execution stream.' });
  def('patch_sequence', { name: 'Patch Sequence', rarity: 'C', type: 'skill', icon: 'patch', cost: 1,
    v: { s: [6, 8, 10], h: [2, 3, 4] }, text: 'Gain {s} [shield]. Heal {h} HP.', fx: (v) => [['shield', v.s], ['heal', v.h]],
    flavor: 'Minor parameter fix.' });
  def('fallen_leaf', { name: 'Fallen Leaf', rarity: 'C', type: 'attack', icon: 'leaf', cost: 0,
    v: { d: [3, 5, 7] }, text: 'Deal {d} damage. Draw 1 card.', fx: (v) => [['hit', v.d], ['draw', 1]],
    flavor: 'Fading particle simulation.' });
  def('dewdrop', { name: 'Dewdrop', rarity: 'C', type: 'skill', icon: 'drop', cost: 0,
    v: { s: [4, 6, 8] }, text: 'Gain {s} [shield].', fx: (v) => [['shield', v.s]],
    flavor: 'Trace fluid allocation.' });
  def('ignition', { name: 'Ignition', rarity: 'C', type: 'attack', icon: 'candle', cost: 1,
    v: { d: [4, 5, 6], e: [3, 4, 5] }, text: 'Deal {d} damage. Apply {e} [ember].', fx: (v) => [['hit', v.d], ['foe', 'ember', v.e]],
    flavor: 'Thermal initialization.' });
  def('sprout_root', { name: 'Sprout Root', rarity: 'C', type: 'skill', icon: 'root', cost: 1,
    v: { b: [4, 5, 6], s: [3, 4, 5] }, text: 'Gain {b} [bloom] and {s} [shield].', fx: (v) => [['self', 'bloom', v.b], ['shield', v.s]],
    flavor: 'Organic logic injection.' });
  def('dissolve', { name: 'Dissolve', rarity: 'C', type: 'skill', icon: 'dissolve', cost: 1,
    v: { f: [2, 3, 4] }, text: 'Apply {f} [fracture]. Draw 1 card.', fx: (v) => [['foe', 'fracture', v.f], ['draw', 1]],
    flavor: 'Atmospheric disruption.' });
  def('spark', { name: 'Spark', rarity: 'C', type: 'attack', icon: 'sparkle', cost: 1,
    v: { d: [4, 5, 6] }, text: 'Deal {d} damage twice.', fx: (v) => [['hit', v.d, 2]],
    flavor: 'Two thoughts, one direction.' });
  def('insight', { name: 'Insight', rarity: 'C', type: 'skill', icon: 'eye', cost: [1, 1, 0],
    v: { n: [2, 3, 3] }, text: 'Draw {n} cards.', fx: (v) => [['draw', v.n]],
    flavor: 'Read the next page before it turns.' });
  def('ash_veil', { name: 'Ash Veil', rarity: 'C', type: 'skill', icon: 'veil', cost: 1,
    v: { s: [6, 8, 10] }, text: 'Gain {s} [shield]. Apply 1 [dim].', fx: (v) => [['shield', v.s], ['foe', 'dim', 1]],
    flavor: 'Grey on grey. Hard to hit.' });

  /* ---------------- uncommon ---------------- */
  def('destruction', { name: 'Destruction', rarity: 'U', type: 'attack', icon: 'blast', cost: 2,
    v: { d: [18, 23, 28] }, text: 'Deal {d} damage.', fx: (v) => [['hit', v.d]],
    flavor: 'Standard structural fracture.' });
  def('rejuvenate', { name: 'Rejuvenate', rarity: 'U', type: 'skill', icon: 'heartPlus', cost: 1, exhaust: true,
    v: { h: [8, 11, 14] }, text: 'Heal {h} HP.', fx: (v) => [['heal', v.h]],
    flavor: 'Restores operating code.' });
  def('decay_link', { name: 'Decay Link', rarity: 'U', type: 'attack', icon: 'link', cost: 1,
    v: { d: [5, 7, 9] }, text: 'Deal {d} damage. Apply 1 [dim] and 1 [fracture].',
    fx: (v) => [['hit', v.d], ['foe', 'dim', 1], ['foe', 'fracture', 1]],
    flavor: 'Rot travels along every connection.' });
  def('gale_force', { name: 'Gale Force', rarity: 'U', type: 'attack', icon: 'wind', cost: 1,
    v: { d: [3, 4, 4], n: [3, 3, 4] }, text: 'Deal {d} damage {n} times.', fx: (v) => [['hit', v.d, v.n]],
    flavor: 'Kinetic projection.' });
  def('earthen_shell', { name: 'Earthen Shell', rarity: 'U', type: 'skill', icon: 'mountain', cost: 2,
    v: { s: [14, 18, 22] }, text: 'Gain {s} [shield].', fx: (v) => [['shield', v.s]],
    flavor: 'Balance shield extraction.' });
  def('frost_layer', { name: 'Frost Layer', rarity: 'U', type: 'attack', icon: 'snow', cost: 1,
    v: { d: [7, 9, 11] }, text: 'Deal {d} damage. Apply 2 [dim].', fx: (v) => [['hit', v.d], ['foe', 'dim', 2]],
    flavor: 'Thermal drop containment.' });
  def('solar_pulse', { name: 'Solar Pulse', rarity: 'U', type: 'power', icon: 'sun', cost: 1,
    v: { h: [2, 3, 4] }, text: 'At the start of each turn, heal {h} HP.', fx: (v) => [['self', 'solar', v.h]],
    flavor: 'Standard data correction.' });
  def('dark_matter', { name: 'Dark Matter', rarity: 'U', type: 'attack', icon: 'moon', cost: 2,
    v: { d: [24, 30, 36] }, text: 'Deal {d} damage. Lose 3 HP.', fx: (v) => [['hit', v.d], ['loseHp', 3]],
    flavor: 'Heavy pressure output.' });
  def('sanguine_pact', { name: 'Sanguine Pact', rarity: 'U', type: 'skill', icon: 'pact', cost: 0,
    v: { l: [4, 3, 2] }, text: 'Lose {l} HP. Gain 2 [energy].', fx: (v) => [['loseHp', v.l], ['energy', 2]],
    flavor: 'Critical cell calculation.' });
  def('anima_drain', { name: 'Anima Drain', rarity: 'U', type: 'attack', icon: 'wisp', cost: 1,
    v: { d: [7, 9, 11], h: [3, 4, 5] }, text: 'Deal {d} damage. Heal {h} HP.', fx: (v) => [['hit', v.d], ['heal', v.h]],
    flavor: 'Spectral frequency conversion.' });

  /* ---------------- rare ---------------- */
  def('judgment', { name: 'Judgment', rarity: 'R', type: 'attack', icon: 'bolt', cost: 1,
    v: { d: [16, 21, 26] }, text: 'Deal {d} damage. Lose 4 HP.', fx: (v) => [['hit', v.d], ['loseHp', 4]],
    flavor: 'High-risk compensation blow.' });
  def('stasis', { name: 'Stasis', rarity: 'R', type: 'skill', icon: 'stasis', cost: [1, 0, 0], exhaust: true,
    v: { n: [1, 1, 2] }, text: 'Gain {n} [stasis].', fx: (v) => [['self', 'stasis', v.n]],
    flavor: 'Freeze state parameters.' });
  def('meteor_shift', { name: 'Meteor Shift', rarity: 'R', type: 'attack', icon: 'comet', cost: 3,
    v: { d: [32, 40, 48] }, text: 'Deal {d} damage.', fx: (v) => [['hit', v.d]],
    flavor: 'Focused compression assault.' });
  def('siphon_abyss', { name: 'Siphon Abyss', rarity: 'R', type: 'attack', icon: 'vortex', cost: 2, exhaust: true,
    v: { d: [12, 16, 20] }, text: 'Deal {d} damage. Heal HP equal to the unblocked damage.',
    fx: (v) => [['hit', v.d, 1, { lifesteal: true }]],
    flavor: 'Converts energy on impact.' });
  def('divinity_essence', { name: 'Divinity Essence', rarity: 'R', type: 'skill', icon: 'star5', cost: 2, exhaust: true,
    v: { h: [12, 15, 18], r: [2, 2, 3] }, text: 'Heal {h} HP. Gain {r} [resonance].',
    fx: (v) => [['heal', v.h], ['self', 'resonance', v.r]],
    flavor: 'Extensive formula parsing.' });
  def('echo_chamber', { name: 'Echo Chamber', rarity: 'R', type: 'skill', icon: 'echo', cost: [1, 0, 0],
    v: { dr: [0, 0, 1] }, text: (v) => 'Your next Attack this turn is played twice.' + (v.dr ? ' Draw {dr} card.' : ''),
    fx: (v) => [['self', 'echo', 1], ['draw', v.dr]],
    flavor: 'Every strike deserves an encore.' });
  def('ember_storm', { name: 'Ember Storm', rarity: 'R', type: 'skill', icon: 'storm', cost: 1,
    v: { e: [0, 3, 6] }, text: (v) => (v.e ? 'Apply {e} [ember], then double' : 'Double') + ' the enemy\'s [ember].',
    fx: (v) => [['foe', 'ember', v.e], ['doubleFoe', 'ember']],
    flavor: 'Feed the fire until it feeds itself.' });
  def('mirror_shell', { name: 'Mirror Shell', rarity: 'R', type: 'power', icon: 'mirror', cost: [2, 2, 1],
    v: { t: [3, 4, 6] }, text: 'Gain {t} [thorns].', fx: (v) => [['self', 'thorns', v.t]],
    flavor: 'Whatever strikes you, strikes itself.' });

  /* ---------------- epic ---------------- */
  def('pure_chaos', { name: 'Pure Chaos', rarity: 'E', type: 'attack', icon: 'shuffle', cost: 1,
    v: { lo: [5, 8, 10], hi: [25, 30, 36] }, text: 'Deal {lo} to {hi} damage.', fx: (v) => [['hitRand', v.lo, v.hi]],
    flavor: 'Unstable energy burst.' });
  def('transcendence', { name: 'Transcendence', rarity: 'E', type: 'power', icon: 'orbit', cost: [2, 1, 1],
    v: { dr: [0, 0, 1] }, text: (v) => 'At the start of each turn, gain 1 [energy]' + (v.dr ? ' and draw {dr} card.' : '.'),
    fx: (v) => [['self', 'transcend', 1], ['self', 'foresight', v.dr]],
    flavor: 'Permeates structural growth.' });
  def('collapse', { name: 'Collapse', rarity: 'E', type: 'attack', icon: 'collapse', cost: 2, exhaust: true,
    v: { p: [25, 30, 35] }, text: 'Deal damage equal to {p}% of the enemy\'s current HP.', fx: (v) => [['hitPct', v.p]],
    flavor: 'Proportional structural tear.' });
  def('resonant_core', { name: 'Resonant Core', rarity: 'E', type: 'power', icon: 'core', cost: 1,
    v: { r: [2, 3, 4] }, text: 'Gain {r} [resonance].', fx: (v) => [['self', 'resonance', v.r]],
    flavor: 'Hum at the frequency of breaking things.' });
  def('inferno_vow', { name: 'Inferno Vow', rarity: 'E', type: 'power', icon: 'vow', cost: 1,
    v: { e: [2, 3, 4] }, text: 'Whenever you play an Attack, apply {e} [ember].', fx: (v) => [['self', 'inferno', v.e]],
    flavor: 'A promise, written in heat.' });

  /* ---------------- legendary ---------------- */
  def('absolute_void', { name: 'Absolute Void', rarity: 'L', type: 'attack', icon: 'crown', cost: 3, exhaust: true,
    v: { d: [45, 60, 75] }, text: 'Deal {d} damage.', fx: (v) => [['hit', v.d]],
    flavor: 'Erases presence itself completely.' });
  def('genesis_light', { name: 'Genesis Light', rarity: 'L', type: 'skill', icon: 'genesis', cost: 2, exhaust: true,
    v: { h: [20, 26, 32] }, text: 'Heal {h} HP. Remove all your debuffs. Gain 1 [energy].',
    fx: (v) => [['heal', v.h], ['cleanse'], ['energy', 1]],
    flavor: 'Re-engineers vital functions.' });
  def('infinite_pick', { name: 'Infinite Pick', rarity: 'L', type: 'skill', icon: 'infinity', cost: 0, exhaust: true,
    v: { n: [3, 4, 5] }, text: 'Draw {n} cards. They cost 0 this turn.', fx: (v) => [['drawFree', v.n]],
    flavor: 'Pick again. And again. And again.' });

  /* ---------------- special ---------------- */
  def('static', { name: 'Static', rarity: 'S', type: 'status', icon: 'static', cost: null, pool: false,
    unplayable: true, ethereal: true, text: 'A burst of noise from the Void.', fx: () => [],
    flavor: 'Noise where a thought used to be.' });
  def('last_light', { name: 'Last Light', rarity: 'X', type: 'skill', icon: 'beacon', cost: 0, pool: false,
    retain: true, exhaust: true, v: { h: 15, s: 20, r: 3 },
    text: 'Heal {h} HP. Gain {s} [shield] and {r} [resonance].',
    fx: (v) => [['heal', v.h], ['shield', v.s], ['self', 'resonance', v.r]],
    flavor: 'Lumen\'s light. All of it, for you.' });

  /* ---------------- helpers ---------------- */
  const get = (id) => DB[id];
  const pick = (val, lv) => (Array.isArray(val) ? val[Math.min(lv, val.length - 1)] : val);

  function values(id, lv = 0) {
    const c = DB[id]; const out = {};
    for (const k in c.v) out[k] = pick(c.v[k], lv);
    return out;
  }
  function costOf(id, lv = 0) { return pick(DB[id].cost, lv); }
  function effects(id, lv = 0) { return DB[id].fx(values(id, lv)); }
  function upgradable(id) { return !!DB[id] && ['C', 'U', 'R', 'E', 'L'].includes(DB[id].rarity); }
  function pool(rarity) { return Object.values(DB).filter((c) => c.pool && c.rarity === rarity).map((c) => c.id); }
  function all() { return Object.values(DB).filter((c) => c.pool).map((c) => c.id); }

  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  function kwTip(key) { const k = Keywords[key]; return k ? `${k.name}: ${k.desc}` : ''; }
  function kwSpan(key) {
    const k = Keywords[key];
    return k ? `<b class="kw" data-tip="${esc(kwTip(key))}">${k.name}</b>` : key;
  }

  /* Card rules text as HTML. o.dmg(n) lets the battle show modified damage. */
  function textHTML(id, lv = 0, o = {}) {
    const c = DB[id]; const v = values(id, lv); const base = values(id, 0);
    let t = typeof c.text === 'function' ? c.text(v) : c.text;
    t = esc(t).replace(/\{(\w+)\}/g, (m, k) => {
      let n = v[k]; let cls = 'n';
      if (lv > 0 && base[k] !== n) cls += ' up';
      if (o.dmg && c.type === 'attack' && ['d', 'lo', 'hi'].includes(k)) {
        const m2 = o.dmg(n);
        if (m2 > n) cls += ' buff'; else if (m2 < n) cls += ' nerf';
        n = m2;
      }
      return `<b class="${cls}">${n}</b>`;
    }).replace(/\[(\w+)\]/g, (m, k) => kwSpan(k));
    const tags = [];
    if (c.unplayable) tags.push(kwSpan('unplayable'));
    if (c.retain) tags.push(kwSpan('retain'));
    if (c.ethereal) tags.push(kwSpan('ethereal'));
    if (c.exhaust) tags.push(kwSpan('exhaust'));
    if (c.type === 'power') tags.push('<b class="kw" data-tip="Power: stays active for the rest of the battle.">Power</b>');
    return `<span class="c-rules">${t}</span>` + (tags.length ? `<span class="c-tags">${tags.join(' · ')}</span>` : '');
  }

  function pips(rarity) {
    const r = Rarity[rarity].rank;
    let s = '';
    for (let i = 0; i < 5; i++) s += `<i class="${i < r ? 'on' : ''}"></i>`;
    return `<div class="c-pips" title="${Rarity[rarity].name}">${s}</div>`;
  }

  /* Full card face.
   * o: { uid, cls, cost, costCls, sealed, badge, badgeCls, dmg, attrs, locked, inDeck } */
  function html(id, lv = 0, o = {}) {
    const c = DB[id];
    if (!c) return '';
    if (o.locked) {
      return `<div class="card locked r-${c.rarity} ${o.cls || ''}" data-id="${id}" ${o.attrs || ''}>
        <div class="c-frame">${pips(c.rarity)}<div class="c-art">${Icons.svg('question')}</div>
        <div class="c-name">Unknown Concept</div><div class="c-type">${Rarity[c.rarity].name}</div>
        <div class="c-text muted">Extract it in the Before-Pick.</div></div></div>`;
    }
    const cost = o.cost !== undefined ? o.cost : costOf(id, lv);
    const lvMark = lv > 0 ? `<span class="c-lv">${'+'.repeat(lv)}</span>` : '';
    const costHTML = cost === null || cost === undefined ? '' :
      `<div class="c-cost ${o.costCls || ''}"><span>${cost}</span></div>`;
    return `<div class="card r-${c.rarity} t-${c.type} lv${lv} ${o.cls || ''}" data-id="${id}" ${o.uid !== undefined ? `data-uid="${o.uid}"` : ''} ${o.attrs || ''}>
      <div class="c-frame">
        ${costHTML}${pips(c.rarity)}
        <div class="c-art">${Icons.svg(c.icon)}</div>
        <div class="c-name">${esc(c.name)}${lvMark}</div>
        <div class="c-type">${TYPE_NAME[c.type]} · ${Rarity[c.rarity].name}</div>
        <div class="c-text">${textHTML(id, lv, o)}</div>
      </div>
      ${o.sealed ? `<div class="c-seal" data-tip="${esc(kwTip('sealed'))}">${Icons.svg('lock')}<span>Sealed</span></div>` : ''}
      ${o.inDeck ? `<div class="c-indeck">${Icons.svg('check')}</div>` : ''}
      ${o.badge ? `<div class="c-badge ${o.badgeCls || ''}">${o.badge}</div>` : ''}
    </div>`;
  }

  function back(rarity = 'C', o = {}) {
    return `<div class="card card-back r-${rarity} ${o.cls || ''}" ${o.attrs || ''}>
      <div class="cb-inner">${Icons.svg('p_picker')}<span>pickpack</span></div></div>`;
  }

  return { DB, MAX_LV, UPGRADE_COST, ECHO_REFUND, TYPE_NAME, get, values, costOf, effects, upgradable, pool, all,
    html, back, textHTML, kwSpan, kwTip, esc };
})();
