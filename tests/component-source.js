const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Lift one method body out of the inline Component class so the tests run the
// code that actually ships, not a copy of it.
function methodSource(name) {
  const start = html.indexOf(`\n  ${name}(`);
  assert.notEqual(start, -1, `missing Component.${name}`);
  const body = html.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;
  for (let i = body; i < html.length; i++) {
    const c = html[i];
    const n = html[i + 1];
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
    if (c === '}' && --depth === 0) return html.slice(start + 3, i + 1);
  }
  throw new Error(`unterminated Component.${name}`);
}

function method(name) {
  return Function(`"use strict"; return ({${methodSource(name)}}).${name};`)();
}

module.exports = { html, methodSource, method };
