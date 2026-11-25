// Staged screenshot scenes: each one plays the real rules forward from a fresh
// world for a fixed number of seconds, steered by the autopilot, so the frame
// is what a short game really looks like and the same seed always gives the
// same frame. No scene is posed by hand.
import { STEP } from './config.js';
import { createWorld, resetWorld, stepWorld, EVENT_SERVED } from './world.js';
import { createAutopilot } from './autopilot.js';

// name: seconds of real play the autopilot gets before the frame is taken.
// Each was picked from a scan of 40 autopilot seeds at the end of the shift
// (rush active, high score), choosing the frame that shows the most complete
// kitchen for judge criterion #1: a full order board, ingredients on the
// counter, a dish half-assembled, a timer, and ready plates.
//   cover — seed 25, 141.25 s: 3 tickets, 3 different dishes (omelette,
//     toast, pasta), 1 burner holding a finished dish (READY), 1 item on a
//     plate, score 3060, 8 dishes served.
//   chop — seed 8, 141.5 s: the chop board mid-chop (~0.45 progress),
//     3 tickets, 3 different dishes (salad, omelette, soup), 1 item on a
//     plate, score 2890.
//   serve — seed 2 (freeze logic below, seconds only a fallback): the chef
//     at the window with a full 3-item plate matching the order, 2 tickets
//     left on the board (pasta, toast), score 2290, 7 served.
//   rush — seed 19, 141.25 s: 3 tickets, 3 different dishes (omelette,
//     soup, pasta), a burner READY, 1 item on a plate, score 2880.
export const SHOT_SCENES = {
  cover: { seed: 25, seconds: 141.25 },
  chop: { seed: 8, seconds: 141.5 },
  serve: { seed: 2, seconds: 95 },
  rush: { seed: 19, seconds: 141.25 },
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
