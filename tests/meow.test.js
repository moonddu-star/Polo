const assert = require('node:assert/strict');
const test = require('node:test');
const { html, js } = require('./component-source.js');

// Every cat opts in by carrying one class; a single document-level listener
// does the rest. So a cat that reads as tappable and misses the class is
// silent, and nothing in the markup says why.
test('the meow is delegated by class, not wired per cat', () => {
  assert.match(js, /closest\('\.cs-meowcat'\)/, 'the meow listener no longer picks cats by class');
  assert.match(
    js,
    /document\.addEventListener\('click', this\._onMeowClick, true\)/,
    'the meow listener is no longer bound on the document'
  );
});

test('the polo cats meow like the rest of them', () => {
  const hero = /<img[^>]*src="assets\/cats_polo\.webp"[^>]*>/.exec(html);
  assert.ok(hero, 'the polo hero image is gone');
  assert.match(hero[0], /class="[^"]*\bcs-meowcat\b/, 'the polo cats do not meow');
});

test('the markup and the stylesheet agree on which cats are tappable', () => {
  const rule = /\.cs-meowcat \{([^}]*)\}/.exec(html);
  assert.ok(rule, 'the tappable-cat rule is gone');
  assert.match(rule[1], /cursor: pointer/, 'tappable cats lost their pointer cursor');
  // The polo cats were silent for exactly this reason: a rule above them set
  // pointer-events to none, so every tap resolved to the container.
  assert.match(rule[1], /pointer-events: auto/, 'a decorative rule can silence a cat again');

  const tagged = html.match(/\bcs-meowcat\b/g) || [];
  // one stylesheet rule plus the cats themselves
  assert.ok(tagged.length > 8, `expected the whole cast tagged, found ${tagged.length}`);
});

test('no cat is left decorative by its own rule', () => {
  // Order matters here: .cs-hero-cat and .cs-meowcat carry the same weight, so
  // whichever is written later wins. Rather than rely on that, a cat's own rule
  // must not turn pointer events off in the first place.
  // Checked in every block, not just the first: the mobile override is a
  // second .cs-hero-cat rule further down the stylesheet.
  const heroRules = [...html.matchAll(/\.cs-hero-cat \{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(heroRules.length > 0, 'the polo hero rule is gone');
  for (const rule of heroRules) {
    assert.doesNotMatch(rule, /pointer-events: none/, 'the polo cats are decorative again');
  }
});

// The bubble text is written out four times: once in the string table and once
// as a fallback at each place that reads it. One of those fallbacks had been
// sitting there with its korean mangled into question marks.
test('every meow fallback still spells what the string table says', () => {
  const canonical = /meowText: '([^']*)'/.exec(js);
  assert.ok(canonical, 'the meow text is gone from the string table');

  const fallbacks = [...js.matchAll(/meowText\b[^;\n]*\|\|\s*'([^']*)'/g)].map((m) => m[1]);
  assert.ok(fallbacks.length > 0, 'no meow fallback found to check');
  for (const f of fallbacks) {
    assert.equal(f, canonical[1], 'a meow fallback drifted from the string table');
  }
});
