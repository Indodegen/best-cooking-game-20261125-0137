// Autopilot: plays the real rules, one decision a tick, so a staged screenshot
// scene is a genuine moment of play, not a posed mockup. It works the oldest
// order first: fetch, chop, cook, plate, serve, repeat.
import { DISHES, INGREDIENTS, PANTRY_BINS, STATIONS } from './config.js';
import { computeRoute, plateMatchesDish } from './world.js';

function tokenKind(token) { return token.split(':')[0]; }

/** The oldest order the plate on the counter (or in hand) can still complete. */
function targetOrder(world) {
  return world.orders[0] || null;
}

function planNext(world) {
  const carry = world.chef.carry;
  const order = targetOrder(world);
  const plateItems = carry && carry.plate ? carry.items : (world.plate ? world.plate.items : []);

  // 1. A plate in hand: serve it, set it down to keep building, or dump it.
  if (carry && carry.plate) {
    const match = world.orders.find((o) => plateMatchesDish(carry.items, o.dish));
    if (match) return { station: 'serve' };
    if (!order) return { station: 'trash' };
    const needed = new Set(DISHES[order.dish].needs);
    const extra = carry.items.some((it) => !needed.has(`${it.kind}:${it.state}`));
    if (extra) return { station: 'trash' };
    return { station: 'plate' }; // set it down, then fetch the next ingredient
  }

  // 2. A plate on the counter that already matches an order: pick it up.
  if (!carry && world.plate) {
    const match = world.orders.find((o) => plateMatchesDish(world.plate.items, o.dish));
    if (match) return { station: 'plate' };
  }

  // 3. A single item in hand: take it where it needs to go.
  if (carry && !carry.plate) {
    if (carry.state === 'burnt') return { station: 'trash' };
    if (carry.state === 'raw' && INGREDIENTS[carry.kind].chop) return { station: 'chop', hold: true };
    if (carry.state === 'raw' && INGREDIENTS[carry.kind].cook) return { station: 'stove' };
    // Prepared item: plate it if the oldest order wants it.
    if (order) {
      const needed = new Set(DISHES[order.dish].needs);
      if (needed.has(`${carry.kind}:${carry.state}`)) return { station: 'plate' };
    }
    return { station: 'trash' };
  }

  // 4. Empty hands: a cooked item waiting on a burner that an order needs.
  if (!carry && order) {
    const needed = new Set(DISHES[order.dish].needs);
    const ready = world.burners.find((b) => b.item && b.item.state === 'cooked'
      && needed.has(`${b.item.kind}:cooked`));
    if (ready) return { station: 'stove' };
  }

  // 5. Empty hands: fetch the next missing token of the oldest order.
  if (!carry && order) {
    const needed = DISHES[order.dish].needs;
    const have = {};
    for (const it of plateItems) {
      const t = `${it.kind}:${it.state}`;
      have[t] = (have[t] || 0) + 1;
    }
    // A raw item already cooking counts as on its way.
    for (const b of world.burners) {
      if (b.item) {
        const t = `${b.item.kind}:${b.item.state === 'raw' ? 'cooked' : b.item.state}`;
        have[t] = (have[t] || 0) + 1;
      }
    }
    for (const token of needed) {
      if ((have[token] || 0) > 0) { have[token] -= 1; continue; }
      const kind = tokenKind(token);
      const bin = PANTRY_BINS.find((b) => b.kind === kind);
      return { station: 'pantry', bin };
    }
    // Everything needed is on the plate or on its way: pick the plate up only
    // once it truly matches an order; while a burner still cooks, wait for it.
    if (world.plate && world.plate.items.length > 0) {
      const match = world.orders.find((o) => plateMatchesDish(world.plate.items, o.dish));
      if (match) return { station: 'plate' };
      const cooking = world.burners.some((b) => b.item && b.item.state === 'raw');
      if (cooking) return { station: 'stove', idle: true };
    }
  }

  // 6. Nothing to do: wait by the plating counter.
  return { station: 'plate', idle: true };
}

function spotFor(plan) {
  if (plan.station === 'pantry' && plan.bin) {
    return { x: plan.bin.x + plan.bin.w / 2, y: STATIONS.pantry.spot.y };
  }
  return STATIONS[plan.station].spot;
}

export function createAutopilot() {
  let targetKey = null;
  let arrived = false;
  let lastSig = '';
  let route = [];
  // The action at a station changes what the chef holds: a press that plates
  // an item and the next press that picks the plate up share one station key,
  // so arrival resets whenever the carried or plated state changes.
  function signature(world) {
    const carry = world.chef.carry;
    const carryDesc = !carry ? '-' : carry.plate ? `plate:${carry.items.length}` : `${carry.kind}:${carry.state}`;
    const plateDesc = !world.plate ? '-' : `${world.plate.items.length}`;
    const burnerDesc = world.burners.map((b) => (b.item ? `${b.item.kind}:${b.item.state}` : '-')).join(',');
    return `${carryDesc}|${plateDesc}|${burnerDesc}|${world.chopping ? 'chop' : '-'}`;
  }
  return function autopilot(world) {
    const plan = planNext(world);
    const key = plan.station + (plan.bin ? `:${plan.bin.kind}` : '');
    const sig = signature(world);
    if (key !== targetKey || sig !== lastSig) {
      targetKey = key;
      lastSig = sig;
      arrived = false;
      route = computeRoute({ x: world.chef.x, y: world.chef.y }, spotFor(plan));
    }
    // Still chopping: hold E at the board until the item is chopped.
    if (world.chopping) {
      return { mx: 0, my: 0, interact: true, interactPressed: false };
    }
    // Walk the routed waypoints; only the last one is the station itself.
    const dest = route.length > 0 ? route[0] : spotFor(plan);
    const dx = dest.x - world.chef.x;
    const dy = dest.y - world.chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 12) {
      const len = Math.max(0.001, dist);
      return { mx: dx / len, my: dy / len, interact: false, interactPressed: false };
    }
    if (route.length > 0) route.shift();
    if (route.length > 0) {
      return { mx: 0, my: 0, interact: false, interactPressed: false };
    }
    if (!arrived) {
      arrived = true;
      // An idle plan only waits at the station; it never presses E.
      return { mx: 0, my: 0, interact: !!plan.hold, interactPressed: !plan.idle };
    }
    // Arrived and already pressed: hold E only while chopping needs it.
    return { mx: 0, my: 0, interact: !!plan.hold, interactPressed: false };
  };
}
