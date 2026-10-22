export const WHEELS = ['Avant gauche', 'Avant droite', 'Arrière gauche', 'Arrière droite'];
const rad = Math.PI / 180;
export function validate({ wheelbase, track, maxLevel }) {
  if (!Number.isFinite(wheelbase) || wheelbase < 200 || wheelbase > 500 || !Number.isFinite(track) || track < 120 || track > 240 || !Number.isInteger(maxLevel) || maxLevel < 1 || maxLevel > 5) throw new Error('Empattement : 200–500 cm ; voie : 120–240 cm ; paliers : 1–5.');
}
// Screen-up portrait, top of phone pointing to vehicle front. W3C Z-X-Y rotation.
export function sensorSlopes(beta, gamma) {
  if (![beta, gamma].every(Number.isFinite) || Math.abs(beta) > 20 || Math.abs(gamma) > 20) throw new Error('Posez le téléphone à plat, écran vers le haut (moins de 20°).');
  return { pitch: Math.atan(Math.tan(beta * rad) / Math.cos(gamma * rad)) / rad, roll: -gamma };
}
export function groundHeights(pitch, roll, wheelbase, track) {
  if (![pitch, roll].every(Number.isFinite) || Math.abs(pitch) > 15 || Math.abs(roll) > 15) throw new Error('Mesure hors plage : ±15°.');
  const p = Math.tan(pitch * rad) * wheelbase / 2;
  const r = Math.tan(roll * rad) * track / 2;
  return [p-r, p+r, -p-r, -p+r];
}
// A rigid rectangle rests on a high diagonal. Evaluate both possible supporting
// triangles; taking their worst tilt avoids promising a fictitious 4-point plane.
export function evaluate(h, wheelbase, track) {
  const planes = [
    [(h[1]-h[0])/track,(h[0]-h[2])/wheelbase, h[1]+h[2]-h[0]-h[3]],
    [(h[1]-h[0])/track,(h[1]-h[3])/wheelbase, h[0]+h[3]-h[1]-h[2]],
    [(h[3]-h[2])/track,(h[0]-h[2])/wheelbase, h[0]+h[3]-h[2]-h[1]],
    [(h[3]-h[2])/track,(h[1]-h[3])/wheelbase, h[1]+h[2]-h[3]-h[0]],
  ].filter(p => p[2] >= -1e-8);
  return { residual: Math.max(...planes.map(([r,p]) => Math.atan(Math.hypot(r,p))/rad)), gap: Math.abs(h[0]+h[3]-h[1]-h[2]) };
}
export function solve(pitch, roll, config) {
  validate(config);
  const { wheelbase, track, maxLevel } = config;
  const h = groundHeights(pitch, roll, wheelbase, track);
  const ideal = h.map(v => Math.max(...h)-v);
  let best;
  for (let a=0;a<=maxLevel;a++) for(let b=0;b<=maxLevel;b++) for(let c=0;c<=maxLevel;c++) for(let d=0;d<=maxLevel;d++) {
    const levels=[a,b,c,d], count=levels.filter(Boolean).length;
    if(count>2) continue;
    const result=evaluate(h.map((v,i)=>v+7*levels[i]),wheelbase,track);
    const candidate={...result,levels,count,total:levels.reduce((s,v)=>s+v,0)};
    if(!best || candidate.residual < best.residual-1e-9 || (Math.abs(candidate.residual-best.residual)<1e-9 && (candidate.count<best.count || (candidate.count===best.count && candidate.total<best.total)))) best=candidate;
  }
  return {...best,ideal,initial:evaluate(h,wheelbase,track).residual};
}
// Rotate the measured gravity normal by the minimal rotation taking the
// calibration normal to vertical, instead of subtracting coupled Euler angles.
export function calibratedAngles(raw, zero) {
  const normal=({pitch,roll})=>{const x=Math.tan(roll*rad),y=Math.tan(pitch*rad),n=Math.hypot(x,y,1);return [x/n,y/n,1/n]};
  const a=normal(zero),b=normal(raw),v=[a[1],-a[0],0];
  const cross=(u,w)=>[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
  const first=cross(v,b),second=cross(v,first),rotated=b.map((x,i)=>x+first[i]+second[i]/(1+a[2]));
  return {pitch:Math.atan2(rotated[1],rotated[2])/rad,roll:Math.atan2(rotated[0],rotated[2])/rad};
}

// Fixed scale across all wheels: green at zero, red at the ramp capacity.
export function correctionColor(cm, capacity) {
  const ratio = Math.max(0, Math.min(1, cm / capacity));
  return `hsl(${120 * (1 - ratio)} 65% 42%)`;
}
