import React from 'react';
export function MeasurementNotice({notice}) {
 return <div className="measurement-notice-slot">{notice&&<div className={"measurement-notice notice-"+notice.kind}>
  {notice.kind==='gauge'?<div className="stability-gauge"><div className="stability-heading"><strong>{notice.title}</strong><span>{notice.progress===100?'✓ Stable':`${notice.progress} %`}</span></div><progress aria-label={notice.title} aria-valuetext={notice.progress===100?'Mesure stable':`${notice.progress} %, ${notice.detail}`} value={notice.progress} max="100"/></div>:
  <div role="status" aria-live="polite"><strong>{notice.title}</strong><p>{notice.detail}</p></div>}
 </div>}</div>;
}
