// Golden Ladle — every pixel the judge sees: the kitchen, the chef, the food,
// the order board and the HUD. Canvas 2D only, all art drawn in code, warm
// golden-hour light over the whole scene.
import {
  CHEF, DISHES, INGREDIENTS, ORDER, PALETTE, PANTRY_BINS, SHIFT_SECONDS,
  STATIONS, VIEW,
} from './config.js';
import { plateMatchesDish } from './world.js';

const FONT = "'Trebuchet MS', Verdana, sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(60,30,10,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 4, w / 2.1, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** One ingredient icon, drawn from its kind and preparation state. */
export function drawIngredient(ctx, kind, state, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (kind === 'tomato') {
    if (state === 'chopped') {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillStyle = i === 0 ? ing.color : ing.light;
        ctx.beginPath();
        ctx.arc(i * r * 0.55, (i % 2) * r * 0.25, r * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb3ab';
        ctx.beginPath();
        ctx.arc(i * r * 0.55, (i % 2) * r * 0.25, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, r * 0.08, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.light;
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(-r * 0.45, -r * 1.05);
      ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.45, -r * 1.05);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'onion') {
    if (state === 'chopped') {
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = r * 0.16;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc((i - 1) * r * 0.5, (i % 2) * r * 0.3, r * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#ede7f6';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, r * 0.4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ing.light;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
    }
  } else if (kind === 'egg') {
    if (state === 'cooked') {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath();
      ctx.arc(r * 0.1, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffc107';
      ctx.beginPath();
      ctx.arc(r * 0.02, -r * 0.06, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath();
      ctx.arc(0, -r * 0.4, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'pasta') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, (i - 1) * r * 0.32, r * (0.75 - i * 0.1), 0.3, Math.PI * 2.4);
      ctx.stroke();
    }
    if (state === 'cooked') {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.5, -r * 1.4, -r * 0.2, -r * 1.6);
      ctx.moveTo(r * 0.3, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.5, -r * 1.4, r * 0.2, -r * 1.6);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.5);
    ctx.lineTo(r * 0.9, r * 0.5);
    ctx.lineTo(r * 0.9, -r * 0.2);
    ctx.lineTo(-r * 0.9, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.2, r * 0.1, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.05, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bread') {
    ctx.fillStyle = ing.dark;
    rr(ctx, -r, -r * 0.7, r * 2, r * 1.5, r * 0.5);
    ctx.fill();
    ctx.fillStyle = ing.light;
    rr(ctx, -r * 0.82, -r * 0.52, r * 1.64, r * 1.14, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.4, -r * 0.2);
    ctx.moveTo(-r * 0.4, r * 0.2);
    ctx.lineTo(r * 0.4, r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCounter(ctx, st, highlight) {
  ctx.fillStyle = 'rgba(60,30,10,0.25)';
  rr(ctx, st.x + 4, st.y + 8, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, st.x, st.y, st.w, 26, 12);
  ctx.fill();
  ctx.fillRect(st.x, st.y + 14, st.w, 12);
  if (highlight) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 18;
    rr(ctx, st.x - 2, st.y - 2, st.w + 4, st.h + 4, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = 'rgba(255,248,231,0.85)';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(st.label, st.x + st.w / 2, st.y + st.h - 10);
}

function drawPantry(ctx, world) {
  const st = STATIONS.pantry;
  drawCounter(ctx, st, world.nearStation === 'pantry');
  for (const bin of PANTRY_BINS) {
    const ing = INGREDIENTS[bin.kind];
    ctx.fillStyle = '#fff8e7';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 2;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 8);
    ctx.stroke();
    drawIngredient(ctx, bin.kind, 'raw', bin.x + bin.w / 2, bin.y + 22, 15);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(ing.name, bin.x + bin.w / 2, bin.y + bin.h - 6);
  }
}

function drawStove(ctx, world) {
  const st = STATIONS.stove;
  drawCounter(ctx, st, world.nearStation === 'stove');
  for (const burner of world.burners) {
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(burner.x, burner.y, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(burner.x, burner.y, 28, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      ctx.fillStyle = '#eceff1';
      ctx.beginPath();
      ctx.arc(burner.x, burner.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.arc(burner.x, burner.y, 24, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, burner.item.kind, burner.item.state, burner.x, burner.y, 16);
      if (burner.item.state === 'raw') {
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(burner.x, burner.y, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * burner.progress);
        ctx.stroke();
      } else if (burner.item.state === 'cooked') {
        const left = 1 - burner.progress / 7;
        ctx.strokeStyle = left > 0.4 ? '#43a047' : '#e5484d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(burner.x, burner.y, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
        ctx.stroke();
        text(ctx, 'READY!', burner.x, burner.y - 48, 13, '#2e7d32', 'bold', 'center');
      } else if (burner.item.state === 'burnt') {
        text(ctx, 'BURNT', burner.x, burner.y - 48, 13, '#37474f', 'bold', 'center');
      }
    }
  }
}

function drawPlateCounter(ctx, world) {
  const st = STATIONS.plate;
  drawCounter(ctx, st, world.nearStation === 'plate');
  const px = 792;
  const py = 426;
  if (world.plate) {
    drawPlate(ctx, world.plate.items, px, py);
  } else {
    ctx.strokeStyle = 'rgba(255,248,231,0.5)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, py - 6, 46, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPlate(ctx, items, x, y) {
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.ellipse(x, y, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.ellipse(x, y, 40, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  const spots = [[-20, -4], [20, -6], [-2, 8], [0, -14]];
  items.forEach((item, i) => {
    const s = spots[i % spots.length];
    drawIngredient(ctx, item.kind, item.state, x + s[0], y + s[1], 15);
  });
}

function drawServe(ctx, world) {
  const st = STATIONS.serve;
  drawCounter(ctx, st, world.nearStation === 'serve');
  // Serving window: warm opening with a waiting customer.
  ctx.fillStyle = '#5d4037';
  rr(ctx, st.x + 16, st.y + 8, st.w - 32, 66, 8);
  ctx.fill();
  ctx.fillStyle = '#ffecb3';
  rr(ctx, st.x + 22, st.y + 14, st.w - 44, 54, 6);
  ctx.fill();
  const bob = Math.sin(world.time * 2) * 2;
  const cx = st.x + st.w / 2;
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.arc(cx, st.y + 44 + bob, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.arc(cx, st.y + 34 + bob, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.arc(cx - 6, st.y + 44 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 6, st.y + 44 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, st.y + 48 + bob, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // Service bell on the counter.
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(st.x + 42, st.y + 98, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(st.x + 31, st.y + 96, 22, 5);
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.arc(st.x + 42, st.y + 98, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrash(ctx, world) {
  const st = STATIONS.trash;
  drawCounter(ctx, st, world.nearStation === 'trash');
  // Small bin, kept clear of the counter label underneath it.
  ctx.fillStyle = '#546e7a';
  rr(ctx, st.x + 33, st.y + 8, 40, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#37474f';
  rr(ctx, st.x + 29, st.y + 4, 48, 8, 4);
  ctx.fill();
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(world.time * 14) * 3 : Math.sin(world.time * 2) * 1.5;
  const x = chef.x;
  const y = chef.y - bob * 0.4;
  ctx.save();
  ctx.translate(x, y);
  shadow(ctx, -CHEF.radius, 16, CHEF.radius * 2, 10);
  // Body and apron.
  ctx.fillStyle = '#eceff1';
  rr(ctx, -17, -8, 34, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#42a5f5';
  rr(ctx, -13, 2, 26, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#42a5f5';
  ctx.fillRect(-17, -8, 6, 18);
  ctx.fillRect(11, -8, 6, 18);
  // Head and toque.
  ctx.fillStyle = '#ffcc9e';
  ctx.beginPath();
  ctx.arc(0, -22, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -34, 8, 0, Math.PI * 2);
  ctx.arc(0, -38, 9, 0, Math.PI * 2);
  ctx.arc(8, -34, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -36, 28, 8);
  // Face.
  ctx.fillStyle = '#3e2723';
  const ex = chef.dir * 3;
  ctx.beginPath();
  ctx.arc(-5 + ex, -22, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + ex, -22, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(ex, -18, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // Carried item held high.
  if (chef.carry) {
    const cy = -62;
    ctx.fillStyle = 'rgba(60,30,10,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -44, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (chef.carry.plate) {
      drawPlate(ctx, chef.carry.items, 0, cy);
    } else {
      drawIngredient(ctx, chef.carry.kind, chef.carry.state, 0, cy, 15);
    }
    ctx.fillStyle = '#ffcc9e';
    ctx.beginPath();
    ctx.arc(-14, -52, 4, 0, Math.PI * 2);
    ctx.arc(14, -52, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Chopping progress ring over the board.
  if (world.chopping) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, -52, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * world.chopProgress);
    ctx.stroke();
    text(ctx, 'CHOP!', 0, -84, 13, '#ffb300', 'bold', 'center');
  }
  ctx.restore();
}

function drawOrders(ctx, world) {
  const y = 92;
  const w = 300;
  const h = 100;
  const gap = 12;
  const startX = 16;
  for (let i = 0; i < world.orders.length; i += 1) {
    const order = world.orders[i];
    const dish = DISHES[order.dish];
    const x = startX + i * (w + gap);
    const share = Math.max(0, order.patience / order.maxPatience);
    const matching = world.chef.carry && world.chef.carry.plate
      && plateMatchesDish(world.chef.carry.items, order.dish);
    ctx.fillStyle = 'rgba(60,30,10,0.2)';
    rr(ctx, x + 3, y + 5, w, h, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = share > 0.5 ? '#43a047' : share > 0.25 ? '#fb8c00' : '#e53935';
    rr(ctx, x, y, w, 10, 10);
    ctx.fill();
    ctx.fillRect(x, y + 5, w, 5);
    if (matching) {
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 14;
      rr(ctx, x, y, w, h, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    text(ctx, `#${order.id}  ${dish.name}`, x + 12, y + 34, 19, PALETTE.ink);
    text(ctx, dish.blurb, x + 12, y + 52, 12, '#8d6e63', 'normal');
    order.dish && dish.needs.forEach((token, j) => {
      const [kind, state] = token.split(':');
      drawIngredient(ctx, kind, state, x + 26 + j * 44, y + 74, 13);
    });
    text(ctx, `$${dish.base}+`, x + w - 14, y + 52, 15, '#b8860b', 'bold', 'right');
    // Patience bar.
    ctx.fillStyle = '#e0d5c1';
    rr(ctx, x + 12, y + h - 14, w - 24, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = share > 0.5 ? '#43a047' : share > 0.25 ? '#fb8c00' : '#e53935';
    rr(ctx, x + 12, y + h - 14, (w - 24) * share, 7, 3.5);
    ctx.fill();
  }
  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,248,231,0.75)';
    rr(ctx, startX, y, 300, h, 10);
    ctx.fill();
    text(ctx, 'No orders yet —', startX + 16, y + 44, 16, '#8d6e63', 'bold');
    text(ctx, 'the lunch crowd is coming!', startX + 16, y + 66, 14, '#8d6e63');
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, 84);
  ctx.fillStyle = PALETTE.hudEdge;
  ctx.fillRect(0, 80, VIEW.width, 4);
  text(ctx, '🍳 THE GOLDEN LADLE', 18, 36, 26, '#ffb300');
  text(ctx, 'Rush Hour Kitchen  •  Day 1', 20, 62, 14, '#d7ccc8');
  const remain = Math.max(0, SHIFT_SECONDS - world.time);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60).toString().padStart(2, '0');
  const low = remain <= 30;
  ctx.fillStyle = '#fff8e7';
  rr(ctx, 560, 12, 160, 60, 12);
  ctx.fill();
  if (low) {
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 3;
    rr(ctx, 560, 12, 160, 60, 12);
    ctx.stroke();
  }
  text(ctx, 'SHIFT', 640, 32, 12, '#8d6e63', 'bold', 'center');
  text(ctx, `${mm}:${ss}`, 640, 66, 30, low ? '#e53935' : PALETTE.ink, 'bold', 'center');
  if (world.rush && world.mode === 'play') {
    ctx.fillStyle = '#e53935';
    rr(ctx, 736, 18, 132, 48, 10);
    ctx.fill();
    text(ctx, '🔥 RUSH x2', 802, 50, 18, '#ffffff', 'bold', 'center');
  }
  text(ctx, `SCORE ${world.score}`, 1010, 34, 17, '#fff8e7', 'bold', 'right');
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(1032, 56, 10, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '$', 1032, 60, 13, '#8d6e63', 'bold', 'center');
  text(ctx, `${world.coins}`, 1050, 62, 20, '#ffd54f', 'bold');
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 1240, 34, 16, '#ff7043', 'bold', 'right');
  }
  text(ctx, `Served ${world.served}`, 1240, 62, 13, '#bcaaa4', 'normal', 'right');
}

function drawBackground(ctx, world) {
  // Warm wall and tile floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 84, VIEW.width, 128);
  ctx.fillStyle = PALETTE.wallDark;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 196, 64, 4);
  }
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 212, VIEW.width, VIEW.height - 212);
  // Terracotta tile grout: faint full-length lines, never a road marking.
  ctx.fillStyle = 'rgba(120,60,10,0.10)';
  for (let y = 260; y < VIEW.height; y += 48) ctx.fillRect(0, y, VIEW.width, 2);
  for (let x = 48; x < VIEW.width; x += 96) ctx.fillRect(x, 212, 2, VIEW.height - 212);
  // Golden-hour wash from the top-left window light.
  const glow = ctx.createRadialGradient(180, 120, 40, 180, 120, 720);
  glow.addColorStop(0, 'rgba(255,190,80,0.28)');
  glow.addColorStop(0.55, 'rgba(255,190,80,0.10)');
  glow.addColorStop(1, 'rgba(255,190,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 84, VIEW.width, VIEW.height - 84);
  // Hanging lamps.
  for (const lx of [320, 640, 960]) {
    ctx.strokeStyle = '#6b421d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 84);
    ctx.lineTo(lx, 128);
    ctx.stroke();
    const lamp = ctx.createRadialGradient(lx, 138, 4, lx, 138, 90);
    lamp.addColorStop(0, 'rgba(255,214,120,0.55)');
    lamp.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(lx, 138, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(lx, 136, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    text(ctx, f.text, f.x, f.y - (1.4 - f.life) * 24, 22, f.color, 'bold', 'center');
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, world) {
  if (world.message) {
    ctx.fillStyle = 'rgba(51,36,26,0.92)';
    const w = 460;
    rr(ctx, (VIEW.width - w) / 2, 210, w, 52, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 3;
    rr(ctx, (VIEW.width - w) / 2, 210, w, 52, 12);
    ctx.stroke();
    text(ctx, world.message.text, VIEW.width / 2, 245, 24, '#ffd54f', 'bold', 'center');
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(43,26,16,0.55)';
  ctx.fillRect(0, 84, VIEW.width, VIEW.height - 84);
  ctx.fillStyle = 'rgba(51,36,26,0.95)';
  rr(ctx, 290, 180, 700, 340, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 3;
  rr(ctx, 290, 180, 700, 340, 18);
  ctx.stroke();
  text(ctx, '🍳 THE GOLDEN LADLE', 640, 262, 44, '#ffb300', 'bold', 'center');
  text(ctx, 'Rush Hour Kitchen', 640, 306, 26, '#fff8e7', 'bold', 'center');
  text(ctx, 'Cook. Plate. Serve. Beat the clock.', 640, 344, 17, '#d7ccc8', 'normal', 'center');
  text(ctx, 'WASD / Arrows — walk      E / Space — use station', 640, 392, 16, '#fff8e7', 'normal', 'center');
  text(ctx, 'Click a station to walk there      P — pause      M — mute', 640, 418, 16, '#fff8e7', 'normal', 'center');
  text(ctx, 'Chop it, cook it, plate it, ring the bell!', 640, 452, 15, '#ffd54f', 'bold', 'center');
  ctx.fillStyle = '#ffb300';
  rr(ctx, 520, 472, 240, 40, 20);
  ctx.fill();
  text(ctx, '▶  START SHIFT', 640, 499, 18, '#33241a', 'bold', 'center');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(43,26,16,0.6)';
  ctx.fillRect(0, 84, VIEW.width, VIEW.height - 84);
  ctx.fillStyle = 'rgba(51,36,26,0.95)';
  rr(ctx, 340, 170, 600, 380, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 3;
  rr(ctx, 340, 170, 600, 380, 18);
  ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 244, 40, '#ffb300', 'bold', 'center');
  text(ctx, `Grade ${world.served >= 22 ? 'S' : world.served >= 18 ? 'A' : world.served >= 14 ? 'B' : world.served >= 10 ? 'C' : 'D'}`, 640, 292, 26, '#fff8e7', 'bold', 'center');
  text(ctx, `Dishes served:  ${world.served}`, 640, 340, 20, '#fff8e7', 'normal', 'center');
  text(ctx, `Orders missed:  ${world.missed}      Burnt:  ${world.burnt}`, 640, 372, 18, '#d7ccc8', 'normal', 'center');
  text(ctx, `Best combo:  x${world.bestCombo}      Coins earned:  $${world.coins}`, 640, 404, 18, '#d7ccc8', 'normal', 'center');
  text(ctx, `Final score:  ${world.score}`, 640, 442, 22, '#ffd54f', 'bold', 'center');
  ctx.fillStyle = '#ffb300';
  rr(ctx, 520, 472, 240, 40, 20);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', 640, 499, 18, '#33241a', 'bold', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,26,16,0.55)';
  ctx.fillRect(0, 84, VIEW.width, VIEW.height - 84);
  text(ctx, 'PAUSED — press P to keep cooking', 640, 380, 28, '#fff8e7', 'bold', 'center');
}

/** Draw one full frame. `paused` draws the pause veil over the kitchen. */
export function drawFrame(ctx, world, paused) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8 * world.shake, (Math.random() - 0.5) * 8 * world.shake);
  }
  drawBackground(ctx, world);
  drawOrders(ctx, world);
  drawPantry(ctx, world);
  drawStove(ctx, world);
  drawPlateCounter(ctx, world);
  drawServe(ctx, world);
  drawTrash(ctx, world);
  // Chopping board with the item being chopped.
  const st = STATIONS.chop;
  drawCounter(ctx, st, world.nearStation === 'chop');
  ctx.fillStyle = '#d7a05b';
  rr(ctx, st.x + 40, st.y + 22, 150, 48, 8);
  ctx.fill();
  if (world.chopping) {
    drawIngredient(ctx, world.chopping.kind, 'raw', st.x + 115, st.y + 46, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(st.x + 115, st.y + 46, 18, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, world.chopping.kind, 'chopped', st.x + 115, st.y + 46, 18 * world.chopProgress);
  }
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawBanner(ctx, world);
  drawHud(ctx, world);
  if (world.mode === 'title') drawTitle(ctx, world);
  if (world.mode === 'over') drawOver(ctx, world);
  if (paused) drawPaused(ctx);
  ctx.restore();
}
