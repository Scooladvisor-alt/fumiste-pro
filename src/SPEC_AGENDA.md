# SPÉCIFICATION EXHAUSTIVE — AGENDA « FUMISTE PRO »

> Prompt de reproduction à l'identique. Ce document décrit, dans les moindres détails, l'agenda
> (vues Jour / Semaine / Mois, création par glisser-maintenir, déplacement par drag & drop,
> redimensionnement par étirement, gestion des chevauchements, dialogue de rendez-vous).
> Stack cible : React + Tailwind CSS + shadcn/ui + date-fns (locale `fr`) + lucide-react.

---

## 1. VUE D'ENSEMBLE

L'agenda est une page plein écran composée de :
1. Une **barre d'outils** (toolbar) en haut.
2. Une **zone de vue** qui affiche soit une grille horaire (Jour / Semaine), soit une grille mensuelle.
3. Un **dialogue modal** de création / édition de rendez-vous.

Trois vues commutables : `day` (« Jour »), `week` (« Semaine », vue par défaut), `month` (« Mois »).

### Modèle de données `Appointment`
```
{
  id: string,
  title: string,              // généré : "TypeIntervention - Nom du client"
  client_id: string,
  intervention_type: string,  // nom du type (ex. "Ramonage")
  start: string ISO datetime, // requis
  end: string ISO datetime,   // requis
  notes: string,
  color: string hex,          // couleur héritée du type d'intervention, défaut "#3b82f6"
}
```

### Entité `InterventionType`
```
{ name: string, color: string hex (défaut "#3b82f6") }
```
Chaque type a une couleur ; l'évènement prend la couleur de son type au moment de l'enregistrement.

### Réglages utilisateur (entité de settings)
- `agenda_start_hour` : première heure affichée dans la grille (défaut **6**).
- `agenda_end_hour` : dernière heure affichée (défaut **20**).
Ces valeurs sont configurables dans les paramètres et pilotent la hauteur totale de la grille.

---

## 2. BARRE D'OUTILS (toolbar)

Disposition : `flex flex-wrap items-center gap-3 mb-4`, page en `h-full flex flex-col p-4 md:p-6`.

De gauche à droite :
1. **Navigation** : deux boutons icône fantôme (ChevronLeft / ChevronRight, `w-5 h-5`) + un bouton
   outline « Aujourd'hui » (retour à `new Date()`).
   - Vue mois : ±1 mois (`addMonths` / `subMonths`).
   - Vue semaine : ±7 jours.
   - Vue jour : ±1 jour.
2. **Titre** (`h1`, `font-bold text-lg md:text-xl capitalize`) formaté selon la vue :
   - Mois : `"MMMM yyyy"` (ex. « juillet 2026 »).
   - Semaine : `"d MMM"` du lundi – `"d MMM yyyy"` du dimanche (semaine commençant le **lundi**,
     `weekStartsOn: 1`), séparés par ` – `.
   - Jour : `"EEEE d MMMM yyyy"` (ex. « samedi 18 juillet 2026 »).
3. À droite (`ml-auto`) :
   - **Sélecteur de vue** : segmented control — conteneur `flex bg-secondary rounded-lg p-0.5`,
     boutons `px-3 py-1.5 text-sm font-medium rounded-md`, l'actif a `bg-card shadow-sm text-foreground`,
     les inactifs `text-muted-foreground`.
   - **Bouton « + Rendez-vous »** (Plus icon, libellé masqué sur mobile via `hidden sm:inline`) :
     ouvre le dialogue en mode création avec `start = maintenant`.

