export function measurementGuidance({ mode, enabled, accessError, diagnostic, startedAt, now }) {
 if (mode !== 'sensor') return null;
 if (accessError) return { title: 'Accès au capteur à vérifier', detail: 'Vérifiez l’autorisation d’accès aux mouvements dans votre navigateur, puis réactivez le capteur.' };
 if (!enabled) return null;
 if (diagnostic === 'tilted') return { title: 'Posez le téléphone à plat', detail: 'Écran vers le haut, haut vers l’avant du véhicule.' };
 if (diagnostic === 'no-signal' && now - startedAt >= 3000) return { title: 'Aucun signal du capteur', detail: 'Vérifiez le capteur dans les paramètres.' };
 if (diagnostic === 'invalid') return { title: 'Données inutilisables', detail: 'Vérifiez le capteur dans les paramètres.' };
 return null;
}
