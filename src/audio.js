import { FRESH_MS } from './sensors.js';

// Actual calibrated inclination, never the solver's predicted residual tilt.
export function soundPlan(input, wasLevel = false) {
  const { angles, mode, fresh, stable, sampleTime, now, hidden } = input;
  if (hidden) return { kind: 'silent', label: 'Son suspendu · application en arrière-plan' };
  if (mode !== 'sensor') return { kind: 'silent', label: 'Son suspendu · mode simulation' };
  if (!angles) return { kind: 'silent', label: 'Son suspendu · activez et calibrez le capteur' };
  if (![angles.pitch, angles.roll, sampleTime, now].every(Number.isFinite) || Math.abs(angles.pitch) > 15 || Math.abs(angles.roll) > 15) return { kind: 'silent', label: 'Son suspendu · mesure inexploitable' };
  if (!fresh || now < sampleTime || now - sampleTime >= FRESH_MS) return { kind: 'silent', label: 'Son suspendu · mesure non actualisée' };
  const rad = Math.PI / 180;
  const tilt = Math.atan(Math.hypot(Math.tan(angles.pitch * rad), Math.tan(angles.roll * rad))) / rad;
  // Hysteresis avoids repeated beeps/continuous transitions near the threshold.
  const level = stable && tilt <= (wasLevel ? 0.3 : 0.2);
  if (level) return { kind: 'continuous', label: 'Niveau atteint · son continu', tilt };
  const interval = 200 + 1800 * Math.max(0, Math.min(1, (tilt - 0.2) / 1.8));
  return { kind: 'beep', interval, tilt, label: tilt < 0.5 ? 'Approche du niveau · bips rapides' : 'Guidage sonore · bips espacés' };
}

// One oscillator per user activation. Audio-clock envelopes include an expiry
// even when JS timers are delayed. The timer reads measurements, never makes any.
export class SoundGuide {
  constructor({ createContext, read, notify, clock = () => performance.now(), schedule = fn => setInterval(fn, 50), cancel = id => clearInterval(id) }) {
    Object.assign(this, { createContext, read, notify, clock, schedule, cancel });
    this.enabled = false;
    this.generation = 0;
    this.label = '';
  }
  report(label) { if (label !== this.label) { this.label = label; this.notify({ enabled: this.enabled, label }); } }
  async enable() {
    this.disable();
    const generation = ++this.generation;
    this.enabled = true;
    this.report('Activation du son…');
    try {
      // Creation and resume both happen in the direct click, before any await.
      const context = this.createContext();
      this.context = context;
      this.gain = context.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(context.destination);
      this.oscillator = context.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 660;
      this.oscillator.connect(this.gain);
      this.oscillator.start();
      await context.resume();
      if (generation !== this.generation) return;
      if (context.state !== 'running') throw new Error('Audio indisponible');
      context.onstatechange = () => {
        if (this.enabled && context.state !== 'running') {
          this.disable();
          this.report('Son interrompu · touchez « Son désactivé » pour réactiver');
        }
      };
      this.lastBeep = -Infinity;
      this.kind = 'silent';
      this.timer = this.schedule(() => this.tick());
      this.tick();
    } catch {
      if (generation !== this.generation) return;
      this.disable();
      this.report('Audio indisponible · réessayez en touchant le bouton Son');
    }
  }
  mute() {
    if (!this.gain || !this.context) return;
    this.gain.gain.cancelScheduledValues(this.context.currentTime);
    this.gain.gain.setValueAtTime(0, this.context.currentTime);
  }
  tick() {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const now = this.clock(), input = this.read(now);
    const plan = soundPlan({ ...input, now }, this.kind === 'continuous');
    const previous = this.kind;
    this.kind = plan.kind;
    this.report(plan.label);
    if (plan.kind === 'silent') { this.mute(); this.lastBeep = -Infinity; return; }
    const time = this.context.currentTime, gain = this.gain.gain;
    // Every audible envelope expires no later than the real reading's deadline.
    const remaining = Math.max(0, (FRESH_MS - (now - input.sampleTime)) / 1000);
    if (remaining <= 0.02) { this.mute(); return; }
    if (plan.kind === 'continuous') {
      gain.cancelScheduledValues(time);
      gain.setValueAtTime(previous === 'continuous' ? 0.045 : 0, time);
      gain.linearRampToValueAtTime(0.045, time + 0.01);
      gain.setValueAtTime(0.045, time + remaining - 0.01);
      gain.linearRampToValueAtTime(0, time + remaining);
    } else {
      if (previous !== 'beep') { this.mute(); this.lastBeep = -Infinity; }
      if (now - this.lastBeep >= plan.interval) {
        const duration = Math.min(0.08, remaining);
        gain.cancelScheduledValues(time);
        gain.setValueAtTime(0, time);
        gain.linearRampToValueAtTime(0.06, time + 0.008);
        gain.setValueAtTime(0.06, time + duration - 0.01);
        gain.linearRampToValueAtTime(0, time + duration);
        this.lastBeep = now;
      }
    }
  }
  disable() {
    ++this.generation;
    this.enabled = false;
    if (this.timer !== undefined) this.cancel(this.timer);
    this.timer = undefined;
    this.mute();
    if (this.context) this.context.onstatechange = null;
    if (this.oscillator) { this.oscillator.stop(); this.oscillator.disconnect(); }
    if (this.gain) this.gain.disconnect();
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    this.context = this.gain = this.oscillator = null;
    this.kind = 'silent';
    this.report('Guidage sonore désactivé');
  }
}
