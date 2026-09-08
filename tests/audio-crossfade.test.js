const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

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

let clock = 100;
let nextTimer = 1;
const timers = new Map();
global.performance = { now: () => clock * 1000 };
global.setTimeout = (fn, ms) => {
  const id = nextTimer++;
  timers.set(id, { fn, at: clock + ms / 1000 });
  return id;
};
global.clearTimeout = (id) => timers.delete(id);
global.clearInterval = global.clearTimeout;

function gainParam(value) {
  return {
    value,
    cancelScheduledValues() {},
    setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v, at) { this.ramp = { value: v, at }; }
  };
}
let sourceCount = 0;
const ctx = {
  currentTime: clock,
  destination: {},
  createMediaElementSource: () => { sourceCount++; return { connect() {} }; },
  createGain: () => ({ gain: gainParam(0), connect() {} })
};
function audio(id, level, paused) {
  return {
    id, volume: 1, muted: paused, paused, currentTime: 0, isConnected: true,
    playCalls: 0, pauseCalls: 0,
    play() { this.paused = false; this.playCalls++; return Promise.resolve(); },
    pause() { this.paused = true; this.pauseCalls++; }
  };
}

const bgm = audio('cs-bgm', 0.25, false);
bgm.volume = 0.25;
bgm.muted = false;
const guitar = audio('cs-guitar', 0, true);

global.window = {
  __csBgm: bgm,
  __csGuitar: guitar,
  __csAllAudio: [],
  AudioContext: function AudioContext() { return ctx; },
  scrollY: 0
};

const mixerOwner = {
  getAudio: () => bgm,
  getGuitar: () => guitar,
  audioVolumeWorks: () => true,
  compactUi: () => false,
  ensureMediaMixer: method('ensureMediaMixer')
};
const mixer = mixerOwner.ensureMediaMixer();
assert.ok(mixer, 'desktop volume-property result incorrectly prevented mixer creation');
assert.equal(mixer.bgm.gain.gain.value, 0.25, 'mixer takeover cut existing BGM level');
assert.equal(mixer.guitar.gain.gain.value, 0);
assert.equal(bgm.volume, 1, 'media elements must be unity under GainNode control');
assert.strictEqual(mixerOwner.ensureMediaMixer(), mixer);
assert.equal(sourceCount, 2, 'repeat mixer setup created duplicate media sources');

const bgmTrack = mixer.bgm;
const guitarTrack = mixer.guitar;

function advance(seconds) {
  const end = clock + seconds;
  while (true) {
    const due = [...timers.entries()]
      .filter(([, timer]) => timer.at <= end)
      .sort((a, b) => a[1].at - b[1].at)[0];
    if (!due) break;
    clock = due[1].at;
    ctx.currentTime = clock;
    timers.delete(due[0]);
    due[1].fn();
  }
  clock = end;
  ctx.currentTime = clock;
}

const component = {
  refs2: { guitarSection: {} },
  _loaderGone: true,
  _wdAt: clock * 1000,
  soundEnabled: () => true,
  getAudio: () => bgm,
  getGuitar: () => guitar,
  audioMixerTrack: method('audioMixerTrack'),
  trackLevel: method('trackLevel'),
  setTrackLevel: method('setTrackLevel'),
  hardAudioCut: method('hardAudioCut'),
  stopTrack: method('stopTrack'),
  audioVolumeWorks: () => true,
  updateAudioZones: method('updateAudioZones')
};

const entering = { guitarEnabled: true, guitarRect: { top: 300, bottom: 1900 } };
component.updateAudioZones(1000, entering);
assert.deepEqual(bgmTrack.gain.gain.ramp, { value: 0, at: clock + 1.35 });
assert.deepEqual(guitarTrack.gain.gain.ramp, { value: 0.5, at: clock + 1.35 });

advance(0.675);
assert.ok(Math.abs(component.trackLevel(bgmTrack) - 0.125) < 1e-9);
assert.ok(Math.abs(component.trackLevel(guitarTrack) - 0.25) < 1e-9);

const bgmRamp = bgmTrack.gain.gain.ramp;
const guitarRamp = guitarTrack.gain.gain.ramp;
component.updateAudioZones(1000, entering);
assert.strictEqual(bgmTrack.gain.gain.ramp, bgmRamp, 'repeat scroll restarted BGM ramp');
assert.strictEqual(guitarTrack.gain.gain.ramp, guitarRamp, 'repeat scroll restarted guitar ramp');

advance(0.705);
assert.equal(component.trackLevel(bgmTrack), 0);
assert.equal(component.trackLevel(guitarTrack), 0.5);
assert.equal(bgm.paused, true);
assert.equal(bgm.muted, true);

const leaving = { guitarEnabled: true, guitarRect: { top: 700, bottom: 2300 } };
component.updateAudioZones(1000, leaving);
advance(0.675);
assert.ok(Math.abs(component.trackLevel(bgmTrack) - 0.125) < 1e-9);
assert.ok(Math.abs(component.trackLevel(guitarTrack) - 0.25) < 1e-9);
advance(0.705);
assert.equal(component.trackLevel(bgmTrack), 0.25);
assert.equal(component.trackLevel(guitarTrack), 0);
assert.equal(guitar.paused, true);
assert.equal(guitar.muted, true);

console.log('audio crossfade: deterministic 1.35s enter/leave ramps passed');
