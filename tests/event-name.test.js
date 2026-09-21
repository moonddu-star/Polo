// The event name is spelled in nine places: the hero line in the string table,
// the two strings the page re-applies over the head, and six head tags that
// kakao and the browser tab read before any script runs. A rename that misses
// one of them ships a share card naming an event that no longer exists.

const test = require('node:test');
const assert = require('node:assert/strict');
const { html, js } = require('./component-source.js');

function string(key) {
  const m = new RegExp(`\\n  ${key}: '((?:[^'\\\\]|\\\\.)*)'`).exec(js);
  assert.notEqual(m, null, `missing T.${key}`);
  return m[1].replace(/\\'/g, "'");
}

function meta(attr, name) {
  const m = new RegExp(`<meta ${attr}="${name}" content="([^"]*)">`).exec(html);
  assert.notEqual(m, null, `missing <meta ${attr}="${name}">`);
  return m[1];
}

const TITLES = [
  ['<title>', /<title>([^<]*)<\/title>/.exec(html)[1]],
  ['og:title', meta('property', 'og:title')],
  ['twitter:title', meta('name', 'twitter:title')],
];

const DESCS = [
  ['description', meta('name', 'description')],
  ['og:description', meta('property', 'og:description')],
  ['twitter:description', meta('name', 'twitter:description')],
];

test('the share card names the same event as the page', () => {
  const event = string('eventLine2');
  assert.ok(event.length > 6, 'the hero lost its event name');

  for (const [where, value] of [...TITLES, ...DESCS]) {
    assert.ok(value.includes(event), `${where} does not name "${event}": ${value}`);
  }
});

test('the head says one thing, not three', () => {
  for (const group of [TITLES, DESCS]) {
    const [first, ...rest] = group;
    for (const [where, value] of rest) {
      assert.equal(value, first[1], `${where} drifted from ${first[0]}`);
    }
  }
});

test('the strings the script re-applies match the head it overwrites', () => {
  // applyText() rewrites the title and the og/twitter tags after boot, so a
  // stale string here would swap the name back in front of the reader.
  assert.equal(string('pageTitle'), TITLES[0][1], 'T.pageTitle would overwrite the title with something else');
  assert.equal(string('pageDesc'), DESCS[0][1], 'T.pageDesc would overwrite the description with something else');
});

test('no page text still calls it a 폴로대회', () => {
  const copy = [...TITLES, ...DESCS].map(([, v]) => v).concat(string('eventLine2'), string('eventLine1'));
  for (const value of copy) {
    assert.ok(!value.includes('폴로대회'), `renamed away from 폴로대회, but this kept it: ${value}`);
  }
});
