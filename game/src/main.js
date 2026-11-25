// Golden Ladle — boot and game loop: fixed 60 Hz steps, title / play / over
// screens, click-to-move, pause and mute, and the ?shot= scenes the maker
// screenshots from. The world does the rules; this file only drives it.
import { STEP, STATIONS, VIEW } from './config.js';
import {
  EVENT_BURNT, EVENT_MISSED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG,
  createWorld, resetWorld, stepWorld,
} from './world.js';
import { createInput, stationAt } from './input.js';
import { drawFrame } from './render.js';
import { createAudio } from './audio.js';
import { stageShot, stageTitle } from './shots.js';
import { createAutopilot } from './autopilot.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || '7');

const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(seedParam);
let demo = stageTitle(world);
const demoPilot = createAutopilot();
let paused = false;
let prevChops = 0;
let prevCooks = 0;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function startShift() {
  audio.unlock();
  audio.startMusic();
  resetWorld(world, (Date.now() % 100000) + 1);
  prevChops = 0;
  prevCooks = 0;
  paused = false;
}

function handleSounds(events) {
  if (events & EVENT_SERVED) audio.coin();
  if (events & EVENT_MISSED) audio.miss();
  if (events & EVENT_WRONG) audio.error();
  if (events & EVENT_BURNT) audio.error();
  if (world.stats.chops > prevChops) audio.chop();
  if (world.stats.cooks > prevCooks) audio.ding();
  prevChops = world.stats.chops;
  prevCooks = world.stats.cooks;
  if (world.rushAnnounced) {
    audio.rush();
    world.rushAnnounced = false;
  }
  if (events & EVENT_OVER) audio.stopMusic();
}

function handleClick(click) {
  if (world.mode === 'title') { startShift(); return; }
  if (world.mode === 'over') { startShift(); return; }
  const station = stationAt(click.x, click.y);
  if (station) {
    // The pantry's spot follows the clicked bin; every other station has one
    // fixed spot in front of its counter (see config.js).
    const spot = station === 'pantry'
      ? { x: click.x, y: STATIONS.pantry.spot.y }
      : { x: STATIONS[station].spot.x, y: STATIONS[station].spot.y };
    world.clickTarget = { x: spot.x, y: spot.y, station };
    world.clickRoute = null;
  } else {
    world.clickTarget = { x: click.x, y: Math.max(300, Math.min(696, click.y)) };
    world.clickRoute = null;
  }
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  input.poll();
  if (input.pausePressed && world.mode === 'play') paused = !paused;
  if (input.mutePressed) audio.toggleMute();
  if (input.restartPressed && world.mode !== 'title') startShift();
  if (input.click) handleClick(input.click);

  if (world.mode === 'title') {
    // The demo kitchen behind the title keeps cooking on its own.
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      if (demo.mode !== 'play') demo = stageTitle(world);
      stepWorld(demo, demoPilot(demo), STEP);
    }
    input.consumeEdges();
  }
  if (world.mode === 'play' && !paused) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      const events = stepWorld(world, input, STEP);
      handleSounds(events);
      input.consumeEdges();
    }
  } else {
    input.consumeEdges();
  }
  drawFrame(ctx, world.mode === 'title' ? demo : world, paused);
  requestAnimationFrame(frame);
}

// Exposed for play-testing from the console and the screenshot driver.
window.__game = { world, demo, startShift };

// --- Screenshot scenes: one frozen frame of real play, no live loop. ---------
if (shotName) {
  stageShot(shotName, world);
  document.title = `Golden Ladle — shot ${shotName}`;
  drawFrame(ctx, world, false);
  // A second paint once fonts settle, so the frame is exactly what ships.
  requestAnimationFrame(() => drawFrame(ctx, world, false));
} else {
  // Title screen: the demo world is the backdrop; the player starts the shift.
  world.mode = 'title';
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && world.mode === 'title') startShift();
    if (event.code === 'Enter' && world.mode === 'over') startShift();
    if (event.code === 'KeyE' && world.mode === 'title') startShift();
    if (event.code === 'Space' && world.mode === 'title') { startShift(); event.preventDefault(); }
  });
  requestAnimationFrame(frame);
}
