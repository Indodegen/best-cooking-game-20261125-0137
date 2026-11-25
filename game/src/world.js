// Golden Ladle — the kitchen itself: state, orders, stations and rules.
// Pure logic: no canvas, no audio, no DOM. A step is one fixed tick; the same
// seed and the same inputs always replay the same shift.

import {
  BOT_LANE_Y, BURN_AFTER_SECONDS, CHEF, CHOP_SECONDS, COMBO_CAP, DISHES, GAPS, INGREDIENTS, MAX_ORDERS, MAX_PLATE_ITEMS,
  MENU_TIERS, MISS_PENALTY, ORDER, PANTRY_BINS, RUSH_START, SHIFT_SECONDS, STATIONS, TOP_LANE_Y,
} from './config.js';
import { mulberry32, pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_OVER = 4;
export const EVENT_BURNT = 8;
export const EVENT_WRONG = 16;

/** A carried or placed food item: a kind and how far it has been prepared. */
export function makeItem(kind, state = 'raw') {
  return { kind, state };
}
/** The token a recipe matches on, e.g. "tomato:chopped". */
export function tokenOf(item) {
  return `${item.kind}:${item.state}`;
}
export function dishNeeds(dishId) {
  return DISHES[dishId].needs;
}
/** True when the plate holds exactly the dish's tokens, in any order. */
export function plateMatchesDish(items, dishId) {
  const needs = dishNeeds(dishId).slice().sort();
  const have = items.map(tokenOf).sort();
  return needs.length === have.length && needs.every((t, i) => t === have[i]);
}

export function createWorld(seed = 1) {
  const world = {
    seed,
    rand: mulberry32(seed),
    time: 0,
    mode: 'title', // title | play | over
    chef: { x: CHEF.startX, y: CHEF.startY, dir: 1, moving: false, carry: null },
    orders: [],
    nextOrderAt: ORDER.firstAt,
    nextOrderId: 1,
    burners: [
      { item: null, progress: 0, x: 380, y: 438 },
      { item: null, progress: 0, x: 520, y: 438 },
    ],
    chopProgress: 0,
    chopping: null, // the item currently on the board
    plate: null, // { items: [] } resting on the plating counter
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    burnt: 0,
    rush: false,
    rushAnnounced: false,
    shake: 0,
    message: null, // { text, until } banner shown over the kitchen
    particles: [],
    floaters: [],
    clickTarget: null, // { x, y, station } set by mouse or the autopilot
    clickRoute: null, // waypoints from computeRoute, walked in order
    nearStation: null,
    stats: { chops: 0, cooks: 0, plates: 0 },
  };
  return world;
}

/** Fresh shift: empty counters, empty hands, first ticket on its way. */
export function resetWorld(world, seed) {
  const fresh = createWorld(seed === undefined ? world.seed : seed);
  Object.assign(world, fresh);
  world.mode = 'play';
}

function menuFor(elapsed) {
  for (const tier of MENU_TIERS) {
    if (elapsed < tier.until) return tier.dishes;
  }
  return MENU_TIERS[MENU_TIERS.length - 1].dishes;
}

function spawnOrder(world) {
  const dish = pick(world.rand, menuFor(world.time));
  const patience = world.rush ? ORDER.patienceRush : ORDER.patience;
  world.orders.push({
    id: world.nextOrderId,
    dish,
    patience,
    maxPatience: patience,
    born: world.time,
  });
  world.nextOrderId += 1;
}

function burst(world, x, y, color, count, text) {
  for (let i = 0; i < count; i += 1) {
    const a = world.rand() * Math.PI * 2;
    const speed = 40 + world.rand() * 90;
    world.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 60,
      life: 0.7 + world.rand() * 0.5,
      maxLife: 1.2,
      color,
      size: 3 + world.rand() * 4,
    });
  }
  if (text) {
    world.floaters.push({ x, y: y - 18, text, life: 1.4, maxLife: 1.4, color });
  }
}

