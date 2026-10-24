import React from 'react';
export function MeasurementNotice({notice}) {
 return <div className="measurement-notice-slot" role="status" aria-live="polite" aria-atomic="true">{notice&&<div className="measurement-notice"><span aria-hidden="true">ⓘ</span><div><strong>{notice.title}</strong><p>{notice.detail}</p></div></div>}</div>;
}
