import React, { useEffect, useRef } from 'react';
import { WHEELS } from './level.js';

export const THEMES = [
 {id:'classic',name:'Classique',description:'Le thème d’origine'},
 {id:'light',name:'Clair',description:'Ivoire et vert profond'},
 {id:'night',name:'Bleu nuit',description:'Marine et turquoise'},
];
export function ThemePicker({value,onChange}) {
 return <fieldset className="theme-picker"><legend>Apparence</legend>{THEMES.map(theme=><label key={theme.id} className={'theme-option '+theme.id}><input type="radio" name="theme" value={theme.id} checked={value===theme.id} onChange={()=>onChange(theme.id)}/><span className="theme-swatch" aria-hidden="true"/><span><strong>{theme.name}</strong><small>{theme.description}</small></span></label>)}</fieldset>;
}
export function SettingsDialog({open,title,onClose,children}) {
 const ref=useRef(null);
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog.open)dialog.showModal();else if(!open&&dialog.open)dialog.close();},[open]);
 return <dialog ref={ref} aria-label={title} className="preferences-dialog" onCancel={onClose} onClose={onClose}><div className="dialog-heading"><h2>{title}</h2><button aria-label="Fermer les paramètres" onClick={onClose}>×</button></div>{children}</dialog>;
}
const number=value=>value.toLocaleString('fr-FR',{maximumFractionDigits:1});
function Van() {
 return <svg className="modern-van" viewBox="0 0 140 300" aria-hidden="true"><defs><linearGradient id="van-body"><stop stopColor="#b9c6cb"/><stop offset=".25" stopColor="#f5f4ef"/><stop offset=".75" stopColor="#e0e6e5"/><stop offset="1" stopColor="#a3b4bc"/></linearGradient></defs><rect x="9" y="47" width="15" height="46" rx="6" fill="#263440"/><rect x="116" y="47" width="15" height="46" rx="6" fill="#263440"/><rect x="9" y="231" width="15" height="45" rx="6" fill="#263440"/><rect x="116" y="231" width="15" height="45" rx="6" fill="#263440"/><path d="M23 44Q23 9 53 8H87Q117 9 117 44V280Q117 293 101 293H39Q23 293 23 280Z" fill="url(#van-body)" stroke="#8f9fa7" strokeWidth="2"/><path d="M32 48Q70 34 108 48L102 78Q70 69 38 78Z" fill="#304d61" stroke="#748c96" strokeWidth="2"/><rect x="36" y="91" width="68" height="163" rx="15" fill="#e3e8e5" stroke="#afbdc0"/><rect x="54" y="111" width="32" height="32" rx="5" fill="#466274" stroke="#f8faf5" strokeWidth="3"/><rect x="54" y="199" width="32" height="26" rx="4" fill="#bccacf" stroke="#f8faf5" strokeWidth="2"/><path d="M39 265H101M70 266V286" stroke="#a9b7ba" fill="none"/><path d="M28 276h10m64 0h10" stroke="#cb5651" strokeWidth="4"/></svg>;
}
export function ModernMeasure({result,error,mode,fresh,stable,raw,enabled,sound,cal,config,onStart,onCalibrate,onHelp}) {
 const status=mode==='manual'?'◇ Simulation':fresh?(stable?'● Mesure stable':'◌ En mesure'):raw?'Ⅱ En pause':'○ En attente';
 const max=config.heights.at(-1);
 const title=error?'Mesure inexploitable':!result?(!enabled?'Prêt à vous poser ?':!raw?'En attente du capteur':!cal?'Calibrez le zéro':'En attente'):result.count?`${result.count} cale${result.count>1?'s':''} à placer`:'Aucune cale à placer';
 return <section className="modern-measure">
  <div className={"modern-status "+(!fresh||mode==='manual'?'muted':'')} role="status">{status}</div>
  <div className="modern-title"><h1>{title}</h1><p>{error||(!result?'Téléphone à plat, haut vers l’avant':mode==='sensor'&&!fresh?'Dernière mesure conservée · non actualisée':mode==='sensor'&&!stable?'Placement provisoire · stabilisation…':result.count?'Suivez les paliers indiqués':result.initial<=.2?'Le véhicule est à niveau':'Aucun placement ne réduit davantage la pente')}</p></div>
  <div className="modern-map"><span className="modern-front">AVANT ↑</span><Van/>{WHEELS.map((name,i)=>{
   const value=result?.ideal[i],ratio=value==null?0:Math.min(1,value/max);
   const intensity=value==null?'unknown':ratio<.15?'low':ratio<.5?'medium':'high';
   return <div key={name} className={`modern-wheel position-${i} ${intensity}`}>
    <span className="wheel-name">{name}</span><strong>{!result?'—':result.levels[i]?`${number(result.heights[i])} cm`:'Au sol'}</strong><small>{!result?'En attente':result.levels[i]?`Palier ${result.levels[i]}`:'Sans cale'}</small>
    <div className="intensity-track" role={result?'meter':undefined} aria-label={`Correction théorique ${name}`} aria-valuemin={result?0:undefined} aria-valuemax={result?max:undefined} aria-valuenow={result?Math.min(value,max):undefined} aria-valuetext={result?`${number(value)} cm de correction théorique${value>max?', au-delà de la hauteur maximale des cales':''}`:undefined}><span style={{width:`${ratio*100}%`}}/></div>
    <span className="wheel-connector" aria-hidden="true"/>{Boolean(result?.levels[i])&&<span className="ramp-symbol" aria-hidden="true"/>}
   </div>;
  })}<div className="intensity-legend"><span>Faible</span><i/><span>Forte</span><small>Correction théorique</small></div></div>
  <div className={"modern-prediction "+(result?.residual>.5?'imperfect':'')}><span>Après calage{result?.residual>.5&&<small className="prediction-warning">Résultat imparfait</small>}</span><strong>{result?`≈ ${number(result.residual)}°`:'—'}<small> estimés</small></strong></div>
  <div className="modern-actions">{mode==='sensor'&&!enabled?<button className="primary" onClick={onStart}>Activer le capteur</button>:<button disabled={mode!=='sensor'||!raw} onClick={onCalibrate}>⊕ Calibrer</button>}<button onClick={onHelp}>ⓘ Aide</button></div>
  {(sound.enabled||!sound.label.includes('désactivé'))&&<p className="modern-sound" role="status">{sound.label}</p>}
 </section>;
}
