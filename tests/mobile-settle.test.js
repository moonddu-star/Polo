const assert = require('node:assert/strict');
const { method, handler } = require('./component-source');

const VH = 844;
const DOC = 9828;
const MAX = DOC - VH;
// how far in front of a stop the settle offers to finish the job
const REACH = VH * 0.16;
// the last screen holds trailer, buttons and footer at once, so no rival stop
// is allowed within this of the page end
const END_GUARD = VH * 0.5;

// story stretch: 2024 -> its beats read centred at 10/46/79% of the pinned travel
const STORY_TOP = 2024;
const STORY_H = 2701;
const STORY_TRAVEL = STORY_H - VH;
const STORY_END = STORY_TOP + STORY_TRAVEL;
// one screen-tall section per stop, plus two short ones at the bottom that must
// not become stops of their own
const SECTIONS = [
  { label: 'landing', top: 0, height: 1180, cls: ['cs-landing'] },
  { label: 'prologue', top: 1180, height: VH, cls: ['cs-tall'] },
  { label: 'forest', top: 4724, height: VH, cls: ['cs-scene3'] },
  { label: 'cook', top: 5568, height: VH, cls: ['cs-interlude'] },
  { label: 'cats', top: 6412, height: VH, cls: ['cs-cats'] },
  { label: 'deepnight', top: 7256, height: VH, cls: ['cs-tall'] },
  { label: 'guitar', top: 8100, height: VH, cls: ['cs-tall'] },
  { label: 'trailer', top: 8944, height: 572, cls: ['cs-tall', 'cs-trailer'] },
  { label: 'stores', top: 9516, height: 229, cls: ['cs-bottom-download'] }
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
// the prologue the menu points at, one screen above the first beat
const PROLOGUE = SECTIONS.find((s) => s.label === 'prologue');
const storyStart = {
  classList: { contains: (c) => PROLOGUE.cls.includes(c) },
  getBoundingClientRect: () => rect(PROLOGUE.top, PROLOGUE.height)
};

global.document = {
  documentElement: { scrollHeight: DOC },
  getElementById: (id) => (id === 'story-start' ? storyStart : null),
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
  updateScroll: () => {},
  closeMenu: () => {},
  centreOf: method('centreOf'),
  clampStop: method('clampStop'),
  storyStops: method('storyStops'),
  jumpToStory: method('jumpToStory'),
  settleTargets: method('settleTargets'),
  settleScroll: method('settleScroll'),
  scheduleSettle: method('scheduleSettle'),
  glideTo: method('glideTo'),
  cancelSettle: method('cancelSettle')
};

// dir is the way the reader was last moving: the settle only looks that way
function at(y, dir) {
  global.window.scrollY = y;
  scrolls.length = 0;
  frame = null;
  clock = 0;
  app._settling = false;
  app._scrollDir = dir === undefined ? 1 : dir;
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
assert.ok(targets.includes(1180), 'screen-tall section is not a resting point');
assert.ok(!targets.includes(0), 'hero must not be a resting point');
assert.ok(
  targets.every((t) => t >= 0 && t <= MAX),
  'a resting point sits outside the scrollable range'
);
// short sections would steal the stop from the screen they belong to, so every
// stop has to trace back to a story beat or a screen-tall section. The bottom
// stores strip centres past the end of the scroll range, where the clamp hides
// it, so its own gate is covered by the last-screen filter below.
const allowed = new Set();
for (const f of [0.10, 0.46, 0.79]) allowed.add(Math.round(STORY_TOP + f * STORY_TRAVEL));
for (const s of SECTIONS) {
  if (s.cls.includes('cs-landing') || s.height < VH * 0.4) continue;
  allowed.add(Math.round(s.top + s.height / 2 - VH / 2));
}
assert.deepEqual(
  targets.filter((t) => !allowed.has(t)),
  [],
  'a resting point came from something other than a beat or a full screen'
);

// --- the menu jump --------------------------------------------------------
// The entry promises the start of the story, which is the prologue, not the
// first night a screen below it. It also has to finish exactly where a scroll
// would have come to rest, or the settle nudges the reader on first touch.
at(0);
app.jumpToStory();
const landed = global.window.scrollY;
assert.equal(
  landed,
  Math.round(PROLOGUE.top + PROLOGUE.height / 2 - VH / 2),
  'the menu jump did not land on the prologue'
);
assert.ok(
  landed < STORY_TOP,
  'the menu jump overshot into the story beats instead of opening at the prologue'
);
assert.ok(app.settleTargets().includes(landed), 'the menu jump did not land on a resting point');
at(landed);
app.settleScroll();
assert.equal(scrolls.length, 0, 'the settle tugged the page after the menu jump');
// the last screen shows the trailer, the store buttons and the footer at once.
// there is nothing to centre there, and settling would fight a reader reaching
// for a badge or scrubbing the video, so the whole screen stays unassisted
assert.deepEqual(
  targets.filter((t) => MAX - t <= END_GUARD),
  [],
  'a stop survives inside the final trailer and download screen'
);

// Looking only forward means REACH no longer has to span half the distance
// between two scenes; it is the run-up in front of each stop, and a reader who
// pauses before it simply stays put. So the shape to hold is a band: wide
// enough that every scene really does offer to centre itself, narrow enough
// that the offer never becomes a haul across a third of the screen.
const sorted = targets.slice().sort((a, b) => a - b);
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i - 1] < STORY_END) continue;
  const gap = sorted[i] - sorted[i - 1];
  assert.ok(REACH >= gap * 0.12, `only ${Math.round(REACH / gap * 100)}% of a ${gap}px gap gets any help`);
  assert.ok(REACH <= gap * 0.25, `a ${gap}px gap starts pulling from ${REACH}px out, close enough to a grab`);
}

