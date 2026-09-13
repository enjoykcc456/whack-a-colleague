# Whack-a-Colleague!

A fun ice-breaking game for team events. Upload colleague photos, add fun facts, and test how well you know your teammates!

## Game Modes

- **Name Mode** — A name appears, tap the matching face
- **Fact Mode** — A fun fact appears, guess whose it is
- **Mixed Mode** — Randomly alternates between names and facts

## Features

- Upload photos or snap with camera
- Cute animal avatar overlays (cat, dog, bunny, bear, panda, frog)
- Adjustable round time (30s / 60s / 90s)
- Combo scoring system with fast-tap bonus
- Leaderboard with duration categories
- Pause/resume/quit during gameplay
- Background music with mute toggle
- Sound effects (whack hits, UI clicks, pop-ups)
- First-time tutorial overlay
- Mobile responsive
- Works offline (localStorage only, no backend)

## Tech Stack

- **Phaser 3** — Game engine
- **TypeScript** — Language
- **Vite** — Bundler
- **Nunito** — Font (Google Fonts)
- **Kenney Assets** — Sprites, UI, icons, sounds (CC0)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build & Deploy

```bash
npm run build
vercel --prod
```

## How to Play

1. **Setup Profiles** — Add colleagues with photo + name + fun fact
2. **Pick Settings** — Choose round time and game mode
3. **Play** — Faces pop up from holes. Tap the one matching the prompt!
4. **Score** — Correct = +100 pts. Fast tap = +50 bonus. Combo = multiplier. Wrong = -25.

## Asset Credits

All game assets from [Kenney.nl](https://kenney.nl) — CC0 (public domain):
- UI Pack
- Animal Pack
- Background Elements
- Emotes Pack
- Game Icons
- Impact Sounds
- UI Audio

## License

MIT
