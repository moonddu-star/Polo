const assert = require('node:assert/strict');
const { method } = require('./component-source');

const VH = 844;
const DOC = 9795;
const MAX = DOC - VH;

// story stretch: 2052 -> its beats read centred at 10/46/79% of the pinned travel
const STORY_TOP = 2052;
const STORY_H = 2701;
const STORY_TRAVEL = STORY_H - VH;
// one screen-tall section per stop, plus a short one that must not become a stop
const SECTIONS = [
  { label: 'landing', top: 0, height: VH, cls: ['cs-landing'] },
  { label: 'prologue', top: 1208, height: VH, cls: ['cs-tall'] },
  { label: 'forest', top: 4753, height: VH, cls: ['cs-scene3'] },
  { label: 'cook', top: 5597, height: VH, cls: ['cs-interlude'] },
  { label: 'cats', top: 6441, height: VH, cls: ['cs-cats'] },
  { label: 'deepnight', top: 7285, height: VH, cls: ['cs-tall'] },
  { label: 'guitar', top: 8129, height: VH, cls: ['cs-tall'] },
  { label: 'trailer', top: 8797, height: VH, cls: ['cs-trailer'] },
  { label: 'stores', top: 9465, height: 229, cls: ['cs-bottom-download'] }
];

let scrollTarget = null;
const timers = new Map();
let nextTimer = 1;

global.setTimeout = (fn, ms) => {
  const id = nextTimer++;
  timers.set(id, { fn, ms });
  return id;
};
global.clearTimeout = (id) => timers.delete(id);

function rect(top, height) {
  const t = top - global.window.scrollY;
  return { top: t, bottom: t + height, height };
}

global.window = {
  innerHeight: VH,
  scrollY: 0,
  scrollTo: (opts) => { scrollTarget = opts; }
};
global.document = {
  documentElement: { scrollHeight: DOC },
  getElementById: () => null,
  querySelectorAll: () => SECTIONS.map((s) => ({
    classList: { contains: (c) => s.cls.includes(c) },
    getBoundingClientRect: () => rect(s.top, s.height)
  }))
};

const app = {
  refs2: {
    scene2: {
      offsetHeight: STORY_H,
      getBoundingClientRect: () => rect(STORY_TOP, STORY_H)
    }
  },
  _loaderGone: true,
  compactUi: () => true,
  settleTargets: method('settleTargets'),
  settleScroll: method('settleScroll'),
  scheduleSettle: method('scheduleSettle')
};

function at(y) {
  global.window.scrollY = y;
  scrollTarget = null;
}

// --- the stops themselves -------------------------------------------------
at(0);
const targets = app.settleTargets();
for (const f of [0.10, 0.46, 0.79]) {
  const beat = Math.round(STORY_TOP + f * STORY_TRAVEL);
  assert.ok(targets.includes(beat), `story beat at ${f} is not a resting point (${beat})`);
}
assert.ok(targets.includes(1208), 'screen-tall section is not a resting point');
assert.ok(targets.includes(MAX), 'page end is not a resting point');
assert.ok(!targets.includes(0), 'hero must not be a resting point');
assert.ok(
  targets.every((t) => t >= 0 && t <= MAX),
  'a resting point sits outside the scrollable range'
);
// short sections would steal the stop from the screen they belong to
assert.ok(
  !targets.includes(9465 + 229 / 2 - VH / 2),
  'sub-screen section became a resting point'
);

// no reader should ever be left more than half a screen from a stop
const sorted = targets.slice().sort((a, b) => a - b);
for (let i = 1; i < sorted.length; i++) {
  const gap = sorted[i] - sorted[i - 1];
  assert.ok(gap / 2 <= VH * 0.75, `gap of ${gap}px between stops is wider than the glide reach`);
}

// --- the glide ------------------------------------------------------------
at(5000);
app.settleScroll();
assert.equal(scrollTarget && scrollTarget.top, 4753, 'nearby stop was not glided to');
assert.equal(scrollTarget.behavior, 'smooth', 'settle jumped instead of gliding');

at(MAX);
app.settleScroll();
assert.equal(scrollTarget, null, 'reaching the bottom dragged the reader back up');

at(1208);
app._settling = false;
app.settleScroll();
assert.equal(scrollTarget, null, 'already-centred screen was nudged again');

at(400);
app.settleScroll();
assert.equal(scrollTarget, null, 'hero got pulled down');

// --- the gates ------------------------------------------------------------
const gated = (patch, why) => {
  at(5000);
  const restore = {};
  for (const k of Object.keys(patch)) { restore[k] = app[k]; app[k] = patch[k]; }
  app._settling = false;
  app.settleScroll();
  assert.equal(scrollTarget, null, why);
  for (const k of Object.keys(patch)) app[k] = restore[k];
};
gated({ _touching: true }, 'settled while a finger was still on the glass');
gated({ compactUi: () => false }, 'settled on desktop');
gated({ _loaderGone: false }, 'settled before the loader finished');
gated({ _menuOpen: true }, 'settled with the menu open');

// --- scheduling -----------------------------------------------------------
app._touching = false;
app._settling = false;
timers.clear();
app.scheduleSettle();
assert.equal([...timers.values()][0].ms, 140, 'idle settle check is not prompt');

timers.clear();
app._settling = true;
app.scheduleSettle();
assert.equal(
  [...timers.values()][0].ms,
  780,
  'a running glide must defer the next check, not cancel it'
);

timers.clear();
app._settling = false;
app._touching = true;
app.scheduleSettle();
assert.equal(timers.size, 0, 'a check was queued while the finger was down');

console.log('mobile settle resting points and gating passed');
