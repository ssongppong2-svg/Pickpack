/* pickpack - the five Phase guardians.
 * Every boss has its own move cycle, a signature passive and its own voice,
 * so no two battles play the same way. Text is stored as [English, Korean] pairs;
 * `say` is a list of such pairs, one of which is spoken at random.
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
    name: ['Warden of Oblivion', '망각의 문지기'], short: ['WARDEN', '문지기'], hp: 100, shape: 'warden', portrait: 'p_warden',
    passives: ['oblivion'],
    moves: {
      lash:   { name: ['Oblivion Lash', '망각의 채찍'], fx: [['hit', 10]] },
      twin:   { name: ['Twin Bolts', '쌍둥이 화살'], fx: [['hit', 6, 2]] },
      forget: { name: ['Forget', '망각'], fx: [['shield', 10], ['addCard', 'static', 2]], say: [['Forget.', '잊어라.'], ['Let it go. All of it.', '놓아라. 전부 다.']] }
    },
    pattern: ['lash', 'twin', 'forget'],
    lines: {
      start: ['Turn back, spark. Beyond this gate, even your name forgets you.', '돌아가라, 불씨여. 이 문 너머에서는 네 이름조차 너를 잊는다.'],
      half: ['You... resist the fog?', '네가... 안개를 버텨 낸다고?'],
      low: ['No... I remember... the gate was white, once...', '안 돼... 기억난다... 이 문은 한때 하얬는데...'],
      kill: ['Sleep now. You will not remember losing.', '이제 잠들어라. 패배했다는 것조차 기억하지 못할 테니.']
    }
  },

  choir: {
    name: ['The Hollow Choir', '텅 빈 성가대'], short: ['CHOIR', '성가대'], hp: 165, shape: 'choir', portrait: 'p_choir',
    passives: ['silence'],
    moves: {
      hush:    { name: ['Hush', '고요'], fx: [['hit', 10], ['foe', 'dim', 1]], say: [['Hush.', '조용히.'], ['Shhh...', '쉬잇...']] },
      chorus:  { name: ['Chorus of None', '아무도 없는 합창'], fx: [['hit', 6, 3]] },
      requiem: { name: ['Requiem', '진혼곡'], fx: [['shield', 14], ['self', 'resonance', 2]], say: [['We sing for no one.', '우리는 누구를 위해서도 노래하지 않는다.']] }
    },
    pattern: ['hush', 'chorus', 'requiem'],
    lines: {
      start: ['Hush. Hush now. Isolation consumes us all.', '쉿. 쉿, 조용히. 고립은 우리 모두를 삼킨다.'],
      half: ['Why do you still make noise?', '어째서 아직도 소리를 내는가?'],
      low: ['A melody... we had forgotten melodies...', '선율... 우리는 선율을 잊고 있었다...'],
      kill: ['Join the silence. It is not lonely here. It is nothing at all.', '침묵에 합류하라. 이곳은 외롭지 않다. 아무것도 없을 뿐.']
    }
  },

  fracture: {
    name: ['The Fracture', '균열체'], short: ['FRACTURE', '균열체'], hp: 280, shape: 'fracture', portrait: 'p_fracture',
    passives: ['distortion'],
    moves: {
      burst:     { name: ['Glitch Burst', '오류 폭발'], fx: [['hit', 5, 4]] },
      recompile: { name: ['Recompile', '재컴파일'], fx: [['shield', 18], ['self', 'resonance', 1]], say: [['RECOMPILING. NOW WITH FEWER MERCIES.', '재컴파일 중. 자비 기능을 줄였다.']] },
      corrupt:   { name: ['Corrupt', '오염'], fx: [['hit', 9], ['foe', 'fracture', 2]], say: [['WRITING ERRORS INTO YOU.', '너에게 오류를 기록한다.']] },
      overclock: { name: ['Overclock', '오버클럭'], fx: [['hit', 24]], say: [['OVERCLOCK. OVERCLOCK. OVERCLOCK.', '오버클럭. 오버클럭. 오버클럭.']] }
    },
    pattern: ['burst', 'recompile', 'corrupt', 'overclock'],
    events: [{ at: 0.6, id: 'override' }],
    lines: {
      start: ['UNAUTHORIZED CONCEPT DETECTED. INITIATING DELETION.', '미승인 개념 감지. 삭제를 개시한다.'],
      low: ['ERR... ERROR... I WAS A LENS. I WAS... CLARITY?', '오... 오류... 나는 렌즈였다. 나는... 명료함이었나?'],
      kill: ['DELETION COMPLETE. HAVE A NICE VOID.', '삭제 완료. 즐거운 공허 되시길.']
    }
  },

  singularity: {
    name: ['The Singularity', '특이점'], short: ['SINGULARITY', '특이점'], hp: 300, shape: 'singularity', portrait: 'p_singularity',
    passives: ['gravity'],
    moves: {
      pull:    { name: ['Pull', '끌어당김'], fx: [['hit', 11], ['drawLess', 1]], say: [['Come closer.', '더 가까이 오너라.']] },
      accrete: { name: ['Accrete', '강착'], fx: [['shield', 16]] },
      charge:  { name: ['Collapsing Inward', '내부 붕괴'], fx: [['charge']], say: [['Everything... falls... inward...', '모든 것이... 안으로... 떨어진다...']] },
      horizon: { name: ['Event Horizon', '사건의 지평선'], fx: [['hit', 34]] }
    },
    pattern: ['pull', 'accrete', 'charge', 'horizon'],
    lines: {
      start: ['All things fall. All things end here. You are simply late.', '모든 것은 떨어진다. 모든 것은 이곳에서 끝난다. 너는 그저 늦었을 뿐.'],
      half: ['You are heavier than you look, little Picker.', '보기보다 무겁구나, 작은 선택자여.'],
      low: ['Why will you not fall?', '어째서 떨어지지 않는 것이냐?'],
      kill: ['Another light swallowed. It is always the same.', '또 하나의 빛을 삼켰다. 언제나 똑같구나.']
    }
  },

  void: {
    name: ['VOID', '공허'], short: ['VOID', '공허'], hp: 420, shape: 'void', portrait: 'p_void',
    passives: [],
    moves: {
      oblivion: { name: ['Oblivion Wave', '망각의 파도'], fx: [['hit', 12], ['addCard', 'static', 1]] },
      silence:  { name: ['Silence Echo', '침묵의 메아리'], fx: [['hit', 7, 2], ['seal', 1]] },
      glitch:   { name: ['Glitch Echo', '오류의 메아리'], fx: [['hit', 5, 4]] },
      gravity:  { name: ['Gravity Echo', '중력의 메아리'], fx: [['shield', 14], ['self', 'resonance', 2]] },
      erase:    { name: ['Erase', '소거'], fx: [['hit', 22]], say: [['Be erased.', '지워져라.']] },
      nullfield:{ name: ['Null Field', '무효의 장'], fx: [['shield', 10], ['foe', 'dim', 2], ['foe', 'fracture', 2]] },
      tide:     { name: ['Oblivion Tide', '망각의 조수'], fx: [['hit', 8, 3]] },
      gather:   { name: ['Gathering Nothing', '무의 응집'], fx: [['charge']], say: [['Watch everything you are... end.', '네 모든 것이... 끝나는 걸 지켜보아라.']] },
      nonexist: { name: ['Non-Existence', '비존재'], fx: [['hit', 42]] }
    },
    pattern: ['oblivion', 'silence', 'glitch', 'gravity'],
    pattern2: ['erase', 'nullfield', 'tide', 'gather', 'nonexist'],
    events: [{ at: 0.5, id: 'phase2' }],
    lines: {
      start: ['So. The last spark reaches the edge of everything.', '그래. 마지막 불씨가 모든 것의 끝자락에 닿았구나.'],
      low: ['Why... do you... still shine...', '어째서... 너는... 아직도 빛나는가...'],
      kill: ['Nothing. At last, nothing.', '아무것도 없다. 마침내, 아무것도.']
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
      } else if (k === 'shield') chips.push({ icon: 'shield', text: '', tip: tr('it.shield') });
      else if (k === 'self') chips.push({ icon: 'up', text: '', tip: tr('it.buff', { name: Cards.kwName(a) }) });
      else if (k === 'foe') chips.push({ icon: 'down', text: '', tip: tr('it.debuff', { name: Cards.kwName(a) }) });
      else if (k === 'addCard') chips.push({ icon: 'static', text: '', tip: tr('it.addCard', { name: Cards.name(a) }) });
      else if (k === 'seal') chips.push({ icon: 'lock', text: '', tip: tr('it.seal') });
      else if (k === 'drawLess') chips.push({ icon: 'deck', text: '', tip: tr('it.drawLess') });
      else if (k === 'charge') { chips.push({ icon: 'warning', text: '', cls: 'warn', tip: tr('it.charge') }); if (kind !== 'attack') kind = 'charge'; }
    }
    // merge repeated icons (e.g. two debuffs) into a single chip
    const merged = [];
    for (const c of chips) {
      const same = !c.text && merged.find((m) => m.icon === c.icon && !m.text);
      if (same) same.tip = `${same.tip}. ${c.tip}`; else merged.push(Object.assign({}, c));
    }
    return { chips: merged, kind, name: loc(move.name) };
  }
  return { describe };
})();
