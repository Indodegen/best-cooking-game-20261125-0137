// Golden Ladle — Rush Hour Kitchen: configuration.
// One kitchen, one screen: the chef walks between stations, prepares ingredients
// and plates dishes against the order board. Every number that tunes the game
// lives here so the rules can be balanced without touching the world code.

export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const RUSH_START = 110; // seconds into the shift when dinner rush begins
export const MAX_ORDERS = 4;
export const MAX_PLATE_ITEMS = 4;

// --- Ingredients -------------------------------------------------------------
// state: what a carried item can become. chop: needs the board. cook: needs a
// burner. ready: served as-is. Each ingredient knows its colours for drawing.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', chop: true, cook: false, color: '#e5484d', dark: '#a92c31', light: '#ff8a80' },
  onion: { name: 'Onion', chop: true, cook: false, color: '#f3e5f5', dark: '#b39ddb', light: '#ffffff' },
  lettuce: { name: 'Lettuce', chop: true, cook: false, color: '#66bb6a', dark: '#2e7d32', light: '#a5d6a7' },
  egg: { name: 'Egg', chop: false, cook: true, cookSeconds: 4, color: '#fff3c4', dark: '#e0a800', light: '#fffbe6' },
  pasta: { name: 'Pasta', chop: false, cook: true, cookSeconds: 5, color: '#f2c14e', dark: '#b98a1d', light: '#ffe082' },
  cheese: { name: 'Cheese', chop: false, cook: false, color: '#ffb300', dark: '#c67c00', light: '#ffd54f' },
  bread: { name: 'Bread', chop: false, cook: false, color: '#d7a05b', dark: '#8d5a1e', light: '#f0c98f' },
};
export const PANTRY_ORDER = ['tomato', 'onion', 'lettuce', 'egg', 'pasta', 'cheese', 'bread'];

// --- Dishes ------------------------------------------------------------------
// Each dish is a set of prepared ingredients: "kind:state" tokens the plate
// must hold, in any order. base: coins before the patience bonus.
export const DISHES = {
  salad: {
    name: 'Garden Salad', base: 12,
    needs: ['lettuce:chopped', 'tomato:chopped'],
    blurb: 'Crisp and fresh',
  },
  toast: {
    name: 'Cheesy Toast', base: 16,
    needs: ['bread:ready', 'cheese:ready', 'tomato:chopped'],
    blurb: 'Golden and gooey',
  },
  pasta: {
    name: 'Sunny Pasta', base: 20,
    needs: ['pasta:cooked', 'tomato:chopped', 'cheese:ready'],
    blurb: 'The house favourite',
  },
  omelette: {
    name: 'Golden Omelette', base: 22,
    needs: ['egg:cooked', 'cheese:ready', 'onion:chopped'],
    blurb: 'Fluffy, sunny side up',
  },
  soup: {
    name: 'Sunset Soup', base: 24,
    needs: ['tomato:chopped', 'onion:chopped', 'cheese:ready'],
    blurb: 'Slow-simmered comfort',
  },
};
// Early orders stay easy; the full menu opens as the shift goes on.
export const MENU_TIERS = [
  { until: 35, dishes: ['salad', 'toast'] },
  { until: 80, dishes: ['salad', 'toast', 'pasta'] },
  { until: 9999, dishes: ['salad', 'toast', 'pasta', 'omelette', 'soup'] },
];

// --- Orders ------------------------------------------------------------------
export const ORDER = {
  firstAt: 2, // seconds until the first ticket appears
  interval: 16, // seconds between tickets, calm
  intervalRush: 9, // seconds between tickets, dinner rush
  patience: 50, // seconds a ticket waits, calm
  patienceRush: 36, // seconds a ticket waits, dinner rush
  patienceBonus: 12, // extra coins for serving with patience left
};

// --- Stations ----------------------------------------------------------------
// The kitchen is one open floor. Each station has a counter rect (drawn) and a
// floor spot in front of it where the chef stands to use it.
export const STATIONS = {
  pantry: { label: 'PANTRY', x: 24, y: 214, w: 700, h: 74, spot: { x: 374, y: 320 } },
  chop: { label: 'CHOP', x: 24, y: 392, w: 232, h: 92, spot: { x: 140, y: 370 } },
  stove: { label: 'STOVE', x: 304, y: 392, w: 292, h: 92, spot: { x: 450, y: 370 } },
  plate: { label: 'PLATE', x: 644, y: 392, w: 296, h: 92, spot: { x: 792, y: 370 } },
  serve: { label: 'SERVE', x: 988, y: 392, w: 268, h: 128, spot: { x: 1122, y: 370 } },
  trash: { label: 'TRASH', x: 1150, y: 620, w: 106, h: 72, spot: { x: 1203, y: 610 } },
};
// The gaps between counters are the only way from the top lane (in front of
// the pantry, behind the counters) to the bottom lane: each is wider than the
// chef, so a straight walk through one never wedges. The lane centres are
// where a route travels when it is not heading for a station.
export const GAPS = [280, 620, 964];
export const TOP_LANE_Y = 348;
export const BOT_LANE_Y = 580;
// Pantry bins sit on the pantry counter, one per ingredient.
export const PANTRY_BINS = PANTRY_ORDER.map((kind, i) => ({
  kind,
  x: STATIONS.pantry.x + 14 + i * 96,
  y: STATIONS.pantry.y + 10,
  w: 84,
  h: 54,
}));

export const CHEF = { speed: 250, radius: 22, startX: 640, startY: 600 };
export const CHOP_SECONDS = 1.1; // holding E at the board
export const BURN_AFTER_SECONDS = 7; // a finished dish burns if left on the burner
export const COMBO_CAP = 2.0; // coin multiplier cap
export const MISS_PENALTY = 5; // coins lost when a ticket expires

// --- Look --------------------------------------------------------------------
export const PALETTE = {
  wall: '#f7e3c2',
  wallDark: '#e8c99a',
  floor: '#d9a05b',
  floorDark: '#c98f4b',
  counter: '#8d5a2b',
  counterTop: '#b5773a',
  counterEdge: '#6b421d',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  hud: '#33241a',
  hudEdge: '#1f150e',
  cream: '#fff8e7',
  ink: '#2b1a10',
  gold: '#ffb300',
  red: '#e5484d',
  green: '#43a047',
};
