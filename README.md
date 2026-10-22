# Calons

PWA React/Vite en français, mobile, sans compte ni serveur applicatif. Les ressources et icônes sont locales : aucun CDN, aucune police distante. Calibration et configuration sont conservées dans le stockage du navigateur.

## Utiliser / construire

Node.js 22.12+ (version 22.23.4 utilisée pour la validation).

```sh
npm ci
npm test
npm run build
npm run preview
```

Le dossier `dist/` est la livraison statique complète. Ne pas ouvrir `index.html` par `file://`. Le service worker est généré après chaque build, avec une version calculée sur le contenu de tous les fichiers. Le serveur de développement n’active pas le cache PWA.

## GitHub Pages

Adresse : https://cdesaintleger.github.io/calons/

Le dépôt est public et GitHub Pages est activé avec HTTPS obligatoire.

Le workflow `.github/workflows/pages.yml` installe les dépendances avec `npm ci`,
construit la PWA et exécute les tests avant de publier `dist/`.
Chaque push sur `main` déploie automatiquement ; les pull requests lancent uniquement
les vérifications. Un lancement manuel est possible depuis Actions → Deploy to GitHub Pages.

Dans Settings → Pages, la source doit être **GitHub Actions**.
Le job de déploiement dispose uniquement des permissions Pages et OpenID Connect
nécessaires ; aucun secret personnel n'est requis.

Le workflow définit `VITE_BASE_PATH=/calons/`. Pour reproduire ce build localement :

```sh
VITE_BASE_PATH=/calons/ npm test
VITE_BASE_PATH=/calons/ npm run preview
# Ouvrir http://localhost:4173/calons/
```

Le manifest conserve des URLs relatives et le service worker est enregistré sous
`/calons/sw.js`. Ses caches sont isolés par URL de portée pour ne pas supprimer
ceux d'une autre installation sur le même domaine GitHub Pages.
Pour un futur domaine personnalisé à la racine, remplacer `VITE_BASE_PATH` par `/`.

Pour revenir à une version précédente, rétablir son code dans un nouveau commit
sur `main` : le même workflow republiera cette version. Les installations PWA
adopteront la mise à jour après fermeture des anciens onglets puis réouverture en ligne.

## Déploiement HTTPS

Publier **le contenu de `dist/`** sur votre hébergement statique HTTPS. Le ZIP `ducato-level-dist.zip` contient exactement ce contenu. Le chemin de base est relatif : la PWA peut être publiée à la racine ou dans un sous-dossier, avec une URL terminée par `/`.

Exemple de configuration Netlify fourni dans `netlify.toml` (commande `npm run build`, dossier `dist`). Il n’est pas nécessaire d’utiliser Netlify : tout serveur statique HTTPS convient. Le déploiement GitHub Pages est géré par le workflow décrit ci-dessus.

Pour un serveur Caddy existant : adapter le domaine et le chemin du `Caddyfile.example`, faire pointer le DNS vers ce serveur et ouvrir les ports 80/443. Caddy peut obtenir le certificat automatiquement. Ne pas servir `sw.js` avec un cache HTTP de longue durée ; conserver le type JavaScript. Servir le manifest en `application/manifest+json` ou `application/json`.

HTTPS est nécessaire sur téléphone pour les capteurs et le service worker ; `localhost` bénéficie d’une exception de développement. Un téléphone accédant à l’adresse IP HTTP du PC ne bénéficie pas de cette exception.

## Installation et hors connexion

1. Ouvrir l’URL HTTPS en ligne et attendre « Prêt hors ligne ».
2. Android/Chrome : utiliser « Installer l’application » ou le menu du navigateur.
3. iPhone/Safari : Partager → Sur l’écran d’accueil.
4. Ouvrir l’application installée, activer le mode avion et recharger pour vérifier le cache sur l’appareil cible.

Une mise à jour se prépare en arrière-plan et s’active après fermeture des anciens onglets de l’application. Rouvrir ensuite l’application. Le navigateur peut supprimer son stockage en cas de manque d’espace ; ouvrir alors une fois en ligne. Le badge de connexion dépend du signal fourni par le navigateur et ne teste pas l’accès Internet.

## Interface

Les commandes de mesure sont accessibles dès le premier écran. Les onglets « Vue du véhicule » et « Où placer les cales » partagent la même mesure. Le schéma affiche les corrections théoriques à 0,1 cm près, sans prétendre à cette précision physique. Les roues passent du vert (0 cm) au rouge (hauteur maximale des cales), sur une échelle identique pour les quatre roues. Le placement reste optimisé pour deux cales à paliers de 7 cm ; sa hauteur réalisable est distincte de la correction théorique.

