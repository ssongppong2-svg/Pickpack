/* pickpack - story, chapters and dialogue.
 * Line modes:
 *   (default)  dialogue box with speaker portrait
 *   'center'   narration in large centered type
 *   'title'    chapter title card
 *   'whisper'  a disembodied voice in large italic type
 * fx: 'flash' | 'shake' | 'glitch' */
'use strict';

const Speakers = {
  narrator:    { name: '', portrait: null },
  picker:      { name: 'Picker', portrait: 'p_picker' },
  lumen:       { name: 'Lumen', portrait: 'p_lumen' },
  warden:      { name: 'Warden of Oblivion', portrait: 'p_warden' },
  choir:       { name: 'The Hollow Choir', portrait: 'p_choir' },
  fracture:    { name: 'The Fracture', portrait: 'p_fracture' },
  singularity: { name: 'The Singularity', portrait: 'p_singularity' },
  void:        { name: 'VOID', portrait: 'p_void' }
};

const Chapters = [
  {
    code: 'Phase 01', name: 'Threshold of Oblivion', boss: 'warden', backdrop: 'threshold', reward: 300,
    desc: 'A faint whisper of the void echoes through the gateway.',
    hint: 'The Warden hits softly, but its Forget floods your draw pile with Static. Strike fast and keep your hand clean.',
    odds: { C: 60, U: 30, R: 10 },
    intro: [
      { mode: 'title', sub: 'Phase 01', t: 'Threshold of Oblivion' },
      { s: 'void', mode: 'whisper', t: 'Seek it... Erase it...' },
      { s: 'picker', t: 'Who said that?' },
      { s: 'lumen', t: 'The Void itself. It speaks through every Phase. Do not listen too closely.' },
      { s: 'warden', t: 'Another spark crawls out of the Sanctuary. How quaint.', fx: 'flash' },
      { s: 'warden', t: 'I am the Warden of Oblivion. All who pass this gate are forgotten. Their names. Their faces. Their reasons.' },
      { s: 'lumen', t: 'Watch the sign above it, Picker. It shows what the Warden will do next. Spend your Energy on cards, then end your turn.' },
      { s: 'lumen', t: 'And beware its Forget. It clogs your mind with Static.' },
      { s: 'picker', t: 'Then let\'s see which of us forgets the other.' }
    ],
    outro: [
      { s: 'warden', t: 'Impossible... I can... remember... the color of the gate...' },
      { mode: 'center', t: 'The Warden dissolves into a soft grey mist. Where it stood, the gate is no longer black.', act: 'fade' },
      { s: 'lumen', t: 'Grey. Do you see it? Grey means something is coming back.' },
      { s: 'picker', t: 'It said it remembered. Was it... someone, once?' },
      { s: 'lumen', t: 'Every guardian was a concept once. The Void does not create. It only twists what already exists.' },
      { s: 'lumen', t: 'Rest, and choose well. The next Phase is quieter. That is not a kindness.' }
    ]
  },
  {
    code: 'Phase 02', name: 'Abyssal Silence', boss: 'choir', backdrop: 'silence', reward: 400,
    desc: 'A deep, profound darkness looms where light ceases to register.',
    hint: 'The Choir seals one card in your hand every turn and grows louder with each Requiem. Cheap cards keep your voice alive.',
    odds: { C: 45, U: 35, R: 17, E: 3 },
    intro: [
      { mode: 'title', sub: 'Phase 02', t: 'Abyssal Silence' },
      { mode: 'center', t: 'Here, even thoughts make no sound.' },
      { s: 'choir', mode: 'whisper', t: 'Isolation consumes me...' },
      { s: 'choir', t: 'We were a thousand voices once. Now we sing only silence.' },
      { s: 'choir', t: 'Lay down your noise, little Picker. Join us.' },
      { s: 'lumen', t: 'The Choir seals one concept in your hand every turn. You cannot play what has been silenced.' },
      { s: 'lumen', t: 'Carry more than you need. When one card goes quiet, another must speak.' },
      { s: 'picker', t: 'A song without sound is still a song. I\'ll remind you how it goes.' }
    ],
    outro: [
      { s: 'choir', t: '...a note. We heard... a note...' },
      { mode: 'center', t: 'The Choir falls silent, but it is a different silence now. A resting one.', act: 'fade' },
      { s: 'lumen', t: 'Harmony. That was its concept, before the Void taught it to hush.' },
      { s: 'picker', t: 'Something is changing in the Sanctuary, Lumen. The walls... they hum.' },
      { s: 'lumen', t: 'Because the world is starting to remember. And the Void has noticed.' },
      { s: 'void', mode: 'whisper', t: '...unacceptable...', fx: 'glitch' },
      { s: 'lumen', t: 'The next Phase is the Fracture. Reality breaks strangely there. Expect the rules to bend.' }
    ]
  },
  {
    code: 'Phase 03', name: 'Fracture of Reality', boss: 'fracture', backdrop: 'fracture', reward: 500,
    desc: 'CRITICAL ALERT: Space-time structures are collapsing. Chaotic code pattern detected.',
    hint: 'The Fracture scrambles your costs and follows Corrupt with Overclock. When its frame cracks, be ready to override it.',
    odds: { C: 35, U: 38, R: 20, E: 6, L: 1 },
    intro: [
      { mode: 'title', sub: 'Phase 03', t: 'Fracture of Reality' },
      { mode: 'center', t: 'CRITICAL ALERT: Space-time structures are collapsing.', fx: 'glitch' },
      { s: 'fracture', t: 'UNAUTHORIZED CONCEPT DETECTED. INITIATING DELETION.', fx: 'glitch' },
      { s: 'picker', t: 'It sounds like... a machine.' },
      { s: 'lumen', t: 'Its code is unstable. The costs of your concepts will shift every turn. Sometimes that will hurt you. Sometimes it will not.' },
      { s: 'lumen', t: 'Listen carefully. If its frame cracks, there will be a moment to override it. When that moment comes, strike with everything you have.' },
      { s: 'fracture', t: 'PREDICTION: YOU WILL LOSE. CONFIDENCE: 99.9%.' },
      { s: 'picker', t: 'I like those odds.' }
    ],
    outro: [
      { s: 'fracture', t: 'REBOOT... FAILED... what... what was I, before...' },
      { s: 'lumen', t: 'A lens. You were Clarity. You let us see things as they are.' },
      { s: 'fracture', t: '...clarity... yes... I see... you...' },
      { mode: 'center', t: 'The shards settle, and for one moment everything is sharp and clear.', act: 'fade' },
      { s: 'picker', t: 'Two Phases left.' },
      { s: 'lumen', t: 'The Singularity waits next. Its pull grows stronger with every breath. Do not let the fight drag on.' }
    ]
  },
  {
    code: 'Phase 04', name: 'Singularity Center', boss: 'singularity', backdrop: 'singularity', reward: 650,
    desc: 'A colossal event horizon consuming all structural properties.',
    hint: 'The Singularity gains strength every turn. When it starts Collapsing Inward, raise every Shield you have.',
    odds: { C: 25, U: 40, R: 25, E: 8, L: 2 },
    intro: [
      { mode: 'title', sub: 'Phase 04', t: 'Singularity Center' },
      { mode: 'center', t: 'A colossal event horizon, consuming all structural properties.' },
      { s: 'singularity', t: 'All things fall. All things end here. You are simply late.', fx: 'shake' },
      { s: 'lumen', t: 'It grows heavier every turn. And when it gathers itself, it will unleash the Event Horizon.' },
      { s: 'lumen', t: 'When you see it charging, raise every Shield you have.' },
      { s: 'picker', t: 'Gravity pulls everything in. That means it has to hold on to all of it.' },
      { s: 'picker', t: 'Let\'s see if it can hold on to me.' }
    ],
    outro: [
      { s: 'singularity', t: 'The weight... it is lifting... I can see... stars...' },
      { mode: 'center', t: 'Light, trapped for an age, spills out of the collapsing core. It is warm.', act: 'fade' },
      { s: 'lumen', t: 'It was Gravity. The concept that holds worlds together. The Void made it a prison.' },
      { s: 'picker', t: 'One Phase left.' },
      { s: 'lumen', t: 'The Horizon of Non-Existence. The Void itself waits there.' },
      { s: 'lumen', t: 'Picker... whatever happens beyond that horizon, thank you. For remembering us.' },
      { s: 'picker', t: 'Save it for after, Lumen. We\'re going home.' }
    ]
  },
  {
    code: 'Final Phase', name: 'Horizon of Non-Existence', boss: 'void', backdrop: 'horizon', reward: 1000,
    desc: 'The ultimate trial separating complete presence from absolute nothingness.',
    hint: 'The VOID wields every guardian\'s power. At half strength it becomes something worse. Keep your strongest cards for that moment.',
    odds: { C: 15, U: 40, R: 30, E: 12, L: 3 },
    intro: [
      { mode: 'title', sub: 'Final Phase', t: 'Horizon of Non-Existence' },
      { mode: 'center', t: 'The ultimate trial, separating complete presence from absolute nothingness.' },
      { s: 'void', t: 'So. The last spark reaches the edge of everything.', fx: 'flash' },
      { s: 'void', t: 'Why resist? Nothing is peaceful. Nothing is quiet. Nothing never hurts.' },
      { s: 'picker', t: 'Nothing never laughs, either. Never sings. Never burns.' },
      { s: 'picker', t: 'I\'ll take the hurt.' },
      { s: 'void', t: 'Then be erased with the rest.', fx: 'shake' },
      { s: 'lumen', t: 'It will use the power of every guardian you freed. Stay sharp, Picker. I am with you.' }
    ],
    outro: []
  }
];

