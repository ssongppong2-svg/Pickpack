/* pickpack - keywords, rarities, card database and card renderer.
 * Player-facing text is stored as [English, Korean] pairs and read through loc(). */
'use strict';

const Keywords = {
  shield:     { name: ['Shield', '방어막'], icon: 'shield', desc: ['Blocks incoming damage. Fades at the start of the owner\'s next turn.', '받는 피해를 막아 줍니다. 자신의 다음 턴이 시작되면 사라집니다.'] },
  fracture:   { name: ['Fracture', '균열'], icon: 'fracture', debuff: true, desc: ['Takes 50% more damage from attacks. Drops by 1 each turn.', '공격으로 받는 피해가 50% 늘어납니다. 매 턴 1씩 줄어듭니다.'] },
  dim:        { name: ['Dim', '약화'], icon: 'dim', debuff: true, desc: ['Deals 25% less attack damage. Drops by 1 each turn.', '공격으로 주는 피해가 25% 줄어듭니다. 매 턴 1씩 줄어듭니다.'] },
  resonance:  { name: ['Resonance', '공명'], icon: 'wave', desc: ['Every hit deals +1 damage per stack.', '공격이 적중할 때마다 중첩당 피해가 1 늘어납니다.'] },
  ember:      { name: ['Ember', '잔불'], icon: 'ember', debuff: true, desc: ['Loses HP equal to Ember at the start of its turn, then Ember drops by 1.', '자신의 턴이 시작될 때 잔불 수치만큼 체력을 잃고, 잔불이 1 줄어듭니다.'] },
  bloom:      { name: ['Bloom', '개화'], icon: 'bloom', desc: ['Heals HP equal to Bloom at the start of its turn, then Bloom drops by 1.', '자신의 턴이 시작될 때 개화 수치만큼 체력을 회복하고, 개화가 1 줄어듭니다.'] },
  thorns:     { name: ['Thorns', '가시'], icon: 'thorns', desc: ['Whenever it is hit by an attack, the attacker takes this much damage.', '공격을 받을 때마다 공격한 쪽이 이만큼 피해를 입습니다.'] },
  stasis:     { name: ['Stasis', '정지'], icon: 'stasis', desc: ['Completely negates the next incoming hit. One stack per hit.', '다음에 받는 공격 한 번을 완전히 무효로 합니다. 공격 한 번에 1씩 소모됩니다.'] },
  echo:       { name: ['Echo', '메아리'], icon: 'echo', desc: ['The next Attack played this turn resolves twice.', '이번 턴에 사용하는 다음 공격 카드가 두 번 발동합니다.'] },
  solar:      { name: ['Solar', '태양'], icon: 'sun', desc: ['Heals this much HP at the start of each turn.', '매 턴 시작 시 이만큼 체력을 회복합니다.'] },
  transcend:  { name: ['Transcend', '초월'], icon: 'orbit', desc: ['Gains this much extra Energy at the start of each turn.', '매 턴 시작 시 에너지를 이만큼 더 얻습니다.'] },
  foresight:  { name: ['Foresight', '예지'], icon: 'eye', desc: ['Draws this many extra cards at the start of each turn.', '매 턴 시작 시 카드를 이만큼 더 뽑습니다.'] },
  inferno:    { name: ['Inferno', '업화'], icon: 'vow', desc: ['Whenever an Attack is played, applies this much Ember.', '공격 카드를 사용할 때마다 잔불을 이만큼 부여합니다.'] },
  gravity:    { name: ['Gravity', '중력'], icon: 'gravity', desc: ['Gains 1 Resonance at the end of each of its turns.', '자신의 턴이 끝날 때마다 공명을 1 얻습니다.'] },
  silence:    { name: ['Silence', '침묵'], icon: 'silence', desc: ['Seals 1 random card in your hand at the start of your turn.', '당신의 턴이 시작될 때 손패 1장을 무작위로 봉인합니다.'] },
  distortion: { name: ['Distortion', '왜곡'], icon: 'glitch', desc: ['Scrambles the cost of 2 cards in your hand every turn.', '매 턴 손패 2장의 비용을 뒤섞습니다.'] },
  oblivion:   { name: ['Oblivion', '망각'], icon: 'static', desc: ['Some of its moves slip Static into your draw pile.', '일부 행동으로 당신의 뽑을 카드 더미에 잡음을 섞어 넣습니다.'] },
  unmaking:   { name: ['Unmaking', '소거'], icon: 'p_void', desc: ['Before it acts, half of your Shield is unmade. Its hits grow heavier.', '행동하기 전에 당신의 방어막 절반을 소거합니다. 공격도 더 무거워집니다.'] },
  stun:       { name: ['Stunned', '기절'], icon: 'stun', debuff: true, desc: ['Skips its next action.', '다음 행동을 건너뜁니다.'] },
  exhaust:    { name: ['Exhaust', '소멸'], desc: ['Removed from this battle after it is played.', '사용하면 이번 전투에서 제외됩니다.'] },
  retain:     { name: ['Retain', '보존'], desc: ['Stays in your hand at the end of your turn.', '턴이 끝나도 손패에 남습니다.'] },
  ethereal:   { name: ['Ethereal', '덧없음'], desc: ['If it is still in your hand at the end of your turn, it fades away.', '턴이 끝날 때 손패에 남아 있으면 사라집니다.'] },
  unplayable: { name: ['Unplayable', '사용 불가'], desc: ['Cannot be played.', '사용할 수 없습니다.'] },
  sealed:     { name: ['Sealed', '봉인'], icon: 'lock', desc: ['Silenced by the Choir. Cannot be played this turn.', '성가대에게 침묵당했습니다. 이번 턴에는 사용할 수 없습니다.'] },
  energy:     { name: ['Energy', '에너지'], desc: ['Spent to play cards. Refills at the start of your turn.', '카드를 사용하는 데 씁니다. 자신의 턴이 시작되면 다시 채워집니다.'] }
};

