import React from 'react';
export function MeasurementNotice({notice, fallback = 'Écran vers le haut, haut du téléphone vers l’avant du véhicule.'}) {
 return <div className="measurement-context" role="status" aria-live="polite">{notice?<div className="measurement-notice"><strong>{notice.title}</strong><p>{notice.detail}</p></div>:<p>{fallback}</p>}</div>;
}
