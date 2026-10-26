// Android vectors are remapped to screen coordinates by the native plugin.
// Positive y = phone top raised; positive x = right edge raised.
export function nativeMotion(sample) {
 if (!sample || ![sample.x,sample.y,sample.z].every(Number.isFinite)) return null;
 return {accelerationIncludingGravity:{x:sample.x,y:sample.y,z:sample.z}};
}

// Serialize ownership of the one native subscription across effect restarts.
let operations=Promise.resolve();
export function listenNativeSensors(plugin, doc, tracker, update, onError, clock=()=>performance.now()) {
 let disposed=false,offset=null,handles=[];
 const publish=()=>update(tracker.snapshot(clock()));
 const visibility=()=>{tracker.suspend(doc.hidden);publish();};
 doc.addEventListener('visibilitychange',visibility);visibility();
 const setup=async()=>{
  if(disposed)return;
  handles.push(await plugin.addListener('sample',sample=>{
   if(disposed||doc.hidden||offset===null)return;
   const event=nativeMotion(sample),time=sample.timestampMs+offset,now=clock();
   if(!event||!Number.isFinite(time)||time>now+100||now-time>1000)return;
   update(tracker.receive('motion',event,Math.min(time,now)));
  }));
  handles.push(await plugin.addListener('sensorState',state=>{
   if(disposed)return;
   tracker.suspend(!state.active||doc.hidden);publish();
   if(state.error)onError(state.error);
  }));
  const before=clock(),info=await plugin.start(),after=clock();
  offset=(before+after)/2-info.elapsedRealtimeMs;
 };
 operations=operations.then(setup).catch(error=>{if(!disposed){tracker.suspend(true);publish();onError(error.message||'Capteur Android indisponible.');}});
 return ()=>{
  disposed=true;doc.removeEventListener('visibilitychange',visibility);tracker.suspend(true);publish();
  operations=operations.then(async()=>{await plugin.stop();for(const handle of handles)await handle.remove();}).catch(()=>{});
 };
}
