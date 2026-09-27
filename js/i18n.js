/* pickpack - localization (English / Korean).
 * A localized value is a two-item array: [English, Korean].
 *   loc(pair)        picks the current language (falls back to English)
 *   tr(key, vars)    looks up a UI string; {name} inserts a value and
 *                    {name|이/가} also appends the right Korean particle */
'use strict';

const I18N = (() => {
  const SUPPORTED = ['en', 'ko'];
  let lang = 'en';
  const listeners = [];

  const S = {
    /* ---------- title and navigation ---------- */
    'doc.title': ['pickpack - Monochrome Reality', 'pickpack - 흑백의 현실'],
    'title.sub': ['Monochrome Reality', '흑백의 현실'],
    'title.begin': ['Click anywhere to begin', '아무 곳이나 눌러 시작하세요'],
    'title.continue': ['Click anywhere to continue', '아무 곳이나 눌러 이어서 하세요'],
    'title.foot': ['A deck-building card adventure in five Phases', '다섯 관문을 넘는 덱빌딩 카드 모험'],
    'nav.gacha': ['Before-Pick', '개념 추출'],
    'nav.archive': ['Archive', '서고'],
    'lobby.title': ['Sanctuary of Concepts', '개념의 성소'],
    'ui.back': ['Back to the Sanctuary', '성소로 돌아가기'],
    'ui.settings': ['Settings', '설정'],
    'ui.skip': ['Skip', '건너뛰기'],
    'ui.skipScene': ['Skip scene', '장면 건너뛰기'],
    'ui.close': ['Close', '닫기'],
    'ui.cancel': ['Cancel', '취소'],
    'ui.confirm': ['Confirm', '확인'],
    'ui.done': ['Done', '완료'],
    'ui.nothing': ['Nothing here yet.', '아직 아무것도 없습니다.'],
    'ui.noCards': ['No cards here.', '카드가 없습니다.'],
    'ui.soundOn': ['Sound on', '소리 켜짐'],
    'ui.soundOff': ['Sound off', '소리 꺼짐'],
    'ui.mute': ['Mute sound', '소리 끄기'],
    'ui.unmute': ['Unmute sound', '소리 켜기'],
    'ui.langSwitched': ['Language: English', '언어: 한국어'],
    'tip.points': ['Concept Points: spend them in the Before-Pick to extract new concepts.', '개념 포인트: 개념 추출에서 새로운 개념을 얻는 데 씁니다.'],
    'aria.title': ['Title', '타이틀'],
    'aria.story': ['Story', '이야기'],
    'aria.phases': ['Phases', '관문'],
    'aria.battle': ['Battle', '전투'],
    'aria.reward': ['Reward', '보상'],
    'aria.language': ['Language', '언어'],
    'boot.error': ['Something went wrong while loading. Please refresh the page.', '불러오는 중 문제가 생겼습니다. 페이지를 새로고침해 주세요.'],

    /* ---------- lobby ---------- */
    'lobby.complete': ['Story complete. Every Phase is open for training.', '이야기 완결. 모든 관문에서 수련할 수 있습니다.'],
    'lobby.progress': ['{n} of {total} Phases broken', '관문 {total}개 중 {n}개 돌파'],
    'lobby.sealed': ['Sealed. Break the previous Phase first.', '봉인됨. 이전 관문을 먼저 돌파하세요.'],
    'lobby.firstClear': ['First clear', '첫 돌파'],
    'lobby.training': ['Training', '수련'],
    'lobby.voidTip': ['Master of every Phase.', '모든 관문의 주인.'],
    'lobby.deck': ['Deck <b>{n}</b> cards', '덱 <b>{n}</b>장'],
    'lobby.needs': ['Needs {n}+', '{n}장 이상 필요'],
    'lobby.enter': ['Enter Phase', '관문 진입'],
    'lobby.train': ['Train Here', '여기서 수련'],
    'lobby.openArchive': ['Open the Archive', '서고 열기'],
    'lobby.deckSmallTitle': ['Deck too small', '덱이 너무 작습니다'],
    'lobby.deckSmallText': ['Your deck needs at least {min} cards to enter a Phase (it has {n}). Open the Archive to add more?', '관문에 들어가려면 덱에 카드가 {min}장 이상 필요합니다(현재 {n}장). 서고에서 카드를 추가할까요?'],
    'lobby.openArchiveBtn': ['Open Archive', '서고 열기'],

    /* ---------- archive ---------- */
    'ar.all': ['All', '전체'],
    'ar.attack': ['Attack', '공격'],
    'ar.skill': ['Skill', '스킬'],
    'ar.power': ['Power', '파워'],
    'ar.deck': ['In Deck', '덱'],
    'ar.enh': ['Enhance', '강화 가능'],
    'ar.help': ['Click a concept to add it to your deck or remove it. Duplicates from the Before-Pick become Echoes, and Echoes Enhance a card up to ++.', '개념을 누르면 덱에 넣거나 뺄 수 있습니다. 개념 추출에서 나온 중복 카드는 잔향이 되고, 잔향으로 카드를 ++까지 강화합니다.'],
    'ar.deckCount': ['Deck <b class="{cls}">{n}</b><small>min {min}</small>', '덱 <b class="{cls}">{n}</b><small>최소 {min}</small>'],
    'ar.collected': ['Collected <b>{n}</b><small>/ {total}</small>', '수집 <b>{n}</b><small>/ {total}</small>'],
    'ar.enhanceAll': ['Enhance all', '모두 강화'],
    'ar.enhanceAllN': ['Enhance all ({n})', '모두 강화 ({n})'],
    'ar.enhance': ['Enhance', '강화'],
    'ar.enhanceTip': ['Enhance: {text}', '강화: {text}'],
    'ar.next': ['Next level: {text}', '다음 단계: {text}'],
    'ar.echoTip': ['Echoes: {e} of {need} needed to Enhance. {next}', '잔향: 강화에 필요한 {need}개 중 {e}개를 모았습니다. {next}'],
    'ar.echoMax': ['Echoes: this concept is fully enhanced. Further duplicates return Concept Points.', '잔향: 이미 최대로 강화된 개념입니다. 이후 중복은 개념 포인트로 돌아옵니다.'],
    'ar.max': ['MAX', '최대'],
    'ar.lv0': ['Base', '기본'],
    'ar.lv1': ['Lv +', '1단계'],
    'ar.lv2': ['Lv ++', '2단계'],
    'ar.addOne': ['Add one', '1장 추가'],
    'ar.removeOne': ['Remove one', '1장 빼기'],
    'ar.notOwned': ['Not extracted yet. Find it in the Before-Pick.', '아직 얻지 못한 개념입니다. 개념 추출에서 찾아보세요.'],
    'ar.enhancedN': ['{n} enhancements applied.', '강화 {n}회를 적용했습니다.'],
    'ar.enhancedOne': ['1 enhancement applied.', '강화 1회를 적용했습니다.'],
    'ar.enhanced': ['{name} enhanced to {lv}', '{name} 강화 완료: {lv}'],

    /* ---------- before-pick ---------- */
    'g.rates': ['Manifestation Rates', '출현 확률'],
    'g.note1': ['Every x10 extraction guarantees at least one Epic or higher.', '10회 추출마다 영웅 등급 이상이 최소 1장 보장됩니다.'],
    'g.note2': ['Duplicates become Echoes that Enhance the card up to ++.', '중복 카드는 잔향이 되어 카드를 ++까지 강화합니다.'],
    'g.note3': ['Echoes past the max level return Concept Points.', '최대 강화 이후의 잔향은 개념 포인트로 돌아옵니다.'],
    'g.one': ['Extract x1', '1회 추출'],
    'g.ten': ['Extract x10', '10회 추출'],
    'g.collected': ['Collected <b>{n}</b> / {total} concepts', '수집한 개념 <b>{n}</b> / {total}'],
    'g.poor': ['Not enough Concept Points. {cost} p needed, you have {pts} p.', '개념 포인트가 부족합니다. {cost} P가 필요하지만 {pts} P만 있습니다.'],
    'g.resultTitle': ['New Concepts Manifested', '새로운 개념이 나타났습니다'],
    'g.tapToReveal': ['Click a card to reveal it.', '카드를 눌러 공개하세요.'],
    'g.revealAll': ['Reveal all', '모두 공개'],
    'g.again': ['Extract again', '다시 추출'],
    'badge.new': ['NEW', '신규'],
    'badge.echo': ['ECHO +1', '잔향 +1'],
    'badge.ready': ['ENHANCE READY', '강화 가능'],
    'badge.refund': ['+{n} p', '+{n} P'],

    /* ---------- battle ---------- */
    'b.picker': ['PICKER', '선택자'],
    'b.pause': ['Pause menu', '일시 정지 메뉴'],
    'b.hand': ['Your hand', '손패'],
    'b.endTurn': ['End Turn', '턴 종료'],
    'b.turnN': ['Turn {n}', '{n}턴'],
    'b.yourTurn': ['Your Turn', '나의 턴'],
    'b.enemyTurn': ['Enemy Turn', '적의 턴'],
    'b.unmaking': ['Unmaking', '소거'],
    'b.phaseBroken': ['Phase Broken', '관문 돌파'],
    'b.cantPlay': ['{name} cannot be played.', '{name|은/는} 사용할 수 없습니다.'],
    'b.sealed': ['That card is sealed this turn.', '그 카드는 이번 턴에 봉인되었습니다.'],
    'b.noEnergy': ['Not enough Energy.', '에너지가 부족합니다.'],
    'tip.energy': ['Energy: Spent to play cards. Refills to 3 at the start of your turn.', '에너지: 카드를 사용하는 데 씁니다. 자신의 턴이 시작되면 3으로 다시 채워집니다.'],
    'tip.draw': ['Draw pile: click to view it.', '뽑을 카드 더미: 눌러서 확인합니다.'],
    'tip.discard': ['Discard pile: click to view it.', '버린 카드 더미: 눌러서 확인합니다.'],
    'tip.exhaust': ['Exhausted: cards removed for this battle.', '소멸: 이번 전투에서 제외된 카드입니다.'],
    'tip.shield': ['Shield: blocks the next {n} damage.', '방어막: 다음 피해를 {n}만큼 막습니다.'],
    'tip.passive': ['{name} (passive): {desc}', '{name} (지속 효과): {desc}'],
    'f.negated': ['Negated', '무효'],
    'f.blocked': ['Blocked', '막음'],
    'f.fullHp': ['Full HP', '체력 가득'],
    'f.shield': ['+{n} Shield', '방어막 +{n}'],
    'f.status': ['{name} +{n}', '{name} +{n}'],
    'f.reshuffle': ['Reshuffle', '다시 섞기'],
    'f.handFull': ['Hand full', '손패 가득'],
    'f.sealedOne': ['Card sealed', '카드 봉인'],
    'f.sealedN': ['{n} cards sealed', '카드 {n}장 봉인'],
    'f.echo': ['Echo', '메아리'],
    'f.energy': ['+{n} Energy', '에너지 +{n}'],
    'f.cleansed': ['Cleansed', '정화'],
    'f.stunned': ['Stunned', '기절'],
    'f.unmade': ['Unmade -{n}', '소거 -{n}'],
    'f.addCard': ['+{n} {name}', '{name} +{n}'],
    'f.silence': ['Silence looms', '침묵이 다가온다'],
    'f.drawLess': ['Next draw -{n}', '다음 드로우 -{n}'],
    'f.charging': ['Charging', '힘을 모으는 중'],
    'ov.title': ['SYSTEM OVERRIDE', '시스템 강제 개입'],
    'ov.hint': ['Click, tap or press any key as fast as you can', '최대한 빠르게 클릭하거나, 탭하거나, 아무 키나 누르세요'],
    'ov.met': [' / Overload it!', ' / 과부하시켜!'],
    'pile.draw': ['Draw Pile', '뽑을 카드 더미'],
    'pile.drawNote': ['Shown in no particular order. Cards are drawn at random.', '순서 없이 표시됩니다. 카드는 무작위로 뽑힙니다.'],
    'pile.discard': ['Discard Pile', '버린 카드 더미'],
    'pile.discardNote': ['Shuffled back into the draw pile when it runs out.', '뽑을 카드가 떨어지면 다시 섞여 들어갑니다.'],
    'pile.exhaust': ['Exhausted', '소멸한 카드'],
    'pile.exhaustNote': ['Removed for the rest of this battle.', '이번 전투가 끝날 때까지 제외됩니다.'],
    'it.shield': ['Gains Shield', '방어막을 얻음'],
    'it.buff': ['Gains {name}', '{name|을/를} 얻음'],
    'it.debuff': ['Applies {name} to you', '당신에게 {name|을/를} 부여'],
    'it.addCard': ['Adds {name} to your draw pile', '뽑을 카드 더미에 {name|을/를} 섞음'],
    'it.seal': ['Seals cards next turn', '다음 턴에 카드를 봉인'],
    'it.drawLess': ['You draw fewer cards next turn', '다음 턴에 카드를 덜 뽑음'],
    'it.charge': ['Charging a devastating attack', '파괴적인 공격을 준비하는 중'],

    /* ---------- pause, results and rewards ---------- */
    'p.title': ['Paused', '일시 정지'],
    'p.note': ['Play cards with a click or keys 1-9. End your turn with E. Hover keywords and icons for details.', '카드는 클릭하거나 1~9 키로 사용합니다. E 키로 턴을 끝냅니다. 키워드와 아이콘에 마우스를 올리면 설명이 나옵니다.'],
    'p.retreat': ['Retreat', '후퇴'],
    'p.mute': ['Mute', '음소거'],
    'p.unmute': ['Unmute', '소리 켜기'],
    'p.resume': ['Resume', '계속하기'],
    'p.retreatTitle': ['Retreat?', '후퇴할까요?'],
    'p.retreatText': ['You will leave this battle without any reward. Your deck and collection are kept.', '보상 없이 전투를 떠납니다. 덱과 수집한 카드는 그대로 유지됩니다.'],
    'r.broken': ['Phase Broken', '관문 돌파'],
    'r.training': ['Training Complete', '수련 완료'],
    'r.turns': ['{n} turns', '{n}턴'],
    'r.dealt': ['{n} damage dealt', '준 피해 {n}'],
    'r.taken': ['{n} damage taken', '받은 피해 {n}'],
    'r.cards': ['{n} cards played', '사용한 카드 {n}장'],
    'r.points': ['Concept Points', '개념 포인트'],
    'r.pick': ['Pick a concept to keep', '가져갈 개념을 고르세요'],
    'r.take': ['Take concept', '개념 획득'],
    'r.skip': ['Skip (+{n} p)', '건너뛰기 (+{n} P)'],
    'r.newCard': ['{name} joined your deck.', '{name|이/가} 덱에 합류했습니다.'],
    'r.maxed': ['{name} is maxed: +{n} p', '{name|은/는} 이미 최대 강화: +{n} P'],
    'r.echo': ['{name}: Echo +1', '{name}: 잔향 +1'],
    'r.echoReady': ['{name}: Echo +1, ready to Enhance', '{name}: 잔향 +1, 강화 가능'],
    'r.skipToast': ['+{n} Concept Points', '개념 포인트 +{n}'],
    'd.title': ['The Phase Holds', '관문이 버텨냈습니다'],
    'd.recovered': ['fragments recovered. Extract, rebuild, return.', '조각을 회수했습니다. 추출하고, 덱을 다시 짜고, 돌아오세요.'],
    'd.sanctuary': ['Sanctuary', '성소로'],
    'd.retry': ['Retry Phase', '관문 재도전'],

    /* ---------- settings and cloud ---------- */
    'set.title': ['Settings', '설정'],
    'set.save': ['Save', '저장'],
    'set.local': ['Progress is saved automatically in this browser.', '진행 상황은 이 브라우저에 자동으로 저장됩니다.'],
    'set.cloudDown': ['Progress is saved automatically in this browser. Cloud save could not be reached right now.', '진행 상황은 이 브라우저에 자동으로 저장됩니다. 지금은 클라우드 저장에 연결할 수 없습니다.'],
    'set.signedIn': ['Signed in as <b>{name}</b>. Your progress also syncs to the cloud.', '<b>{name}</b> 계정으로 로그인했습니다. 진행 상황이 클라우드에도 동기화됩니다.'],
    'set.signInHint': ['Progress is saved in this browser. Sign in with Google to back it up to the cloud.', '진행 상황은 이 브라우저에 저장됩니다. Google로 로그인하면 클라우드에도 백업됩니다.'],
    'set.record': ['Record', '기록'],
    'set.recordText': ['{w} victories · {l} defeats · {p} extractions', '승리 {w} · 패배 {l} · 추출 {p}회'],
    'set.controls': ['Controls', '조작'],
    'set.controlsText': ['Click or 1-9 to play a card · E to end the turn · Space or Enter to advance dialogue · Esc to skip a scene', '클릭 또는 1~9 키로 카드 사용 · E 키로 턴 종료 · Space 또는 Enter로 대화 넘기기 · Esc로 장면 건너뛰기'],
    'set.language': ['Language', '언어'],
    'set.languageText': ['The game is shown in English.', '게임이 한국어로 표시됩니다.'],
    'set.login': ['Google Login', 'Google 로그인'],
    'set.push': ['Save Cloud', '클라우드 저장'],
    'set.logout': ['Logout', '로그아웃'],
    'set.prologue': ['Replay Prologue', '프롤로그 다시 보기'],
    'set.reset': ['Reset Progress', '진행 초기화'],
    'set.resetTitle': ['Reset all progress?', '모든 진행을 초기화할까요?'],
    'set.resetText': ['Your deck, collection, points and story progress will be erased. This cannot be undone.', '덱, 수집한 카드, 포인트, 이야기 진행이 모두 지워집니다. 되돌릴 수 없습니다.'],
    'set.resetOk': ['Erase everything', '모두 지우기'],
    'set.resetDone': ['Progress reset. A new journey begins.', '진행을 초기화했습니다. 새로운 여정이 시작됩니다.'],
    'cloud.signedIn': ['Signed in as {name}.', '{name} 계정으로 로그인했습니다.'],
    'cloud.loaded': ['Cloud save loaded.', '클라우드 저장을 불러왔습니다.'],
    'cloud.unavailable': ['Cloud save is unavailable right now. Progress is still saved in this browser.', '지금은 클라우드 저장을 쓸 수 없습니다. 진행 상황은 이 브라우저에 계속 저장됩니다.'],
    'cloud.cancelled': ['Login cancelled.', '로그인을 취소했습니다.'],
    'cloud.failed': ['Login failed. Check your connection.', '로그인에 실패했습니다. 연결을 확인하세요.'],
    'cloud.loggedOut': ['Logged out safely.', '안전하게 로그아웃했습니다.'],
    'cloud.logoutFailed': ['Logout failed.', '로그아웃에 실패했습니다.'],
    'cloud.synced': ['Cloud synchronization complete.', '클라우드 동기화를 마쳤습니다.'],
    'cloud.syncFailed': ['Cloud sync failed.', '클라우드 동기화에 실패했습니다.'],
    'cloud.readFailed': ['Could not read your cloud save.', '클라우드 저장을 읽지 못했습니다.'],

    /* ---------- cards ---------- */
    'type.attack': ['Attack', '공격'],
    'type.skill': ['Skill', '스킬'],
    'type.power': ['Power', '파워'],
    'type.status': ['Status', '상태'],
    'rarity.B': ['Basic', '기본'],
    'rarity.C': ['Common', '일반'],
    'rarity.U': ['Uncommon', '고급'],
    'rarity.R': ['Rare', '희귀'],
    'rarity.E': ['Epic', '영웅'],
    'rarity.L': ['Legendary', '전설'],
    'rarity.S': ['Status', '상태'],
    'rarity.X': ['Story', '이야기'],
    'card.unknown': ['Unknown Concept', '알 수 없는 개념'],
    'card.lockedHint': ['Extract it in the Before-Pick.', '개념 추출에서 얻을 수 있습니다.'],
    'card.powerTip': ['Power: stays active for the rest of the battle.', '파워: 이번 전투가 끝날 때까지 효과가 유지됩니다.']
  };

  /* Pick the Korean particle that fits the last syllable of a word. */
  function josa(word, spec) {
    const [withFinal, noFinal] = spec.split('/');
    const ch = String(word).trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return word + noFinal;
    const fin = (code - 0xac00) % 28;
    if (withFinal === '으로') return word + (fin === 0 || fin === 8 ? '로' : '으로');
    return word + (fin ? withFinal : noFinal);
  }

  function loc(v) {
    if (!Array.isArray(v)) return v;
    return lang === 'ko' && v[1] !== undefined && v[1] !== null ? v[1] : v[0];
  }

  function tr(key, vars) {
    const e = S[key];
    let s = e ? loc(e) : key;
    if (vars) {
      s = s.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (m, k, particle) => {
        if (!(k in vars)) return m;
        const val = String(vars[k]);
        return particle && lang === 'ko' ? josa(val, particle) : val;
      });
    }
    return s;
  }

  function detect() {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    return String(list[0] || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }

  /* Fill text, tooltips and labels written in the HTML with data-i18n attributes. */
  function applyStatic(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-tip]').forEach((el) => el.setAttribute('data-tip', tr(el.dataset.i18nTip)));
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', tr(el.dataset.i18nAria)));
    document.documentElement.lang = lang;
    document.title = tr('doc.title');
  }

  function init(saved) {
    lang = SUPPORTED.includes(saved) ? saved : detect();
    applyStatic();
  }

  function setLang(l) {
    if (!SUPPORTED.includes(l) || l === lang) return false;
    lang = l;
    applyStatic();
    listeners.forEach((fn) => { try { fn(lang); } catch (e) { console.error(e); } });
    return true;
  }

  return { init, setLang, tr, loc, josa, applyStatic, detect, on: (fn) => listeners.push(fn), get lang() { return lang; } };
})();

const tr = I18N.tr;
const loc = I18N.loc;