## Mesure et calibration

- Renseigner l’empattement (distance entre essieux) et la voie (distance entre centres des roues). Les valeurs initiales 403,5 / 181 cm sont des exemples, pas une certification des dimensions de votre Ducato. Le modèle suppose une voie identique à l’avant et à l’arrière.
- Renseigner le nombre de paliers réellement disponibles (1 à 5), tous de 7 cm.
- Calibrer sur une référence **connue horizontale**, téléphone immobile, écran vers le haut, portrait naturel, haut du téléphone vers l’avant du véhicule. Ne pas calibrer sur le plancher incliné du fourgon.
- Replacer ensuite le téléphone dans la même orientation. Le zéro corrige l’orientation par rotation du vecteur vertical (et non simple soustraction d’angles couplés).
- L’accès capteur est demandé uniquement au clic. Les mesures sont lissées et deviennent inutilisables après 3 secondes sans événement. Les appareils retournés ou trop inclinés sont rejetés.
- Prendre la mesure véhicule arrêté **sans cales**. Après pose, lire l’inclinaison pour vérifier, sans appliquer une nouvelle recommandation à des cales déjà présentes.

## Calcul et limites

Les hauteurs initiales sont calculées par `z = x tan(roulis) + y tan(tangage)`, avec coordonnées des centres des roues en cm. Les corrections théoriques continues sont `max(z) - z` ; elles sont distinctes des hauteurs réalisables avec deux cales.

Toutes les combinaisons de zéro, une ou deux roues relevées de 7 × palier cm sont examinées. Une caisse rigide avec quatre supports non coplanaires ne possède pas de plan unique : chaque triangle de support dont le plan est au-dessus du quatrième appui est évalué. Le score est la plus grande inclinaison de ces plans, `atan(hypot(pente_x, pente_y))`. Le minimum global est retenu ; égalités départagées par nombre de cales, puis somme des hauteurs, puis ordre d’énumération fixe.

C’est une optimisation prudente **dans ce modèle**, pas une garantie de niveau réel. Elle suppose un terrain localement plan, une géométrie rectangulaire et un centre de masse suffisamment central ; elle ne modélise pas suspension, pression des pneus, enfoncement du sol ni déplacement du véhicule en montant sur la cale. Une seule recommandation est affichée, avec l’inclinaison résiduelle estimée. Une inclinaison résiduelle supérieure à 0,5° déclenche une indication de résultat imparfait (seuil d’interface, pas une tolérance constructeur).

## Vérifications réalisées

- 14 tests : plat, tangage dans les deux sens, roulis dans les deux sens, petites pentes, appuis non coplanaires, unités, signes des capteurs, entrées invalides, calibration et comparaison exhaustive avec une implémentation géométrique indépendante ; tests du service worker sans réseau (navigation et fichiers avec variation Origin) et des chemins de déploiement GitHub Pages.
- Build de production React/Vite réussi.
- Vérification visuelle Chrome bureau et largeur mobile 390 px ; simulation et proposition d’installation visibles.
- Cache hors ligne contrôlé avec arrêt du serveur de preview puis rechargement navigateur.

À valider sur les appareils réels : autorisations et précision des capteurs iOS/Android, installation depuis le domaine HTTPS final, répétabilité du zéro et mesures physiques du véhicule. Aucun téléphone ni fourgon réel n’a été utilisé pour cette validation.

Références : [convention W3C des angles](https://www.w3.org/TR/orientation-event/), [permission des capteurs](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static), [déploiement Vite](https://vite.dev/guide/static-deploy.html).

## Version 1.1.0 et retour arrière

Les releases GitHub sont identifiées par un tag `vMAJEUR.MINEUR.CORRECTIF`.
Pour revenir à une version publiée : Actions → Deploy to GitHub Pages → Run workflow,
laisser la branche `main` et renseigner le tag (par exemple `v1.0.0`) dans `version`.
Le workflow reconstruit et vérifie cette version avant de la publier. Un push ultérieur
sur main publiera à nouveau main. Les installations hors ligne restent sur leur version
jusqu'à reconnexion et fermeture des anciens onglets.

Les cales peuvent avoir 1 à 5 paliers de hauteurs totales personnalisées, strictement
croissantes, jusqu'à 50 cm. Les anciens réglages sont conservés avec leurs paliers de 7 cm.
La stabilité demande au moins 10 mesures sur 1,5 seconde, récentes de moins d'une seconde,
avec une amplitude de 0,2° maximum sur chaque axe dans une fenêtre de deux secondes.
Ce critère mesure l'immobilité, pas la précision absolue. La calibration est désactivée
pendant les mouvements ; le placement reste affiché comme provisoire.