function serveOrder(world, order) {
  const dish = DISHES[order.dish];
  const patienceShare = order.patience / order.maxPatience;
  const mult = Math.min(COMBO_CAP, 1 + 0.1 * world.combo);
  const coins = Math.round((dish.base + ORDER.patienceBonus * patienceShare) * mult);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.coins += coins;
  world.score += coins * 10;
  world.served += 1;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  const spot = STATIONS.serve.spot;
  burst(world, spot.x, spot.y - 40, '#ffd54f', 16, `+${coins}`);
  if (world.combo >= 3) {
    world.floaters.push({
      x: spot.x, y: spot.y - 70, text: `COMBO x${world.combo}!`,
      life: 1.4, maxLife: 1.4, color: '#ff7043',
    });
  }
  return coins;
}

function expireOrder(world, order) {
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.missed += 1;
  world.combo = 0;
  world.coins = Math.max(0, world.coins - MISS_PENALTY);
  world.floaters.push({
    x: 640, y: 150, text: `Order #${order.id} walked out! -${MISS_PENALTY}`,
    life: 1.6, maxLife: 1.6, color: '#e5484d',
  });
}

/** Waypoints from `from` to `to` that never cut through a counter: same lane
 * means a straight walk; crossing lanes goes along the current lane to the
 * nearest gap, through it, then along the other lane to the target. */
export function computeRoute(from, to) {
  const top = (p) => p.y < 392;
  if (top(from) === top(to)) return [{ x: to.x, y: to.y }];
  const midX = (from.x + to.x) / 2;
  const gapX = GAPS.reduce((best, g) => (Math.abs(g - midX) < Math.abs(best - midX) ? g : best), GAPS[0]);
  const laneY = top(to) ? TOP_LANE_Y : BOT_LANE_Y;
  return [{ x: gapX, y: from.y }, { x: gapX, y: laneY }, { x: to.x, y: to.y }];
}

/** The station the chef stands beside (distance to its counter), or null. */
export function nearestStation(world) {
  let best = null;
  let bestDist = 72;
  for (const [key, st] of Object.entries(STATIONS)) {
    const cx = Math.max(st.x, Math.min(world.chef.x, st.x + st.w));
    const cy = Math.max(st.y, Math.min(world.chef.y, st.y + st.h));
    const d = Math.hypot(world.chef.x - cx, world.chef.y - cy);
    if (d < bestDist) { bestDist = d; best = key; }
  }
  return best;
}

/** The pantry bin the chef stands in front of, when at the pantry. */
function nearestBin(world) {
  if (world.chef.y > 380) return null;
  let best = null;
  let bestDist = 60;
  for (const bin of PANTRY_BINS) {
    const cx = bin.x + bin.w / 2;
    const d = Math.abs(world.chef.x - cx);
    if (d < bestDist) { bestDist = d; best = bin; }
  }
  return best;
}

