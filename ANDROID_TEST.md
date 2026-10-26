# Calons Android — version de test 1.3.5-android.1

Cette version réutilise l’interface React dans Capacitor 8 et lit les capteurs via
un plugin Android Java. Ce n’est pas une interface entièrement réécrite en natif.
La PWA publiée reste sur la branche main et n’est pas remplacée.

## Installation et essai

- APK de test signé en debug, Android 7/API 24 minimum, WebView Android à jour.
- Application distincte : « Calons Test », identifiant `fr.calons.androidtest`.
- Télécharger l’APK sur le téléphone, l’ouvrir puis autoriser cette installation
  depuis le navigateur si Android le demande. Aucun compte ni Play Store requis.
- Activer le capteur et refaire la calibration sur une surface connue horizontale.
  Les réglages et la calibration du navigateur ne sont pas transférés.
- L’application et ses ressources sont embarquées : tester aussi en mode avion.
- Une future compilation debug peut utiliser une autre signature : désinstaller
  cette version avant réinstallation si Android refuse la mise à jour. Cette
  désinstallation efface les réglages de Calons Test, pas ceux de la PWA.

## Capteurs

- `SensorManager.TYPE_GRAVITY`, avec repli `TYPE_ACCELEROMETER` si absent.
- Cadence demandée 50 Hz, sans batching ; aucun événement inventé par minuterie.
- Un seul flux natif, sans double lecture des événements du navigateur.
- Horodatage de l’acquisition Android utilisé pour rejeter les événements anciens.
- Axes remis dans le repère de l’écran ; présentation verrouillée en portrait.
- Arrêt en arrière-plan et reprise au premier plan avec nouvelle stabilisation.
- Même filtre, mêmes limites d’inclinaison, même calibration mathématique et
  même calcul des cales que la version web.
- Les options avancées affichent la source native réellement sélectionnée.

Le repli accéléromètre reste sensible aux accélérations du téléphone. La gravité
fusionnée dépend du matériel et du constructeur. Aucun gain de précision ou de
cadence réelle n’est présumé sans essai sur téléphone.

## Recette sur téléphone réel

1. Poser le téléphone à plat, écran vers le haut et haut vers l’avant du véhicule.
2. Calibrer, puis observer 30 secondes immobile : valeurs, interruptions, son.
3. Soulever légèrement le haut, puis le bord droit : vérifier respectivement
   « Avant plus haut » et « Droite plus haute » dans les options avancées.
4. Revenir à plat et répéter cinq fois pour évaluer la répétabilité.
5. Mettre en arrière-plan puis revenir ; vérifier des mesures fraîches et le son.
6. Comparer à la PWA sur la même surface avec une calibration propre à chacune.

## Compilation

Node 22+, JDK 21, SDK Android 36 et Build Tools 36.0.0.

```sh
npm ci
VITE_BASE_PATH=/ npm test
npx cap sync android
cd android
./gradlew testDebugUnitTest assembleDebug
```

Le workflow `Android test APK` produit l’APK, son SHA-256 et le résultat de la
vérification de signature. Les tests couvrent les signes, axes, calibration,
calcul des cales, horodatages, interruption et nettoyage des abonnements.
La compilation et les tests automatisés ne constituent pas un essai physique.
