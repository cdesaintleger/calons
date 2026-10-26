export function measurementGuidance({ mode, enabled, accessError, diagnostic, progress = 0, startedAt, now }) {
 if (mode !== 'sensor') return null;
 if (accessError) return { kind: 'message', title: 'Accès au capteur à vérifier', detail: 'Vérifiez l’autorisation d’accès aux mouvements dans votre navigateur, puis réactivez le capteur.' };
 if (enabled && diagnostic === 'tilted') return { kind: 'message', title: 'Posez le téléphone à plat', detail: 'Écran vers le haut, haut vers l’avant du véhicule.' };
 const label = !enabled ? 'Capteur à activer' : diagnostic === 'paused' ? 'Mesure en pause' :
  diagnostic === 'no-signal' && now - startedAt >= 3000 ? 'Aucun signal du capteur' :
  diagnostic === 'invalid' ? 'Données inutilisables' : 'Stabilité';
 return { kind: 'gauge', title: label, progress: enabled ? progress : 0,
  detail: label === 'Stabilité' ? 'Gardez le téléphone immobile.' : 'Vérifiez le capteur dans les paramètres.' };
}