function useStation(world, key) {
  const chef = world.chef;
  if (key === 'pantry') {
    const bin = nearestBin(world);
    if (!bin || chef.carry) return false;
    // Ingredients that need no preparation come out ready to plate; the rest
    // come out raw and must be chopped or cooked first.
    const ing = INGREDIENTS[bin.kind];
    const state = ing.chop || ing.cook ? 'raw' : 'ready';
    chef.carry = makeItem(bin.kind, state);
    return true;
  }
  if (key === 'chop') {
    if (!chef.carry) return false;
    const ing = INGREDIENTS[chef.carry.kind];
    if (chef.carry.state !== 'raw' || !ing.chop) return false;
    world.chopping = chef.carry;
    return true;
  }
  if (key === 'stove') {
    if (chef.carry) {
      const ing = INGREDIENTS[chef.carry.kind];
      if (chef.carry.state !== 'raw' || !ing.cook) return false;
      const free = world.burners.find((b) => b.item === null);
      if (!free) return false;
      free.item = chef.carry;
      free.progress = 0;
      chef.carry = null;
      return true;
    }
    const done = world.burners.find((b) => b.item && b.item.state === 'cooked');
    if (!done) return false;
    chef.carry = done.item;
    done.item = null;
    done.progress = 0;
    return true;
  }
  if (key === 'plate') {
    if (chef.carry && chef.carry.plate) {
      if (world.plate) return false;
      world.plate = chef.carry;
      chef.carry = null;
      return true;
    }
    if (chef.carry && !chef.carry.plate) {
      if (chef.carry.state === 'raw' || chef.carry.state === 'burnt') return false;
      if (!world.plate) world.plate = { plate: true, items: [] };
      if (world.plate.items.length >= MAX_PLATE_ITEMS) return false;
      world.plate.items.push(chef.carry);
      world.stats.plates += 1;
      chef.carry = null;
      return true;
    }
    if (!chef.carry && world.plate) {
      chef.carry = world.plate;
      world.plate = null;
      return true;
    }
    if (!chef.carry && !world.plate) {
      world.plate = { plate: true, items: [] };
      chef.carry = world.plate;
      return true;
    }
    return false;
  }
  if (key === 'serve') {
    if (!chef.carry || !chef.carry.plate) return false;
    const order = world.orders.find((o) => plateMatchesDish(chef.carry.items, o.dish));
    if (!order) {
      world.shake = 0.25;
      world.floaters.push({
        x: STATIONS.serve.spot.x, y: STATIONS.serve.spot.y - 60,
        text: 'No order wants this!', life: 1.2, maxLife: 1.2, color: '#e5484d',
      });
      return 'wrong';
    }
    serveOrder(world, order);
    chef.carry = null;
    world.plate = { plate: true, items: [] };
    return 'served';
  }
  if (key === 'trash') {
    if (!chef.carry) return false;
    if (chef.carry.plate) {
      if (chef.carry.items.length === 0) return false;
      chef.carry.items = [];
      return true;
    }
    chef.carry = null;
    return true;
  }
  return false;
}

/** Move the chef, pushing out of counter rectangles. */
function moveChef(world, mx, my, dt) {
  const chef = world.chef;
  const len = Math.hypot(mx, my);
  if (len < 0.01) { chef.moving = false; return; }
  const nx = mx / len;
  const ny = my / len;
  chef.x += nx * CHEF.speed * dt;
  chef.y += ny * CHEF.speed * dt;
  chef.dir = nx < -0.1 ? -1 : nx > 0.1 ? 1 : chef.dir;
  chef.moving = true;
  chef.x = Math.max(36, Math.min(1244, chef.x));
  chef.y = Math.max(300, Math.min(696, chef.y));
  for (const st of Object.values(STATIONS)) {
    const r = CHEF.radius;
    const cx = Math.max(st.x, Math.min(chef.x, st.x + st.w));
    const cy = Math.max(st.y, Math.min(chef.y, st.y + st.h));
    const dx = chef.x - cx;
    const dy = chef.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < r && d > 0.001) {
      chef.x = cx + (dx / d) * r;
      chef.y = cy + (dy / d) * r;
    }
  }
}

/**
 * One fixed tick. input: { mx, my, interact } where interact is held E / mouse.
 * Returns an event bitmask for sound hooks.
 */
