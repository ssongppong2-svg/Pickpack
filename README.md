# pickpack

**Monochrome Reality**: a deck-building card adventure in five Phases.

The Void has erased color, sound and names from the world. You are a *Picker*, the last one
who can reach into the Pack of concepts, pick a card and project it into reality. Guided by
Lumen, keeper of the Sanctuary of Concepts, you break the five Phases held by the Void's
twisted guardians and help reality remember itself.

## How to play

Open `index.html` in a modern browser (double-clicking the file works, no server needed),
or host the folder on any static host such as GitHub Pages.

1. **Before-Pick**: spend Concept Points to extract cards (x1 for 140 p, x10 for 1400 p).
   Every x10 guarantees at least one Epic or higher.
2. **Archive**: build your deck (at least 8 cards). Duplicates become **Echoes**, and Echoes
   **Enhance** a card to `+` and `++`.
3. **Enter Phase**: each turn you draw 5 cards and get 3 Energy. Read the boss's intent above
   its head, then attack, raise Shield, or set up statuses before ending your turn.
4. Winning pays Concept Points and lets you keep 1 of 3 concepts. Losing still recovers
   fragments, so you can rebuild your deck and retry the Phase.

### Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Play a card | Click it (touch: tap to lift, tap again to play) | `1` to `9`, `0` |
| End turn | End Turn button | `E` |
| Advance dialogue | Click anywhere | `Space` / `Enter` |
| Skip a scene | Skip button | `Esc` |
| Keyword and status details | Hover (touch: tap) | |

## The five Phases

| Phase | Guardian | Signature mechanic |
| --- | --- | --- |
| 01 Threshold of Oblivion | Warden of Oblivion | *Forget* shuffles Static into your draw pile |
| 02 Abyssal Silence | The Hollow Choir | *Silence* seals one card in your hand every turn |
| 03 Fracture of Reality | The Fracture | *Distortion* scrambles card costs, plus the SYSTEM OVERRIDE event |
| 04 Singularity Center | The Singularity | *Gravity* grows stronger every turn and charges the Event Horizon |
| Final Horizon of Non-Existence | VOID | Wields every guardian's power, then transforms at half HP |

## Cards

36 unique concept cards across five rarities (Common, Uncommon, Rare, Epic, Legendary), plus
the basic Strike and Guard. Keywords include Shield, Fracture, Dim, Resonance, Ember, Bloom,
Thorns, Stasis, Echo, Exhaust and Retain. Every pictogram is a hand-drawn inline SVG icon;
the game uses no emoji.

## Saving

Progress is saved automatically in the browser (`localStorage`).

Optional Google login and cloud save: fill in your Firebase web config in `js/save.js`
(`firebaseConfig`). While the placeholder values remain, the cloud buttons stay hidden and
the Firebase SDK is never downloaded, so the game also works offline.

## Project structure

```
index.html          screens and overlays
css/base.css        tokens, frame, buttons, modal, title, dialogue
css/cards.css       card faces, rarity frames, card backs
css/screens.css     lobby, archive, before-pick, reward
css/battle.css      battle screen
js/util.js          shared helpers
js/icons.js         SVG icon set
js/cards.js         keywords, rarities, card database, card renderer
js/enemies.js       the five guardians and their intents
js/story.js         chapters, dialogue, prologue and epilogue
js/save.js          local save and optional Firebase cloud save
js/audio.js         synthesized sound effects (WebAudio)
js/fx.js            canvas renderer (battle and story scenes)
js/battle-view.js   battle screen rendering
js/battle.js        battle rules
js/ui.js            screens, toasts, tooltips, modals, dialogue player
js/screens.js       title, lobby, archive, before-pick, rewards, game flow
js/main.js          boot
```
