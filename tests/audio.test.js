import test from 'node:test';
import assert from 'node:assert/strict';
import { soundPlan, SoundGuide } from '../src/audio.js';

const input = overrides => ({ angles: { pitch: 1, roll: 0 }, mode: 'sensor', fresh: true, stable: true, sampleTime: 0, now: 0, hidden: false, ...overrides });

test('beeps accelerate monotonically toward level, with bounded cadence', () => {
  const intervals = [8, 2, 1, 0.5, 0.21].map(pitch => soundPlan(input({ angles: { pitch, roll: 0 } })).interval);
  assert.deepEqual(intervals.slice(0, 2), [2000, 2000]);
  for (let i = 2; i < intervals.length; i++) assert.ok(intervals[i] < intervals[i-1]);
  assert.equal(soundPlan(input({ stable: false, angles: { pitch: 0, roll: 0 } })).interval, 200);
});
test('continuous requires confirmed stability and combined axes, with hysteresis', () => {
  const plan = (pitch, roll, stable = true, wasLevel = false) => soundPlan(input({ angles: { pitch, roll }, stable }), wasLevel);
  assert.equal(plan(0.1, -0.1).kind, 'continuous');
  assert.equal(plan(0.18, 0.18).kind, 'beep');
  assert.equal(plan(0, 0, false).kind, 'beep');
  assert.equal(plan(0.25, 0, true, false).kind, 'beep');
  assert.equal(plan(0.25, 0, true, true).kind, 'continuous');
  assert.equal(plan(0.31, 0, true, true).kind, 'beep');
  assert.equal(plan(0.1, 0, false, true).kind, 'beep');
  assert.equal(plan(1, -2).interval, plan(-1, 2).interval);
});
test('silence for stale, absent, invalid, background or simulation measurements', () => {
  for (const overrides of [{ fresh: false }, { now: 3000 }, { now: -1 }, { angles: null }, { angles: { pitch: NaN, roll: 0 } }, { angles: { pitch: 0, roll: Infinity } }, { angles: { pitch: 16, roll: 0 } }, { sampleTime: undefined }, { mode: 'manual' }, { hidden: true }]) {
    assert.equal(soundPlan(input(overrides), true).kind, 'silent');
  }
  assert.equal(soundPlan(input({ now: 2999 })).kind, 'beep');
});

function fixture({ resume, createError, nativeCancel = false } = {}) {
  const events = [], notifications = [];
  let now = 0, reading = input(), callback, cancelled = 0, starts = 0, stops = 0, closes = 0;
  const param = { value: 0, cancelScheduledValues: t => events.push(['cancel', t]), setValueAtTime: (v,t) => events.push(['set',v,t]), linearRampToValueAtTime: (v,t) => events.push(['ramp',v,t]) };
  const context = { get currentTime() { return now / 1000; }, state: 'running', destination: {},
    createGain: () => ({ gain: param, connect() {}, disconnect() {} }),
    createOscillator: () => ({ frequency: {}, connect() {}, start: () => starts++, stop: () => stops++, disconnect() {} }),
    resume: resume || (() => Promise.resolve()),
    close: () => { closes++; context.state = 'closed'; return Promise.resolve(); },
  };
  const guide = new SoundGuide({ createContext: () => { if (createError) throw new Error(); return context; }, read: () => reading, notify: s => notifications.push(s), clock: () => now, schedule: fn => { callback = fn; return 1; }, ...(nativeCancel ? {} : { cancel: () => cancelled++ }) });
  return { guide, context, events, notifications,
    set: value => reading = { ...reading, ...value }, advance: time => { now = time; callback?.(); },
    counts: () => ({ starts, stops, closes, cancelled }),
  };
}
test('audio is opt-in, single oscillator, rate unaffected by rapid sensor updates; off stops immediately', async () => {
  const f = fixture(); assert.equal(f.counts().starts, 0);
  await f.guide.enable(); assert.equal(f.counts().starts, 1);
  for (let t = 1; t < 1000; t++) f.advance(t);
  assert.equal(f.events.filter(e => e[0] === 'ramp' && e[1] > 0).length, 1);
  f.guide.disable();
  assert.deepEqual(f.counts(), { starts: 1, stops: 1, closes: 1, cancelled: 1 });
  assert.equal(f.guide.enabled, false);
  assert.deepEqual(f.events.at(-1), ['set', 0, 0.999]);
  f.advance(2000); assert.equal(f.counts().starts, 1);
});
test('continuous tone expires on the audio clock even without another JS callback', async () => {
  const f = fixture(); f.set({ angles: { pitch: 0, roll: 0 } });
  await f.guide.enable();
  assert.deepEqual(f.events.at(-1), ['ramp', 0, 3]);
  f.advance(2500); assert.deepEqual(f.events.at(-1), ['ramp', 0, 3]);
  f.advance(3000); assert.equal(f.guide.kind, 'silent');
  assert.deepEqual(f.events.at(-1), ['set', 0, 3]);
  f.set({ sampleTime: 3100, stable: false }); f.advance(3100);
  assert.equal(f.guide.kind, 'beep');
});
test('background and lost calibration cancel sound; new foreground measurements can resume', async () => {
  const f = fixture(); f.set({ angles: { pitch: 0, roll: 0 } }); await f.guide.enable();
  f.set({ hidden: true }); f.guide.tick(); assert.equal(f.guide.kind, 'silent');
  assert.deepEqual(f.events.at(-1), ['set', 0, 0]);
  f.set({ hidden: false, fresh: false }); f.advance(100); assert.equal(f.guide.kind, 'silent');
  f.set({ fresh: true, sampleTime: 200, stable: false }); f.advance(200); assert.equal(f.guide.kind, 'beep');
  f.set({ angles: null }); f.guide.tick(); assert.equal(f.guide.kind, 'silent');
});
test('off during pending resume cannot restart sound', async () => {
  let finish; const f = fixture({ resume: () => new Promise(r => finish = r) });
  const pending = f.guide.enable(); f.guide.disable(); finish(); await pending;
  assert.equal(f.guide.enabled, false); assert.equal(f.counts().stops, 1);
  assert.equal(f.events.filter(e => e[0] === 'ramp').length, 0);
});
test('default cancellation does not bind browser clearInterval to the guide', async () => {
  const original = globalThis.clearInterval;
  let called = false;
  const f = fixture({ nativeCancel: true });
  globalThis.clearInterval = function(id) { assert.notEqual(this, f.guide); assert.equal(id, 1); called = true; };
  try { await f.guide.enable(); f.guide.disable(); assert.equal(called, true); }
  finally { globalThis.clearInterval = original; }
});
test('missing API, rejected resume and browser interruption fail silently with actionable status', async () => {
  for (const options of [{ createError: true }, { resume: () => Promise.reject(new Error()) }]) {
    const f = fixture(options); await f.guide.enable();
    assert.equal(f.guide.enabled, false); assert.match(f.notifications.at(-1).label, /indisponible/);
  }
  const f = fixture(); await f.guide.enable(); f.context.state = 'interrupted'; f.context.onstatechange();
  assert.equal(f.guide.enabled, false); assert.equal(f.counts().stops, 1);
  assert.match(f.notifications.at(-1).label, /interrompu/);
});
