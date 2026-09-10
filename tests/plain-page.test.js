// The host accepts only a plain html + css + js page, and serves it under a CSP
// without 'unsafe-eval'. The page was rewritten off a template runtime to meet
// that. These tests hold the shape in place: nothing may reintroduce a
// framework, a third-party script, or code built from a string.

const test = require('node:test');
const assert = require('node:assert/strict');
const { html, js } = require('./component-source.js');

test('the page loads no framework, runtime or third-party script', () => {
  const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(srcs, ['./app.js'], 'the only script the page may load is its own');

  for (const trace of ['x-dc', 'data-dc-script', 'DCLogic', '__dcComponent', 'support.js', 'unpkg.com', 'react']) {
    assert.ok(!html.includes(trace), `runtime trace left in the markup: ${trace}`);
    assert.ok(!js.includes(trace), `runtime trace left in the script: ${trace}`);
  }
});

test('nothing is built from a string, because the CSP forbids it', () => {
  for (const [name, src] of [['index.html', html], ['app.js', js]]) {
    assert.ok(!/\bnew Function\b/.test(src), `${name} calls new Function`);
    assert.ok(!/[^.\w]eval\s*\(/.test(src), `${name} calls eval`);
  }
});

test('no template bindings are left unresolved in the markup', () => {
  const left = html.match(/\{\{[^}]*\}\}/g) || [];
  assert.deepEqual(left, [], 'a binding that never resolves renders as literal braces');
});

test('every text placeholder has a string behind it', () => {
  const dict = js.slice(js.indexOf('const T = {'), js.indexOf('\n};', js.indexOf('const T = {')));
  const keys = [...html.matchAll(/data-i18n(?:-first|-alt|-title|-aria)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 20, 'the markup lost its text placeholders');

  const missing = [...new Set(keys)].filter((k) => !new RegExp(`(^|[\\s{])${k}:`, 'm').test(dict));
  assert.deepEqual(missing, [], 'these placeholders would render empty');
});

test('every ref in the markup is wired to a callback', () => {
  const refs = [...new Set([...html.matchAll(/data-ref="([^"]+)"/g)].map((m) => m[1]))];
  assert.ok(refs.length > 30, 'the markup lost its refs');

  const map = js.slice(js.indexOf('refCallbacks() {'), js.indexOf('\n  bindRefs()'));
  // mainContent is a plain wrapper: it never had a callback, only a name.
  const unbound = refs.filter((r) => r !== 'mainContent' && !new RegExp(`\\n      ${r}:`).test(map));
  assert.deepEqual(unbound, [], 'these elements would silently do nothing');
});
