const assert = require('node:assert/strict');
const { method } = require('./component-source');

// Must track the crossfade length in updateAudioZones.
const RAMP = 1.8;

let clock = 100;
let nextTimer = 1;
let timers = new Map();
global.performance = { now: () => clock * 1000 };
global.setTimeout = (fn, ms) => {
  const id = nextTimer++;
  timers.set(id, { fn, at: clock + ms / 1000 });
  return id;
};
global.setInterval = (fn, ms) => {
  const id = nextTimer++;
  timers.set(id, { fn, at: clock + ms / 1000, every: ms / 1000 });
  return id;
};
global.clearTimeout = (id) => timers.delete(id);
global.clearInterval = global.clearTimeout;
global.getComputedStyle = () => ({ display: 'block' });

function gainParam(value) {
  return {
    value,
    cancelScheduledValues() {},
    setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v, at) { this.ramp = { value: v, at }; }
  };
}

// `volumeWorks: false` models iOS, where assigning volume silently does nothing.
function audio(id, { volumeWorks = true, paused = true } = {}) {
  let vol = paused ? 0 : 1;
  const el = {
    id, muted: paused, paused, currentTime: 0, isConnected: true,
    playCalls: 0, pauseCalls: 0, listeners: {},
    play() { this.paused = false; this.playCalls++; return { catch() {} }; },
    pause() { this.paused = true; this.pauseCalls++; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    emit(type) { for (const fn of this.listeners[type] || []) fn(); }
  };
  Object.defineProperty(el, 'volume', {
    get: () => vol,
    set: (v) => { if (volumeWorks) vol = v; }
  });
  return el;
}

function makeCtx(state) {
  let sources = 0;
  let onResume = null;
  const ctx = {
    currentTime: clock,
    state,
    destination: {},
    // Chrome leaves this promise pending until the policy actually lets the
    // context run, so the test decides when that happens.
    resume() { return { then: (ok) => { onResume = ok; return { catch() {} }; }, catch() {} }; },
    settleResume() { ctx.state = 'running'; const fn = onResume; onResume = null; if (fn) fn(); },
    createMediaElementSource: () => { sources++; return { connect() {} }; },
    createGain: () => ({ gain: gainParam(0), connect() {} })
  };
  Object.defineProperty(ctx, 'sourceCount', { get: () => sources });
  return ctx;
}

// A fresh page: audio elements, an AudioContext and a component wired to the
// real methods lifted out of index.html.
function makeWorld({ volumeWorks = true, ctxState = 'running', bgmPlaying = true, origin = 'https://example.test' } = {}) {
  timers = new Map();
  const ctx = makeCtx(ctxState);
  const bgm = audio('cs-bgm', { volumeWorks, paused: !bgmPlaying });
  const guitar = audio('cs-guitar', { volumeWorks });
  if (bgmPlaying) { bgm.volume = 0.25; bgm.muted = false; }

  global.window = {
    __csBgm: bgm,
    __csGuitar: guitar,
    __csAllAudio: [],
    __csAudioCtx: null,
    origin,
    AudioContext: function AudioContext() { return ctx; },
    scrollY: 0,
    innerHeight: 1000
  };
  global.navigator = { userActivation: { isActive: true } };

  let rect = { top: 3000, bottom: 4600 };
  const component = {
    refs2: { guitarSection: { hidden: false, getBoundingClientRect: () => rect } },
    _loaderGone: true,
    _wdAt: Date.now(),
    soundEnabled: () => true,
    getAudio: () => bgm,
    getGuitar: () => guitar,
    audioVolumeWorks: method('audioVolumeWorks'),
    audioMixerTrack: method('audioMixerTrack'),
    trackLevel: method('trackLevel'),
    setTrackLevel: method('setTrackLevel'),
    hardAudioCut: method('hardAudioCut'),
    stopTrack: method('stopTrack'),
    silenceAll: method('silenceAll'),
    adoptMixerLevels: method('adoptMixerLevels'),
    ensureMediaMixer: method('ensureMediaMixer'),
    unlockAudio: method('unlockAudio'),
    updateAudioZones: method('updateAudioZones')
  };

  const advance = (seconds) => {
    const end = clock + seconds;
    for (;;) {
      let dueId = null;
      let due = null;
      for (const [id, timer] of timers) {
        if (timer.at <= end && (!due || timer.at < due.at)) { dueId = id; due = timer; }
      }
      if (!due) break;
      clock = due.at;
      ctx.currentTime = clock;
      if (due.every) due.at = clock + due.every;
      else timers.delete(dueId);
      due.fn();
    }
    clock = end;
    ctx.currentTime = clock;
  };

  // Level as heard: the GainNode when the mixer owns routing, else the element.
  const heard = (el) => {
    const track = component.audioMixerTrack(el);
    if (el.paused || el.muted) return 0;
    return track ? component.trackLevel(track) : el.volume;
  };

  const zone = (where) => {
    rect = where === 'in' ? { top: 300, bottom: 1900 } : { top: 700, bottom: 2300 };
    component.updateAudioZones(1000, { guitarEnabled: true, guitarRect: rect });
  };

  // The watchdog only runs once every 1200ms of wall time; force it to.
  const runWatchdog = () => { component._wdAt = 0; };

  return { ctx, bgm, guitar, component, advance, heard, zone, runWatchdog, setRect: (r) => { rect = r; } };
}

// --- mixer setup -------------------------------------------------------------
{
  const w = makeWorld({ ctxState: 'suspended' });
  // Routing through a MediaElementSource while the context is suspended would
  // silence the page outright, so nothing may be connected yet.
  const pending = w.component.ensureMediaMixer();
  assert.equal(pending, null, 'mixer took over routing before its context was running');
  assert.equal(w.ctx.sourceCount, 0, 'suspended context created media sources anyway');
  assert.equal(w.bgm.volume, 0.25, 'suspended mixer setup disturbed the element level');

  w.ctx.settleResume();
  const mixer = window.__csMediaMixer;
  assert.ok(mixer && mixer.bgm && mixer.guitar, 'resumed context never produced a mixer');
  assert.equal(mixer.bgm.gain.gain.value, 0.25, 'mixer takeover cut existing BGM level');
  assert.equal(mixer.guitar.gain.gain.value, 0);
  assert.equal(w.bgm.volume, 1, 'media elements must be unity under GainNode control');
  assert.strictEqual(w.component.ensureMediaMixer(), mixer);
  assert.equal(w.ctx.sourceCount, 2, 'repeat mixer setup created duplicate media sources');
}

// --- a reader who only scrolls still gets a mixer -----------------------------
{
  // Panning the page never counts as user activation, yet Safari does allow the
  // audio context to start from that same touch. Losing the mixer here is what
  // left iOS with no fade path at all.
  const w = makeWorld({ volumeWorks: false });
  global.navigator.userActivation = { isActive: false };
  assert.equal(w.component.hardAudioCut(), true, 'expected a hard-cut platform before unlock');

  w.component.unlockAudio();
  assert.ok(window.__csMediaMixer, 'scroll-only reader was left without a mixer');
  assert.equal(w.component.hardAudioCut(), false, 'mixer present but zoning still hard-cuts');
}

// --- crossfade shape, in and out ---------------------------------------------
{
  const w = makeWorld();
  const mixer = w.component.ensureMediaMixer();
  const bgmTrack = mixer.bgm;
  const guitarTrack = mixer.guitar;

  w.zone('in');
  assert.equal(w.guitar.loop, false, 'guitar track must play only once');
  assert.deepEqual(bgmTrack.gain.gain.ramp, { value: 0, at: clock + RAMP });
  assert.deepEqual(guitarTrack.gain.gain.ramp, { value: 0.5, at: clock + RAMP });

  w.advance(RAMP / 2);
  assert.ok(Math.abs(w.component.trackLevel(bgmTrack) - 0.125) < 1e-9);
  assert.ok(Math.abs(w.component.trackLevel(guitarTrack) - 0.25) < 1e-9);

  const bgmRamp = bgmTrack.gain.gain.ramp;
  const guitarRamp = guitarTrack.gain.gain.ramp;
  w.zone('in');
  assert.strictEqual(bgmTrack.gain.gain.ramp, bgmRamp, 'repeat scroll restarted BGM ramp');
  assert.strictEqual(guitarTrack.gain.gain.ramp, guitarRamp, 'repeat scroll restarted guitar ramp');

  // The watchdog must not reach in and pause a track that is still fading.
  w.runWatchdog();
  w.zone('in');
  assert.equal(w.bgm.paused, false, 'watchdog paused the BGM mid-crossfade');
  assert.ok(w.heard(w.bgm) > 0.05, 'watchdog dropped the BGM level mid-crossfade');

  w.advance(RAMP / 2 + 0.05);
  assert.equal(w.component.trackLevel(bgmTrack), 0);
  assert.equal(w.component.trackLevel(guitarTrack), 0.5);
  assert.equal(w.bgm.paused, true);
  assert.equal(w.bgm.muted, true);

  w.zone('out');
  w.advance(RAMP / 2);
  assert.ok(Math.abs(w.component.trackLevel(bgmTrack) - 0.125) < 1e-9);
  assert.ok(Math.abs(w.component.trackLevel(guitarTrack) - 0.25) < 1e-9);
  w.advance(RAMP / 2 + 0.05);
  assert.equal(w.component.trackLevel(bgmTrack), 0.25);
  assert.equal(w.component.trackLevel(guitarTrack), 0);
  assert.equal(w.guitar.paused, true);
  assert.equal(w.guitar.muted, true);

  // Sound toggled back on must land at the normal level with no fade.
  w.component.setTrackLevel(w.bgm, 0);
  w.bgm.pause();
  w.bgm.muted = true;
  w.component._t_bRamp = 0;
  w.component._restoreSoundLevel = true;
  w.zone('out');
  assert.equal(w.component.trackLevel(bgmTrack), 0.25, 'sound toggle did not restore normal BGM level immediately');
  assert.equal(w.bgm.paused, false);
  assert.equal(w.bgm.muted, false);
  assert.equal(w.component._restoreSoundLevel, false);
}

// --- the guitar plays once a session, and the scene never goes silent ---------
{
  const w = makeWorld();
  w.component.getGuitar = method('getGuitar');
  const mixer = w.component.ensureMediaMixer();
  const guitar = w.component.getGuitar();

  w.zone('in');
  w.advance(RAMP + 0.05);
  assert.equal(w.heard(guitar), 0.5, 'guitar never reached its level');
  assert.equal(w.heard(w.bgm), 0);
  const playCalls = guitar.playCalls;

  // The track runs out on its own.
  guitar.emit('ended');
  assert.equal(w.component._guitarDone, true);
  assert.equal(guitar.paused, true);

  // Dead air here is the bug: the scene has to fall back to plain BGM.
  w.advance(RAMP + 0.05);
  assert.equal(w.heard(w.bgm), 0.25, 'guitar scene went silent after the guitar finished');
  assert.equal(w.bgm.paused, false);

  // Still standing in the scene: nothing may restart.
  w.zone('in');
  w.advance(RAMP + 0.05);
  assert.equal(guitar.playCalls, playCalls, 'finished guitar track restarted in its scene');
  assert.equal(guitar.paused, true);
  assert.equal(w.heard(w.bgm), 0.25, 're-reading the guitar scene silenced the page');

  // Leave and come back: still no second performance, still not silent.
  w.zone('out');
  w.advance(RAMP + 0.05);
  w.zone('in');
  w.advance(RAMP + 0.05);
  assert.equal(guitar.playCalls, playCalls, 'guitar played a second time in one session');
  assert.equal(guitar.paused, true);
  assert.equal(w.heard(w.bgm), 0.25, 'returning to the guitar scene silenced the page');
  assert.equal(mixer.bgm.gain.gain.value, 0.25);
}

// --- platforms that ignore volume must still fade -----------------------------
{
  // iOS: assigning volume does nothing, so before the mixer existed the BGM was
  // simply paused the instant the scene arrived.
  const w = makeWorld({ volumeWorks: false });
  global.navigator.userActivation = { isActive: false };
  w.component.unlockAudio();
  w.zone('out');
  w.advance(RAMP + 0.05);
  assert.equal(w.heard(w.bgm), 0.25, 'BGM never reached its level on a volume-deaf platform');

  w.zone('in');
  assert.equal(w.bgm.paused, false, 'BGM was cut dead on entering the guitar scene');
  assert.ok(w.heard(w.bgm) > 0.24, 'BGM level jumped down on entering the guitar scene');

  w.advance(RAMP / 2);
  const mid = w.heard(w.bgm);
  assert.ok(mid > 0.1 && mid < 0.15, 'BGM did not fade smoothly, heard ' + mid);
  assert.ok(w.heard(w.guitar) > 0.2 && w.heard(w.guitar) < 0.3, 'guitar did not fade in smoothly');

  w.advance(RAMP / 2 + 0.05);
  assert.equal(w.heard(w.bgm), 0);
  assert.equal(w.heard(w.guitar), 0.5);
}

// --- an opaque origin must not reach for the mixer ---------------------------
{
  // Served under a CSP sandbox without allow-same-origin, the page is foreign
  // to its own mp3s. A MediaElementSource built there is tainted: the element
  // keeps playing and the graph emits nothing, so the site goes quiet with no
  // error to show for it. The element's own volume is unaffected.
  const w = makeWorld({ origin: 'null' });
  assert.equal(w.component.ensureMediaMixer(), null, 'an opaque origin still built a mixer');
  assert.equal(w.ctx.sourceCount, 0, 'a tainted media source was created anyway');
  assert.equal(window.__csMediaMixer, undefined, 'a silent mixer was published globally');

  // And the fade still has to happen, now through the element.
  w.zone('out');
  w.advance(RAMP + 0.05);
  assert.equal(w.heard(w.bgm), 0.25, 'BGM never reached its level without the mixer');

  w.zone('in');
  w.advance(RAMP / 2);
  const mid = w.heard(w.bgm);
  assert.ok(mid > 0.1 && mid < 0.15, 'BGM did not fade through volume, heard ' + mid);

  w.advance(RAMP / 2 + 0.05);
  assert.equal(w.heard(w.bgm), 0);
  assert.equal(w.heard(w.guitar), 0.5, 'the guitar never came up without a mixer');
}

console.log('audio crossfade, guitar one-shot and volume-deaf fade paths passed');
