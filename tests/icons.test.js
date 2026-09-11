const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { html } = require('./component-source.js');

// The icons used to be files pulled in as CSS masks. One host serves this page
// under a CSP sandbox without allow-same-origin, which makes even its own
// assets cross-origin; a mask image has to pass CORS, so every icon rendered
// as nothing while the ordinary <img> cats were fine. Drawing them inline
// removes the fetch, and with it the whole class of failure.
test('icons are drawn inline, never fetched', () => {
  assert.doesNotMatch(html, /mask(-image)?\s*:/, 'an icon went back to being a CSS mask');
  assert.doesNotMatch(html, /icon_link\.webp|instagram\.svg|youtube\.svg|tik-tok\.svg|pinterest\.svg/, 'an icon is being loaded from a file again');
});

test('the icon files they replaced are gone from the build', () => {
  const assets = path.join(__dirname, '..', 'assets');
  for (const dead of ['icon_link.webp', 'instagram.svg', 'youtube.svg', 'tik-tok.svg', 'pinterest.svg']) {
    assert.equal(fs.existsSync(path.join(assets, dead)), false, `${dead} still ships, and editing it would change nothing`);
  }
});

test('every social link carries its glyph', () => {
  const links = [...html.matchAll(/<a class="cs-social"[\s\S]*?<\/a>/g)].map((m) => m[0]);
  assert.equal(links.length, 4, `expected four social links, found ${links.length}`);
  for (const link of links) {
    const label = /aria-label="([^"]*)"/.exec(link);
    assert.match(link, /<svg class="cs-social-icon"[^>]*viewBox="0 0 24 24"/, `${label && label[1]} lost its inline glyph`);
    assert.match(link, /<path d="M[^"]{40,}"/, `${label && label[1]} has an empty glyph`);
  }
});

test('every link that leaves the site shows it', () => {
  // The arrow sits after the label, so the entry has to keep room for both.
  const marks = html.match(/<svg class="cs-extlink"/g) || [];
  assert.equal(marks.length, 3, `expected three external-link marks, found ${marks.length}`);
});

test('the glyphs take their colour from the text around them', () => {
  const social = /\.cs-social-icon \{([^}]*)\}/.exec(html);
  assert.ok(social, 'the social icon rule is gone');
  assert.match(social[1], /fill: currentColor/, 'social glyphs no longer follow the nav colour');

  const ext = /\.cs-extlink \{([^}]*)\}/.exec(html);
  assert.ok(ext, 'the external-link rule is gone');
  assert.match(ext[1], /stroke: currentColor/, 'the external-link mark no longer follows the nav colour');
});