// --- the glide ------------------------------------------------------------
at(4820, -1);
app.settleScroll();
assert.ok(frame, 'nearby stop did not start a glide');
const path = runGlide();
assert.equal(global.window.scrollY, 4724, 'glide did not land exactly on the stop');
assert.equal(app._settling, false, 'glide left the settling flag raised');
assert.ok(path.length > 12, `glide finished in ${path.length} frames, too abrupt to read as natural`);
// smootherstep: leaves from rest and arrives at rest, so the ends creep and
// the middle carries the distance
const stepAt = (i) => Math.abs(path[i] - path[i - 1]);
const mid = Math.floor(path.length / 2);
assert.ok(stepAt(1) < stepAt(mid), 'glide starts at full speed instead of easing in');
assert.ok(stepAt(path.length - 1) < stepAt(mid), 'glide stops dead instead of easing out');

// --- how hard it pulls ----------------------------------------------------
// The longest pull the settle can make is what the reader feels as tension, so
// pin the distance and the fastest frame, not just the shape of the curve.
const FOREST = 4724;
const LONGEST = Math.floor(REACH);
at(FOREST - LONGEST, 1);
app.settleScroll();
assert.ok(frame, 'a pause at the far edge of the run-up got no help');
const pull = runGlide();
assert.equal(global.window.scrollY, FOREST, 'the longest pull did not land on the stop');
assert.ok(LONGEST <= VH * 0.2, `the settle can move the page ${LONGEST}px the reader never asked for`);
let fastest = 0;
for (let i = 1; i < pull.length; i++) {
  fastest = Math.max(fastest, Math.abs(pull[i] - pull[i - 1]) / 16 * 1000);
}
fastest = Math.round(fastest);
assert.ok(fastest <= 500, `the glide peaks at ${fastest}px/s, fast enough to read as a yank`);
assert.ok(fastest >= 280, `the glide peaks at ${fastest}px/s, so slow it drifts`);
const span = pull.length * 16;
assert.ok(span >= 600 && span <= 1000, `the longest glide runs ${span}ms, out of the readable band`);

at(MAX);
app.settleScroll();
assert.equal(frame, null, 'reaching the bottom dragged the reader back up');

at(1180);
app.settleScroll();
assert.equal(frame, null, 'already-centred screen was nudged again');

at(400);
app.settleScroll();
assert.equal(frame, null, 'hero got pulled down');

// midway through the story's tail every stop is out of reach, and the page
// stays put rather than hauling the reader across
const tail = Math.round((3491 + 4724) / 2);
assert.ok(
  Math.min(tail - 3491, 4724 - tail) > REACH,
  'fixture no longer has an out-of-reach spot to check'
);
at(tail);
app.settleScroll();
assert.equal(frame, null, 'a stop beyond the run-up still yanked the page');

// a touch mid-glide abandons it where it is
at(4900, -1);
app.settleScroll();
runGlide(3);
const abandoned = global.window.scrollY;
app.cancelSettle();
runGlide();
assert.equal(global.window.scrollY, abandoned, 'glide kept running after being cancelled');
assert.equal(app._settling, false, 'cancelled glide left the settling flag raised');

