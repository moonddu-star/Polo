const assert = require('node:assert/strict');
const test = require('node:test');
const { js, callback } = require('./component-source.js');

// The cadence has been retuned several times: quieter for CPU, then busier, then
// busier again. Two numbers decide it and they live far apart in the file, so
// they are read back out of the shipped source rather than restated here.
const TICK = Number(/this\.shootTimer = setInterval\([\s\S]*?\}, (\d+)\);/.exec(js)[1]);
const LIFE = Number(/sh\.life \+= step \/ ([\d.]+);/.exec(js)[1]);
const PREVIOUS_TICK = 3000;

const spawn = callback('this.shootTimer = setInterval(');

// Deterministic stand-in for Math.random so the two cadences see the same rolls.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Run one cadence over a fixed stretch of night and report what it produced.
function run(tick, minutes) {
  const shooters = [];
  const ctx = {
    shooters,
    dayAlpha: 0,
    reducedMotion: () => false
  };
  const fire = spawn(ctx);
  const random = seeded(7);
  const realRandom = Math.random;
  Math.random = random;
  global.document = { hidden: false };
  let spawns = 0;
  let mostAtOnce = 0;
  try {
    const span = minutes * 60 * 1000;
    for (let t = 0; t < span; t += tick) {
      // whatever was launched more than a lifetime ago has finished crossing
      while (shooters.length && t - shooters[0].bornAt >= LIFE * 1000) shooters.shift();
      const before = shooters.length;
      fire();
      if (shooters.length > before) {
        shooters[shooters.length - 1].bornAt = t;
        spawns++;
      }
      mostAtOnce = Math.max(mostAtOnce, shooters.length);
    }
  } finally {
    Math.random = realRandom;
    delete global.document;
  }
  return { spawns, mostAtOnce, perMinute: spawns / minutes };
}

test('shooting stars fall twice as often, still one at a time', () => {
  const MINUTES = 60;
  const now = run(TICK, MINUTES);
  const before = run(PREVIOUS_TICK, MINUTES);

  // the whole point of the change
  const gain = now.spawns / before.spawns;
  assert.ok(gain > 1.9 && gain < 2.1, `firing rate should double, got ${gain.toFixed(3)}x`);

  // a tick is skipped while one is still crossing the sky, so a cadence faster
  // than a shooter's lifetime would quietly cap out instead of doubling
  assert.ok(TICK > LIFE * 1000, `tick ${TICK}ms must outlast a shooter (${LIFE * 1000}ms)`);
  assert.equal(now.mostAtOnce, 1, 'never more than one shooter in flight');

  // a sanity floor on the absolute cadence: often enough to notice while
  // waiting on one screen, not so often the sky turns into rain
  assert.ok(
    now.perMinute > 20 && now.perMinute < 40,
    `expected 20-40 shooters a minute, got ${now.perMinute.toFixed(1)}`
  );
});

test('no shooters while the tab is hidden or the sky is bright', () => {
  const shooters = [];
  const ctx = { shooters, dayAlpha: 0, reducedMotion: () => false };
  const fire = spawn(ctx);
  const realRandom = Math.random;
  Math.random = () => 0; // always inside the 0.75 chance
  try {
    global.document = { hidden: true };
    for (let i = 0; i < 50; i++) fire();
    assert.equal(shooters.length, 0, 'hidden tab must not accumulate shooters');

    global.document = { hidden: false };
    ctx.dayAlpha = 0.9; // daylight
    for (let i = 0; i < 50; i++) fire();
    assert.equal(shooters.length, 0, 'no shooters in a bright sky');

    ctx.dayAlpha = 0;
    fire();
    assert.equal(shooters.length, 1, 'night sky should launch one');
  } finally {
    Math.random = realRandom;
    delete global.document;
  }
});
