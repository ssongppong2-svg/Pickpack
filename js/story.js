/* pickpack - story, chapters and dialogue.
 * Every line of text is an [English, Korean] pair.
 * Line modes:
 *   (default)  dialogue box with speaker portrait
 *   'center'   narration in large centered type
 *   'title'    chapter title card
 *   'whisper'  a disembodied voice in large italic type
 * fx: 'flash' | 'shake' | 'glitch'    act: 'fade' (boss dissolves) | 'dawn' (color returns) */
'use strict';

const Speakers = {
  narrator:    { name: ['', ''], portrait: null },
  picker:      { name: ['Picker', '선택자'], portrait: 'p_picker' },
  lumen:       { name: ['Lumen', '루멘'], portrait: 'p_lumen' },
  warden:      { name: ['Warden of Oblivion', '망각의 문지기'], portrait: 'p_warden' },
  choir:       { name: ['The Hollow Choir', '텅 빈 성가대'], portrait: 'p_choir' },
  fracture:    { name: ['The Fracture', '균열체'], portrait: 'p_fracture' },
  singularity: { name: ['The Singularity', '특이점'], portrait: 'p_singularity' },
  void:        { name: ['VOID', '공허'], portrait: 'p_void' }
};

const Chapters = [
  {
    code: ['Phase 01', '제1관문'], name: ['Threshold of Oblivion', '망각의 문턱'], boss: 'warden', backdrop: 'threshold', reward: 300,
    desc: ['A faint whisper of the void echoes through the gateway.', '관문 너머로 공허의 희미한 속삭임이 울려 퍼진다.'],
    hint: ['The Warden hits softly, but its Forget floods your draw pile with Static. Strike fast and keep your hand clean.', '문지기의 공격은 약하지만, 망각으로 뽑을 카드 더미를 잡음으로 채워요. 빠르게 몰아붙이세요.'],
    odds: { C: 60, U: 30, R: 10 },
    intro: [
      { mode: 'title', sub: ['Phase 01', '제1관문'], t: ['Threshold of Oblivion', '망각의 문턱'] },
      { s: 'void', mode: 'whisper', t: ['Seek it... Erase it...', '찾아라... 지워라...'] },
      { s: 'picker', t: ['Who said that?', '방금 누구죠?'] },
      { s: 'lumen', t: ['The Void itself. It speaks through every Phase. Do not listen too closely.', '공허 그 자체예요. 모든 관문을 통해 말을 걸어오죠. 너무 귀 기울이지 마세요.'] },
      { s: 'warden', t: ['Another spark crawls out of the Sanctuary. How quaint.', '성소에서 불씨가 또 하나 기어 나왔군. 가소롭구나.'], fx: 'flash' },
      { s: 'warden', t: ['I am the Warden of Oblivion. All who pass this gate are forgotten. Their names. Their faces. Their reasons.', '나는 망각의 문지기. 이 문을 지나는 자는 모두 잊힌다. 이름도, 얼굴도, 이유도.'] },
      { s: 'lumen', t: ['Watch the sign above it, Picker. It shows what the Warden will do next. Spend your Energy on cards, then end your turn.', '선택자, 저것의 머리 위를 보세요. 문지기가 다음에 무엇을 할지 보여 주고 있어요. 에너지로 카드를 사용한 뒤 턴을 끝내면 돼요.'] },
      { s: 'lumen', t: ['And beware its Forget. It clogs your mind with Static.', '그리고 망각을 조심하세요. 당신의 머릿속을 잡음으로 막아 버리니까요.'] },
      { s: 'picker', t: ['Then let\'s see which of us forgets the other.', '그럼 누가 누굴 잊게 될지 보자고.'] }
    ],
    outro: [
      { s: 'warden', t: ['Impossible... I can... remember... the color of the gate...', '말도 안 돼... 기억이... 난다... 이 문의... 색이...'] },
      { mode: 'center', t: ['The Warden dissolves into a soft grey mist. Where it stood, the gate is no longer black.', '문지기는 부드러운 잿빛 안개가 되어 흩어졌다. 그것이 서 있던 자리의 문은 더 이상 검지 않았다.'], act: 'fade' },
      { s: 'lumen', t: ['Grey. Do you see it? Grey means something is coming back.', '잿빛이에요. 보이나요? 잿빛이라는 건 무언가가 돌아오고 있다는 뜻이에요.'] },
      { s: 'picker', t: ['It said it remembered. Was it... someone, once?', '기억이 난다고 했어요. 저것도 한때는... 누군가였던 걸까요?'] },
      { s: 'lumen', t: ['Every guardian was a concept once. The Void does not create. It only twists what already exists.', '모든 수호자는 한때 개념이었어요. 공허는 아무것도 만들어 내지 못해요. 이미 있는 것을 비틀 뿐이죠.'] },
      { s: 'lumen', t: ['Rest, and choose well. The next Phase is quieter. That is not a kindness.', '쉬면서 잘 골라 두세요. 다음 관문은 더 조용해요. 그게 결코 친절은 아니지만요.'] }
    ]
  },
  {
    code: ['Phase 02', '제2관문'], name: ['Abyssal Silence', '심연의 침묵'], boss: 'choir', backdrop: 'silence', reward: 400,
    desc: ['A deep, profound darkness looms where light ceases to register.', '빛조차 닿지 않는 곳에 깊고 아득한 어둠이 드리운다.'],
    hint: ['The Choir seals one card in your hand every turn and grows louder with each Requiem. Cheap cards keep your voice alive.', '성가대는 매 턴 손패 한 장을 봉인하고, 진혼곡을 부를 때마다 강해져요. 비용이 낮은 카드가 당신의 목소리를 지켜 줄 거예요.'],
    odds: { C: 45, U: 35, R: 17, E: 3 },
    intro: [
      { mode: 'title', sub: ['Phase 02', '제2관문'], t: ['Abyssal Silence', '심연의 침묵'] },
      { mode: 'center', t: ['Here, even thoughts make no sound.', '이곳에서는 생각조차 소리를 내지 못한다.'] },
      { s: 'choir', mode: 'whisper', t: ['Isolation consumes me...', '고립이 나를 삼킨다...'] },
      { s: 'choir', t: ['We were a thousand voices once. Now we sing only silence.', '우리는 한때 천 개의 목소리였다. 이제는 침묵만을 노래한다.'] },
      { s: 'choir', t: ['Lay down your noise, little Picker. Join us.', '소음을 내려놓으렴, 작은 선택자여. 우리와 함께하자.'] },
      { s: 'lumen', t: ['The Choir seals one concept in your hand every turn. You cannot play what has been silenced.', '성가대는 매 턴 손패의 개념 하나를 봉인해요. 침묵당한 카드는 사용할 수 없어요.'] },
      { s: 'lumen', t: ['Carry more than you need. When one card goes quiet, another must speak.', '필요한 것보다 넉넉히 챙기세요. 한 장이 입을 다물면, 다른 한 장이 말해야 하니까요.'] },
      { s: 'picker', t: ['A song without sound is still a song. I\'ll remind you how it goes.', '소리 없는 노래도 노래야. 그 노래가 어떻게 흘러가는지 다시 알려 주지.'] }
    ],
    outro: [
      { s: 'choir', t: ['...a note. We heard... a note...', '...음이다. 우리는 들었다... 하나의 음을...'] },
      { mode: 'center', t: ['The Choir falls silent, but it is a different silence now. A resting one.', '성가대는 입을 다물었다. 하지만 이제 그것은 다른 침묵이었다. 쉬어 가는 침묵.'], act: 'fade' },
      { s: 'lumen', t: ['Harmony. That was its concept, before the Void taught it to hush.', '화음. 공허가 입을 다무는 법을 가르치기 전, 그것의 개념은 화음이었어요.'] },
      { s: 'picker', t: ['Something is changing in the Sanctuary, Lumen. The walls... they hum.', '루멘, 성소에 뭔가 변화가 생겼어요. 벽이... 울리고 있어요.'] },
      { s: 'lumen', t: ['Because the world is starting to remember. And the Void has noticed.', '세계가 기억하기 시작했으니까요. 그리고 공허도 그걸 알아챘어요.'] },
      { s: 'void', mode: 'whisper', t: ['...unacceptable...', '...용납할 수 없다...'], fx: 'glitch' },
      { s: 'lumen', t: ['The next Phase is the Fracture. Reality breaks strangely there. Expect the rules to bend.', '다음 관문은 균열체가 지키고 있어요. 그곳에서는 현실이 이상하게 부서져요. 규칙이 뒤틀릴 거라고 각오하세요.'] }
    ]
  },
  {
    code: ['Phase 03', '제3관문'], name: ['Fracture of Reality', '현실의 균열'], boss: 'fracture', backdrop: 'fracture', reward: 500,
    desc: ['CRITICAL ALERT: Space-time structures are collapsing. Chaotic code pattern detected.', '치명적 경고: 시공간 구조가 붕괴하고 있습니다. 혼돈의 코드 패턴이 감지되었습니다.'],
    hint: ['The Fracture scrambles your costs and follows Corrupt with Overclock. When its frame cracks, be ready to override it.', '균열체는 카드 비용을 뒤섞고, 오염 다음에는 오버클럭을 써요. 몸체에 금이 가면 강제 개입할 준비를 하세요.'],
    odds: { C: 35, U: 38, R: 20, E: 6, L: 1 },
    intro: [
      { mode: 'title', sub: ['Phase 03', '제3관문'], t: ['Fracture of Reality', '현실의 균열'] },
      { mode: 'center', t: ['CRITICAL ALERT: Space-time structures are collapsing.', '치명적 경고: 시공간 구조가 붕괴하고 있습니다.'], fx: 'glitch' },
      { s: 'fracture', t: ['UNAUTHORIZED CONCEPT DETECTED. INITIATING DELETION.', '미승인 개념 감지. 삭제를 개시한다.'], fx: 'glitch' },
      { s: 'picker', t: ['It sounds like... a machine.', '꼭... 기계 같은 목소리네요.'] },
      { s: 'lumen', t: ['Its code is unstable. The costs of your concepts will shift every turn. Sometimes that will hurt you. Sometimes it will not.', '저것의 코드는 불안정해요. 당신의 개념 비용이 매 턴 바뀔 거예요. 불리할 때도 있고, 아닐 때도 있겠죠.'] },
      { s: 'lumen', t: ['Listen carefully. If its frame cracks, there will be a moment to override it. When that moment comes, strike with everything you have.', '잘 들어요. 저것의 몸체에 금이 가면, 강제로 개입할 틈이 생길 거예요. 그 순간이 오면 가진 모든 걸 쏟아부으세요.'] },
      { s: 'fracture', t: ['PREDICTION: YOU WILL LOSE. CONFIDENCE: 99.9%.', '예측: 너는 패배한다. 신뢰도: 99.9%.'] },
      { s: 'picker', t: ['I like those odds.', '나쁘지 않은 확률이네.'] }
    ],
    outro: [
      { s: 'fracture', t: ['REBOOT... FAILED... what... what was I, before...', '재부팅... 실패... 나는... 나는 원래 무엇이었지...'] },
      { s: 'lumen', t: ['A lens. You were Clarity. You let us see things as they are.', '렌즈였어요. 당신은 명료함이었죠. 우리가 세상을 있는 그대로 볼 수 있게 해 주던.'] },
      { s: 'fracture', t: ['...clarity... yes... I see... you...', '...명료함... 그래... 보인다... 네가...'] },
      { mode: 'center', t: ['The shards settle, and for one moment everything is sharp and clear.', '파편들이 가라앉고, 한순간 모든 것이 선명하고 또렷해졌다.'], act: 'fade' },
      { s: 'picker', t: ['Two Phases left.', '이제 관문 두 개 남았어요.'] },
      { s: 'lumen', t: ['The Singularity waits next. Its pull grows stronger with every breath. Do not let the fight drag on.', '다음은 특이점이에요. 숨을 쉴 때마다 끌어당기는 힘이 강해지죠. 싸움을 오래 끌지 마세요.'] }
    ]
  },
  {
    code: ['Phase 04', '제4관문'], name: ['Singularity Center', '특이점 중심부'], boss: 'singularity', backdrop: 'singularity', reward: 650,
    desc: ['A colossal event horizon consuming all structural properties.', '모든 구조적 속성을 집어삼키는 거대한 사건의 지평선.'],
    hint: ['The Singularity gains strength every turn. When it starts Collapsing Inward, raise every Shield you have.', '특이점은 매 턴 강해져요. 내부 붕괴를 시작하면 모을 수 있는 방어막을 전부 올리세요.'],
    odds: { C: 25, U: 40, R: 25, E: 8, L: 2 },
    intro: [
      { mode: 'title', sub: ['Phase 04', '제4관문'], t: ['Singularity Center', '특이점 중심부'] },
      { mode: 'center', t: ['A colossal event horizon, consuming all structural properties.', '모든 구조적 속성을 집어삼키는 거대한 사건의 지평선.'] },
      { s: 'singularity', t: ['All things fall. All things end here. You are simply late.', '모든 것은 떨어진다. 모든 것은 이곳에서 끝난다. 너는 그저 늦었을 뿐.'], fx: 'shake' },
      { s: 'lumen', t: ['It grows heavier every turn. And when it gathers itself, it will unleash the Event Horizon.', '저것은 턴마다 더 무거워져요. 그리고 힘을 모으고 나면 사건의 지평선을 터뜨릴 거예요.'] },
      { s: 'lumen', t: ['When you see it charging, raise every Shield you have.', '힘을 모으는 게 보이면, 가진 방어막을 전부 올리세요.'] },
      { s: 'picker', t: ['Gravity pulls everything in. That means it has to hold on to all of it.', '중력은 모든 걸 끌어당기죠. 그 말은, 끌어당긴 걸 전부 붙잡고 있어야 한다는 뜻이고요.'] },
      { s: 'picker', t: ['Let\'s see if it can hold on to me.', '나까지 붙잡아 둘 수 있는지 보자.'] }
    ],
    outro: [
      { s: 'singularity', t: ['The weight... it is lifting... I can see... stars...', '무게가... 걷히고 있다... 별이... 보인다...'] },
      { mode: 'center', t: ['Light, trapped for an age, spills out of the collapsing core. It is warm.', '오랜 세월 갇혀 있던 빛이 무너지는 핵에서 흘러넘친다. 따뜻하다.'], act: 'fade' },
      { s: 'lumen', t: ['It was Gravity. The concept that holds worlds together. The Void made it a prison.', '저건 중력이었어요. 세계를 하나로 붙들어 주던 개념. 공허가 그걸 감옥으로 만들어 버렸죠.'] },
      { s: 'picker', t: ['One Phase left.', '이제 관문 하나 남았어요.'] },
      { s: 'lumen', t: ['The Horizon of Non-Existence. The Void itself waits there.', '비존재의 지평선. 그곳에서 공허 그 자체가 기다리고 있어요.'] },
      { s: 'lumen', t: ['Picker... whatever happens beyond that horizon, thank you. For remembering us.', '선택자... 저 지평선 너머에서 무슨 일이 일어나든, 고마워요. 우리를 기억해 줘서.'] },
      { s: 'picker', t: ['Save it for after, Lumen. We\'re going home.', '그 말은 나중에 해요, 루멘. 우린 집에 갈 거니까.'] }
    ]
  },
  {
    code: ['Final Phase', '마지막 관문'], name: ['Horizon of Non-Existence', '비존재의 지평선'], boss: 'void', backdrop: 'horizon', reward: 1000,
    desc: ['The ultimate trial separating complete presence from absolute nothingness.', '완전한 존재와 절대적인 무를 가르는 최후의 시험.'],
    hint: ['The VOID wields every guardian\'s power. At half strength it becomes something worse. Keep your strongest cards for that moment.', '공허는 모든 수호자의 힘을 휘둘러요. 힘이 절반으로 줄면 더 끔찍한 무언가로 변하죠. 가장 강한 카드는 그 순간을 위해 아껴 두세요.'],
    odds: { C: 15, U: 40, R: 30, E: 12, L: 3 },
    intro: [
      { mode: 'title', sub: ['Final Phase', '마지막 관문'], t: ['Horizon of Non-Existence', '비존재의 지평선'] },
      { mode: 'center', t: ['The ultimate trial, separating complete presence from absolute nothingness.', '완전한 존재와 절대적인 무를 가르는 최후의 시험.'] },
      { s: 'void', t: ['So. The last spark reaches the edge of everything.', '그래. 마지막 불씨가 모든 것의 끝자락에 닿았구나.'], fx: 'flash' },
      { s: 'void', t: ['Why resist? Nothing is peaceful. Nothing is quiet. Nothing never hurts.', '왜 저항하지? 무는 평화롭다. 무는 고요하다. 무는 결코 아프지 않다.'] },
      { s: 'picker', t: ['Nothing never laughs, either. Never sings. Never burns.', '무는 웃지도 않아. 노래하지도, 타오르지도 않고.'] },
      { s: 'picker', t: ['I\'ll take the hurt.', '난 아픈 쪽을 택하겠어.'] },
      { s: 'void', t: ['Then be erased with the rest.', '그렇다면 나머지와 함께 지워져라.'], fx: 'shake' },
      { s: 'lumen', t: ['It will use the power of every guardian you freed. Stay sharp, Picker. I am with you.', '저것은 당신이 해방한 모든 수호자의 힘을 쓸 거예요. 정신 바짝 차려요, 선택자. 제가 곁에 있어요.'] }
    ],
    outro: []
  }
];

