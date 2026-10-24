export function measurementGuidance({ mode, enabled, accessError, diagnostic, startedAt, now }) {
 if (mode !== 'sensor') return null;
 if (accessError) return { title: 'Accès au capteur à vérifier', detail: accessError };
 if (!enabled) return null;
 switch (diagnostic) {
  case 'tilted': return { title: 'Posez le téléphone à plat', detail: 'Écran vers le haut, haut du téléphone vers l’avant du véhicule. Inclinaison hors de la plage de mesure.' };
  case 'moving': return { title: 'Mesure perturbée', detail: 'Posez le téléphone et gardez-le immobile quelques secondes.' };
  case 'invalid': return { title: 'Données du capteur inutilisables', detail: 'Posez le téléphone à plat. Si le problème persiste, relancez le capteur dans les paramètres.' };
  case 'stabilizing': return { title: 'Stabilisation en cours', detail: 'Gardez le téléphone immobile quelques secondes.' };
  case 'paused': return { title: 'Mesure en pause', detail: 'La dernière valeur reste affichée. Reposez le téléphone à plat ; la mesure reprendra à réception de nouvelles données.' };
  case 'waiting': return { title: 'En attente d’une mesure exploitable', detail: 'Posez le téléphone à plat, écran vers le haut.' };
  case 'no-signal': return now - startedAt < 3000 ? { title: 'Connexion au capteur…', detail: 'Posez le téléphone à plat, écran vers le haut.' } : { title: 'Aucun signal du capteur', detail: 'Vérifiez l’accès aux mouvements dans votre navigateur (Safari sur iPhone), puis relancez le capteur dans les paramètres.' };
  default: return null;
 }
}
