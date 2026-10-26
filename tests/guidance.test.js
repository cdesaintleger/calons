import test from 'node:test';
import assert from 'node:assert/strict';
import {SensorTracker, sensorIssue} from '../src/sensors.js';
import {measurementGuidance} from '../src/guidance.js';
import {soundPlan} from '../src/audio.js';
const orient=(t,beta,time)=>t.receive('orientation',{beta,gamma:0},time);
const settle=t=>{for(let time=0;time<=2200;time+=50)orient(t,0,time);return t.snapshot(2200);};
const input={mode:'sensor',enabled:true,startedAt:0,now:4000};
test('upright orientation is explained without creating a sample; laying flat removes the placement notice',()=>{
 const t=new SensorTracker();const s=orient(t,75,0);assert.equal(s.diagnostic,'tilted');assert.equal(s.raw,null);
 assert.match(measurementGuidance({...input,...s}).title,/à plat/);
 assert.equal(orient(t,0,100).diagnostic,'stabilizing');
 for(let time=150;time<=2400;time+=50)orient(t,0,time);
 assert.equal(t.snapshot(2400).diagnostic,null);
 assert.equal(measurementGuidance({...input,...t.snapshot(2400)}),null);
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
 assert.equal(measurementGuidance({...input,diagnostic:'no-signal',now:1000}),null);
 assert.match(measurementGuidance({...input,diagnostic:'no-signal'}).title,/Aucun signal/);
 settle(t);assert.equal(t.snapshot(6000).diagnostic,'paused');
 assert.equal(measurementGuidance({...input,...t.snapshot(6000)}),null);
});
test('old fault expires; visibility return clears fault and requires fresh samples',()=>{
 const t=new SensorTracker();orient(t,80,0);assert.equal(t.snapshot(4000).diagnostic,'no-signal');
 settle(t);t.suspend(true);assert.equal(t.snapshot(2500).diagnostic,'paused');t.suspend(false);
 assert.equal(t.snapshot(2600).fresh,false);assert.equal(orient(t,0,2700).diagnostic,'stabilizing');
});
test('manual mode and unactivated sensors are quiet; activation errors are persistent guidance',()=>{
 assert.equal(measurementGuidance({...input,mode:'manual',accessError:'Refus'}),null);
 assert.equal(measurementGuidance({...input,enabled:false,diagnostic:'no-signal'}),null);
 assert.match(measurementGuidance({...input,enabled:false,accessError:'Accès refusé'}).title,/Accès/);
});
test('normal acquisition, stable and paused states do not create a stability notice',()=>{
 for(const diagnostic of ['moving','stabilizing','paused','waiting',null]) assert.equal(measurementGuidance({...input,diagnostic}),null);
 for(const diagnostic of ['tilted','invalid','no-signal']) assert.ok(measurementGuidance({...input,diagnostic}).title);
});
