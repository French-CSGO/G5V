# G5V (MatchZy Panel) — Claude Instructions

## Vue d'ensemble

Frontend Vue.js 2 pour la gestion de matchs CS2 compétitifs.
Interface web du panel MatchZy — communique avec G5API en backend.

## Stack technique

- **Framework** : Vue.js 2.6.14 + Vue Router 3 + Vuex 3
- **UI** : Vuetify 2.6.10 (Material Design, thème dark esports)
- **HTTP** : Axios 0.26.0 (avec credentials)
- **Temps réel** : VueSSE 2.5.2 (Server-Sent Events)
- **i18n** : Vue i18n 8.22.1 (EN, FR, JP)
- **Build** : Vue CLI 5 + Babel + ESLint + Prettier
- **PWA** : service worker enregistré

## Commandes essentielles

```bash
# Développement (port 8080, proxy /api → localhost:3301)
yarn serve

# Build production → dist/
yarn build

# Lint
yarn lint
```

## Structure du projet

```
src/
  main.js                      # Entrée : init Vue, i18n, VueSSE, Vue.mixin(api)
  App.vue                      # Composant racine : overlay startup API, Navbar, router-view
  router/index.js              # 24+ routes en lazy-loading (history mode)
  store/index.js               # Vuex (minimal, peu utilisé)
  plugins/vuetify.js           # Thème Vuetify (dark, orange #e8523a)
  utils/api.vue                # FICHIER CENTRAL : mixin ~1700 lignes avec 100+ méthodes API
  translations/translations.json  # Clés i18n (EN, FR, JP)
  components/                  # Composants réutilisables (~25)
    Navbar.vue                  # Sidebar avec menu role-based (user, admin, super-admin)
    MatchCard.vue               # Carte d'affichage d'un match
    MatchesTable.vue            # Liste des matchs
    NewMatchForm.vue            # Formulaire de création de match
    TeamTable.vue               # Gestion des équipes
    ServerDialog.vue            # Configuration serveur
    LoginDialog.vue             # Authentification utilisateur
    VetoTable.vue               # Système de veto de maps
    PlayerLeaderboardTable.vue  # Classement joueurs
    PlayerStatTable.vue         # Stats d'un joueur
  views/                       # Pages (~23)
    Home.vue                    # Dashboard : leaderboards, matchs récents
    Match.vue                   # Détail match, contrôles admin, score live
    CreateMatch.vue             # Création de match
    Queue.vue                   # Queue 5v5 avec SSE temps réel
    SeasonToornament.vue        # Bracket Toornament
    SeasonToornamentSchedule.vue  # Planning par stage/round
    AdminSettings.vue           # Config admin
    AdminUsers.vue              # Gestion des utilisateurs
```

## Architecture

**Mixin global (`api.vue`)** : `Vue.mixin(api)` dans `main.js` injecte toutes les méthodes dans chaque composant.
Les composants appellent directement `this.GetTeam(id)`, `this.IsLoggedIn()`, `this.axioCall.get(...)`, etc.

**Proxy dev** : `vue.config.js` proxifie `/api` → `http://localhost:3301` (G5API).

**Temps réel** : VueSSE utilisé dans `Queue.vue` pour les notifications de queue et de création de match.

**Auth** : Steam OAuth via G5API (session cookie). Rôles vérifiés via `user.admin` et `user.super_admin`.

## Pièges Vuetify 2 connus

### Bug 1 : Collision `Vue.mixin()` avec les internals Vuetify

`Vue.mixin(api)` injecte les méthodes de `api.vue` dans **tous** les composants, y compris ceux de Vuetify.
Vuetify 2 utilise `register`, `unregister`, `toggle`, `isActive`, `show`, `hide` en interne.
Si `api.vue` définit une méthode avec l'un de ces noms → comportement cassé silencieusement.

**Exemple connu** : une méthode `register` dans `api.vue` cassait la navigation dans `v-tabs`.
**Règle** : toujours préfixer ou nommer de façon unique les méthodes dans `api.vue`.

### Bug 2 : `v-tabs-items` + `v-if` ne se synchronise pas

`v-tabs-items` avec `v-model` ne se synchronise pas correctement quand il est dans un bloc `v-if` qui démarre à `false`.

**Fix recommandé** : remplacer `v-tabs-items` / `v-tab-item` par des `v-if="tab === N"` manuels sur des `<div>`.

```vue
<!-- Ne pas faire (cassé dans v-dialog / v-if) : -->
<v-tabs-items v-model="tab">
  <v-tab-item>Section A</v-tab-item>
</v-tabs-items>

<!-- Faire à la place : -->
<div v-if="tab === 0">Section A</div>
<div v-if="tab === 1">Section B</div>
```

## Thème

- Mode dark par défaut (`dark: true` dans Vuetify)
- Couleur primaire : `#e8523a` (orange)
- Fond général : `#0b0d12`
- Overrides CSS dans `App.vue`

## i18n

- Fichier source : `src/translations/translations.json`
- Langues : `en`, `fr`, `jp`
- Changement de langue via `ChangeLanguage()` (persist en localStorage)
- Toute nouvelle chaîne UI doit être ajoutée dans les 3 langues

## Règles de développement

- Ne jamais utiliser des noms génériques dans `api.vue` (register, toggle, open, close, etc.)
- Préférer `v-if="tab === N"` à `v-tab-item` dans les dialogs et blocs conditionnels
- Toute nouvelle vue doit être ajoutée dans `router/index.js` en lazy-loading
- Toute nouvelle méthode API va dans `src/utils/api.vue`
- Garder la cohérence du thème dark — ne pas introduire de composants en mode light
