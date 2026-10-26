import { sensorSlopes, isStable } from './level.js';

const RAD = Math.PI / 180;
export const FRESH_MS = 3000;
const SOURCE_TIMEOUT = 1000;

// W3C device coordinates, natural portrait, screen up. The vertical normal is
// (-cos(beta)*sin(gamma), sin(beta), cos(beta)*cos(gamma)). These ratios
// reproduce sensorSlopes exactly, including coupled axes and persisted zeros.
export function motionSlopes(event) {
  const g = event.accelerationIncludingGravity;
  if (!g || ![g.x, g.y, g.z].every(Number.isFinite)) return null;
  const magnitude = Math.hypot(g.x, g.y, g.z);
  if (magnitude < 8.5 || magnitude > 11 || g.z <= 0) return null;
  const a = event.acceleration;
  if (a && [a.x, a.y, a.z].every(Number.isFinite) && Math.hypot(a.x, a.y, a.z) > 0.5) return null;
  const beta = Math.asin(g.y / magnitude) / RAD;
  const gamma = -Math.atan2(g.x, g.z) / RAD;
  try { return sensorSlopes(beta, gamma); } catch { return null; }
}

// Diagnostic only: rejected events never become measurements.
export function sensorIssue(source, event) {
  if (source === 'orientation') {
    if (![event.beta, event.gamma].every(Number.isFinite)) return 'invalid';
    return Math.abs(event.beta) > 20 || Math.abs(event.gamma) > 20 ? 'tilted' : null;
  }
  const g = event.accelerationIncludingGravity;
  if (!g || ![g.x, g.y, g.z].every(Number.isFinite)) return 'invalid';
  const magnitude = Math.hypot(g.x, g.y, g.z);
  if (magnitude < 8.5 || magnitude > 11) return 'moving';
  const a = event.acceleration;
  if (a && [a.x, a.y, a.z].every(Number.isFinite) && Math.hypot(a.x, a.y, a.z) > 0.5) return 'moving';
  return motionSlopes(event) ? null : 'tilted';
}

const distance = (a, b) => Math.max(Math.abs(a.pitch - b.pitch), Math.abs(a.roll - b.roll));

// Progress depends on received samples, never on elapsed wall time alone.
export function stabilityProgress(samples, now) {
  if (!samples.length || now - samples.at(-1).time > 1000) return 0;
  const window = [];
  for (let i = samples.length - 1; i >= 0; i--) {
    const next = [samples[i], ...window];
    if (!['pitch', 'roll'].every(k => Math.max(...next.map(s => s[k])) - Math.min(...next.map(s => s[k])) <= 0.2)) break;
    window.unshift(samples[i]);
  }
  const span = window.length ? window.at(-1).time - window[0].time : 0;
  return Math.floor(99 * Math.min(1, span / 1500, window.length / 10));
}

