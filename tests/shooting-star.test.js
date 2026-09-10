const assert = require('node:assert/strict');
const test = require('node:test');
const { js, callback } = require('./component-source.js');

// The effect was taken wholesale from the Cats & Soup homepage so both sites
// read as one sky. Its four numbers are restated here rather than read out of
// that repo, which is not checked out beside this one. Retune it there first,
// then move these.
const SOURCE = { tick: 1900, odds: 0.6, step: 0.04, maxLife: 1.25 };

// Read back out of the shipped source: the cadence lives hundreds of lines away
// from the flight, and the two have drifted apart before.
const TICK = Number(/this\.shootTimer = setInterval\([\s\S]*?\}, (\d+)\);/.exec(js)[1]);
const ODDS = Number(/if \(Math\.random\(\) < ([\d.]+)\) \{\s*this\.shooters\.push/.exec(js)[1]);
const STEP = Number(/sh\.life \+= ([\d.]+);/.exec(js)[1]);
const MAX_LIFE = Number(/const maxLife = ([\d.]+);/.exec(js)[1]);
const TIMER = /this\.shootTimer = setInterval\(([\s\S]*?)\}, \d+\);/.exec(js)[1];

const spawn = callback('this.shootTimer = setInterval(');

// Deterministic stand-in for Math.random so a rerun counts the same launches.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Tick one stretch of night through and report how much fell.
function run(minutes) {
  const shooters = [];
  const fire = spawn({ shooters, reducedMotion: () => false });
  const realRandom = Math.random;
  Math.random = seeded(7);
  global.document = { hidden: false };
  try {
    const span = minutes * 60 * 1000;
    for (let t = 0; t < span; t += TICK) fire();
  } finally {
    Math.random = realRandom;
    delete global.document;
  }
  return shooters.length / minutes;
}

test('the sky matches the Cats & Soup one it was taken from', () => {
  assert.equal(TICK, SOURCE.tick, 'launch cadence drifted from the original');
  assert.equal(ODDS, SOURCE.odds, 'launch odds drifted from the original');
  assert.equal(STEP, SOURCE.step, 'flight speed drifted from the original');
  assert.equal(MAX_LIFE, SOURCE.maxLife, 'flight length drifted from the original');

  // The original launches on a timer alone. Both gates this page used to add are
  // gone on purpose: nothing caps how many are aloft, which is what lets a slow
  // device show an overlap instead of dropping the second launch on the floor.
  assert.doesNotMatch(TIMER, /shooters\.length/, 'the one-at-a-time cap came back');
  assert.doesNotMatch(TIMER, /dayAlpha/, 'the daylight gate came back');
});

test('a shooter crosses fast enough to stay a glimpse', () => {
  // The original advances a fixed amount per frame, so this is the 60Hz figure.
  const seconds = MAX_LIFE / STEP / 60;
  assert.ok(seconds > 0.45 && seconds < 0.6, `expected about half a second, got ${seconds.toFixed(2)}s`);

  // Far enough inside the gap between launches that the sky still reads calm.
  assert.ok(seconds * 1000 < TICK, `a ${seconds.toFixed(2)}s flight must fit inside the ${TICK}ms gap`);
});

test('shooting stars fall often enough to catch, not often enough to rain', () => {
  const perMinute = run(60);
  const expected = (60000 / TICK) * ODDS;
  assert.ok(
    Math.abs(perMinute - expected) < 3,
    `expected about ${expected.toFixed(1)} a minute, got ${perMinute.toFixed(1)}`
  );
});

test('no shooters while the tab is hidden or motion is turned down', () => {
  const shooters = [];
  const ctx = { shooters, reducedMotion: () => true };
  const fire = spawn(ctx);
  const realRandom = Math.random;
  Math.random = () => 0; // always inside the launch odds
  try {
    global.document = { hidden: true };
    for (let i = 0; i < 50; i++) fire();
    assert.equal(shooters.length, 0, 'hidden tab must not accumulate shooters');

    global.document = { hidden: false };
    for (let i = 0; i < 50; i++) fire();
    assert.equal(shooters.length, 0, 'reduced motion must not accumulate shooters');

    ctx.reducedMotion = () => false;
    fire();
    assert.equal(shooters.length, 1, 'a visible night sky should launch one');
  } finally {
    Math.random = realRandom;
    delete global.document;
  }
});