const Story = {
  prologue: {
    backdrop: 'sanctuary', boss: null,
    lines: [
      { mode: 'center', t: ['Once, reality was painted in concepts.', '한때 현실은 개념으로 채색되어 있었다.'] },
      { mode: 'center', t: ['Flame had warmth. Light had meaning. Every idea had a shape.', '불꽃에는 온기가, 빛에는 의미가 있었다. 모든 생각에는 형태가 있었다.'] },
      { mode: 'center', t: ['Then the Void came. It did not burn the world. It simply... forgot it.', '그리고 공허가 찾아왔다. 공허는 세계를 불태우지 않았다. 그저... 잊어버렸을 뿐이다.'] },
      { mode: 'center', t: ['Color faded first. Then sound. Then names.', '가장 먼저 색이 바랬다. 다음은 소리가. 그다음은 이름이.'] },
      { s: 'lumen', t: ['...Can you hear me? Good. Stay with my voice.', '...제 목소리가 들리나요? 다행이에요. 제 목소리에서 멀어지지 마세요.'] },
      { s: 'picker', t: ['Where... am I? I can\'t remember anything.', '여긴... 어디죠? 아무것도 기억나지 않아요.'] },
      { s: 'lumen', t: ['No one can, anymore. You are in the Sanctuary of Concepts, the last place the Void has not reached.', '이제는 아무도 기억하지 못해요. 여기는 개념의 성소, 공허가 아직 닿지 못한 마지막 장소예요.'] },
      { s: 'lumen', t: ['I am Lumen, its keeper. And you, I think, are a Picker.', '저는 이곳을 지키는 루멘이에요. 그리고 당신은... 아마 선택자겠지요.'] },
      { s: 'picker', t: ['A Picker?', '선택자요?'] },
      { s: 'lumen', t: ['One who can reach into the Pack of all things, pick a concept, and project it into reality. Fire. Frost. Light. Each one a card in your hand.', '만물의 꾸러미에 손을 뻗어 개념을 골라내고, 그것을 현실에 투영할 수 있는 사람. 불꽃, 서리, 빛... 그 하나하나가 당신 손의 카드가 되지요.'] },
      { s: 'lumen', t: ['The Void has sealed the world behind five Phases. Each is held by a guardian it has twisted to its will.', '공허는 세계를 다섯 관문 너머에 봉인했어요. 관문마다 공허가 뒤틀어 버린 수호자가 지키고 있고요.'] },
      { s: 'lumen', t: ['Break the five Phases, and reality will remember itself.', '다섯 관문을 모두 돌파하면, 현실은 스스로를 다시 기억해 낼 거예요.'] },
      { s: 'picker', t: ['And if I fail?', '만약 실패하면요?'] },
      { s: 'lumen', t: ['Then there will be no one left to remember that we existed at all.', '그땐 우리가 존재했다는 사실조차 기억해 줄 이가 남지 않겠지요.'] },
      { s: 'picker', t: ['...Then I won\'t fail.', '...그럼 실패하지 않을게요.'] },
      { s: 'lumen', t: ['I have gathered what Concept Points I could. Use the Before-Pick to extract new concepts, shape your deck in the Archive, then step through the Threshold.', '제가 모을 수 있었던 개념 포인트를 드릴게요. 개념 추출에서 새로운 개념을 얻고, 서고에서 덱을 다듬은 뒤, 문턱을 넘어가세요.'] }
    ]
  },

  epilogue: {
    backdrop: 'dawn', boss: 'void',
    lines: [
      { s: 'void', t: ['Why... do you... still shine...', '어째서... 너는... 아직도 빛나는가...'] },
      { s: 'picker', t: ['Because someone gave me their light. And I picked it.', '누군가 내게 자신의 빛을 줬거든. 그리고 난 그걸 선택했어.'] },
      { mode: 'center', t: ['The Horizon cracked like dawn.', '지평선이 새벽처럼 갈라졌다.'], fx: 'flash', act: 'dawn' },
      { mode: 'center', t: ['Color returned. Not all at once, but the way a memory does. Slowly. Then all at once.', '색이 돌아왔다. 한꺼번에가 아니라, 기억이 돌아오는 방식으로. 천천히. 그리고 한순간에.'] },
      { s: 'picker', t: ['Lumen? Lumen, where are you?', '루멘? 루멘, 어디 있어요?'] },
      { s: 'lumen', t: ['...Still here. A little dimmer. But here.', '...여기 있어요. 조금 희미해졌지만, 여기 있어요.'] },
      { s: 'lumen', t: ['Look around you, Picker. The Warden\'s gate. The Choir\'s song. Clarity. Gravity. They are all waking up.', '주위를 봐요, 선택자. 문지기의 문, 성가대의 노래, 명료함, 중력... 모두 깨어나고 있어요.'] },
      { s: 'picker', t: ['And the Void?', '공허는요?'] },
      { s: 'lumen', t: ['Even nothing has a place in the world. At the edges. Between the stars. Where it belongs.', '무에게도 세상에 자리가 있어요. 가장자리에, 별과 별 사이에. 원래 있어야 할 곳에요.'] },
      { s: 'lumen', t: ['You did it. Reality remembers itself.', '당신이 해냈어요. 현실이 스스로를 기억해 냈어요.'] },
      { mode: 'title', sub: ['Thank you for playing', '플레이해 주셔서 감사합니다'], t: ['pickpack', 'pickpack'] },
      { mode: 'center', t: ['The Sanctuary stays open. Every Phase can be revisited to train and gather Concept Points.', '성소는 계속 열려 있습니다. 모든 관문을 다시 찾아 수련하고 개념 포인트를 모을 수 있습니다.'] }
    ]
  },

  events: {
    override: [
      { s: 'fracture', t: ['FRAME INTEGRITY 60%... 59%... 58%...', '몸체 무결성 60%... 59%... 58%...'], fx: 'glitch' },
      { s: 'lumen', t: ['Now, Picker! Its frame is exposed. Override it!', '지금이에요, 선택자! 몸체가 드러났어요. 강제로 개입하세요!'] }
    ],
    overrideWin: [
      { s: 'fracture', t: ['D... DAMN IT... THIS ANOMALOUS OVERRIDE PATTERN... MY FRAME IS COLLAPSING!!', '이... 이럴 수가... 이 비정상적인 개입 패턴은... 내 몸체가 무너지고 있다!!'], fx: 'shake' }
    ],
    overrideLose: [
      { s: 'fracture', t: ['PATCH APPLIED. NICE TRY, SPARK.', '패치 적용 완료. 시도는 좋았다, 불씨.'], fx: 'glitch' }
    ],
    phase2: [
      { s: 'void', t: ['ENOUGH.', '그만.'], fx: 'shake' },
      { s: 'void', t: ['I will unmake the very concept of you.', '너라는 개념 자체를 없애 주마.'] },
      { s: 'lumen', t: ['Picker! Take my light. All of it!', '선택자! 제 빛을 받아요. 전부 다!'], fx: 'flash' },
      { s: 'picker', t: ['Lumen, no! You\'ll fade!', '루멘, 안 돼요! 당신이 사라져 버린다고요!'] },
      { s: 'lumen', t: ['Light is meant to be given away. Now shine!', '빛은 원래 나누라고 있는 거예요. 이제, 빛나세요!'] }
    ]
  },

  defeat: [
    ['Every concept you lost is still in the Pack. Pick again.', '당신이 잃은 개념은 모두 아직 꾸러미 안에 있어요. 다시 골라요.'],
    ['The Void wins nothing by waiting. Neither do we. Try a different deck.', '공허는 기다린다고 얻는 게 없어요. 우리도 마찬가지고요. 다른 덱으로 도전해 봐요.'],
    ['Rest. Extract. Return. The Phase is not going anywhere.', '쉬고, 추출하고, 돌아와요. 관문은 어디 도망가지 않아요.'],
    ['Even light has to flicker before it holds steady.', '빛도 흔들린 뒤에야 비로소 곧게 서는 법이에요.'],
    ['Look at what it did to you, and what it did before that. Its pattern is its weakness.', '저것이 당신에게 무엇을 했는지, 그 전에는 무엇을 했는지 떠올려 봐요. 패턴이 곧 약점이에요.']
  ],

  postgame: ['The Void is at peace. Revisit any Phase to train, or extract new concepts from the Pack.', '공허는 이제 잠잠해요. 어느 관문이든 다시 찾아 수련하거나, 꾸러미에서 새 개념을 추출해 보세요.']
};
