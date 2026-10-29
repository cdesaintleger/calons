# Calons — dossier Google Play

Compte personnel de Christophe de saint leger. Contact public : christophe@lindev.fr.
Application `fr.calons.app`, version 1.4.2, versionCode 3, Android 7 minimum, cible Android 16/API 36.

Ce dossier prépare une soumission ; il ne signifie pas que Calons est déjà publiée ou approuvée sur Google Play.

## Fichiers

- `Calons-1.4.2.aab`, joint à la release GitHub : fichier à importer dans Play Console (pas l’APK).
- `fiche-fr.md` : nom, description courte et complète, notes de version.
- `assets/icone-512.png` : icône 512 × 512.
- `assets/presentation-1024x500.png` : visuel de présentation.
- `assets/capture-light.png`, `capture-night.png`, `capture-parametres.png` : captures téléphone.
- URL de confidentialité : https://cdesaintleger.github.io/calons/privacy.html
- La même politique est accessible hors ligne dans Paramètres → Confidentialité dans l’application Android.

## 1. Créer l’application

Dans https://play.google.com/console/, terminer les vérifications du compte et de l’appareil Android demandées par Google. Créer une application nommée Calons, langue français (France), type Application, gratuite. Choisir la catégorie Outils et renseigner le contact ci-dessus. Vérifier les pays de diffusion souhaités ; ne pas les sélectionner sans décision de l’auteur.

Copier les textes de `fiche-fr.md`, importer les visuels, puis renseigner l’URL de confidentialité. Le site Calons peut être indiqué comme site web.

## 2. Signature : préserver les APK existants

**Avant de lancer une diffusion ouverte ou en production, configurer Play App Signing avec la clé actuelle de Calons.** Ne pas conserver une nouvelle clé Google par défaut si l’on veut que Google Play puisse mettre à jour les APK 1.4.0/1.4.1 déjà installés sur Android 7 à 16.

Dans la configuration Play App Signing, choisir l’option permettant de fournir une copie de la clé de signature existante. Télécharger l’outil PEPK et les instructions de chiffrement propres à l’application depuis Play Console. L’export chiffré pourra être préparé depuis la clé privée existante et la clé de chiffrement publique fournie par Google ; le secret ne doit jamais être communiqué dans une discussion ou publié dans le dossier de présentation.

Certificat public de signature actuel, SHA-256 :
`9f96b0e7acfc74f10c5c0fdf9e401042bac5668aa8431e9260ab31227293fe45`

Après configuration, vérifier que le certificat de signature utilisé par Play pour les appareils existants correspond bien à celui-ci. La clé d’import peut être séparée ultérieurement. Conserver les sauvegardes privées existantes ; aucune clé privée ni mot de passe n’est inclus dans ce dossier.

## 3. Contenu de l’application

Réponses fondées sur le code et les dépendances actuels, à confirmer dans les formulaires réels :

- Publicité : non.
- Accès à l’application : toutes les fonctions sont accessibles sans compte ni connexion.
- Collecte et partage de données par l’application Android : non. Les mesures et réglages restent sur l’appareil ; aucun SDK publicitaire, analytique ou de crash distant n’est intégré.
- Données locales : calibration, dimensions, paliers et thème. Suppression par effacement des données Android ou désinstallation.
- Aucun achat intégré, paiement, abonnement, fonction de santé, actualité, fonctionnalité gouvernementale ou produit financier.
- Remplir le questionnaire IARC selon les fonctions décrites ; la classification est attribuée par le questionnaire, pas choisie arbitrairement.
- Choisir le public cible selon l’usage prévu de l’outil par l’auteur ; l’application n’est pas conçue comme un produit destiné aux enfants.

Dans Sécurité des données, ne pas déclarer les mesures locales comme transmises : Google définit la collecte comme un transfert hors de l’appareil. La politique décrit aussi l’assistance par e-mail et l’hébergement du site, qui sont distincts du fonctionnement local de l’APK.

## 4. Tests puis production

1. Importer le `.aab` dans un test interne pour vérifier l’installation et la signature depuis Google Play.
2. Tester une mise à jour sur un appareil équipé de l’APK 1.4.1, sans désinstallation : les réglages et la calibration doivent être conservés.
3. Créer un test fermé avec au moins 12 testeurs inscrits en continu pendant 14 jours consécutifs (nouveau compte personnel). Inviter les testeurs via la liste et le lien d’inscription fournis par Play Console. La période ne démarre pas au dépôt du bundle : elle dépend des inscriptions des testeurs.
4. Recueillir des retours réels et corriger les problèmes. Un formulaire coché ou des tests automatisés ne remplacent pas cette phase.
5. Une fois les conditions remplies, demander l’accès à la production en répondant aux questions Google sur les tests et la préparation. L’accès n’est pas accordé automatiquement au bout de 14 jours.
6. Soumettre ensuite la version et la fiche à l’examen Google. Ne pas annoncer la disponibilité publique avant approbation et mise en ligne effective.

### Recette rapide sur téléphone

- Installation et ouverture hors ligne ; pas de compte demandé.
- En-tête sous l’heure et la batterie, trois thèmes et paramètres utilisables.
- Calibration sur une surface connue horizontale, téléphone écran vers le haut, haut vers l’avant.
- Inclinaisons dans les quatre directions : signes et roues cohérents ; reprise après arrière-plan.
- Son activable/désactivable, accélération des bips à l’approche du niveau.
- Configuration, calibration et thème conservés après fermeture, réouverture et mise à jour depuis 1.4.1.
- Politique de confidentialité accessible hors ligne dans les paramètres.

## Validation technique

Build et 54 tests JavaScript ; tests Java des axes ; APK et App Bundle signés générés par GitHub Actions ; certificat et empreintes vérifiés après téléchargement. Les captures sont générées dans Chrome avec capteurs simulés et sont documentées dans `assets/README.md`. Aucun nouveau test physique n’est revendiqué.

## Sources Google (vérifiées le 29 octobre 2026)

- https://support.google.com/googleplay/android-developer/answer/14151465?hl=fr — tests des comptes personnels.
- https://support.google.com/googleplay/android-developer/answer/9842756?hl=fr — signature et clé existante.
- https://support.google.com/googleplay/android-developer/answer/10787469?hl=fr — sécurité des données.
- https://support.google.com/googleplay/android-developer/answer/9866151?hl=fr — visuels.
- https://support.google.com/googleplay/android-developer/answer/11926878?hl=fr — cible Android 16/API 36.
