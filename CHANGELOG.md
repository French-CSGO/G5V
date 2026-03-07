# Changelog

## [1.8.0] - 2026-03-07

### Features
- **Queue 5v5** : nouvelle page de file d'attente avec taille configurable (1–10 joueurs), redirection automatique vers le match à la création
- **Toornament** : section matches dans la vue Saison avec création de match ; page dédiée `/season/:id/toornament`
- **Toornament** : page de calendrier par round avec accordéon stage/round
- **Toornament** : affichage du format (BO1/BO3…) avec fallback sur les paramètres du stage
- **Pterodactyl** : champ et sélecteur d'ID serveur dans le formulaire serveur
- **Pterodactyl** : page de liaison en masse des 32 serveurs (`/servers/pterodactyl-link`) accessible aux admins
- **UX** : message "serveur en cours de démarrage" lors de la création de match (manuel, Toornament, queue)

### Fixes
- Toornament : format `single_set` affiché comme BO1
- Toornament : héritage de `skip_veto`, `map_pool`, `side_type`, `map_sides`, `min_players_to_ready`, `players_per_team`, `wingman` depuis la saison
- Toornament : `map_sides` converti de séparation par espaces à virgules pour l'API match
- Toornament : bouton "créer match" masqué pour les matchs en cours ou terminés
- Queue : gestion du `matchId` dans la réponse `CreateQueue` pour la redirection immédiate
- Correction de l'URL leaderboard par saison
- Espacement du bouton Pterodactyl dans la barre d'outils serveurs

### Performance
- Build Docker limité à `amd64`, ajout du cache GHA par couches

### Misc
- Suppression de tous les `console.log/error/debug` restants dans les composants

---

## [1.7.3] - précédente version