const Rarity = {
  B: { rank: 0 },
  C: { rank: 1, rate: 50 },
  U: { rank: 2, rate: 30 },
  R: { rank: 3, rate: 14 },
  E: { rank: 4, rate: 5 },
  L: { rank: 5, rate: 1 },
  S: { rank: 0 },
  X: { rank: 5 }
};

const Cards = (() => {
  const DB = {};
  const MAX_LV = 2;
  const UPGRADE_COST = [1, 2];            // echoes needed for Lv0->1 and Lv1->2
  const ECHO_REFUND = { C: 20, U: 35, R: 60, E: 120, L: 250 }; // points for echoes past max level

  function def(id, o) {
    DB[id] = Object.assign({ id, pool: true, exhaust: false, retain: false, ethereal: false, unplayable: false, v: {} }, o);
  }

  /* ---------------- basics ---------------- */
  def('strike', { name: ['Strike', '일격'], rarity: 'B', type: 'attack', icon: 'sword', cost: 1, pool: false,
    v: { d: 6 }, text: ['Deal {d} damage.', '피해를 {d} 줍니다.'], fx: (v) => [['hit', v.d]],
    flavor: ['The first concept every Picker learns: push back.', '모든 선택자가 가장 먼저 배우는 개념. 되받아쳐라.'] });
  def('guard', { name: ['Guard', '수비'], rarity: 'B', type: 'skill', icon: 'shield', cost: 1, pool: false,
    v: { s: 5 }, text: ['Gain {s} [shield].', '[shield]을 {s} 얻습니다.'], fx: (v) => [['shield', v.s]],
    flavor: ['Hold your shape.', '형태를 지켜라.'] });

  /* ---------------- common ---------------- */
  def('strike_protocol', { name: ['Strike Protocol', '타격 프로토콜'], rarity: 'C', type: 'attack', icon: 'dagger', cost: 1,
    v: { d: [9, 12, 15] }, text: ['Deal {d} damage.', '피해를 {d} 줍니다.'], fx: (v) => [['hit', v.d]],
    flavor: ['Basic execution stream.', '기본 실행 흐름.'] });
  def('patch_sequence', { name: ['Patch Sequence', '복구 시퀀스'], rarity: 'C', type: 'skill', icon: 'patch', cost: 1,
    v: { s: [6, 8, 10], h: [2, 3, 4] }, text: ['Gain {s} [shield]. Heal {h} HP.', '[shield]을 {s} 얻습니다. 체력을 {h} 회복합니다.'],
    fx: (v) => [['shield', v.s], ['heal', v.h]],
    flavor: ['Minor parameter fix.', '사소한 매개변수 수정.'] });
  def('fallen_leaf', { name: ['Fallen Leaf', '낙엽'], rarity: 'C', type: 'attack', icon: 'leaf', cost: 0,
    v: { d: [3, 5, 7] }, text: ['Deal {d} damage. Draw 1 card.', '피해를 {d} 줍니다. 카드를 1장 뽑습니다.'], fx: (v) => [['hit', v.d], ['draw', 1]],
    flavor: ['Fading particle simulation.', '사라져 가는 입자의 모사.'] });
  def('dewdrop', { name: ['Dewdrop', '이슬방울'], rarity: 'C', type: 'skill', icon: 'drop', cost: 0,
    v: { s: [4, 6, 8] }, text: ['Gain {s} [shield].', '[shield]을 {s} 얻습니다.'], fx: (v) => [['shield', v.s]],
    flavor: ['Trace fluid allocation.', '아주 작은 물의 배분.'] });
  def('ignition', { name: ['Ignition', '점화'], rarity: 'C', type: 'attack', icon: 'candle', cost: 1,
    v: { d: [4, 5, 6], e: [3, 4, 5] }, text: ['Deal {d} damage. Apply {e} [ember].', '피해를 {d} 줍니다. [ember]을 {e} 부여합니다.'],
    fx: (v) => [['hit', v.d], ['foe', 'ember', v.e]],
    flavor: ['Thermal initialization.', '열의 초기화.'] });
  def('sprout_root', { name: ['Sprout Root', '새싹 뿌리'], rarity: 'C', type: 'skill', icon: 'root', cost: 1,
    v: { b: [4, 5, 6], s: [3, 4, 5] }, text: ['Gain {b} [bloom] and {s} [shield].', '[bloom]를 {b}, [shield]을 {s} 얻습니다.'],
    fx: (v) => [['self', 'bloom', v.b], ['shield', v.s]],
    flavor: ['Organic logic injection.', '유기적 논리의 주입.'] });
  def('dissolve', { name: ['Dissolve', '용해'], rarity: 'C', type: 'skill', icon: 'dissolve', cost: 1,
    v: { f: [2, 3, 4] }, text: ['Apply {f} [fracture]. Draw 1 card.', '[fracture]을 {f} 부여합니다. 카드를 1장 뽑습니다.'],
    fx: (v) => [['foe', 'fracture', v.f], ['draw', 1]],
    flavor: ['Atmospheric disruption.', '대기의 교란.'] });
  def('spark', { name: ['Spark', '섬광'], rarity: 'C', type: 'attack', icon: 'sparkle', cost: 1,
    v: { d: [4, 5, 6] }, text: ['Deal {d} damage twice.', '피해를 {d}씩 2번 줍니다.'], fx: (v) => [['hit', v.d, 2]],
    flavor: ['Two thoughts, one direction.', '두 생각, 하나의 방향.'] });
  def('insight', { name: ['Insight', '통찰'], rarity: 'C', type: 'skill', icon: 'eye', cost: [1, 1, 0],
    v: { n: [2, 3, 3] }, text: ['Draw {n} cards.', '카드를 {n}장 뽑습니다.'], fx: (v) => [['draw', v.n]],
    flavor: ['Read the next page before it turns.', '넘어가기 전에 다음 장을 읽어라.'] });
  def('ash_veil', { name: ['Ash Veil', '재의 장막'], rarity: 'C', type: 'skill', icon: 'veil', cost: 1,
    v: { s: [6, 8, 10] }, text: ['Gain {s} [shield]. Apply 1 [dim].', '[shield]을 {s} 얻습니다. [dim]를 1 부여합니다.'],
    fx: (v) => [['shield', v.s], ['foe', 'dim', 1]],
    flavor: ['Grey on grey. Hard to hit.', '잿빛 위의 잿빛. 맞히기 어렵다.'] });

  /* ---------------- uncommon ---------------- */
  def('destruction', { name: ['Destruction', '파괴'], rarity: 'U', type: 'attack', icon: 'blast', cost: 2,
    v: { d: [18, 23, 28] }, text: ['Deal {d} damage.', '피해를 {d} 줍니다.'], fx: (v) => [['hit', v.d]],
    flavor: ['Standard structural fracture.', '표준적인 구조 파열.'] });
  def('rejuvenate', { name: ['Rejuvenate', '재생'], rarity: 'U', type: 'skill', icon: 'heartPlus', cost: 1, exhaust: true,
    v: { h: [8, 11, 14] }, text: ['Heal {h} HP.', '체력을 {h} 회복합니다.'], fx: (v) => [['heal', v.h]],
    flavor: ['Restores operating code.', '작동 코드를 되살린다.'] });
  def('decay_link', { name: ['Decay Link', '부패의 고리'], rarity: 'U', type: 'attack', icon: 'link', cost: 1,
    v: { d: [5, 7, 9] }, text: ['Deal {d} damage. Apply 1 [dim] and 1 [fracture].', '피해를 {d} 줍니다. [dim]와 [fracture]을 1씩 부여합니다.'],
    fx: (v) => [['hit', v.d], ['foe', 'dim', 1], ['foe', 'fracture', 1]],
    flavor: ['Rot travels along every connection.', '부패는 모든 연결을 타고 번진다.'] });
  def('gale_force', { name: ['Gale Force', '질풍'], rarity: 'U', type: 'attack', icon: 'wind', cost: 1,
    v: { d: [3, 4, 4], n: [3, 3, 4] }, text: ['Deal {d} damage {n} times.', '피해를 {d}씩 {n}번 줍니다.'], fx: (v) => [['hit', v.d, v.n]],
    flavor: ['Kinetic projection.', '운동 에너지의 투사.'] });
  def('earthen_shell', { name: ['Earthen Shell', '대지의 방벽'], rarity: 'U', type: 'skill', icon: 'mountain', cost: 2,
    v: { s: [14, 18, 22] }, text: ['Gain {s} [shield].', '[shield]을 {s} 얻습니다.'], fx: (v) => [['shield', v.s]],
    flavor: ['Balance shield extraction.', '균형 잡힌 방패의 추출.'] });
  def('frost_layer', { name: ['Frost Layer', '서리막'], rarity: 'U', type: 'attack', icon: 'snow', cost: 1,
    v: { d: [7, 9, 11] }, text: ['Deal {d} damage. Apply 2 [dim].', '피해를 {d} 줍니다. [dim]를 2 부여합니다.'], fx: (v) => [['hit', v.d], ['foe', 'dim', 2]],
    flavor: ['Thermal drop containment.', '떨어진 온도의 봉쇄.'] });
  def('solar_pulse', { name: ['Solar Pulse', '태양 파동'], rarity: 'U', type: 'power', icon: 'sun', cost: 1,
    v: { h: [2, 3, 4] }, text: ['At the start of each turn, heal {h} HP.', '매 턴 시작 시 체력을 {h} 회복합니다.'], fx: (v) => [['self', 'solar', v.h]],
    flavor: ['Standard data correction.', '표준 데이터 보정.'] });
  def('dark_matter', { name: ['Dark Matter', '암흑 물질'], rarity: 'U', type: 'attack', icon: 'moon', cost: 2,
    v: { d: [24, 30, 36] }, text: ['Deal {d} damage. Lose 3 HP.', '피해를 {d} 줍니다. 체력을 3 잃습니다.'], fx: (v) => [['hit', v.d], ['loseHp', 3]],
    flavor: ['Heavy pressure output.', '묵직한 압력의 출력.'] });
  def('sanguine_pact', { name: ['Sanguine Pact', '피의 서약'], rarity: 'U', type: 'skill', icon: 'pact', cost: 0,
    v: { l: [4, 3, 2] }, text: ['Lose {l} HP. Gain 2 [energy].', '체력을 {l} 잃습니다. [energy]를 2 얻습니다.'], fx: (v) => [['loseHp', v.l], ['energy', 2]],
    flavor: ['Critical cell calculation.', '위험한 세포 계산.'] });
  def('anima_drain', { name: ['Anima Drain', '영혼 흡수'], rarity: 'U', type: 'attack', icon: 'wisp', cost: 1,
    v: { d: [7, 9, 11], h: [3, 4, 5] }, text: ['Deal {d} damage. Heal {h} HP.', '피해를 {d} 줍니다. 체력을 {h} 회복합니다.'], fx: (v) => [['hit', v.d], ['heal', v.h]],
    flavor: ['Spectral frequency conversion.', '유령 주파수의 변환.'] });

  /* ---------------- rare ---------------- */
  def('judgment', { name: ['Judgment', '심판'], rarity: 'R', type: 'attack', icon: 'bolt', cost: 1,
    v: { d: [16, 21, 26] }, text: ['Deal {d} damage. Lose 4 HP.', '피해를 {d} 줍니다. 체력을 4 잃습니다.'], fx: (v) => [['hit', v.d], ['loseHp', 4]],
    flavor: ['High-risk compensation blow.', '큰 대가를 치르는 일격.'] });
  def('stasis', { name: ['Stasis', '정지'], rarity: 'R', type: 'skill', icon: 'stasis', cost: [1, 0, 0], exhaust: true,
    v: { n: [1, 1, 2] }, text: ['Gain {n} [stasis].', '[stasis]를 {n} 얻습니다.'], fx: (v) => [['self', 'stasis', v.n]],
    flavor: ['Freeze state parameters.', '상태 매개변수 동결.'] });
  def('meteor_shift', { name: ['Meteor Shift', '유성 낙하'], rarity: 'R', type: 'attack', icon: 'comet', cost: 3,
    v: { d: [32, 40, 48] }, text: ['Deal {d} damage.', '피해를 {d} 줍니다.'], fx: (v) => [['hit', v.d]],
    flavor: ['Focused compression assault.', '한곳에 압축한 강습.'] });
  def('siphon_abyss', { name: ['Siphon Abyss', '심연의 흡인'], rarity: 'R', type: 'attack', icon: 'vortex', cost: 2, exhaust: true,
    v: { d: [12, 16, 20] }, text: ['Deal {d} damage. Heal HP equal to the unblocked damage.', '피해를 {d} 줍니다. 막히지 않은 피해만큼 체력을 회복합니다.'],
    fx: (v) => [['hit', v.d, 1, { lifesteal: true }]],
    flavor: ['Converts energy on impact.', '충돌하는 순간 에너지를 바꾼다.'] });
  def('divinity_essence', { name: ['Divinity Essence', '신성의 정수'], rarity: 'R', type: 'skill', icon: 'star5', cost: 2, exhaust: true,
    v: { h: [12, 15, 18], r: [2, 2, 3] }, text: ['Heal {h} HP. Gain {r} [resonance].', '체력을 {h} 회복합니다. [resonance]을 {r} 얻습니다.'],
    fx: (v) => [['heal', v.h], ['self', 'resonance', v.r]],
    flavor: ['Extensive formula parsing.', '방대한 공식의 해석.'] });
  def('echo_chamber', { name: ['Echo Chamber', '반향실'], rarity: 'R', type: 'skill', icon: 'echo', cost: [1, 0, 0],
    v: { dr: [0, 0, 1] },
    text: [(v) => 'Your next Attack this turn is played twice.' + (v.dr ? ' Draw {dr} card.' : ''),
      (v) => '이번 턴에 사용하는 다음 공격 카드가 두 번 발동합니다.' + (v.dr ? ' 카드를 {dr}장 뽑습니다.' : '')],
    fx: (v) => [['self', 'echo', 1], ['draw', v.dr]],
    flavor: ['Every strike deserves an encore.', '모든 일격에는 앙코르가 어울린다.'] });
  def('ember_storm', { name: ['Ember Storm', '잔불 폭풍'], rarity: 'R', type: 'skill', icon: 'storm', cost: 1,
    v: { e: [0, 3, 6] },
    text: [(v) => (v.e ? 'Apply {e} [ember], then double' : 'Double') + ' the enemy\'s [ember].',
      (v) => (v.e ? '[ember]을 {e} 부여한 뒤, ' : '') + '적의 [ember]을 두 배로 만듭니다.'],
    fx: (v) => [['foe', 'ember', v.e], ['doubleFoe', 'ember']],
    flavor: ['Feed the fire until it feeds itself.', '불이 스스로를 먹일 때까지 불을 먹여라.'] });
  def('mirror_shell', { name: ['Mirror Shell', '거울 방패'], rarity: 'R', type: 'power', icon: 'mirror', cost: [2, 2, 1],
    v: { t: [3, 4, 6] }, text: ['Gain {t} [thorns].', '[thorns]를 {t} 얻습니다.'], fx: (v) => [['self', 'thorns', v.t]],
    flavor: ['Whatever strikes you, strikes itself.', '너를 치는 것은 무엇이든 스스로를 친다.'] });

  /* ---------------- epic ---------------- */
  def('pure_chaos', { name: ['Pure Chaos', '순수한 혼돈'], rarity: 'E', type: 'attack', icon: 'shuffle', cost: 1,
    v: { lo: [5, 8, 10], hi: [25, 30, 36] }, text: ['Deal {lo} to {hi} damage.', '{lo}에서 {hi} 사이의 피해를 줍니다.'], fx: (v) => [['hitRand', v.lo, v.hi]],
    flavor: ['Unstable energy burst.', '불안정한 에너지의 폭발.'] });
  def('transcendence', { name: ['Transcendence', '초월'], rarity: 'E', type: 'power', icon: 'orbit', cost: [2, 1, 1],
    v: { dr: [0, 0, 1] },
    text: [(v) => 'At the start of each turn, gain 1 [energy]' + (v.dr ? ' and draw {dr} card.' : '.'),
      (v) => '매 턴 시작 시 [energy]를 1 얻' + (v.dr ? '고 카드를 {dr}장 뽑습니다.' : '습니다.')],
    fx: (v) => [['self', 'transcend', 1], ['self', 'foresight', v.dr]],
    flavor: ['Permeates structural growth.', '구조적 성장이 스며든다.'] });
  def('collapse', { name: ['Collapse', '붕괴'], rarity: 'E', type: 'attack', icon: 'collapse', cost: 2, exhaust: true,
    v: { p: [25, 30, 35] }, text: ['Deal damage equal to {p}% of the enemy\'s current HP.', '적의 현재 체력의 {p}%만큼 피해를 줍니다.'], fx: (v) => [['hitPct', v.p]],
    flavor: ['Proportional structural tear.', '비례하는 구조의 찢김.'] });
  def('resonant_core', { name: ['Resonant Core', '공명 핵'], rarity: 'E', type: 'power', icon: 'core', cost: 1,
    v: { r: [2, 3, 4] }, text: ['Gain {r} [resonance].', '[resonance]을 {r} 얻습니다.'], fx: (v) => [['self', 'resonance', v.r]],
    flavor: ['Hum at the frequency of breaking things.', '무언가 부서지는 주파수로 울려라.'] });
  def('inferno_vow', { name: ['Inferno Vow', '업화의 서약'], rarity: 'E', type: 'power', icon: 'vow', cost: 1,
    v: { e: [2, 3, 4] }, text: ['Whenever you play an Attack, apply {e} [ember].', '공격 카드를 사용할 때마다 [ember]을 {e} 부여합니다.'], fx: (v) => [['self', 'inferno', v.e]],
    flavor: ['A promise, written in heat.', '열기로 쓴 약속.'] });

  /* ---------------- legendary ---------------- */
  def('absolute_void', { name: ['Absolute Void', '절대 공허'], rarity: 'L', type: 'attack', icon: 'crown', cost: 3, exhaust: true,
    v: { d: [45, 60, 75] }, text: ['Deal {d} damage.', '피해를 {d} 줍니다.'], fx: (v) => [['hit', v.d]],
    flavor: ['Erases presence itself completely.', '존재 그 자체를 완전히 지운다.'] });
  def('genesis_light', { name: ['Genesis Light', '창세의 빛'], rarity: 'L', type: 'skill', icon: 'genesis', cost: 2, exhaust: true,
    v: { h: [20, 26, 32] }, text: ['Heal {h} HP. Remove all your debuffs. Gain 1 [energy].', '체력을 {h} 회복합니다. 자신의 해로운 효과를 모두 없앱니다. [energy]를 1 얻습니다.'],
    fx: (v) => [['heal', v.h], ['cleanse'], ['energy', 1]],
    flavor: ['Re-engineers vital functions.', '생명 기능을 다시 설계한다.'] });
  def('infinite_pick', { name: ['Infinite Pick', '무한 선택'], rarity: 'L', type: 'skill', icon: 'infinity', cost: 0, exhaust: true,
    v: { n: [3, 4, 5] }, text: ['Draw {n} cards. They cost 0 this turn.', '카드를 {n}장 뽑습니다. 뽑은 카드는 이번 턴에 비용이 0이 됩니다.'], fx: (v) => [['drawFree', v.n]],
    flavor: ['Pick again. And again. And again.', '다시 골라라. 또다시. 또다시.'] });

  /* ---------------- special ---------------- */
  def('static', { name: ['Static', '잡음'], rarity: 'S', type: 'status', icon: 'static', cost: null, pool: false,
    unplayable: true, ethereal: true, text: ['A burst of noise from the Void.', '공허가 흘려보낸 잡음 덩어리.'], fx: () => [],
    flavor: ['Noise where a thought used to be.', '생각이 있던 자리에 남은 잡음.'] });
  def('last_light', { name: ['Last Light', '마지막 빛'], rarity: 'X', type: 'skill', icon: 'beacon', cost: 0, pool: false,
    retain: true, exhaust: true, v: { h: 15, s: 20, r: 3 },
    text: ['Heal {h} HP. Gain {s} [shield] and {r} [resonance].', '체력을 {h} 회복합니다. [shield]을 {s}, [resonance]을 {r} 얻습니다.'],
    fx: (v) => [['heal', v.h], ['shield', v.s], ['self', 'resonance', v.r]],
    flavor: ['Lumen\'s light. All of it, for you.', '루멘의 빛. 그 전부를, 당신에게.'] });

  /* ---------------- helpers ---------------- */
  const get = (id) => DB[id];
  const pick = (val, lv) => (Array.isArray(val) ? val[Math.min(lv, val.length - 1)] : val);
  const name = (id) => loc(DB[id].name);
  const kwName = (k) => (Keywords[k] ? loc(Keywords[k].name) : k);
  const kwDesc = (k) => (Keywords[k] ? loc(Keywords[k].desc) : '');
  const typeName = (type) => tr(`type.${type}`);
  const rarityName = (r) => tr(`rarity.${r}`);

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
  function kwTip(key) { return Keywords[key] ? `${kwName(key)}: ${kwDesc(key)}` : ''; }
  function kwSpan(key) {
    return Keywords[key] ? `<b class="kw" data-tip="${esc(kwTip(key))}">${esc(kwName(key))}</b>` : key;
  }

  /* Card rules text as HTML. o.dmg(n) lets the battle show modified damage. */
  function textHTML(id, lv = 0, o = {}) {
    const c = DB[id]; const v = values(id, lv); const base = values(id, 0);
    const tmpl = loc(c.text);
    let t = typeof tmpl === 'function' ? tmpl(v) : tmpl;
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
    if (c.type === 'power') tags.push(`<b class="kw" data-tip="${esc(tr('card.powerTip'))}">${esc(typeName('power'))}</b>`);
    return `<span class="c-rules">${t}</span>` + (tags.length ? `<span class="c-tags">${tags.join(' · ')}</span>` : '');
  }

  function pips(rarity) {
    const r = Rarity[rarity].rank;
    let s = '';
    for (let i = 0; i < 5; i++) s += `<i class="${i < r ? 'on' : ''}"></i>`;
    return `<div class="c-pips" title="${esc(rarityName(rarity))}">${s}</div>`;
  }

  /* Full card face.
   * o: { uid, cls, cost, costCls, sealed, badge, badgeCls, dmg, attrs, locked, inDeck } */
  function html(id, lv = 0, o = {}) {
    const c = DB[id];
    if (!c) return '';
    if (o.locked) {
      return `<div class="card locked r-${c.rarity} ${o.cls || ''}" data-id="${id}" ${o.attrs || ''}>
        <div class="c-frame">${pips(c.rarity)}<div class="c-art">${Icons.svg('question')}</div>
        <div class="c-name">${esc(tr('card.unknown'))}</div><div class="c-type">${esc(rarityName(c.rarity))}</div>
        <div class="c-text muted">${esc(tr('card.lockedHint'))}</div></div></div>`;
    }
    const cost = o.cost !== undefined ? o.cost : costOf(id, lv);
    const lvMark = lv > 0 ? `<span class="c-lv">${'+'.repeat(lv)}</span>` : '';
    const costHTML = cost === null || cost === undefined ? '' :
      `<div class="c-cost ${o.costCls || ''}"><span>${cost}</span></div>`;
    return `<div class="card r-${c.rarity} t-${c.type} lv${lv} ${o.cls || ''}" data-id="${id}" ${o.uid !== undefined ? `data-uid="${o.uid}"` : ''} ${o.attrs || ''}>
      <div class="c-frame">
        ${costHTML}${pips(c.rarity)}
        <div class="c-art">${Icons.svg(c.icon)}</div>
        <div class="c-name">${esc(name(id))}${lvMark}</div>
        <div class="c-type">${esc(typeName(c.type))} · ${esc(rarityName(c.rarity))}</div>
        <div class="c-text">${textHTML(id, lv, o)}</div>
      </div>
      ${o.sealed ? `<div class="c-seal" data-tip="${esc(kwTip('sealed'))}">${Icons.svg('lock')}<span>${esc(kwName('sealed'))}</span></div>` : ''}
      ${o.inDeck ? `<div class="c-indeck">${Icons.svg('check')}</div>` : ''}
      ${o.badge ? `<div class="c-badge ${o.badgeCls || ''}">${o.badge}</div>` : ''}
    </div>`;
  }

  function back(rarity = 'C', o = {}) {
    return `<div class="card card-back r-${rarity} ${o.cls || ''}" ${o.attrs || ''}>
      <div class="cb-inner">${Icons.svg('p_picker')}<span>pickpack</span></div></div>`;
  }

  return { DB, MAX_LV, UPGRADE_COST, ECHO_REFUND, get, name, values, costOf, effects, upgradable, pool, all,
    html, back, textHTML, kwSpan, kwTip, kwName, kwDesc, typeName, rarityName, esc };
})();
