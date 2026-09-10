const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The page is plain html + css + js: markup in index.html, behaviour in app.js.
// Markup assertions read `html`; everything that lifts running code reads `js`.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Walk from an opening brace to its match, skipping strings and comments.
function endOfBlock(body) {
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;
  for (let i = body; i < js.length; i++) {
    const c = js[i];
    const n = js[i + 1];
    if (lineComment) {
      if (c === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === '*' && n === '/') { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return i;
  }
  throw new Error('unterminated block');
}

// Lift one method body out of the CatsSoupPage class so the tests run the code
// that actually ships, not a copy of it.
function methodSource(name) {
  const start = js.indexOf(`\n  ${name}(`);
  assert.notEqual(start, -1, `missing CatsSoupPage.${name}`);
  return js.slice(start + 3, endOfBlock(js.indexOf('{', start)) + 1);
}

// Same, for the handlers wired onto the instance at init (this.name = () => {}),
// which are not class methods and so cannot be reached by name.
function arrowSource(name) {
  const decl = `this.${name} = () => {`;
  const start = js.indexOf(decl);
  assert.notEqual(start, -1, `missing this.${name} handler`);
  const open = start + decl.length - 1;
  return `() => ${js.slice(open, endOfBlock(open) + 1)}`;
}

function method(name) {
  return Function(`"use strict"; return ({${methodSource(name)}}).${name};`)();
}

// An arrow takes its `this` from where it is created, so build it inside a
// plain function called on the instance under test.
function handler(name) {
  const make = Function(`"use strict"; return function () { return ${arrowSource(name)}; };`)();
  return (ctx) => make.call(ctx);
}

// Source of the arrow function that follows a marker, for callbacks passed
// straight into another call (timers, listeners) and so unreachable by name.
function callbackAfter(marker) {
  const start = js.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const open = js.indexOf('{', start + marker.length);
  return `() => ${js.slice(open, endOfBlock(open) + 1)}`;
}

function callback(marker) {
  const make = Function(`"use strict"; return function () { return ${callbackAfter(marker)}; };`)();
  return (ctx) => make.call(ctx);
}

// Source of a `name: (arg) => { ... }` entry of the object refCallbacks returns.
// Unlike callbackAfter this keeps the parameter list, so a test can hand the
// ref callback an element.
function entrySource(name) {
  const start = js.indexOf(`\n      ${name}: (`);
  assert.notEqual(start, -1, `missing refCallbacks.${name}`);
  const argsOpen = js.indexOf('(', start);
  const argsClose = js.indexOf(')', argsOpen);
  const open = js.indexOf('{', argsClose);
  return `${js.slice(argsOpen, argsClose + 1)} => ${js.slice(open, endOfBlock(open) + 1)}`;
}

function entry(name) {
  const make = Function(`"use strict"; return function () { return ${entrySource(name)}; };`)();
  return (ctx) => make.call(ctx);
}

module.exports = { html, js, methodSource, method, arrowSource, handler, callbackAfter, callback, entrySource, entry };
