import test from 'node:test';
import assert from 'node:assert/strict';
import {SensorTracker, sensorIssue} from '../src/sensors.js';
import {measurementGuidance} from '../src/guidance.js';
import {soundPlan} from '../src/audio.js';
const orient=(t,beta,time)=>t.receive('orientation',{beta,gamma:0},time);
const settle=t=>{for(let time=0;time<=2200;time+=50)orient(t,0,time);return t.snapshot(2200);};
const input={mode:'sensor',enabled:true,startedAt:0,now:4000};
test('upright orientation is explained without creating a sample; laying flat completes the gauge after stability',()=>{
 const t=new SensorTracker();const s=orient(t,75,0);assert.equal(s.diagnostic,'tilted');assert.equal(s.raw,null);
 assert.match(measurementGuidance({...input,...s}).title,/à plat/);
 assert.equal(orient(t,0,100).diagnostic,'stabilizing');
 for(let time=150;time<=2400;time+=50)orient(t,0,time);
 assert.equal(t.snapshot(2400).diagnostic,null);
 assert.equal(measurementGuidance({...input,...t.snapshot(2400)}).progress,100);
});
test('invalid selected sensor immediately invalidates freshness and audio but preserves value and calibration input',()=>{
 const t=new SensorTracker();const before=settle(t);const bad=orient(t,90,2300);
 assert.deepEqual(bad.raw,before.raw);assert.equal(bad.fresh,false);assert.equal(bad.stable,false);assert.equal(bad.diagnostic,'tilted');
 assert.equal(soundPlan({angles:bad.raw,mode:'sensor',...bad,sampleTime:bad.raw.time,now:2300}).kind,'silent');
 const resumed=orient(t,0,2400);assert.equal(resumed.fresh,true);assert.equal(resumed.stable,false);
});
test('rejected secondary motion does not hide a healthy orientation fallback',()=>{
 const t=new SensorTracker();settle(t);
 const s=t.receive('motion',{accelerationIncludingGravity:{x:0,y:9.81,z:0}},2300);
 assert.equal(s.fresh,true);assert.equal(s.diagnostic,null);assert.equal(s.source,'orientation');
});
test('motion diagnostics distinguish invalid values, perturbation and screen-down posture',()=>{
 assert.equal(sensorIssue('motion',{accelerationIncludingGravity:null}),'invalid');
 assert.equal(sensorIssue('motion',{accelerationIncludingGravity:{x:NaN,y:0,z:9.81}}),'invalid');
 assert.equal(sensorIssue('motion',{accelerationIncludingGravity:{x:0,y:0,z:9.81},acceleration:{x:1,y:0,z:0}}),'moving');
 assert.equal(sensorIssue('motion',{accelerationIncludingGravity:{x:0,y:0,z:-9.81}}),'tilted');
 assert.equal(sensorIssue('orientation',{beta:null,gamma:0}),'invalid');
});
test('signal timeout and retained values have different instructions, without inferring permission denial',()=>{
 const t=new SensorTracker();assert.equal(t.snapshot(4000).diagnostic,'no-signal');
 assert.equal(measurementGuidance({...input,diagnostic:'no-signal',now:1000}).kind,'gauge');
 assert.match(measurementGuidance({...input,diagnostic:'no-signal'}).title,/Aucun signal/);
 settle(t);assert.equal(t.snapshot(6000).diagnostic,'paused');
 assert.equal(measurementGuidance({...input,...t.snapshot(6000)}).progress,0);
});
test('old fault expires; visibility return clears fault and requires fresh samples',()=>{
 const t=new SensorTracker();orient(t,80,0);assert.equal(t.snapshot(4000).diagnostic,'no-signal');
 settle(t);t.suspend(true);assert.equal(t.snapshot(2500).diagnostic,'paused');t.suspend(false);
 assert.equal(t.snapshot(2600).fresh,false);assert.equal(orient(t,0,2700).diagnostic,'stabilizing');
});
test('manual mode and unactivated sensors are quiet; activation errors are persistent guidance',()=>{
 assert.equal(measurementGuidance({...input,mode:'manual',accessError:'Refus'}),null);
 assert.equal(measurementGuidance({...input,enabled:false,diagnostic:'no-signal'}).progress,0);
 assert.equal(measurementGuidance({...input,enabled:false,accessError:'Accès refusé'}).kind,'message');
});
test('diagnostics provide accessible labels and stable state completes the gauge',()=>{
 for(const diagnostic of ['tilted','moving','invalid','stabilizing','paused','waiting','no-signal']){
  const notice=measurementGuidance({...input,diagnostic});assert.ok(notice.title&&notice.detail);
 }
 assert.equal(measurementGuidance({...input,diagnostic:null,progress:100}).progress,100);
});

test('progress follows samples, never a timer; movement and stale data reset it',()=>{
 const t=new SensorTracker();for(let time=0;time<=700;time+=50)orient(t,0,time);
 const p=t.snapshot(700).progress;assert.ok(p>0&&p<100);
 assert.equal(t.snapshot(1100).progress,p);
 assert.equal(orient(t,2,750).progress,0);
 for(let time=800;time<=3000;time+=50)orient(t,2,time);
 assert.equal(t.snapshot(3000).progress,100);assert.equal(t.snapshot(6100).progress,0);
 t.suspend(true);assert.equal(t.snapshot(6200).progress,0);
});
