import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeMotion,listenNativeSensors} from '../src/native-sensors.js';
import {motionSlopes,SensorTracker} from '../src/sensors.js';
import {calibratedAngles,solve} from '../src/level.js';
const config={wheelbase:403.5,track:181,maxLevel:3,heights:[7,14,21]};
function vector(pitch,roll){const x=Math.tan(roll*Math.PI/180),y=Math.tan(pitch*Math.PI/180),m=Math.hypot(x,y,1);return {x:x/m*9.81,y:y/m*9.81,z:9.81/m};}
test('native gravity signs, coupled axes, calibration and ramp placements',()=>{
 for(const pitch of [-5,0,5])for(const roll of [-4,0,4]){
  const slopes=motionSlopes(nativeMotion(vector(pitch,roll)));
  assert.ok(Math.abs(slopes.pitch-pitch)<1e-10);assert.ok(Math.abs(slopes.roll-roll)<1e-10);
  assert.deepEqual(solve(slopes.pitch,slopes.roll,config).levels,solve(pitch,roll,config).levels);
  const zero=calibratedAngles(slopes,slopes);assert.ok(Math.abs(zero.pitch)<1e-10&&Math.abs(zero.roll)<1e-10);
 }
 assert.equal(nativeMotion({x:null,y:0,z:9.81}),null);assert.equal(nativeMotion({x:0,y:Infinity,z:9}),null);
 assert.equal(motionSlopes(nativeMotion({x:0,y:0,z:-9.81})),null);
});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('native stream uses acquisition timestamps, drops delayed samples, pauses and cleans listeners',async()=>{
 let now=1000,started=0,stopped=0;const listeners=new Map();
 const plugin={async addListener(name,fn){listeners.set(name,fn);return {async remove(){listeners.delete(name);}};},async start(){started++;return {elapsedRealtimeMs:5000};},async stop(){stopped++;}};
 const doc=new EventTarget();doc.hidden=false;const tracker=new SensorTracker();const errors=[];
 const stop=listenNativeSensors(plugin,doc,tracker,()=>{},e=>errors.push(e),()=>now);await flush();assert.equal(started,1);
 for(let i=0;i<150;i++){now=1000+i*20;listeners.get('sample')({...vector(0,0),timestampMs:5000+i*20});}
 assert.equal(tracker.snapshot(now).stable,true);
 const last=tracker.value.time;now+=2000;listeners.get('sample')({...vector(8,0),timestampMs:5000});assert.equal(tracker.value.time,last);
 listeners.get('sensorState')({active:false});assert.equal(tracker.snapshot(now).fresh,false);
 listeners.get('sensorState')({active:true});assert.equal(tracker.snapshot(now).stable,false);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));listeners.get('sample')({...vector(3,0),timestampMs:now+4000});assert.equal(tracker.value.time,last);
 stop();await flush();assert.equal(stopped,1);assert.equal(listeners.size,0);assert.deepEqual(errors,[]);
});
test('native start failures are explicit and a cancelled setup cannot publish readings',async()=>{
 const doc=new EventTarget();doc.hidden=false;const tracker=new SensorTracker();const errors=[];let removed=0;
 const plugin={async addListener(){return {async remove(){removed++;}};},async start(){throw new Error('No sensor');},async stop(){}};
 const stop=listenNativeSensors(plugin,doc,tracker,()=>{},e=>errors.push(e),()=>0);await flush();assert.deepEqual(errors,['No sensor']);assert.equal(tracker.snapshot(0).fresh,false);stop();await flush();assert.equal(removed,2);
});
