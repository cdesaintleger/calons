import React from 'react';
export function MeasurementNotice({notice}) {
 if (!notice) return null;
 return <div className="measurement-notice" role="status" aria-live="polite"><div><strong>{notice.title}</strong><p>{notice.detail}</p></div></div>;
}
