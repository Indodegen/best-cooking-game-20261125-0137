// Staged screenshot scenes: each one plays the real rules forward from a fresh
// world for a fixed number of seconds, steered by the autopilot, so the frame
// is what a short game really looks like and the same seed always gives the
// same frame. No scene is posed by hand.
import { STEP } from './config.js';
import { createWorld, resetWorld, stepWorld, EVENT_SERVED } from './world.js';
import { createAutopilot } from './autopilot.js';

// name: seconds of real play the autopilot gets before the frame is taken.
// Each was picked from a scan of the live game: the cover is mid-rush with
// two tickets, a plate mid-assembly and a burner going; chop catches the
// board mid-chop; serve catches the chef at the window with a full plate;
// rush catches the dinner rush at full tilt.
export const SHOT_SCENES = {
  cover: { seed: 5, seconds: 125 },
  chop: { seed: 7, seconds: 26 },
  serve: { seed: 17, seconds: 95 },
  rush: { seed: 7, seconds: 125 },
};

/**
 * First serve (in seconds) after which at least one ticket is still on the
 * board, or null when the autopilot never serves with a ticket to spare.
 * The serve shot freezes one tick before that serve: the chef is at the
 * window with a full plate, the ticket being served is still up, and the
 * next ticket is already showing, so the board is never empty in the frame.
 * (At the old fixed 95 s the autopilot had just cleared the board.)
 */
function firstServeWithSpareTicket(seed, maxSeconds) {
  const probe = createWorld(seed);
  resetWorld(probe, seed);
  const pilot = createAutopilot();
  const steps = Math.floor(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (probe.mode !== 'play') break;
    const events = stepWorld(probe, pilot(probe), STEP);
    if (events & EVENT_SERVED && probe.orders.length >= 1) return probe.time;
  }
  return null;
}

/** Run the autopilot for `seconds` of play and leave the world mid-service. */
export function stageShot(name, world) {
  const scene = SHOT_SCENES[name] || SHOT_SCENES.cover;
  resetWorld(world, scene.seed);
  const pilot = createAutopilot();
  let steps = Math.floor(scene.seconds / STEP);
  if (name === 'serve') {
    // Freeze one tick before the first serve that leaves a ticket behind;
    // the probe replays the same seed, so the replay lands on that tick.
    const serveAt = firstServeWithSpareTicket(scene.seed, 140);
    if (serveAt !== null) steps = Math.max(0, Math.round(serveAt / STEP) - 1);
  }
  for (let i = 0; i < steps; i += 1) {
    if (world.mode !== 'play') break;
    stepWorld(world, pilot(world), STEP);
  }
  // Freeze the frame: the shot is one still image, so stop the clock here and
  // let the render use this exact moment.
  world.mode = 'play';
  return world;
}

/** A lively kitchen behind the title screen: 40 seconds of autopilot play. */
export function stageTitle(world) {
  const demo = createWorld(7);
  resetWorld(demo, 7);
  const pilot = createAutopilot();
  for (let i = 0; i < Math.floor(40 / STEP); i += 1) {
    if (demo.mode !== 'play') break;
    stepWorld(demo, pilot(demo), STEP);
  }
  return demo;
}
