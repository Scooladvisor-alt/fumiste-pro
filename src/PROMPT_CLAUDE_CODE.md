# PROMPT COMPLET — Logiciel de gestion pour artisan fumiste / ramoneur (« Fumiste Pro »)

> Copie-colle l'intégralité de ce document à Claude Code. Il décrit, sans rien omettre, un logiciel SaaS complet de gestion de clientèle, d'agenda et de communications automatisées par e-mail pour un artisan ramoneur/fumiste. Construis-le **entièrement**, fonctionnalité par fonctionnalité, jusqu'à ce que tout soit terminé et testé. Ne t'arrête pas tant qu'il manque quoi que ce soit.

---

## 1. VISION DU PRODUIT

Tu dois construire **« Fumiste Pro »**, un logiciel web (responsive mobile + desktop, déployable aussi en app iOS/Android) destiné à un artisan ramoneur/fumiste indépendant. Il permet de :

1. Gérer un **fichier clients** complet (CRUD, recherche, édition en ligne, export CSV).
2. Gérer un **agenda professionnel** (vues Jour / Semaine / Mois, glisser-déposer, redimensionnement) avec **synchronisation bidirectionnelle Google Agenda**.
3. **Automatiser les communications par e-mail** via le compte Gmail de l'artisan :
   - Rappels d'intervention X jours avant.
   - Demandes d'avis Google X jours après.
   - Relances d'entretien obligatoire (ramonage annuel, test d'étanchéité triennal).
4. Offrir un **tableau de bord** récapitulant l'activité (nombre de clients, communications envoyées par période, prochains rendez-vous).
5. Une **landing page commerciale** publique pour présenter et vendre le produit.

Le ton visuel est chaleureux, « braise / feu » (oranges chauds), professionnel et moderne.

---

## 2. STACK TECHNIQUE IMPOSÉE

- **Frontend** : React 18 + Vite + JavaScript (pas de TypeScript), **React Router DOM v6**, Tailwind CSS, composants **shadcn/ui**, icônes **lucide-react**.
- **Librairies** : `date-fns` (locale `fr`) pour toutes les dates, `@tanstack/react-query` pour le cache de données, `@hello-pangea/dnd` ou logique pointer maison pour le drag & drop de l'agenda, `recharts` si besoin de graphiques.
- **Backend** : Backend-as-a-Service avec :
  - **Entités** (base de données documentaire avec schémas JSON et RLS — Row Level Security par utilisateur).
  - **Fonctions backend** (handlers HTTP serverless type Deno, appelées depuis le frontend).
  - **Connecteurs OAuth** par utilisateur (chaque utilisateur connecte SON propre compte Google).
  - **Auth** gérée par la plateforme (login/register/OTP/reset password).
- **Police** : `Plus Jakarta Sans` (titres/display) + `Inter` (corps).

> Si tu construis hors d'une plateforme BaaS, remplace les entités par des tables (PostgreSQL + Prisma), les fonctions backend par des routes API (Node/Express ou Next.js API routes), l'auth par NextAuth/Clerk, et les connecteurs par une intégration OAuth Google (google-auth-library) stockant les tokens par utilisateur. **L'architecture fonctionnelle doit rester identique.**

---

## 3. DESIGN SYSTEM (à respecter exactement)

Tokens CSS (mode clair), thème « braise » :

```css
--background: 0 0% 100%;
--foreground: 20 24% 14%;
--primary: 18 88% 50%;            /* orange braise */
--primary-foreground: 0 0% 100%;
--secondary: 24 30% 96%;
--muted: 24 30% 96%;
--muted-foreground: 22 12% 46%;
--accent: 22 100% 95%;
--accent-foreground: 16 80% 42%;
--destructive: 0 72% 51%;
--border: 24 24% 89%;
--ring: 18 88% 50%;
--ember: 18 88% 50%;              /* braise */
--ember-deep: 8 78% 44%;          /* braise profonde */
--ember-glow: 36 96% 56%;         /* lueur */
--radius: 0.75rem;
--font-heading: 'Plus Jakarta Sans';
--font-body: 'Inter';
--font-display: 'Plus Jakarta Sans';
```

