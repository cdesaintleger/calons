# v1.3.2 — Nouvelle identité « C comme cale »

- Nouvelle icône : C ivoire et cale turquoise sur fond bleu pétrole, d’après le
  concept retenu. Source vectorielle locale et rendus nets à toutes les tailles.
- Logo dans l’en-tête des trois thèmes ; favicon et icône d’écran d’accueil iPhone.
- Icônes PWA 192/512 px et variante Android maskable avec marge de sécurité.
- Nouvelles URLs d’icônes et cache PWA régénéré pour la mise à jour.
- Aucun changement des mesures, de la calibration ou du calcul des cales.

## Validation

- `npm ci` réussi ; `npm test` : 50 tests réussis ; build Pages réussi.
- Vérification des dimensions PNG, des références HTML/manifest et du cache.
- Chrome et WebKit : thèmes, mise en page mobile et chargement du logo.
- Le remplacement d’une icône déjà installée dépend du système. Ouvrir puis
  fermer et rouvrir Calons en ligne ; si l’ancienne icône reste présente, il peut
  être nécessaire de recréer le raccourci. Sur iPhone, vérifier l’ajout à l’écran
  d’accueil dans Safari. Aucune validation physique iPhone/Android effectuée.

---

# v1.3.1 — Des consignes claires pour la mesure

- Notification intégrée dans les trois thèmes, visible près du véhicule :
  téléphone trop incliné, mesure perturbée, stabilisation, données inutilisables,
  absence de signal, interruption et accès au capteur non accordé.
- Consigne de placement : écran vers le haut, haut du téléphone vers l’avant du
  véhicule. Le message disparaît après réception de mesures exploitables et stables.
- L’absence de signal ne signifie pas automatiquement un refus de permission :
  une aide invite à vérifier l’accès aux mouvements dans le navigateur.
- Les événements rejetés du capteur sélectionné interrompent immédiatement la
  fraîcheur et le guidage sonore ; la dernière valeur est conservée. Les défauts
  d’un capteur secondaire ne masquent pas un repli valide.
- Aucune nouvelle mesure inventée, aucun changement des axes, de la calibration
  persistée ni du calcul des cales. Reprise avec de nouveaux échantillons.

## Validation

- `npm ci`, `npm test` : 48 tests réussis ; build de production Pages réussi.
- Chrome et WebKit, chacun dans Classique, Clair et Bleu nuit : absence de signal,
  posture verticale, retour à plat, disparition du message, pause, refus d’accès
  simulé et lisibilité du bandeau.
- Tests de non-régression : fraîcheur, son, repli orientation/motion, stabilité,
  calibration, géométrie, cales et cache PWA.
- Capteurs et permissions simulés ; aucun test physique sur iPhone ou Android.
  À vérifier sur téléphone : accès aux mouvements, posture verticale puis à plat,
  immobilisation, verrouillage/retour et son.

---

# v1.3.0 — Trois thèmes au choix

- Paramètres accessibles depuis la roue dentée de l’en-tête.
- Thème Classique conservé par défaut ; nouveaux thèmes Clair et Bleu nuit,
  avec vue compacte du véhicule, des cales et du résultat estimé.
- Préférence mémorisée localement, disponible hors ligne ; un choix invalide
  revient au thème Classique sans toucher au zéro ni aux dimensions du véhicule.
- Intensité de correction théorique par roue : couleur et jauge proportionnelle.
  Les hauteurs/paliers restent ceux du placement optimisé. Signalement des
  résultats imparfaits et des mesures conservées ou provisoires.
- Configuration, simulation, diagnostic et installation regroupés dans les paramètres.
- Illustration vectorielle locale, aucun téléchargement d’image ou de police.
- Aucun changement du calcul des cales, des capteurs ni du guidage sonore.

## Validation

- `npm ci`, `npm test` : 40 tests réussis ; build de production Pages réussi.
- Chrome et WebKit : sélection/persistance des thèmes, valeur de repli, continuité
  audio, valeurs comparées au solveur, simulation, modales au clavier et onglets
  classiques. Vues compactes sans défilement à 320×740, 390×844 et 430×932.
- Rechargement WebKit avec serveur arrêté : cache, calibration, thème et test audio.
- WebKit sur Mac avec profil iPhone et capteurs simulés ; pas de validation
  physique sur iPhone/Android. Le volume réel reste à vérifier sur téléphone.

---

# v1.2.1 — Son renforcé et interface épurée

- Signal triangulaire à 880 Hz, gain augmenté pour les bips et le continu.
- Cadence progressive sur toute la plage exploitable, sans plateau dès 2°.
- Bouton Son toujours accessible ; statut compact avec symbole et libellé.
- Calibrer compact, confirmation du zéro, aide repliable ; angles, simulation,
  source et relance manuelle regroupés dans Options avancées.