// Only receive() accepts a new reading. snapshot() never advances sample time.
export class SensorTracker {
  constructor() { this.value = null; this.lastStable = null; this.suspend(false); }
  suspend(hidden) {
    this.hidden = hidden;
    this.observations = {};
    this.interrupted = true;
    this.source = null;
    this.samples = [];
    this.filtered = null;
    this.lock = null;
    this.motionRun = [];
    this.orientation = null;
  }
  receive(source, event, time) {
    if (this.hidden || !Number.isFinite(time)) return this.snapshot(time);
    if (!['motion', 'orientation'].includes(source)) return this.snapshot(time);
    const previous = this.observations[source];
    if (previous && time <= previous.time) return this.snapshot(time);
    this.observations[source] = { time, issue: sensorIssue(source, event) };
    let v;
    if (source === 'motion') v = motionSlopes(event);
    else if (source === 'orientation') {
      try { v = sensorSlopes(event.beta, event.gamma); } catch { v = null; }
    } else return this.snapshot(time);
    if (!v) {
      if (source === 'motion') this.motionRun = [];
      if (source === this.source) this.interrupted = true;
      return this.snapshot(time);
    }
    if (source === 'orientation') this.orientation = { ...v, time };
    if (source === 'motion') {
      // Do not mix incompatible platform conventions/biases. Such devices keep
      // the orientation fallback; never infer a new calibration or invert axes.
      if (this.orientation && time - this.orientation.time < SOURCE_TIMEOUT && distance(v, this.orientation) > 0.3) {
        this.motionRun = [];
        return this.snapshot(time);
      }
      if (this.motionRun.length && time - this.motionRun.at(-1) > 250) this.motionRun = [];
      this.motionRun.push(time);
      this.motionRun = this.motionRun.filter(t => time - t <= 1000);
      if (this.source !== 'motion' && (this.motionRun.length < 5 || time - this.motionRun[0] < 500)) return this.snapshot(time);
    } else if (this.source === 'motion' && time - this.value.time < SOURCE_TIMEOUT) return this.snapshot(time);

    if (this.value && time <= this.value.time) return this.snapshot(time);
    const reset = this.source !== source || !this.value || time - this.value.time >= SOURCE_TIMEOUT || this.interrupted;
    if (reset) { this.samples = []; this.filtered = null; this.lock = null; }
    this.source = source;
    this.interrupted = false;
    // A real small tilt must unlock promptly, even if the old window's range
    // would still fit the stability threshold. Noise below 0.08° stays locked.
    if (this.lock && distance(v, this.lock) > 0.08) { this.lock = null; this.samples = []; }
    this.samples.push({ ...v, time });
    this.samples = this.samples.filter(s => time - s.time <= 2000);
    const alpha = this.filtered ? 1 - Math.exp(-(time - this.value.time) / 150) : 1;
    this.filtered = {
      pitch: (this.filtered?.pitch ?? v.pitch) + alpha * (v.pitch - (this.filtered?.pitch ?? v.pitch)),
      roll: (this.filtered?.roll ?? v.roll) + alpha * (v.roll - (this.filtered?.roll ?? v.roll)),
    };
    const stable = isStable(this.samples, time);
    if (stable && !this.lock) {
      this.lock = Object.fromEntries(['pitch', 'roll'].map(k => [k, this.samples.reduce((sum, s) => sum + s[k], 0) / this.samples.length]));
    }
    const next = this.lock || this.filtered;
    const shown = !reset && !this.lock && this.value && distance(next, this.value) < 0.03 ? this.value : next;
    this.value = { pitch: shown.pitch, roll: shown.roll, time };
    if (stable) this.lastStable = { ...this.value };
    return this.snapshot(time);
  }
  snapshot(time) {
    const fresh = Boolean(this.value && !this.interrupted && !this.hidden && time - this.value.time < FRESH_MS);
    // Stability describes a confirmed pose, freshness describes live reception.
    // A timer may downgrade status, but cannot confirm stability or add samples.
    const stable = fresh && Boolean(this.lock);
    const recent = Object.values(this.observations).filter(o => time >= o.time && time - o.time < FRESH_MS);
    const selected = this.observations[this.source];
    const fault = selected && recent.includes(selected) && selected.issue ? selected.issue :
      recent.some(o => o.issue === 'tilted') ? 'tilted' : recent.some(o => o.issue === 'moving') ? 'moving' :
      recent.length && recent.every(o => o.issue) ? 'invalid' : null;
    const diagnostic = this.hidden ? 'paused' : fresh ? (stable ? null : 'stabilizing') :
      fault || (this.value ? 'paused' : recent.length ? 'waiting' : 'no-signal');
    return { progress: stable ? 100 : fresh ? stabilityProgress(this.samples, time) : 0, diagnostic, raw: this.value, lastStable: this.lastStable, source: this.source,
      fresh, stable, status: !this.value ? 'waiting' : !fresh ? 'retained' : stable ? 'stable' : 'active' };
  }
}

// Invoke both permission requests synchronously inside the user's click, before
// awaiting either promise (transient user activation on iOS).
export async function requestSensorAccess(host) {
  if (!host.isSecureContext) throw new Error('Ouvrez cette application en HTTPS pour accéder aux capteurs.');
  const requests = [['motion', host.DeviceMotionEvent], ['orientation', host.DeviceOrientationEvent]].map(([name, api]) => {
    try { return [name, api ? (typeof api.requestPermission === 'function' ? api.requestPermission() : 'granted') : 'unavailable']; }
    catch { return [name, 'denied']; }
  });
  const results = await Promise.all(requests.map(async ([name, permission]) => {
    try { return [name, await permission === 'granted']; } catch { return [name, false]; }
  }));
  const access = Object.fromEntries(results);
  if (!access.motion && !access.orientation) throw new Error('Capteurs indisponibles ou accès refusé. Vérifiez les autorisations du navigateur, ou utilisez la simulation.');
  return access;
}

export function listenSensors(host, doc, tracker, access, update, clock = () => performance.now()) {
  const receive = source => e => update(tracker.receive(source, e, clock()));
  const motion = receive('motion'), orientation = receive('orientation');
  const visibility = () => { tracker.suspend(doc.hidden); update(tracker.snapshot(clock())); };
  visibility();
  if (access.motion) host.addEventListener('devicemotion', motion);
  if (access.orientation) host.addEventListener('deviceorientation', orientation);
  doc.addEventListener('visibilitychange', visibility);
  return () => {
    host.removeEventListener('devicemotion', motion);
    host.removeEventListener('deviceorientation', orientation);
    doc.removeEventListener('visibilitychange', visibility);
  };
}
