import test from 'node:test';
import assert from 'node:assert/strict';
import { SensorTracker, motionSlopes, requestSensorAccess, listenSensors } from '../src/sensors.js';
import { sensorSlopes, calibratedAngles, solve } from '../src/level.js';

const motion = (beta = 0, gamma = 0) => {
  const b = beta * Math.PI / 180, c = gamma * Math.PI / 180;
  return { accelerationIncludingGravity: { x: -9.81 * Math.cos(b) * Math.sin(c), y: 9.81 * Math.sin(b), z: 9.81 * Math.cos(b) * Math.cos(c) } };
};
const feed = (tracker, start, end, beta = 0, gamma = 0, source = 'motion', interval = 50) => {
  let state;
  for (let t = start; t <= end; t += interval) state = tracker.receive(source, source === 'motion' ? motion(beta, gamma) : { beta, gamma }, t);
  return state;
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('stationary phone receives 30 seconds of real events without expiring', () => {
  const tracker = new SensorTracker();
  for (let t = 0; t <= 30000; t += 50) {
    const s = tracker.receive('motion', motion(1 + 0.01 * Math.sin(t), -2), t);
    if (t >= 2500) { assert.equal(s.status, 'stable'); assert.equal(s.raw.time, t); }
  }
  assert.ok(tracker.samples.length <= 41);
});
test('silence retains exact value and timestamp, does not synthesize readings; resumes freshly', () => {
  const t = new SensorTracker(); const before = feed(t, 0, 3000);
  const count = t.samples.length;
  for (let now = 3100; now <= 33000; now += 100) t.snapshot(now);
  assert.deepEqual(t.snapshot(33000).raw, before.raw);
  assert.equal(t.snapshot(33000).status, 'retained'); assert.equal(t.samples.length, count);
  const resumed = t.receive('motion', motion(1), 33100);
  assert.equal(resumed.status, 'active'); assert.equal(resumed.stable, false);
  assert.equal(feed(t, 33150, 35500, 1).status, 'stable');
});
test('slight tilt unlocks promptly, noise cannot make the output wander', () => {
  const t = new SensorTracker(); const before = feed(t, 0, 3000);
  const noisy = feed(t, 3050, 4000, 0.02);
  assert.equal(noisy.raw.pitch, before.raw.pitch);
  const moved = feed(t, 4050, 4300, 0.15);
  assert.equal(moved.status, 'active'); assert.ok(moved.raw.pitch > 0.1);
  assert.equal(feed(t, 4350, 6500, 0.15).status, 'stable');
});
test('orientation-only fallback stays live for 30 seconds', () => {
  const t = new SensorTracker(); const s = feed(t, 0, 30000, 2, -1, 'orientation', 100);
  assert.equal(s.source, 'orientation'); assert.equal(s.status, 'stable');
});
test('no double sampling; qualified motion preferred, fallback only after timeout', () => {
  const t = new SensorTracker();
  for (let time = 0; time <= 3000; time += 50) {
    t.receive('orientation', { beta: 1, gamma: 0 }, time);
    t.receive('motion', motion(1), time + 1);
  }
  assert.equal(t.source, 'motion'); assert.ok(t.samples.length <= 41);
  assert.equal(t.receive('orientation', { beta: 1, gamma: 0 }, 3500).source, 'motion');
  assert.equal(t.receive('orientation', { beta: 1, gamma: 0 }, 4100).source, 'orientation');
  assert.equal(t.receive('motion', motion(1), 4200).source, 'orientation');
  assert.equal(feed(t, 4250, 4800, 1).source, 'motion');
});
test('incompatible motion signs/bias never reinterpret orientation calibration', () => {
  const t = new SensorTracker();
  for (let time = 0; time <= 3000; time += 50) {
    t.receive('orientation', { beta: 2, gamma: 0 }, time);
    t.receive('motion', motion(-2), time + 1);
  }
  assert.equal(t.source, 'orientation'); near(t.value.pitch, 2);
});
test('invalid gravity, null/nonfinite inputs and linear acceleration do not erase or refresh value', () => {
  const t = new SensorTracker(); const before = feed(t, 0, 3000);
  const invalid = [null, {}, { x: null, y: 0, z: 9.81 }, { x: NaN, y: 0, z: 9.81 }, { x: 0, y: Infinity, z: 9.81 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -9.81 }, { x: 0, y: 0, z: 15 }, { x: 9.81, y: 0, z: 0 }];
  for (const g of invalid) { assert.equal(motionSlopes({ accelerationIncludingGravity: g }), null); t.receive('motion', { accelerationIncludingGravity: g }, 4000); }
  t.receive('motion', { ...motion(), acceleration: { x: 1, y: 0, z: 0 } }, 4500);
  for (const beta of [null, undefined, NaN, Infinity, 90]) t.receive('orientation', { beta, gamma: 0 }, 5000);
  assert.deepEqual(t.value, before.raw); assert.equal(t.snapshot(7000).status, 'retained');
});
test('sparse events or a burst cannot prove stability', () => {
  for (const interval of [500, 1500]) {
    const t = new SensorTracker(); assert.equal(feed(t, 0, 30000, 0, 0, 'orientation', interval).stable, false);
  }
  const t = new SensorTracker(); assert.equal(feed(t, 0, 100, 0, 0, 'orientation', 1).stable, false);
  assert.equal(t.snapshot(2000).stable, false);
});
test('gravity, all signed coupled axes, legacy calibration and ramp placements agree', () => {
  const zero = { pitch: 4, roll: -3 }; const original = JSON.stringify(zero);
  const config = { wheelbase: 403.5, track: 181, maxLevel: 3, heights: [4, 11, 17] };
  for (const beta of [-8, -2, 0, 2, 8]) for (const gamma of [-8, -2, 0, 2, 8]) {
    const a = sensorSlopes(beta, gamma), b = motionSlopes(motion(beta, gamma));
    near(a.pitch, b.pitch); near(a.roll, b.roll);
    const ca = calibratedAngles(a, zero), cb = calibratedAngles(b, zero);
    near(ca.pitch, cb.pitch); near(ca.roll, cb.roll);
    const ra = solve(ca.pitch, ca.roll, config), rb = solve(cb.pitch, cb.roll, config);
    assert.deepEqual(ra.levels, rb.levels); near(ra.residual, rb.residual);
  }
  assert.equal(JSON.stringify(zero), original);
});
test('visibility interruption keeps value but demands new samples on return; listeners clean up', () => {
  const host = new EventTarget(), doc = new EventTarget(); let now = 0, state;
  doc.hidden = false; const tracker = new SensorTracker();
  const dispose = listenSensors(host, doc, tracker, { orientation: true }, s => state = s, () => now);
  const send = () => { const e = new Event('deviceorientation'); Object.assign(e, { beta: 1, gamma: 0 }); host.dispatchEvent(e); };
  for (; now <= 3000; now += 100) send();
  assert.equal(state.status, 'stable'); const saved = state.raw;
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange')); send();
  assert.equal(state.status, 'retained'); assert.deepEqual(state.raw, saved);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(state.status, 'retained'); now += 100; send(); assert.equal(state.status, 'active');
  dispose(); const time = state.raw.time; now += 100; send(); assert.equal(state.raw.time, time);
});
test('permissions requested together during user action; partial denial allows fallback', async () => {
  const called = []; let resolve;
  const p = requestSensorAccess({ isSecureContext: true,
    DeviceMotionEvent: { requestPermission: () => { called.push('motion'); return new Promise(r => resolve = r); } },
    DeviceOrientationEvent: { requestPermission: () => { called.push('orientation'); return Promise.resolve('granted'); } } });
  assert.deepEqual(called, ['motion', 'orientation']); resolve('denied');
  assert.deepEqual(await p, { motion: false, orientation: true });
});
test('ungranted, rejected, throwing, unavailable and insecure permissions', async () => {
  for (const permission of ['denied', 'prompt', undefined]) await assert.rejects(requestSensorAccess({ isSecureContext: true, DeviceMotionEvent: { requestPermission: () => permission } }));
  await assert.rejects(requestSensorAccess({ isSecureContext: true, DeviceOrientationEvent: { requestPermission: () => Promise.reject(new Error()) } }));
  await assert.rejects(requestSensorAccess({ isSecureContext: true, DeviceMotionEvent: { requestPermission: () => { throw new Error(); } } }));
  await assert.rejects(requestSensorAccess({ isSecureContext: true }));
  await assert.rejects(requestSensorAccess({ isSecureContext: false }));
  assert.deepEqual(await requestSensorAccess({ isSecureContext: true, DeviceOrientationEvent: {} }), { motion: false, orientation: true });
});
