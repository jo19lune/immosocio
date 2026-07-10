# Stratégie de Gestion des États de Chargement (Loading Strategy)

## 1. Approche Architecturale Globale

Une gestion optimale des états de chargement est cruciale pour l'expérience utilisateur (UX) et les performances perçues. L'architecture reposera sur les piliers suivants :

*   **Gestion Centralisée vs Locale** : 
    *   **Globale** : Utilisation d'un intercepteur réseau (ex: via Axios ou Fetch) couplé à un contexte React (`LoadingContext`) pour les navigations complètes ou chargements critiques.
    *   **Locale** : Utilisation de hooks personnalisés (ex: `useQuery` de React Query, ou un hook `useDelayedLoading` local) pour isoler l'état de chargement au niveau du composant afin d'éviter de bloquer toute l'interface.
*   **Suspense & Lazy Loading** : Découpage de l'application avec `React.lazy()` et `Suspense`. Chaque frontière Suspense (Suspense Boundary) doit fournir un `fallback` adapté au contexte (Skeleton pour une page, Spinner pour un widget).
*   **Hiérarchie Visuelle** : Ne jamais superposer plusieurs indicateurs de chargement. Si une page globale charge, les composants enfants ne doivent pas afficher leurs propres spinners.

## 2. Spécifications des Composants de Chargement

Tous les composants doivent être créés en tant que composants UI réutilisables dans `frontend/src/components/ui/loading/`.

### 2.1. Skeleton Screens Animés (`<Skeleton />`)
*   **Cas d'usage** : Chargement initial des pages, chargements de données structurées (listes d'annonces, profils, publications).
*   **Apparence** : Formes géométriques (rectangles, cercles) reprenant exactement la disposition finale (layout) du composant chargé pour éviter le CLS (Cumulative Layout Shift).
*   **Animation** : Effet de chatoiement (shimmer) de gauche à droite ou pulsation douce (pulse). Préférer l'opacité (opacity) et le transform pour des animations fluides à 60fps.
*   **Props** : `width`, `height`, `variant` (text, circular, rectangular), `className` (pour surcharge Tailwind).

### 2.2. Inline Spinners Minimalistes (`<Spinner />`)
*   **Cas d'usage** : Micro-interactions, soumissions de formulaires (dans le bouton), rafraîchissement d'une petite zone.
*   **Apparence** : SVG léger, rotatif, avec une épaisseur de trait (stroke-width) proportionnelle à sa taille. Les couleurs doivent respecter le contraste thématique (primary/secondary).
*   **Props** : `size` (sm, md, lg), `color` (primary, neutral, white), `label` (texte optionnel adjacent).

### 2.3. Progress Bars Fluides (`<ProgressBar />`)
*   **Cas d'usage** : Tâches longues, transferts de fichiers (upload d'images), navigation entre les routes (en haut de l'écran type NProgress).
*   **Apparence** : Barre de progression horizontale, fine. Doit toujours commencer à avancer immédiatement pour donner un sentiment de réactivité, même si l'avancement réel est inconnu (progression indéterminée simulée).
*   **Props** : `value` (0-100), `indeterminate` (boolean), `color`.

## 3. Accessibilité (A11Y)

Un chargement visuel n'est utile que s'il est perçu par tous.
*   **`aria-busy="true"`** : À appliquer sur le conteneur dont le contenu est en cours de mise à jour ou de chargement.
*   **`aria-live="polite"` ou `"assertive"`** : 
    *   Utiliser une zone (souvent invisible visuellement, type `.sr-only`) avec `aria-live="polite"` pour annoncer le début et la fin d'un chargement. Exemple : "Chargement des annonces en cours...", puis "Annonces chargées".
*   **`role="progressbar"` et `aria-valuetext`** : Pour les `<ProgressBar />` et `<Spinner />`. Indiquer `aria-valuenow` si la progression est connue, sinon utiliser un `aria-valuetext="Chargement en cours"`.
*   **Réduction des animations (`prefers-reduced-motion`)** : Pour les utilisateurs sensibles, désactiver l'animation "shimmer" des Skeletons ou réduire la vitesse de rotation des Spinners via des media queries CSS.

## 4. Prévention du Scintillement (Flickering) et du CLS

### 4.1. Temporisation Stratégique (Delayed Loading)
Afficher un spinner pour une requête qui dure 50ms crée un effet de flash très désagréable (flickering).
*   **Règle du Délai Minimum** : Ne pas afficher d'indicateur de chargement si la requête dure moins de 200-300ms.
*   **Durée d'Affichage Minimum** : Si un indicateur est affiché, il doit rester visible pendant au moins 500ms pour éviter de disparaître trop vite et perturber l'œil.
*   *Implémentation* : Création d'un hook `useDelayedLoading(isLoading, delay, minDuration)`.

### 4.2. Stabilité de la Mise en Page (CLS)
*   **Réservation d'espace** : Les conteneurs asynchrones doivent avoir une hauteur minimale (`min-height`) définie, correspondant à la hauteur attendue du contenu ou de l'état vide.
*   **Skeletons Exacts** : Le Skeleton doit occuper *exactement* la même boîte englobante (bounding box) que le contenu final.
*   **Transitions CSS** : Lors du passage du Skeleton au contenu réel, utiliser une transition d'opacité (fade in) courte (ex: 200ms) plutôt qu'un remplacement brut.