L'état de la page : `view` (`"day" | "week" | "month"`), `cursor` (Date pivot), `dialogOpen`,
`editing` (rendez-vous en cours d'édition ou `null`), `slotStart` / `slotEnd` (créneau présélectionné).

La zone de vue est enveloppée dans `flex-1 min-h-0 bg-card rounded-2xl border border-border overflow-hidden`.

---

## 3. VUE GRILLE HORAIRE (Jour et Semaine) — LE CŒUR DU SYSTÈME

Un seul composant `TimeGridView` gère les deux modes ; en mode `day` il n'affiche qu'une colonne,
en mode `week` sept colonnes (lundi → dimanche).

### 3.1 Constantes et géométrie
- `HOUR_HEIGHT = 56` px par heure.
- `SNAP_MIN = 15` : **tout s'aimante au quart d'heure** (création, déplacement, redimensionnement).
- Heures affichées : de `startHour` à `endHour` (props, issues des réglages).
- Hauteur d'une colonne = `HOUR_HEIGHT × nombre d'heures`.
- Conversion minute → pixel : `top = (minutes - startHour×60) × (HOUR_HEIGHT / 60)`.
- Conversion pixel → minutes (avec aimantation) :
  ```js
  function yToMinutes(clientY, columnEl) {
    const rect = columnEl.getBoundingClientRect();
    const y = clamp(clientY - rect.top, 0, rect.height);
    const raw = (y / HOUR_HEIGHT) * 60 + startHour * 60;
    return Math.round(raw / SNAP_MIN) * SNAP_MIN;
  }
  ```
- `dateFromMinutes(day, minutes)` : construit une Date du jour donné, minutes bornées entre
  `startHour×60` et `endHour×60 - SNAP_MIN`.

### 3.2 Structure DOM
- Conteneur : `flex flex-col h-full overflow-auto`.
- **En-tête sticky** (`sticky top-0 bg-card z-10 border-b`) : une cellule vide de `w-14` (gouttière
  des heures) puis une cellule par jour (`flex-1 text-center py-2 border-l`) contenant :
  - le jour abrégé (`"EEE"`, ex. « sam. ») en `text-xs text-muted-foreground capitalize` ;
  - le numéro du jour dans une pastille ronde `w-9 h-9 rounded-full text-lg font-bold` —
    **le jour courant a la pastille remplie** `bg-primary text-primary-foreground`.
- **Corps** : `flex flex-1` — gouttière `w-14` avec les libellés d'heures (`text-[10px]`,
  alignés à droite, `HH:00`, positionnés en `absolute -top-1.5` pour être à cheval sur la ligne ;
  la première heure n'affiche pas de libellé), puis une **colonne par jour** :
  ```
  <div data-day-column
       className="flex-1 relative border-l border-border select-none touch-none"
       style={{ height: HOUR_HEIGHT * hourCount }}
       onPointerDown / onPointerMove / onPointerUp / onDragOver / onDrop>
  ```
  - `select-none touch-none` est **indispensable** pour que les pointer events fonctionnent au doigt.
  - Fond : une div par heure `border-b border-border hover:bg-secondary/30` de 56 px.

### 3.3 Indicateur « maintenant »
Sur la colonne du jour courant uniquement, si l'heure actuelle est dans la plage affichée :
une ligne rouge `h-0.5 bg-red-500` positionnée en absolu à `top = minutesToTop(minutesActuelles)`,
avec un point rouge `w-2 h-2 rounded-full` débordant à gauche (`-left-1 -top-[3px]`),
`z-20 pointer-events-none`.

### 3.4 ⭐ CRÉATION PAR GLISSER-MAINTENIR (drag-to-create)
C'est l'interaction phare. Implémentée avec les **Pointer Events sur la colonne** (pas de lib externe) :

1. **`onPointerDown`** sur la colonne (bouton gauche uniquement, ignoré si un redimensionnement est
   en cours) : calcule `startMin = yToMinutes(e.clientY)`, mémorise dans un ref
   `{ columnEl, day, startMin, moved: false }`, appelle `columnEl.setPointerCapture(e.pointerId)`
   (capture indispensable pour continuer à recevoir les move/up même si le doigt sort de la colonne),
   et pose un état `draft = { dayKey: day.toISOString(), startMin, endMin: startMin + 15 }`.
2. **`onPointerMove`** : recalcule la minute courante ; si l'écart avec le point de départ atteint
   ≥ 15 min, marque `moved = true`. Met à jour le draft avec
   `startMin = min(origine, courant)`, `endMin = max(origine, courant)` — **on peut donc glisser
   vers le haut comme vers le bas**. Si start == end, force `endMin = startMin + 15`.
3. **Rendu du draft** : un rectangle fantôme en absolu dans la colonne,
   `left-1 right-1 rounded-lg bg-primary/30 border-2 border-primary pointer-events-none z-10`,
   affichant en haut à gauche la plage horaire en direct au format `HH:mm – HH:mm`
   (`text-[10px] font-semibold text-primary`). Il suit la souris en temps réel.
4. **`onPointerUp`** : efface le draft, puis :
   - si `moved` (vrai glisser) → ouvre le dialogue avec `start` ET `end` du rectangle dessiné ;
   - sinon (simple **clic**) → ouvre le dialogue avec seulement `start` (l'heure cliquée, aimantée
     au quart d'heure) ; le dialogue appliquera une durée par défaut d'1 h.

### 3.5 ⭐ DÉPLACEMENT PAR DRAG & DROP (HTML5 natif)
Chaque évènement est `draggable` (désactivé pendant un redimensionnement) :
- `onDragStart` : `e.dataTransfer.setData("text/plain", appointment.id)`.
- La colonne fait `onDragOver={(e) => e.preventDefault()}` et `onDrop` :
  - lit l'id, calcule la nouvelle heure de début via `yToMinutes(e.clientY)` (aimantée 15 min),
  - **conserve la durée d'origine** : `newEnd = newStart + durée`,
  - applique immédiatement un **override local** (voir 3.8) pour figer l'évènement à sa nouvelle
    position sans attendre le serveur,
  - persiste : `update(id, { start, end })` puis rafraîchit les données.
- Le drop fonctionne **entre colonnes** (changer de jour ET d'heure en un seul geste).
- Important : l'évènement fait `onPointerDown={(e) => e.stopPropagation()}` pour ne pas déclencher
  le drag-to-create de la colonne sous-jacente.

### 3.6 ⭐ REDIMENSIONNEMENT PAR ÉTIREMENT (resize)
Chaque bloc évènement possède **deux poignées invisibles** de 8 px (`h-2`) en haut et en bas,
`absolute left-0 right-0 cursor-ns-resize z-20 touch-none`. Au survol du bloc (`group-hover`),
une petite barre pilule `w-6 h-1 rounded-full bg-white/60` apparaît au centre de chaque poignée.

Mécanique (pointer events, capture sur la poignée) :
1. `onPointerDown` sur une poignée : `stopPropagation` + `preventDefault`, retrouve la colonne via
   `e.currentTarget.closest("[data-day-column]")`, mémorise `{ appt, edge: "top"|"bottom",
   startMin, endMin }`, capture le pointeur **sur la poignée** (`handleEl.setPointerCapture`),
   pose l'état `resizing = { id, startMin, endMin }`.
2. `onPointerMove` : recalcule la borne déplacée, avec **durée minimale de 15 min**
   (`top` : `startMin = min(courant, endMin - 15)` ; `bottom` : `endMin = max(courant, startMin + 15)`).
   Le bloc se redessine en direct à partir de l'état `resizing` (top + height recalculés).
3. `onPointerUp` : si les bornes ont changé, pose un flag `justResized = true` (pour **avaler le
   clic qui suit** et ne pas ouvrir le dialogue), applique l'override local, persiste
   `update(id, { start, end })`. Les handlers move/up de resize sont aussi branchés sur la colonne
   (appelés avant ceux du drag-to-create) pour fiabiliser le suivi.

### 3.7 ⭐ CHEVAUCHEMENTS : DISPOSITION EN COLONNES
Les évènements qui se chevauchent s'affichent **côte à côte** avec partage équitable de la largeur
(algorithme de clustering) :
1. Trier les évènements du jour par minute de début puis de fin.
2. Regrouper en **clusters** : un cluster s'étend tant que l'évènement suivant commence avant la fin
   maximale du cluster (`clusterEnd`).
3. Dans chaque cluster, placement glouton en colonnes : pour chaque évènement, prendre la première
   colonne dont le dernier évènement est terminé (`startMin >= colsEnd[c]`), sinon créer une colonne.
4. Chaque évènement du cluster reçoit `{ col, cols: nombreTotalDeColonnesDuCluster }`, converti en CSS :
   ```js
   left:  calc(col/cols × 100% + (col === 0 ? 4 : 2)px)
   width: calc(1/cols × 100% - (cols === 1 ? 8 : 4)px)
   ```
   (marges de 4 px sur les bords, 2 px entre colonnes).

### 3.8 ANTI-CLIGNOTEMENT : overrides locaux (optimistic UI)
Après un déplacement ou un redimensionnement, la donnée serveur met un instant à revenir. Pour éviter
que l'évènement « saute » à son ancienne position pendant le rechargement :
- État `overrides = { [id]: { start, end } }` appliqué par-dessus les props ;
- un `useEffect` sur `appointments` **purge** chaque override dès que la donnée parente correspond
  exactement (start ET end identiques).

### 3.9 Rendu d'un bloc évènement
- `absolute z-10 rounded-lg px-2 py-1 text-white overflow-hidden shadow-sm cursor-pointer group`,
  `backgroundColor` = couleur de l'évènement, `top`/`height` calculés (hauteur minimale 24 px).
- Contenu — le titre est stocké sous la forme `"Prestation - Client"`, on le scinde :
  - **durée > 60 min** : deux lignes — prestation en `text-[11px] font-semibold truncate`,
    client en `text-[10px] opacity-90 truncate` ;
  - **durée ≤ 60 min** : une ligne — `Prestation · Client`.
- En dessous, des mini-badges emoji (📧 rappel envoyé, 💬 SMS, ⭐ avis, 🔔 relance) en `text-[9px]`
  avec `title` au survol, affichés uniquement si le flag correspondant est vrai.
- **Clic** sur le bloc (avec `stopPropagation`) → ouvre le dialogue en mode édition,
  sauf si `justResized` (flag consommé et remis à false).

---

## 4. VUE MOIS

- Grille CSS 7 colonnes ; en-tête `Lun Mar Mer Jeu Ven Sam Dim` (`text-xs font-semibold text-muted-foreground`).
- Jours de `startOfWeek(startOfMonth)` à `endOfWeek(endOfMonth)` (lundi comme premier jour) →
  la grille inclut les jours débordants du mois précédent/suivant, grisés (`bg-secondary/30`,
  numéro en `opacity-40`).
- Cellule : `min-h-[96px] border-b border-r p-1.5 cursor-pointer hover:bg-secondary/60` ;
  numéro du jour en haut à droite dans une pastille `w-6 h-6 rounded-full` (remplie `bg-primary`
  pour aujourd'hui).
- **Clic sur une cellule** → création d'un rendez-vous à **9h00** ce jour-là.
- **Maximum 3 évènements affichés** par cellule (triés par heure), puis un compteur `+N`.
- Chaque évènement : petit bouton coloré pleine largeur `text-[11px] px-1.5 py-1 rounded-md text-white`
  affichant `HH:mm Titre` (tronqué) — cliquable (édition, avec `stopPropagation`) et **draggable**.
- **Drop sur une cellule** = déplacement vers ce jour **en conservant l'heure et la durée d'origine**.

---

## 5. DIALOGUE DE RENDEZ-VOUS (création / édition)

Modal shadcn `sm:max-w-md`. Titre : « Nouveau rendez-vous » ou « Modifier le rendez-vous ».
Un seul état `form` initialisé à l'ouverture :
- start = créneau cliqué/glissé (ou maintenant) ; end = créneau glissé (ou start + 1 h) ;
- type d'intervention présélectionné : le type dont le nom matche `/ramonage/i`, sinon le premier ;
- titre auto : `"Type - NomClient"` (flag `titleEdited` : dès que l'utilisateur touche le titre à la
  main, l'auto-génération cesse ; changer de type le régénère et réinitialise le flag).

Champs, dans l'ordre :
1. **Client** — combobox recherche (Popover + Command) : recherche sur nom + téléphone + ville,
   chaque item affiche nom (gras) + téléphone dessous, coche sur l'item sélectionné. Un bouton `+`
   incrusté à droite du déclencheur bascule le popover en **formulaire de création rapide de client**
   (pré-rempli avec le texte recherché) ; à la création, le client est immédiatement sélectionné.
   Sélectionner un client **préremplit la description** avec un bloc contact :
   `Client : … / Téléphone : … / Email : …`.
2. **Type d'intervention** — select avec pastille de couleur `w-2.5 h-2.5 rounded-full` devant chaque nom.
3. **Titre** — input libre (hauteur `h-11`).
4. **Début / Fin** — grille 2 colonnes ; chaque borne = un input `type="date"` (flex-1, date en gras)
   + un input `type="time"` (`w-24`). **Changer le début décale la fin pour conserver la durée**
   (durée de secours 1 h si incohérente). Changer la fin est libre.
5. **Description** — textarea 5 lignes, non redimensionnable.
6. (Édition seulement, si le type matche `/ramonage/i`) — bouton pleine largeur
   « Générer le certificat de ramonage » (lien vers la page certificat avec l'id du rendez-vous).

Pied : à gauche une icône **corbeille** rouge (suppression, visible en édition uniquement) ;
à droite « Annuler » + « Enregistrer » (désactivés pendant la sauvegarde, libellé « … »).
À l'enregistrement : `color` = couleur du type choisi ; create ou update selon le mode ; puis
rafraîchissement des données et fermeture.

---

## 6. DÉTAILS QUI FONT LA DIFFÉRENCE (checklist de conformité)

- [ ] Aimantation systématique au **quart d'heure** partout (création, drop, resize).
- [ ] `setPointerCapture` sur la colonne (création) et sur la poignée (resize) — sans ça, le suivi
      décroche dès que le curseur quitte l'élément.
- [ ] `touch-none` + `select-none` sur les colonnes et poignées (compatibilité tactile/tablette).
- [ ] Distinction clic vs glisser : seuil de 15 min de déplacement (`moved`).
- [ ] Flag `justResized` pour ne pas ouvrir le dialogue après un étirement.
- [ ] `stopPropagation` sur pointerdown des évènements (sinon un drag d'évènement crée un draft).
- [ ] Overrides optimistes purgés automatiquement quand la donnée serveur rattrape.
- [ ] Hauteur minimale d'un bloc : 24 px ; durée minimale : 15 min.
- [ ] Ligne rouge « maintenant » sur le jour courant uniquement, dans la plage horaire visible.
- [ ] Semaine du lundi au dimanche, locale française partout (date-fns `fr`).
- [ ] Plage horaire de la grille pilotée par les réglages utilisateur (défaut 6h → 20h).
- [ ] Couleur d'évènement héritée du type d'intervention.
- [ ] Vue mois : 3 évènements max + compteur « +N », clic cellule = RDV à 9h, drop = même heure conservée.