// --- reading onward -------------------------------------------------------
// Stops sit about a screen apart, so a reader who pauses in the first half of
// a gap is nearest the scene behind them. Taking that stop hauled them back
// where they came from, and because a small scroll never reached the halfway
// line, gentle scrolling in those bands could not make any progress at all.
const stops = targets.slice().sort((a, b) => a - b);
for (let i = 1; i < stops.length; i++) {
  for (let y = stops[i - 1] + 20; y < stops[i]; y += 20) {
    at(y, 1);
    app.settleScroll();
    if (frame) runGlide();
    assert.ok(
      global.window.scrollY >= y,
      `reading down at ${y} was dragged back to ${global.window.scrollY}`
    );
    at(y, -1);
    app.settleScroll();
    if (frame) runGlide();
    assert.ok(
      global.window.scrollY <= y,
      `reading up at ${y} was pushed on to ${global.window.scrollY}`
    );
  }
}

// the reported case: pausing on the way from the "깊어가는 밤" screen down to
// the trailer used to fling the reader back up to it
const DEEPNIGHT = 7256;
const GUITAR = 8100;
assert.ok(targets.includes(DEEPNIGHT) && targets.includes(GUITAR), 'fixture lost the bottom stops');
at(DEEPNIGHT + 400, 1);
app.settleScroll();
if (frame) runGlide();
assert.ok(
  global.window.scrollY >= DEEPNIGHT + 400,
  `a pause on the way to the trailer was dragged back to ${global.window.scrollY}`
);

// once inside the run-up the offer still stands and lands on the scene
at(GUITAR - 100, 1);
app.settleScroll();
assert.ok(frame, 'a pause inside the run-up got no help at all');
runGlide();
assert.equal(
  global.window.scrollY,
  GUITAR,
  'the run-up did not carry on to the next screen'
);

// walking down in small steps has to actually go somewhere
at(GUITAR, 1);
let walked = GUITAR;
for (let i = 0; i < 8; i++) {
  at(walked + 45, 1);
  app.settleScroll();
  if (frame) runGlide();
  walked = global.window.scrollY;
}
assert.ok(
  walked >= GUITAR + 8 * 45,
  `eight small scrolls moved ${walked - GUITAR}px instead of ${8 * 45}px`
);

// --- which way the reader is going ----------------------------------------
// Glancing back is not a decision to go back. While the direction turned on
// the first event pointing the other way, a 25px look-up just below a scene
// aimed the settle uphill and hauled the reader a hundred pixels onto it.
const onScroll = handler('onScroll')(app);
function drive(from, steps) {
  global.window.scrollY = from;
  app._lastY = from;
  app._scrollDir = 1;
  app._dirRun = 0;
  app._settling = false;
  app._scrollRaf = 0;
  for (const d of steps) {
    global.window.scrollY += d;
    onScroll();
  }
  frame = null;
  clock = 0;
  scrolls.length = 0;
  return app._scrollDir;
}

const GLANCE = [-12, -13];
const COMMITTED = [-25, -25, -25, -25];
assert.equal(drive(8300, GLANCE), 1, 'a 25px glance back flipped the reading direction');
assert.equal(drive(8300, COMMITTED), -1, 'a committed 100px scroll up never took hold');
assert.equal(drive(8300, [40, 40]), 1, 'reading onward somehow changed direction');

// the payoff: a glance just under a scene leaves the page where the reader put it
drive(GUITAR + 80, GLANCE);
app.settleScroll();
assert.equal(frame, null, 'a glance back below a scene was pulled uphill');

// while a deliberate scroll up still gets the scene centred
drive(GUITAR + 200, COMMITTED);
app.settleScroll();
assert.ok(frame, 'a committed scroll up got no help');
runGlide();
assert.equal(global.window.scrollY, GUITAR, 'reading up did not land on the scene');

// the final screen carries the trailer and the store badges, so no scroll
// anywhere inside it may be taken over, in either direction
for (let y = MAX - Math.round(END_GUARD); y <= MAX; y += 20) {
  for (const dir of [1, -1]) {
    at(y, dir);
    app.settleScroll();
    assert.equal(
      frame,
      null,
      `scrolling ${dir > 0 ? 'down' : 'up'} at ${y} was settled inside the trailer screen`
    );
  }
}

// --- the gates ------------------------------------------------------------
const gated = (patch, why) => {
  at(4900, -1);
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
assert.equal(
  [...timers.values()][0].ms,
  240,
  'the settle jumps in before the reader has really stopped'
);

timers.clear();
app._settling = true;
app.scheduleSettle();
assert.equal(
  [...timers.values()][0].ms,
  320,
  'a running glide must defer the next check, not cancel it'
);

timers.clear();
app._settling = false;
app._touching = true;
app.scheduleSettle();
assert.equal(timers.size, 0, 'a check was queued while the finger was down');

console.log('mobile settle resting points, glide easing and gating passed');
