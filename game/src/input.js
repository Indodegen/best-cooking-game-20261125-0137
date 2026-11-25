// Keyboard and mouse: WASD / arrows to walk, E or Space to use a station,
// click a station to walk there and use it, P to pause, M to mute, R to restart.
import { STATIONS } from './config.js';

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    mx: 0, my: 0,
    interact: false,
    interactPressed: false,
    pausePressed: false,
    mutePressed: false,
    restartPressed: false,
    click: null, // { x, y } in canvas logical coordinates, consumed by main.js
  };

  function isInteract(code) {
    return code === 'KeyE' || code === 'Space';
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (isInteract(event.code)) event.preventDefault();
      return;
    }
    keys.add(event.code);
    if (isInteract(event.code)) {
      input.interact = true;
      input.interactPressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP') input.pausePressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
    if (event.code === 'KeyR') input.restartPressed = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (isInteract(event.code)) input.interact = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
    input.interact = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    input.click = { x, y };
  });

  /** Read the held keys into a movement vector for this tick. */
  input.poll = function poll() {
    let mx = 0;
    let my = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    input.mx = mx;
    input.my = my;
  };

  /** Edge-triggered flags are consumed once per tick. */
  input.consumeEdges = function consumeEdges() {
    input.interactPressed = false;
    input.pausePressed = false;
    input.mutePressed = false;
    input.restartPressed = false;
    input.click = null;
  };

  return input;
}

/** The station whose counter the point falls on, for click-to-use. */
export function stationAt(x, y) {
  for (const [key, st] of Object.entries(STATIONS)) {
    if (x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h) return key;
  }
  return null;
}