- Fond applicatif général : `#fbf7f4` (beige très clair).
- Sidebar desktop : fond sombre `#1c1410` avec lueurs de braise floutées en dégradé (`from-ember-glow via-ember to-ember-deep`).
- Boutons, badges, dégradés actifs : dégradés `from-ember to-ember-deep`.
- Logo : icône `Flame` (lucide) dans un carré arrondi dégradé braise.
- Toujours utiliser les classes mappées sur les tokens (`bg-primary`, `text-ember`, `font-display`…), jamais de couleurs en dur.
- Mappe ces tokens dans `tailwind.config.js` (couleurs `ember`, `ember-deep`, `ember-glow`, et `fontFamily` heading/body/display).

---

## 4. MODÈLE DE DONNÉES (ENTITÉS)

**Toutes** les entités ci-dessous portent une RLS stricte : chaque utilisateur ne voit/édite que ses propres enregistrements. Règle RLS pour create/read/update/delete :
```json
{ "create": {"created_by_id": "{{user.id}}"}, "read": {"created_by_id": "{{user.id}}"},
  "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"} }
```
Attributs intégrés présents partout (ne pas redéclarer) : `id`, `created_date`, `updated_date`, `created_by_id`.

### 4.1 `Client`
| Champ | Type | Description |
|---|---|---|
| `full_name` | string **(requis)** | Nom et prénom |
| `phone` | string **(requis)** | Téléphone |
| `email` | string | Adresse e-mail |
| `city` | string | Ville |
| `notes` | string | Notes diverses |
| `last_ramonage_date` | date | Date du dernier ramonage (sert aux relances annuelles) |
| `last_etancheite_date` | date | Date du dernier test d'étanchéité (relance triennale) |
| `followup_sent_date` | date | Date du dernier e-mail de relance ramonage envoyé (anti-doublon) |
| `etancheite_followup_sent_date` | date | Date du dernier e-mail de relance étanchéité (anti-doublon) |

### 4.2 `Appointment` (rendez-vous)
| Champ | Type | Description |
|---|---|---|
| `title` | string | Titre généré automatiquement |
| `client_id` | string | ID du client concerné |
| `intervention_type` | string | Type d'intervention |
| `start` | date-time **(requis)** | Début |
| `end` | date-time **(requis)** | Fin |
| `notes` | string | Notes (contiennent le bloc contact + e-mail destinataire) |
| `color` | string (def. `#3b82f6`) | Couleur de l'événement |
| `google_event_id` | string | ID de l'événement Google Calendar lié |

### 4.3 `InterventionType`
| Champ | Type | Description |
|---|---|---|
| `name` | string **(requis)** | Nom du type |
| `color` | string (def. `#3b82f6`) | Couleur hex associée |

Types par défaut à semer au premier lancement (si la table est vide) :
`Ramonage` #3b82f6, `Entretien technique` #10b981, `Débistrage` #f59e0b, `Remise aux normes` #ef4444, `Pose de poêle à bois` #8b5cf6.

### 4.4 `ReminderSettings` (réglages de communication — 1 enregistrement par utilisateur)
| Champ | Type | Déf. | Description |
|---|---|---|---|
| `enabled` | bool | true | Activer les rappels d'intervention |
| `days_before` | number | 2 | Jours avant l'intervention pour le rappel |
| `reminder_subject` | string | | Objet du rappel |
| `reminder_html` | string | | Corps HTML du rappel (avec variables) |
| `review_enabled` | bool | false | Activer les demandes d'avis Google |
| `review_days_after` | number | 1 | Jours après l'intervention pour l'avis |
| `review_subject` | string | | Objet de la demande d'avis |
| `review_html` | string | | Corps HTML de la demande d'avis |
| `google_review_link` | string | | Lien vers la page d'avis Google |
| `daily_send_hour` | number | 9 | Heure (0–23, Europe/Paris) d'envoi quotidien |
| `followup_enabled` | bool | false | Activer la relance ramonage annuelle |
| `followup_months` | number | 12 | Mois après le dernier ramonage (12 = annuel) |
| `followup_subject` | string | | Objet relance ramonage |
| `followup_html` | string | | Corps HTML relance ramonage |
| `etancheite_followup_enabled` | bool | false | Activer la relance test d'étanchéité |
| `etancheite_followup_months` | number | 36 | Mois après le dernier test (36 = triennal) |
| `etancheite_followup_subject` | string | | Objet relance étanchéité |
| `etancheite_followup_html` | string | | Corps HTML relance étanchéité |
| `auto_send_last_run` | date | | Date du dernier envoi auto (anti-doublon journalier) |

