/* pickpack - the five Phase guardians.
 * Every boss has its own move cycle, a signature passive and its own voice,
 * so no two battles play the same way.
 *
 * Move effect ops:
 *   ['hit', dmg, times]          attack the Picker
 *   ['shield', n]                gain Shield
 *   ['self', status, n]          buff itself
 *   ['foe', status, n]           debuff the Picker
 *   ['addCard', id, n]           shuffle status cards into the Picker's draw pile
 *   ['seal', n]                  seal n cards at the start of the Picker's next turn
 *   ['drawLess', n]              the Picker draws n fewer cards next turn
 *   ['charge']                   telegraph only (does nothing this turn) */
'use strict';

const Bosses = {
  warden: {
    name: 'Warden of Oblivion', short: 'WARDEN', hp: 100, shape: 'warden', portrait: 'p_warden',
    passives: ['oblivion'],
    moves: {
      lash:   { name: 'Oblivion Lash', fx: [['hit', 10]] },
      twin:   { name: 'Twin Bolts', fx: [['hit', 6, 2]] },
      forget: { name: 'Forget', fx: [['shield', 10], ['addCard', 'static', 2]], say: ['Forget.', 'Let it go. All of it.'] }
    },
    pattern: ['lash', 'twin', 'forget'],
    lines: {
      start: 'Turn back, spark. Beyond this gate, even your name forgets you.',
      half: 'You... resist the fog?',
      low: 'No... I remember... the gate was white, once...',
      kill: 'Sleep now. You will not remember losing.'
    }
  },

  choir: {
    name: 'The Hollow Choir', short: 'CHOIR', hp: 165, shape: 'choir', portrait: 'p_choir',
    passives: ['silence'],
    moves: {
      hush:    { name: 'Hush', fx: [['hit', 10], ['foe', 'dim', 1]], say: ['Hush.', 'Shhh...'] },
      chorus:  { name: 'Chorus of None', fx: [['hit', 6, 3]] },
      requiem: { name: 'Requiem', fx: [['shield', 14], ['self', 'resonance', 2]], say: ['We sing for no one.'] }
    },
    pattern: ['hush', 'chorus', 'requiem'],
    lines: {
      start: 'Hush. Hush now. Isolation consumes us all.',
      half: 'Why do you still make noise?',
      low: 'A melody... we had forgotten melodies...',
      kill: 'Join the silence. It is not lonely here. It is nothing at all.'
    }
  },

  fracture: {
    name: 'The Fracture', short: 'FRACTURE', hp: 280, shape: 'fracture', portrait: 'p_fracture',
    passives: ['distortion'],
    moves: {
      burst:     { name: 'Glitch Burst', fx: [['hit', 5, 4]] },
      recompile: { name: 'Recompile', fx: [['shield', 18], ['self', 'resonance', 1]], say: ['RECOMPILING. NOW WITH FEWER MERCIES.'] },
      corrupt:   { name: 'Corrupt', fx: [['hit', 9], ['foe', 'fracture', 2]], say: ['WRITING ERRORS INTO YOU.'] },
      overclock: { name: 'Overclock', fx: [['hit', 24]], say: ['OVERCLOCK. OVERCLOCK. OVERCLOCK.'] }
    },
    pattern: ['burst', 'recompile', 'corrupt', 'overclock'],
    events: [{ at: 0.6, id: 'override' }],
    lines: {
      start: 'UNAUTHORIZED CONCEPT DETECTED. INITIATING DELETION.',
      low: 'ERR... ERROR... I WAS A LENS. I WAS... CLARITY?',
      kill: 'DELETION COMPLETE. HAVE A NICE VOID.'
    }
  },

  singularity: {
    name: 'The Singularity', short: 'SINGULARITY', hp: 300, shape: 'singularity', portrait: 'p_singularity',
    passives: ['gravity'],
    moves: {
      pull:    { name: 'Pull', fx: [['hit', 11], ['drawLess', 1]], say: ['Come closer.'] },
      accrete: { name: 'Accrete', fx: [['shield', 16]] },
      charge:  { name: 'Collapsing Inward', fx: [['charge']], say: ['Everything... falls... inward...'] },
      horizon: { name: 'Event Horizon', fx: [['hit', 34]] }
    },
    pattern: ['pull', 'accrete', 'charge', 'horizon'],
    lines: {
      start: 'All things fall. All things end here. You are simply late.',
      half: 'You are heavier than you look, little Picker.',
      low: 'Why will you not fall?',
      kill: 'Another light swallowed. It is always the same.'
    }
  },

  void: {
    name: 'VOID', short: 'VOID', hp: 420, shape: 'void', portrait: 'p_void',
    passives: [],
    moves: {
      oblivion: { name: 'Oblivion Wave', fx: [['hit', 12], ['addCard', 'static', 1]] },
      silence:  { name: 'Silence Echo', fx: [['hit', 7, 2], ['seal', 1]] },
      glitch:   { name: 'Glitch Echo', fx: [['hit', 5, 4]] },
      gravity:  { name: 'Gravity Echo', fx: [['shield', 14], ['self', 'resonance', 2]] },
      erase:    { name: 'Erase', fx: [['hit', 22]], say: ['Be erased.'] },
      nullfield:{ name: 'Null Field', fx: [['shield', 10], ['foe', 'dim', 2], ['foe', 'fracture', 2]] },
      tide:     { name: 'Oblivion Tide', fx: [['hit', 8, 3]] },
      gather:   { name: 'Gathering Nothing', fx: [['charge']], say: ['Watch everything you are... end.'] },
      nonexist: { name: 'Non-Existence', fx: [['hit', 42]] }
    },
    pattern: ['oblivion', 'silence', 'glitch', 'gravity'],
    pattern2: ['erase', 'nullfield', 'tide', 'gather', 'nonexist'],
    events: [{ at: 0.5, id: 'phase2' }],
    lines: {
      start: 'So. The last spark reaches the edge of everything.',
      low: 'Why... do you... still shine...',
      kill: 'Nothing. At last, nothing.'
    }
  }
};

