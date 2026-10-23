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
