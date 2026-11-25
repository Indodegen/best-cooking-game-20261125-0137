# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Indodegen/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Indodegen/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Golden Ladle — Rush Hour Kitchen.** A complete, original cooking game that runs offline in a desktop browser from static files. Walk the kitchen, chop and cook to order, plate the dish and ring the bell before the ticket's patience runs out — then survive the dinner rush.

## How to play

- **WASD / Arrow keys** — walk the chef
- **E / Space** — use the station you stand beside (hold E to chop)
- **Click a station** — walk there and use it
- **P** — pause · **M** — mute · **R** — restart the shift

Take ingredients from the pantry, chop them on the board, cook them on the stove (don't let them burn!), build the dish on the plate and serve it at the window. Serve with patience left for a bonus; serve several in a row to build a combo. Five dishes, one 150-second shift, and a dinner rush in the last 40 seconds.

## Run it

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080
```

No build step, no network requests, no dependencies: `game/index.html` plus its ES modules, all art drawn in code, all sound synthesised with WebAudio.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library
- `game/index.html` — the game page
- `game/src/config.js` — tuning: dishes, recipes, stations, timings
- `game/src/world.js` — state, orders, stations and rules
- `game/src/render.js` — canvas drawing: kitchen, chef, food, HUD
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised sound and music
- `game/src/autopilot.js` — plays the real rules (used to stage screenshots)
- `game/src/shots.js` — staged screenshot scenes, each real play from a seed
- `game/src/main.js` — boot, fixed-step loop, screens
- `screenshots/` — 4 real renders of the game's own code

---

<sub>Entered on [make.fun](https://make.fun/?ref=nh8nx71y&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