const Intent = (() => {
  /* Build the intent chips shown above the boss for a move.
   * dmgFn(base) returns the damage after live modifiers. */
  function describe(move, dmgFn) {
    const chips = [];
    let kind = 'buff';
    for (const op of move.fx) {
      const [k, a, b] = op;
      if (k === 'hit') {
        const n = dmgFn ? dmgFn(a) : a;
        chips.push({ icon: (b || 1) > 1 || n >= 20 ? 'swords' : 'sword', text: (b || 1) > 1 ? `${n}×${b}` : `${n}`, cls: 'atk' });
        kind = 'attack';
      } else if (k === 'shield') chips.push({ icon: 'shield', text: '', tip: 'Gains Shield' });
      else if (k === 'self') chips.push({ icon: 'up', text: '', tip: `Gains ${Keywords[a].name}` });
      else if (k === 'foe') chips.push({ icon: 'down', text: '', tip: `Applies ${Keywords[a].name} to you` });
      else if (k === 'addCard') chips.push({ icon: 'static', text: '', tip: `Adds ${Cards.get(a).name} to your draw pile` });
      else if (k === 'seal') chips.push({ icon: 'lock', text: '', tip: 'Seals cards next turn' });
      else if (k === 'drawLess') chips.push({ icon: 'deck', text: '', tip: 'You draw fewer cards next turn' });
      else if (k === 'charge') { chips.push({ icon: 'warning', text: '', cls: 'warn', tip: 'Charging a devastating attack' }); if (kind !== 'attack') kind = 'charge'; }
    }
    // merge repeated icons (e.g. two debuffs) into a single chip
    const merged = [];
    for (const c of chips) {
      const same = !c.text && merged.find((m) => m.icon === c.icon && !m.text);
      if (same) same.tip = `${same.tip}. ${c.tip}`; else merged.push(Object.assign({}, c));
    }
    return { chips: merged, kind, name: move.name };
  }
  return { describe };
})();