- Test sonore de 0,7 seconde indépendant des capteurs, avec arrêt automatique.
- Réception des mesures toujours active après activation ; reprise à l'arrivée
  d'événements frais, aucune mesure simulée. Permissions mobiles inchangées.
- Calcul des cales, calibration persistée et cache hors ligne préservés.

## Validation

- `npm ci`, `npm test` : 40 tests réussis ; build Pages `/calons/` réussi.
- Chrome bureau automatisé : Web Audio, capteurs simulés, test sonore,
  reprise après silence, options avancées, largeurs 320/390/760 px.
- Pas de validation acoustique sur téléphone réel. À vérifier sur Android/Chrome
  et iPhone/Safari : volume, progression des bips, niveau stable, arrière-plan,
  retour, calibration, mode avion et sortie Bluetooth. Procédure dans README.md.

---

# v1.2.0 — Guidage sonore accessible en un geste

- Bouton Son activé/désactivé dans un en-tête qui reste visible au défilement,
  disponible depuis les deux vues, avec icône, libellé et état accessible.
- Bips de plus en plus rapides en approchant du niveau ; son continu doux à
  0,2° ou moins après confirmation de stabilité, sortie à 0,3° (hystérésis).
- Guidage fondé sur l'inclinaison réelle calibrée des deux axes, jamais sur le
  résultat prédit par les cales. Son désactivé au chargement et coupure immédiate.
- Silence en simulation, sans zéro/mesure exploitable, lors d'un silence capteur
  de trois secondes ou en arrière-plan. Échéance audio même si JavaScript ralentit.
- Web Audio local, initialisé par clic, compatible avec le fonctionnement hors ligne.
  Aucun changement du calcul des cales, des capteurs ou de la calibration persistée.

## Validation de v1.2.0

- `npm ci` réussi (aucune vulnérabilité signalée), `npm test` : **38 tests réussis**,
  `npm run build` réussi avec `VITE_BASE_PATH=/calons/` ; régressions capteurs,
  calibration, cales et PWA incluses.
- Chrome bureau automatisé, Web Audio réel et capteurs simulés : activation,
  continu/bips, fraîcheur, simulation et coupure ; bouton visible après défilement
  à 320/390/760 px, aucune erreur JavaScript ni débordement horizontal.
- Tests audio : progression du rythme, deux axes, hystérésis, stabilité requise,
  silence/perte de fraîcheur, arrière-plan, désactivation immédiate, activation
  asynchrone annulée, API absente et interruptions du navigateur.
- Aucun test acoustique physique sur Android/iPhone. Vérifier permissions audio,
  volume/sortie Bluetooth, passage en arrière-plan, retour et mode avion sur les
  appareils réels. Procédure dans README.md.

---

# v1.1.5 — Mesure plus stable et fraîcheur explicite

- Sélection contrôlée de `devicemotion` (gravité exploitable) avec repli sur
  `deviceorientation`, sans doubles mesures ; qualification avant changement.
- Filtrage réactif, maintien de la pose stabilisée et états active/stable/conservée.
- Dernière valeur conservée pendant les silences, données invalides et passages
  en arrière-plan ; reprise avec nouveaux échantillons, aucun relevé artificiel.
- Permissions iOS demandées par le clic existant, refus partiel toléré.
- Calibration persistée, géométrie, calcul des corrections, optimisation des deux
  cales, paliers personnalisés et écrans préservés.

## Diagnostic

Le seuil de trois secondes changeait le statut sans arrêter l'écoute. La stabilité
était perdue après une seconde de silence ; les valeurs invalides et changements
de visibilité effaçaient la lecture. Aucun lissage n'était présent en 1.1.4.
La cause de l'absence d'événements sur un appareil réel reste à vérifier : ajouter
motion n'est pas une garantie de flux continu.

## Validation

- `npm ci` réussi (aucune vulnérabilité signalée), `npm test` : 29 tests réussis,
  `npm run build` réussi, avec `VITE_BASE_PATH=/calons/` pour la validation finale.
  Environnement local : Node 24.19.0, npm 10.9.4 ; le workflow utilise Node 22.
- Tests simulés : 30 s immobile, silence >3 s, reprise, petite inclinaison, bruit,
  fallback, sélection des sources, permissions refusées/non accordées, données
  nulles/non finies, gravité invalide, visibilité, axes couplés et ancien zéro.
- Régressions : optimisation exhaustive des cales et paliers personnalisés,
  cache hors ligne, nettoyage limité à la portée Calons, chemins GitHub Pages.
- Cache généré par hash du contenu ; activation après fermeture des anciens clients.

## Limites et recette physique

Aucun test physique iOS ou Android réalisé. Sur chaque téléphone : autoriser/refuser
les capteurs, poser 30 s, incliner légèrement dans les quatre sens, vérifier le zéro
persisté, interrompre/reprendre via arrière-plan puis tester la PWA hors connexion.
La réception effective, les conventions du navigateur et la précision physique
restent à valider. Voir la procédure détaillée dans README.md.
