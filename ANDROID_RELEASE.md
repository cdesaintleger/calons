# Calons Android 1.4.2

APK de publication, signé avec une clé de production durable, non débogable.
Application « Calons », identifiant `fr.calons.app`, Android 7/API 24 minimum.
L’interface React est embarquée avec Capacitor ; les capteurs sont lus nativement.

## Installation

Télécharger `Calons-1.4.2.apk` depuis la release Android, ouvrir le fichier sur le
téléphone et autoriser cette installation depuis le navigateur si Android le demande.
L’application fonctionne hors ligne dès l’installation.

La version finale est distincte de « Calons Test » et de la PWA. Refaire la
calibration et saisir la configuration du véhicule : leurs données ne sont pas
transférées automatiquement. Les futures versions de `fr.calons.app` utiliseront
la même clé et un code de version croissant pour permettre une mise à jour normale.

Mise à jour depuis 1.4.0 : installer directement cet APK, sans désinstaller Calons,
pour conserver les réglages et la calibration.

## Changements

- Cadrage de l’icône Android corrigé : logo web complet, avec les marges adaptées
  aux masques des lanceurs Android et un fond bleu pétrole uniforme.

- Prise en compte des marges réelles de la barre d’état, des encoches et de la
  navigation Android, grâce aux variables de zone sûre de Capacitor 8.
- Couleur des icônes système adaptée aux thèmes clair/sombre.
- Signature discrète « Par Christophe de saint leger » dans les trois thèmes.
- Lecture native de gravité Android, repli accéléromètre, filtre et calcul des
  cales identiques à la version Android de test appréciée par l’utilisateur.

## Signature et compilation

Le workflow `Android release APK` utilise deux secrets GitHub :
`CALONS_ANDROID_KEYSTORE` et `CALONS_ANDROID_KEY_PASSWORD`. Les fichiers privés
sont exclus du dépôt. Une copie locale est conservée sous `outputs/android-signing/`
avec accès restreint : sauvegarder ce répertoire dans un emplacement privé sûr.
Ne jamais joindre ces fichiers à une release ni les committer.

```sh
npm ci
VITE_BASE_PATH=/ npm test
npx cap sync android
cd android
# Fournir CALONS_KEYSTORE_PATH et CALONS_KEY_PASSWORD dans l’environnement privé.
./gradlew testReleaseUnitTest assembleRelease bundleRelease
```

L’APK, son SHA-256 et le rapport public de signature sont joints à la release.
La clé privée n’est jamais incluse dans ces livrables.

## Vérification

54 tests JavaScript, tests Java des axes et contrôles Chrome/WebKit des zones
sûres, sur 320×740 et 390×844 avec marges supérieures 0/32/48 px. Ces contrôles
simulent les marges système et ne constituent pas une validation physique de
cette nouvelle version. La fluidité de la version native précédente a été
confirmée par l’utilisateur sur son téléphone.

Sur téléphone : vérifier que le logo et les boutons se trouvent sous l’heure,
la batterie et l’encoche ; essayer les trois thèmes et les paramètres ; vérifier
l’auteur en bas. Calibrer à plat, activer le son puis tester la reprise après
arrière-plan et le fonctionnement hors ligne.

Le bundle `Calons-1.4.2.aab` sert à Google Play ; l’APK sert à l’installation directe. Voir [le guide Google Play](docs/google-play/README.md).
