// The deployment host rewrites the HTML it serves: it drops every on* handler
// attribute and every style attribute it cannot parse as CSS, which a {{ }}
// binding is not. That silently killed the top button, the trailer and the
// menu links, because an attribute that is gone throws no error. These tests
// keep the markup free of both, and check that the handlers the attributes
// used to carry are attached from the ref callbacks instead.

const test = require('node:test');
const assert = require('node:assert/strict');
const { html, entry } = require('./component-source.js');

// A stand-in for a DOM node that records what gets bound to it.
function fakeEl(extra) {
  const listeners = {};
  return Object.assign({
    listeners,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    classList: { toggle() {}, contains: () => false },
    setAttribute() {},
    contains: () => true
  }, extra);
}

test('no handler or bound-style attributes survive into the markup', () => {
  const onAttrs = html.match(/\son[A-Za-z]+="[^"]*"/g) || [];
  assert.deepEqual(
    onAttrs, [],
    'on* attributes are stripped by the host, so handlers must be bound in a ref callback'
  );

  const boundStyles = html.match(/style="[^"]*\{\{[^"]*"/g) || [];
  assert.deepEqual(
    boundStyles, [],
    'the host drops a style attribute holding {{ }}, taking the whole declaration list with it'
  );
});

test('the top button scrolls up from a listener it binds itself', () => {
  const jumps = [];
  const ctx = { refs2: {}, goTopNow: () => jumps.push('top') };
  const ref = entry('topBtnRef')(ctx);

  const el = fakeEl();
  ref(el);
  assert.equal(ctx.refs2.topBtn, el, 'the ref still has to record the element');

  const click = el.listeners.click;
  assert.ok(click && click.length === 1, 'the top button never bound a click listener');

  click[0]({ preventDefault() {} });
  assert.deepEqual(jumps, ['top']);

  // React calls a ref again on every re-render; binding twice would scroll twice.
  ref(el);
  assert.equal(el.listeners.click.length, 1, 'the click listener was bound more than once');

  ref(null);
  assert.equal(ctx.refs2.topBtn, null);
});

test('the trailer starts from a listener it binds itself', () => {
  const plays = [];
  const ctx = { refs2: {}, playTrailer: () => plays.push('play') };
  const ref = entry('trailerBoxRef')(ctx);

  const el = fakeEl();
  ref(el);
  const click = el.listeners.click;
  assert.ok(click && click.length === 1, 'the trailer never bound a click listener');

  click[0]({});
  assert.deepEqual(plays, ['play']);

  ref(el);
  assert.equal(el.listeners.click.length, 1, 'the click listener was bound more than once');
});

test('menu links close the menu, and the social entry does not', () => {
  const closes = [];
  const ctx = { refs2: {}, _menuOpen: true, scheduleNavMode() {}, closeMenu: () => closes.push(1) };
  const nav = fakeEl();
  entry('navRef')(ctx)(nav);

  const click = nav.listeners.click;
  assert.ok(click && click.length === 1, 'the nav never bound a click listener');

  const targetFor = (cls) => ({
    closest: () => ({ classList: { contains: (c) => c === cls } })
  });

  click[0]({ target: targetFor('cs-nav-link') });
  assert.equal(closes.length, 1, 'clicking a menu link should close the menu');

  // The social entry only opens its own submenu, so the menu has to stay open.
  click[0]({ target: targetFor('cs-nav-social') });
  assert.equal(closes.length, 1, 'the social entry must not close the menu');

  // Clicking the nav backdrop itself still closes it.
  click[0]({ target: nav });
  assert.equal(closes.length, 2);
});