const Story = {
  prologue: {
    backdrop: 'sanctuary', boss: null,
    lines: [
      { mode: 'center', t: 'Once, reality was painted in concepts.' },
      { mode: 'center', t: 'Flame had warmth. Light had meaning. Every idea had a shape.' },
      { mode: 'center', t: 'Then the Void came. It did not burn the world. It simply... forgot it.' },
      { mode: 'center', t: 'Color faded first. Then sound. Then names.' },
      { s: 'lumen', t: '...Can you hear me? Good. Stay with my voice.' },
      { s: 'picker', t: 'Where... am I? I can\'t remember anything.' },
      { s: 'lumen', t: 'No one can, anymore. You are in the Sanctuary of Concepts, the last place the Void has not reached.' },
      { s: 'lumen', t: 'I am Lumen, its keeper. And you, I think, are a Picker.' },
      { s: 'picker', t: 'A Picker?' },
      { s: 'lumen', t: 'One who can reach into the Pack of all things, pick a concept, and project it into reality. Fire. Frost. Light. Each one a card in your hand.' },
      { s: 'lumen', t: 'The Void has sealed the world behind five Phases. Each is held by a guardian it has twisted to its will.' },
      { s: 'lumen', t: 'Break the five Phases, and reality will remember itself.' },
      { s: 'picker', t: 'And if I fail?' },
      { s: 'lumen', t: 'Then there will be no one left to remember that we existed at all.' },
      { s: 'picker', t: '...Then I won\'t fail.' },
      { s: 'lumen', t: 'I have gathered what Concept Points I could. Use the Before-Pick to extract new concepts, shape your deck in the Archive, then step through the Threshold.' }
    ]
  },

  epilogue: {
    backdrop: 'dawn', boss: 'void',
    lines: [
      { s: 'void', t: 'Why... do you... still shine...' },
      { s: 'picker', t: 'Because someone gave me their light. And I picked it.' },
      { mode: 'center', t: 'The Horizon cracked like dawn.', fx: 'flash', act: 'dawn' },
      { mode: 'center', t: 'Color returned. Not all at once, but the way a memory does. Slowly. Then all at once.' },
      { s: 'picker', t: 'Lumen? Lumen, where are you?' },
      { s: 'lumen', t: '...Still here. A little dimmer. But here.' },
      { s: 'lumen', t: 'Look around you, Picker. The Warden\'s gate. The Choir\'s song. Clarity. Gravity. They are all waking up.' },
      { s: 'picker', t: 'And the Void?' },
      { s: 'lumen', t: 'Even nothing has a place in the world. At the edges. Between the stars. Where it belongs.' },
      { s: 'lumen', t: 'You did it. Reality remembers itself.' },
      { mode: 'title', sub: 'Thank you for playing', t: 'pickpack' },
      { mode: 'center', t: 'The Sanctuary stays open. Every Phase can be revisited to train and gather Concept Points.' }
    ]
  },

  events: {
    override: [
      { s: 'fracture', t: 'FRAME INTEGRITY 60%... 59%... 58%...', fx: 'glitch' },
      { s: 'lumen', t: 'Now, Picker! Its frame is exposed. Override it!' }
    ],
    overrideWin: [
      { s: 'fracture', t: 'D... DAMN IT... THIS ANOMALOUS OVERRIDE PATTERN... MY FRAME IS COLLAPSING!!', fx: 'shake' }
    ],
    overrideLose: [
      { s: 'fracture', t: 'PATCH APPLIED. NICE TRY, SPARK.', fx: 'glitch' }
    ],
    phase2: [
      { s: 'void', t: 'ENOUGH.', fx: 'shake' },
      { s: 'void', t: 'I will unmake the very concept of you.' },
      { s: 'lumen', t: 'Picker! Take my light. All of it!', fx: 'flash' },
      { s: 'picker', t: 'Lumen, no! You\'ll fade!' },
      { s: 'lumen', t: 'Light is meant to be given away. Now shine!' }
    ]
  },

  defeat: [
    'Every concept you lost is still in the Pack. Pick again.',
    'The Void wins nothing by waiting. Neither do we. Try a different deck.',
    'Rest. Extract. Return. The Phase is not going anywhere.',
    'Even light has to flicker before it holds steady.',
    'Look at what it did to you, and what it did before that. Its pattern is its weakness.'
  ],

  postgame: 'The Void is at peace. Revisit any Phase to train, or extract new concepts from the Pack.'
};