export function stepWorld(world, input, dt) {
  let events = EVENT_NONE;
  if (world.mode !== 'play') return events;

  world.time += dt;
  if (!world.rush && world.time >= RUSH_START) {
    world.rush = true;
    world.rushAnnounced = true;
    world.message = { text: 'DINNER RUSH! Orders x2 coins!', until: world.time + 3 };
  }
  if (world.time >= SHIFT_SECONDS) {
    world.mode = 'over';
    return events | EVENT_OVER;
  }

  // Orders arrive on a timer and lose patience.
  if (world.orders.length < MAX_ORDERS && world.time >= world.nextOrderAt) {
    spawnOrder(world);
    world.nextOrderAt = world.time + (world.rush ? ORDER.intervalRush : ORDER.interval);
  }
  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      expireOrder(world, order);
      events |= EVENT_MISSED;
    }
  }

  // Burners cook, then burn.
  for (const burner of world.burners) {
    if (!burner.item) continue;
    const ing = INGREDIENTS[burner.item.kind];
    if (burner.item.state === 'raw') {
      burner.progress += dt / ing.cookSeconds;
      if (burner.progress >= 1) {
        burner.item.state = 'cooked';
        burner.progress = 0;
        world.stats.cooks += 1;
        burst(world, burner.x, burner.y - 20, '#fff3c4', 8, null);
      }
    } else if (burner.item.state === 'cooked') {
      burner.progress += dt;
      if (burner.progress >= BURN_AFTER_SECONDS) {
        burner.item.state = 'burnt';
        world.burnt += 1;
        events |= EVENT_BURNT;
        world.floaters.push({
          x: burner.x, y: burner.y - 46, text: 'Burnt!',
          life: 1.3, maxLife: 1.3, color: '#37474f',
        });
      }
    }
  }

  // Chopping finishes while E is held at the board.
  if (world.chopping) {
    if (input.interact && world.nearStation === 'chop') {
      world.chopProgress += dt / CHOP_SECONDS;
      if (world.chopProgress >= 1) {
        world.chopping.state = 'chopped';
        world.stats.chops += 1;
        burst(world, world.chef.x, world.chef.y - 30, '#a5d6a7', 10, null);
        world.chopping = null;
        world.chopProgress = 0;
      }
    } else if (world.nearStation !== 'chop') {
      world.chopping = null;
      world.chopProgress = 0;
    }
  }

  // Click-to-move: walk the routed waypoints, then use the station on arrival.
  if (world.clickTarget) {
    if (!world.clickRoute || world.clickRoute.length === 0) {
      world.clickRoute = computeRoute(
        { x: world.chef.x, y: world.chef.y },
        { x: world.clickTarget.x, y: world.clickTarget.y },
      );
    }
    const wp = world.clickRoute[0];
    const dx = wp.x - world.chef.x;
    const dy = wp.y - world.chef.y;
    if (Math.hypot(dx, dy) < 10) {
      world.clickRoute.shift();
      if (world.clickRoute.length === 0) {
        const target = world.clickTarget;
        world.clickTarget = null;
        world.clickRoute = null;
        if (target.station) {
          const result = useStation(world, target.station);
          if (result === 'served') events |= EVENT_SERVED;
          else if (result === 'wrong') events |= EVENT_WRONG;
        }
      }
    } else {
      moveChef(world, dx, dy, dt);
    }
  } else {
    moveChef(world, input.mx, input.my, dt);
  }

  // Keyboard / held interact on the nearest station.
  world.nearStation = nearestStation(world);
  if (input.interactPressed && world.nearStation && !world.chopping) {
    const result = useStation(world, world.nearStation);
    if (result === 'served') events |= EVENT_SERVED;
    else if (result === 'wrong') events |= EVENT_WRONG;
  }

  // Cosmetics: steam over anything cooking, particles and floaters age.
  for (const burner of world.burners) {
    if (burner.item && world.rand() < 0.25) {
      world.particles.push({
        x: burner.x + (world.rand() - 0.5) * 30,
        y: burner.y - 24,
        vx: (world.rand() - 0.5) * 8,
        vy: -34 - world.rand() * 20,
        life: 0.9, maxLife: 0.9, color: 'rgba(255,255,255,0.55)', size: 5 + world.rand() * 4,
      });
    }
  }
  for (const p of world.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floaters) f.life -= dt;
  world.floaters = world.floaters.filter((f) => f.life > 0);
  if (world.shake > 0) world.shake -= dt;
  if (world.message && world.time > world.message.until) world.message = null;
  return events;
}

/** Shift grade from dishes served. */
export function gradeFor(served) {
  if (served >= 22) return 'S';
  if (served >= 18) return 'A';
  if (served >= 14) return 'B';
  if (served >= 10) return 'C';
  return 'D';
}
