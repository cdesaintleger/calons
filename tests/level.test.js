import test from 'node:test';
import assert from 'node:assert/strict';
import {solve,evaluate,groundHeights,sensorSlopes,calibratedAngles,validate} from '../src/level.js';
const config={wheelbase:400,track:180,maxLevel:3};
const angle=(height,distance)=>Math.atan(height/distance)*180/Math.PI;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('flat vehicle needs no ramps',()=>{const r=solve(0,0,config);assert.deepEqual(r.levels,[0,0,0,0]);near(r.residual,0)});
test('7 cm front-high slope raises rear wheels exactly',()=>{const r=solve(angle(7,400),0,config);assert.deepEqual(r.levels,[0,0,1,1]);near(r.residual,0)});
test('14 cm rear-high slope raises front wheels exactly',()=>{const r=solve(-angle(14,400),0,config);assert.deepEqual(r.levels,[2,2,0,0]);near(r.residual,0)});
test('right-high slope raises left wheels',()=>{const r=solve(0,angle(7,180),config);assert.deepEqual(r.levels,[1,0,1,0]);near(r.residual,0)});
test('left-high slope raises right wheels',()=>{assert.deepEqual(solve(0,-angle(7,180),config).levels,[0,1,0,1])});
test('tiny tilt prefers no ramps over harmful rounding up',()=>assert.equal(solve(.1,.1,config).count,0));
test('noncoplanar supports must not falsely report horizontal',()=>assert.ok(evaluate([7,0,0,7],400,180).residual>2));
test('ideal corrections reflect wheel geometry in cm',()=>{const h=groundHeights(angle(14,400),angle(7,180),400,180);near(h[1]-h[2],21);const r=solve(angle(14,400),angle(7,180),config);r.ideal.forEach((v,i)=>near(v,Math.max(...h)-h[i]))});
test('sensor mapping preserves signs and handles coupled angles',()=>{near(sensorSlopes(0,5).roll,-5);near(sensorSlopes(5,0).pitch,5);assert.ok(sensorSlopes(5,10).pitch>5);assert.throws(()=>sensorSlopes(null,0));assert.throws(()=>sensorSlopes(90,0))});
test('reject malformed settings and measurements',()=>{for(const c of [{...config,track:0},{...config,maxLevel:2.5},{...config,wheelbase:NaN}])assert.throws(()=>validate(c));assert.throws(()=>solve(Infinity,0,config));assert.throws(()=>solve(16,0,config))});
// Independent support-plane reference: each admissible plane must lie above all four supports.
function reference(h,L,T){const points=[[-T/2,L/2],[T/2,L/2],[-T/2,-L/2],[T/2,-L/2]];let worst=0;for(let omit=0;omit<4;omit++){const ids=[0,1,2,3].filter(i=>i!==omit);const [i,j,k]=ids;const [x,y]=points[i],dx=points[j][0]-x,dy=points[j][1]-y,ex=points[k][0]-x,ey=points[k][1]-y;const a=((h[j]-h[i])*ey-(h[k]-h[i])*dy)/(dx*ey-ex*dy),b=(dx*(h[k]-h[i])-ex*(h[j]-h[i]))/(dx*ey-ex*dy);if(a*(points[omit][0]-x)+b*(points[omit][1]-y)+h[i]>=h[omit]-1e-8)worst=Math.max(worst,Math.atan(Math.hypot(a,b))*180/Math.PI)}return worst}
test('global optimum compared with independent exhaustive support geometry',()=>{for(const pitch of [-3,-.8,0,1.2,4])for(const roll of [-3,0,2]){const r=solve(pitch,roll,config),h=groundHeights(pitch,roll,400,180);assert.ok(r.count<=2);assert.ok(r.residual<=r.initial+1e-8);near(r.residual,reference(h.map((v,i)=>v+7*r.levels[i]),400,180));for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)for(let a=0;a<=3;a++)for(let b=0;b<=3;b++){const raised=[...h];raised[i]+=7*a;raised[j]+=7*b;assert.ok(r.residual<=reference(raised,400,180)+1e-8)}}});

test("calibration removes reference tilt including coupled axes",()=>{const zero={pitch:4,roll:-3};const r=calibratedAngles(zero,zero);near(r.pitch,0);near(r.roll,0);const untouched=calibratedAngles(zero,{pitch:0,roll:0});near(untouched.pitch,4);near(untouched.roll,-3)});
