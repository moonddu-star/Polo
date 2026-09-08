const assert = require('node:assert/strict');
const { method } = require('./component-source');

const VH = 844;
const DOC = 9795;
const MAX = DOC - VH;
const REACH = VH * 0.5;

// story stretch: 2052 -> its beats read centred at 10/46/79% of the pinned travel
const STORY_TOP = 2052;
const STORY_H = 2701;
const STORY_TRAVEL = STORY_H - VH;
const STORY_END = STORY_TOP + STORY_TRAVEL;
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

const timers = new Map();
let nextTimer = 1;
global.setTimeout = (fn, ms) => {
  const id = nextTimer++;
  timers.set(id, { fn, ms });
  return id;
};
global.clearTimeout = (id) => timers.delete(id);

// hand-pumped clock and frame queue so the glide can be stepped deterministically
let clock = 0;
let frame = null;
global.performance = { now: () => clock };
global.requestAnimationFrame = (fn) => { frame = fn; return 1; };
global.cancelAnimationFrame = () => { frame = null; };

const scrolls = [];
function rect(top, height) {
  const t = top - global.window.scrollY;
  return { top: t, bottom: t + height, height };
}

global.window = {
  innerHeight: VH,
  scrollY: 0,
  scrollTo: (x, y) => { global.window.scrollY = y; scrolls.push(y); }
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
  scheduleSettle: method('scheduleSettle'),
  glideTo: method('glideTo'),
  cancelSettle: method('cancelSettle')
};

function at(y) {
  global.window.scrollY = y;
  scrolls.length = 0;
  frame = null;
  clock = 0;
  app._settling = false;
}

// run a queued glide to completion, returning the frames it produced
function runGlide(maxFrames = 400) {
  const seen = [];
  for (let i = 0; i < maxFrames && frame; i++) {
    const fn = frame;
    frame = null;
    clock += 16;
    fn(clock);
    seen.push(global.window.scrollY);
  }
  return seen;
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
// the last screen shows trailer, buttons and footer at once; a second stop
// just above the end would make the two fight over every small scroll
assert.deepEqual(
  targets.filter((t) => t !== MAX && MAX - t <= REACH),
  [],
  'a rival stop survives right below the page end'
);

// every scene after the story sits one screen from the next, so the glide
// must reach across all of them
const sorted = targets.slice().sort((a, b) => a - b);
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i - 1] < STORY_END) continue;
  const gap = sorted[i] - sorted[i - 1];
  assert.ok(gap / 2 <= REACH, `scenes ${gap}px apart sit outside the glide's reach`);
}

// --- the glide ------------------------------------------------------------
at(5000);
app.settleScroll();
assert.ok(frame, 'nearby stop did not start a glide');
const path = runGlide();
assert.equal(global.window.scrollY, 4753, 'glide did not land exactly on the stop');
assert.equal(app._settling, false, 'glide left the settling flag raised');
assert.ok(path.length > 12, `glide finished in ${path.length} frames, too abrupt to read as natural`);
// smootherstep: leaves from rest and arrives at rest, so the ends creep and
// the middle carries the distance
const stepAt = (i) => Math.abs(path[i] - path[i - 1]);
const mid = Math.floor(path.length / 2);
assert.ok(stepAt(1) < stepAt(mid), 'glide starts at full speed instead of easing in');
assert.ok(stepAt(path.length - 1) < stepAt(mid), 'glide stops dead instead of easing out');

at(MAX);
app.settleScroll();
assert.equal(frame, null, 'reaching the bottom dragged the reader back up');

at(1208);
app.settleScroll();
assert.equal(frame, null, 'already-centred screen was nudged again');

at(400);
app.settleScroll();
assert.equal(frame, null, 'hero got pulled down');

// midway through the story's tail every stop is out of reach, and the page
// stays put rather than hauling the reader across
const tail = Math.round((3519 + 4753) / 2);
assert.ok(
  Math.min(tail - 3519, 4753 - tail) > REACH,
  'fixture no longer has an out-of-reach spot to check'
);
at(tail);
app.settleScroll();
assert.equal(frame, null, 'a stop further than half a screen still yanked the page');

// a touch mid-glide abandons it where it is
at(5000);
app.settleScroll();
runGlide(3);
const abandoned = global.window.scrollY;
app.cancelSettle();
runGlide();
assert.equal(global.window.scrollY, abandoned, 'glide kept running after being cancelled');
assert.equal(app._settling, false, 'cancelled glide left the settling flag raised');

// --- the gates ------------------------------------------------------------
const gated = (patch, why) => {
  at(5000);
  const restore = {};
  for (const k of Object.keys(patch)) { restore[k] = app[k]; app[k] = patch[k]; }
  app.settleScroll();
  assert.equal(frame, null, why);
  for (const k of Object.keys(patch)) app[k] = restore[k];
};
gated({ _touching: true }, 'settled while a finger was still on the glass');
gated({ _settling: true }, 'started a second glide on top of a running one');
gated({ compactUi: () => false }, 'settled on desktop');
gated({ _loaderGone: false }, 'settled before the loader finished');
gated({ _menuOpen: true }, 'settled with the menu open');

// --- scheduling -----------------------------------------------------------
at(5000);
app._touching = false;
timers.clear();
app.scheduleSettle();
assert.equal([...timers.values()][0].ms, 140, 'idle settle check is not prompt');

timers.clear();
app._settling = true;
app.scheduleSettle();
assert.equal(
  [...timers.values()][0].ms,
  260,
  'a running glide must defer the next check, not cancel it'
);

timers.clear();
app._settling = false;
app._touching = true;
app.scheduleSettle();
assert.equal(timers.size, 0, 'a check was queued while the finger was down');

console.log('mobile settle resting points, glide easing and gating passed');