### 4.5 `CommunicationLog` (journal des envois)
| Champ | Type | Description |
|---|---|---|
| `type` | enum **(requis)** : `rappel`, `avis`, `relance_ramonage`, `relance_etancheite`, `sms` | Type de communication |
| `channel` | enum : `email`, `sms` (def. `email`) | Canal |
| `client_id` | string | ID du client destinataire |
| `client_name` | string | Nom du client (copie d'affichage) |
| `to` | string | Destinataire (e-mail/téléphone) |
| `sent_date` | date **(requis)** | Date d'envoi (YYYY-MM-DD, Europe/Paris) |

### 4.6 `SyncState` (état de synchro Google par utilisateur)
| Champ | Type | Description |
|---|---|---|
| `sync_token` | string | Jeton de synchro incrémentale Google Calendar |

### 4.7 `AccessGrant` (statut de connexions — optionnel)
| Champ | Type | Déf. |
|---|---|---|
| `calendar_connected` | bool | false |
| `gmail_connected` | bool | false |

### Entité `User` (intégrée à la plateforme)
Lecture seule : `id`, `full_name`, `email`. Champ `role` (`admin`/`user`). Ne pas la recréer.

---

## 5. AUTHENTIFICATION & ROUTAGE

Pages d'auth standard (login email+password + Google OAuth, register → OTP → vérification, mot de passe oublié, réinitialisation via `?token=`). Routes :

```
/                 -> Landing (page commerciale publique)
/login            -> Login
/register         -> Register (multi-étapes : register → OTP → verifyOtp → setToken → redirect)
/forgot-password  -> ForgotPassword
/reset-password   -> ResetPassword (lit ?token=)
[ProtectedRoute + Layout]
  /app            -> Dashboard (tableau de bord)
  /clients        -> Clients
  /agenda         -> Agenda
  /parametres     -> Réglages
*                 -> PageNotFound
```

Les pages applicatives sont protégées (redirection vers `/login` si non authentifié) et enveloppées dans un **Layout** partagé. Utilise des **redirections dures** (`window.location.href`) après login/verifyOtp/reset, jamais `navigate()`.

---

## 6. LAYOUT APPLICATIF (composant partagé)

- **Desktop** (`lg:`) : sidebar fixe largeur 64 (16rem), fond `#1c1410`, lueurs de braise floutées. En haut : logo `Flame` dégradé + « Fumiste Pro » / sous-titre « GESTION RAMONAGE » en lettres espacées. Navigation verticale (lien actif en dégradé braise avec ombre). En bas : bouton « Se déconnecter » (icône `LogOut`).
- **Mobile** (`<lg`) : barre supérieure sombre sticky avec logo + déconnexion, puis barre de navigation horizontale scrollable.
- Navigation : `Tableau de bord` (`/app`, icône `LayoutDashboard`), `Clients` (`/clients`, `Users`), `Agenda` (`/agenda`, `Calendar`), `Réglages` (`/parametres`, `Settings`).
- Le lien `/app` est actif uniquement sur correspondance exacte ; les autres sur préfixe.
- Au montage du Layout : semer les types d'intervention par défaut (une seule fois) **et** monter un composant invisible `AutoSendEmails` (voir §10).
- Contenu de page rendu via `<Outlet />` dans un `<main>` scrollable.

---

## 7. PAGE CLIENTS (`/clients`)

- En-tête : logo braise + « Clients (N) ». À droite : bouton **« Exporter CSV »** (désactivé si 0 client) et bouton **« Ajouter »**.
- Barre de recherche (icône `Search`) filtrant sur nom + téléphone + e-mail + ville (insensible à la casse).
- **Tableau** avec colonnes : Nom, Téléphone, Ville, E-mail, **Dernier ramonage**, **Dernier test étanchéité**, + colonne action (corbeille).
- **Édition en ligne (inline)** : chaque cellule est un composant `EditableCell` cliquable qui transforme le texte en input (`text`/`tel`/`email`/`date` selon la colonne) et sauvegarde au blur/Enter. Sauvegarde via update de l'entité `Client` puis refresh du cache react-query.
- À côté des dates « dernier ramonage » et « dernier test étanchéité » : un petit icône `FollowupSentIcon` indiquant si la relance correspondante a déjà été envoyée (compare `interventionDate` et `sentDate` : si une relance a été envoyée après l'intervention, afficher un état « envoyé »).
- Bouton corbeille : suppression du client (avec refresh).
- En-tête de tableau sticky. État vide : « Aucun client trouvé. ».
- **`ClientDialog`** (modale ajout/édition) : champs nom, téléphone, e-mail, ville, notes, dates dernier ramonage / dernier test. Création/édition de l'entité `Client`.
- **Export CSV** (`lib/exportCsv.js`) : génère un fichier CSV des clients filtrés (toutes colonnes utiles), avec gestion correcte des accents (BOM UTF-8) et des séparateurs/échappements, et déclenche le téléchargement.

---

## 8. PAGE AGENDA (`/agenda`) — le cœur du logiciel

### 8.1 Barre d'outils
- Flèches précédent/suivant + bouton « Aujourd'hui ».
- Titre dynamique selon la vue (mois « MMMM yyyy », semaine « d MMM – d MMM yyyy », jour « EEEE d MMMM yyyy »), locale `fr`, capitalisé.
- À droite : bouton **synchroniser** (icône `RefreshCw`, qui tourne pendant la synchro), sélecteur de vue **Jour / Semaine / Mois**, bouton **« Rendez-vous »** (création).

### 8.2 Vues
- **Vue Mois (`MonthView`)** : grille 7 colonnes (lundi → dimanche, `weekStartsOn: 1`), cellules de jour calculées via `startOfWeek`/`endOfWeek` sur le mois. Chaque cellule affiche un aperçu trié des rendez-vous du jour (pastille couleur + heure + titre). Clic sur une cellule = nouveau RDV ce jour ; clic sur un événement = édition. **Drag & drop** d'un événement d'un jour à l'autre (conserve l'heure d'origine).
- **Vue Semaine/Jour (`TimeGridView`)** : grille horaire verticale avec snap (ex. pas de 15 min), conversion temps↔pixels, libellés d'heures, **indicateur de l'heure courante**. Fonctions : drag-to-create (glisser pour créer un créneau), déplacement d'événement (drag), **redimensionnement** (poignées haut/bas), clic = édition. Les événements affichés via un sous-composant `EventBadges`.
- Les événements affichent leur couleur (`color`), leur titre, et l'heure.

### 8.3 Modale rendez-vous (`AppointmentDialog`)
- Champs : **Client** (`ClientSelect`, recherche + création rapide d'un nouveau client à la volée via `NewClientForm`), **Type d'intervention** (select avec pastille de couleur), **Titre** (auto-généré, éditable), **Début** (date + heure), **Fin** (date + heure), **Description** (textarea).
- Logique :
  - À l'ouverture, pré-remplit depuis le RDV existant ou depuis le créneau cliqué (durée par défaut 1 h).
  - Le **titre** est auto-généré via `buildTitle(type, clientName)` (`lib/appointments.js`) tant que l'utilisateur ne l'a pas édité manuellement.
  - À la sélection d'un client : injecte en tête de la **description** un bloc contact (`Client : … / Téléphone : … / Email : …`). ⚠️ Cet e-mail dans la description sert de destinataire pour les rappels.
  - Quand le **début** change, décale la **fin** pour conserver la durée.
  - La **couleur** du RDV reprend celle du type d'intervention.
  - On stocke aussi `description` = `notes`.
- À l'enregistrement : create/update de `Appointment`, **puis** appel de la fonction `pushAppointmentToGoogle` (`action: 'upsert'`) pour pousser vers Google Agenda (en try/catch, ne bloque jamais la sauvegarde si le calendrier n'est pas connecté). Refresh du cache.
- Suppression : delete de `Appointment`, **puis** `pushAppointmentToGoogle` (`action: 'delete'`, `googleEventId`).

### 8.4 Synchronisation Google Agenda (bidirectionnelle)
- **À l'ouverture de la page agenda** : lance une synchro entrante (Google → logiciel), puis **polling toutes les 30 s** et **resynchro quand l'onglet redevient visible** (`visibilitychange`). Pas besoin de recharger la page.
- Le bouton synchro manuel fait la même chose avec un spinner.
- Si la synchro renvoie un statut `reconnect_required`, afficher une **bannière de reconnexion** (`ReconnectCalendarBanner`) : un bouton qui déconnecte puis reconnecte le compte Google (ouvre un popup OAuth **immédiatement dans le geste du clic** pour ne pas être bloqué), et relance la synchro à la fermeture du popup.

---

## 9. PAGE RÉGLAGES (`/parametres`)

En-tête « Réglages ». Sections empilées :

1. **`GoogleSync`** — connexion **Google Calendar** (par utilisateur). États : vérification / connecté / déconnecté. Boutons **Connecter**, **Reconnecter** (déconnecte puis reconnecte pour régénérer un jeton propre), **Déconnecter**. Le bouton ouvre le popup OAuth immédiatement dans le geste du clic, puis poll la fermeture du popup pour rafraîchir le statut (via la fonction `checkCalendarConnection`).
2. **`GmailConnect`** — connexion **Gmail** (par utilisateur), même UX (connecter/déconnecter, popup OAuth, polling). Statut via `checkGmailConnection`.
3. **`SendEmailsNow`** — bouton **« Envoyer les e-mails maintenant »** qui déclenche manuellement `sendMyEmails`. Affiche un état d'envoi, puis le nombre d'e-mails envoyés (ou message d'erreur, ex. `gmail_not_connected`).
4. **`CommunicationSettings`** — onglets **Rappels / Avis Google / Relances** :
   - **Rappels** (`ReminderSettings`) : activer/désactiver, `days_before`, éditeur HTML d'e-mail. + **`SmsReminderSettings`** (préparation rappels SMS — UI, le canal `sms` existe dans les logs).
   - **Avis Google** (`GoogleReviewSettings`) : activer, `review_days_after`, lien d'avis Google, éditeur HTML.
   - **Relances** (`MaintenanceFollowupSettings`) : relance ramonage (activer, `followup_months` déf. 12) + relance étanchéité (activer, `etancheite_followup_months` déf. 36), éditeurs HTML.
   - **`DailySendTime`** : heure d'envoi quotidien (`daily_send_hour`, fuseau Europe/Paris).
5. **`InterventionTypes`** — gestion des types d'intervention : liste, ajout (nom + sélecteur de couleur par popover avec palette prédéfinie), modification de couleur, suppression.

### Éditeur HTML d'e-mail (`HtmlEmailEditor`) — composant réutilisable
- Champ **Objet**.
- Barre de **variables insérables** en un clic à la position du curseur : `{{client}}`, `{{date}}`, `{{heure}}`, `{{type}}`, `{{lien_avis}}` (+ variables spécifiques relances : `{{date_dernier_ramonage}}`, `{{date_dernier_test}}`).
- **Zone de code HTML** (textarea monospace redimensionnable).
- **Aperçu en temps réel** dans une `<iframe sandbox>` avec valeurs de démonstration substituées.

Les réglages sont chargés/sauvegardés via un hook `useReminderSettings` (lecture du 1er enregistrement `ReminderSettings` de l'utilisateur, création si absent, mise à jour).

---

## 10. ENVOI AUTOMATIQUE À L'OUVERTURE (`AutoSendEmails`)

Composant invisible monté dans le Layout : au démarrage de l'app, déclenche **une seule fois par jour** l'envoi automatique des e-mails (`sendMyEmails` avec `{ auto: true }`). L'anti-doublon est géré **côté serveur** via `ReminderSettings.auto_send_last_run` (date du jour). Échoue silencieusement (l'utilisateur garde le bouton manuel dans les réglages). Utilise un `ref` pour éviter les exécutions multiples pendant le cycle de vie du composant.

---

## 11. FONCTIONS BACKEND (handlers serverless)

> Toutes en JavaScript, tout le code dans le handler, authentifient l'utilisateur (`auth.me()` → 401 si absent), renvoient des objets `Response.json(...)`, try/catch global. Les connecteurs sont **par utilisateur** : on récupère le token du compte Google de l'utilisateur courant via `getCurrentAppUserConnection(CONNECTOR_ID)`.

### 11.1 `pushAppointmentToGoogle`
Pousse un RDV du logiciel vers le **Google Calendar de l'utilisateur courant**. Payload `{ appointmentId, action: 'upsert' | 'delete', googleEventId? }`.
- Récupère le token calendrier ; si absent → renvoie `{ status: 'calendar_not_connected' }` (ne bloque pas l'app).
- `delete` : supprime l'événement Google (`DELETE /events/{id}`) si `googleEventId` fourni.
- `upsert` : relit le RDV (RLS), construit `{ summary, description, start.dateTime, end.dateTime }`. Si `google_event_id` existe → `PATCH` ; si l'event a disparu côté Google → recrée. Sinon `POST` (création) puis stocke le nouvel `google_event_id` sur le RDV.
- URL base : `https://www.googleapis.com/calendar/v3/calendars/primary/events`.

### 11.2 `syncFromGoogle`
Synchro **entrante** (Google → logiciel) pour l'utilisateur courant.
- Token calendrier de l'utilisateur ; si absent → `{ status: 'calendar_not_connected' }` (400).
- Utilise un **sync token incrémental** par utilisateur (entité `SyncState` filtrée sur `created_by_id`).
- **Import initial** (pas de sync token) : fenêtre large `timeMin` = -90 jours, `timeMax` = +365 jours, `singleEvents=true`, `maxResults=100`.
- **Sync incrémental** : `syncToken` seul + `showDeleted=true` pour récupérer les suppressions.
- Si le `syncToken` est invalide/expiré (HTTP **410 ou 400**, ex. changement de compte) → supprime l'état et refait un import complet.
- Si **403/401** (scopes insuffisants / jeton périmé) → renvoie `{ status: 'reconnect_required' }` (403) pour déclencher la bannière de reconnexion côté UI.
- Parcourt toutes les pages (`nextPageToken`), mémorise `nextSyncToken`.
- Rapproche les events Google des RDV locaux via `google_event_id` :
  - event `cancelled` → supprime le RDV local s'il existe.
  - event existant + champs modifiés (titre/début/fin/notes) → met à jour le RDV local.
  - event inexistant en local → crée un RDV (`color` `#f97316`).
- Sauvegarde le nouveau `sync_token`. Renvoie `{ status:'ok', received, created, updated, deleted }`.

### 11.3 `sendMyEmails` — moteur d'envoi (manuel ET auto)
Utilise le **Gmail de l'utilisateur courant** ; ne traite que ses données (RLS). Payload `{ auto?: boolean }`.
- Token Gmail ; si absent → `{ error: 'gmail_not_connected' }` (400).
- Si `auto === true` et `auto_send_last_run === aujourd'hui` → stoppe (`skipped: already_sent_today`).
- Charge `ReminderSettings` (1er enr.), tous les `Appointment`, tous les `Client` (map par id).
- **Anti-doublon** : charge les `CommunicationLog` du jour, set de clés `type:client_id` pour ne pas réenvoyer.
- Helpers : `encodeRFC2047` (objet), `buildMime` (MIME HTML base64url), `applyVars` (substitution `{{var}}`), `extractEmail` (regex sur les notes du RDV), `formatFr` (date FR longue), `dayOffset(n)`, `isDue(dateStr, months)`.
- Envoi via `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send` avec `{ raw }`.
- **Rappels** (si `enabled !== false`) : cible les RDV dont la date = aujourd'hui + `days_before`. Destinataire = e-mail extrait des notes du RDV. Variables : `{{client}}`, `{{date}}` (jour long), `{{heure}}`, `{{type}}`. Log type `rappel`.
- **Avis Google** (si `review_enabled`) : cible les RDV dont la date = aujourd'hui − `review_days_after`. Variable supplémentaire `{{lien_avis}}` = `google_review_link`. Log type `avis`.
- **Relances ramonage** (si `followup_enabled`) : pour chaque client avec e-mail, si `last_ramonage_date` est dû depuis ≥ `followup_months` mois et qu'aucune relance n'a été envoyée après cette date (`followup_sent_date >= last_ramonage_date`) → envoie, met à jour `followup_sent_date`, log `relance_ramonage`. Variables `{{client}}`, `{{date_dernier_ramonage}}`.
- **Relances étanchéité** (si `etancheite_followup_enabled`) : idem avec `last_etancheite_date`, `etancheite_followup_months` (déf. 36), `etancheite_followup_sent_date`, log `relance_etancheite`, variable `{{date_dernier_test}}`.
- À la fin : met à jour `auto_send_last_run = aujourd'hui`. Renvoie `{ ok:true, totalSent, reminders, reviews, ramonage, etancheite }`.

### 11.4 `checkCalendarConnection` / `checkGmailConnection`
Vérifient si l'utilisateur courant a une connexion active au connecteur (Calendar / Gmail). Renvoient `{ connected: boolean }`.

### 11.5 Fonctions d'envoi planifiées (optionnelles, pour automatisation serveur)
`runDailyEmails`, `sendDailyReminders`, `sendGoogleReviewRequests`, `sendMaintenanceFollowups` : versions déclenchées par tâche planifiée (cron) qui, à l'heure `daily_send_hour` (fuseau **Europe/Paris**), envoient respectivement rappels, demandes d'avis et relances d'entretien — même logique que `sendMyEmails` mais côté serveur planifié, avec validation de la plage horaire en Europe/Paris. `updateLastRamonage` : met à jour `last_ramonage_date` / `last_etancheite_date` du client à partir des RDV de l'agenda. **Implémente d'abord l'envoi à l'ouverture (`sendMyEmails` + `AutoSendEmails`) ; les versions cron sont un complément.**

---

## 12. PAGE TABLEAU DE BORD (`/app`)

- **Bandeau braise** (dégradé `from-ember-deep via-ember to-ember-glow`, coins très arrondis, lueur floutée) : date du jour (FR, capitalisée), « Bonjour {prénom} 🔥 », et un badge « N clients ».
- **Carte « Tour de contrôle »** : filtre de période (`PeriodFilter` : Aujourd'hui / 7 j / 30 j…) + **statistiques de communications** (`CommunicationStats`) calculées depuis `CommunicationLog` filtrés par `sent_date` sur la période (compte par `type` + total). Utilise des `StatCard`.
- **Prochains rendez-vous** (`UpcomingAppointments`) : liste des RDV à venir avec client associé.

---

## 13. LANDING PAGE PUBLIQUE (`/`)

Page commerciale complète (composants dédiés) :
- `LandingNav` (logo Flame + liens + boutons Connexion/Inscription),
- `LandingHero` (accroche, sous-titre, CTA, visuel),
- `LandingFeatures` (agenda synchronisé, clients, e-mails automatiques, relances obligatoires…),
- `LandingHowItWorks` (étapes),
- `LandingTestimonials`,
- `LandingPricing`,
- `LandingCTA`,
- `LandingFooter`.
Ton « artisan ramoneur », design braise cohérent avec l'app. CTA pointant vers `/register`.

---

## 14. HOOKS & UTILITAIRES

- `hooks/useData.js` : `useClients` (`Client.list('-created_date', 500)`), `useAppointments` (`Appointment.list('-start', 1000)`), `useCommunicationLogs` (`CommunicationLog.list('-sent_date', 2000)`), `useInterventionTypes` (`InterventionType.list('created_date', 100)`), `useRefreshData` (invalide les caches clients/appointments/interventionTypes). Tous avec `initialData: []`.
- `hooks/useReminderSettings.js` : charge/crée/met à jour l'enregistrement `ReminderSettings` de l'utilisateur.
- `lib/appointments.js` : `buildTitle(type, clientName)` (ex. « Ramonage – Jean Dupont »).
- `lib/seed.js` : `ensureInterventionTypes()` (sème les types par défaut si table vide, une seule fois).
- `lib/exportCsv.js` : `exportClientsToCsv(clients)`.
- `lib/followupStatus.js` : logique d'état « relance envoyée » à partir des dates.

---

## 15. EXIGENCES TRANSVERSALES (ne rien oublier)

1. **Responsive** total : sidebar desktop / barres mobiles, tableaux scrollables, modales adaptées.
2. **Locale FR** partout (dates `date-fns` locale `fr`, fuseau **Europe/Paris** pour toute la logique d'envoi quotidien).
3. **RLS stricte** : chaque utilisateur isolé (clients, RDV, réglages, logs, sync token, connexions OAuth).
4. **Connexions OAuth par utilisateur** (chacun connecte SON Google Agenda et SON Gmail). Les popups OAuth s'ouvrent **dans le geste du clic** (sinon bloqués), et on **poll la fermeture du popup** pour rafraîchir.
5. **Synchro agenda bidirectionnelle robuste** : import initial + incrémental, gestion des suppressions, gestion `reconnect_required` (403/401) avec bannière de reconnexion, sync token par utilisateur, resync auto (30 s + visibilitychange).
6. **Anti-doublons d'e-mails** : journal `CommunicationLog`, set `type:client_id` du jour, `followup_sent_date` / `etancheite_followup_sent_date`, `auto_send_last_run` journalier.
7. **Envoi auto une fois/jour à l'ouverture** + **bouton d'envoi manuel** dans les réglages.
8. **Éditeur HTML** avec variables insérables et aperçu iframe temps réel.
9. **Édition inline** des clients + export CSV (UTF-8 BOM).
10. **Drag & drop + resize** dans l'agenda, vues Jour/Semaine/Mois, indicateur d'heure courante.
11. **Gestion d'erreurs gracieuse** : un calendrier/Gmail non connecté ne casse jamais l'app (statuts renvoyés, try/catch côté UI).
12. **Composants focalisés** : un fichier par composant, fichiers courts, pas de fichiers fourre-tout.

---

## 16. ORDRE DE CONSTRUCTION RECOMMANDÉ

1. Design system (tokens CSS + Tailwind + polices).
2. Entités + RLS + seed des types d'intervention.
3. Auth + routage + ProtectedRoute + Layout (sidebar/mobile).
4. Page Clients (CRUD, inline edit, recherche, export CSV).
5. Réglages : connecteurs Google Calendar + Gmail (OAuth par utilisateur) + fonctions `checkCalendarConnection`/`checkGmailConnection`.
6. Agenda : vues + modale RDV + `pushAppointmentToGoogle`.
7. Synchro entrante `syncFromGoogle` + resync auto + bannière reconnexion.
8. Réglages communication (onglets + éditeur HTML + types d'intervention).
9. Moteur `sendMyEmails` + `AutoSendEmails` + `SendEmailsNow`.
10. Tableau de bord (stats + prochains RDV).
11. Landing page publique.
12. (Option) Automatisations planifiées cron : `runDailyEmails` & co.

---

## 17. CRITÈRES DE « TERMINÉ » — vérifie chaque point avant de t'arrêter

- [ ] Je peux m'inscrire, valider l'OTP, me connecter, réinitialiser mon mot de passe.
- [ ] Je peux créer/éditer/supprimer des clients, éditer chaque cellule en ligne, rechercher, exporter en CSV.
- [ ] Je peux créer un RDV (avec création de client à la volée), il pousse vers mon Google Agenda.
- [ ] Mes événements Google reviennent dans le logiciel (création/modif/suppression), sans recharger la page.
- [ ] La reconnexion Google régénère un jeton valide et lève l'erreur de scopes.
- [ ] Je connecte/déconnecte Google Agenda et Gmail indépendamment, chaque utilisateur isolé.
- [ ] Les rappels, avis et relances s'envoient depuis MON Gmail, une fois/jour automatiquement + à la demande, sans doublon.
- [ ] L'éditeur HTML insère les variables et montre l'aperçu en direct.
- [ ] Le tableau de bord affiche les bonnes statistiques par période et les prochains RDV.
- [ ] La landing page publique est complète et cohérente visuellement.
- [ ] Tout est responsive, en français, fuseau Europe/Paris, design braise respecté.

**Construis l'ensemble jusqu'au bout. Ne t'arrête pas tant que tous les critères ci-dessus ne sont pas satisfaits.**