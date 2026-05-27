import Vue from "vue";
import VueRouter from "vue-router";
Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import(/* webpackChunkName: "Home" */ "../views/Home.vue")
  },
  {
    path: "/queue",
    name: "Queue",
    component: () =>
      import(/* webpackChunkName: "Queue" */ "../views/Queue.vue")
  },
  {
    path: "/matches",
    name: "Matches",
    component: () =>
      import(/* webpackChunkName: "Home" */ "../views/Matches.vue")
  },
  {
    path: "/teams",
    name: "Teams",
    component: () =>
      import(/* webpackChunkName: "Teams" */ "../views/Teams.vue"),
    children: [
      {
        path: "/create",
        name: "Create Team",
        component: () =>
          import(/* webpackChunkName: "Teams" */ "../views/Team.vue")
      }
    ]
  },
  {
    path: "/mymatches",
    name: "My Matches",
    component: () =>
      import(/* webpackChunkName: "Home" */ "../views/Matches.vue")
  },
  {
    path: "/myteams",
    name: "My Teams",
    component: () =>
      import(/* webpackChunkName: "Teams" */ "../views/Teams.vue")
  },
  {
    path: "/myseasons",
    name: "My Seasons",
    component: () =>
      import(/* webpackChunkName: "Season" */ "../views/Seasons.vue")
  },
  {
    path: "/myservers",
    name: "My Servers",
    component: () =>
      import(/* webpackChunkName: "Server" */ "../views/Servers.vue")
  },
  {
    path: "/teams/:id",
    name: "Team",
    component: () => import(/* webpackChunkName: "Team" */ "../views/Team.vue")
  },
  {
    path: "/match/create",
    name: "New Match",
    component: () =>
      import(/* webpackChunkName: "Match" */ "../views/CreateMatch.vue")
  },
  {
    path: "/match/:id/veto",
    name: "VetoDisplay",
    meta: { hideChrome: true },
    component: () =>
      import(/* webpackChunkName: "Match" */ "../views/VetoDisplay.vue")
  },
  {
    path: "/match/:id",
    name: "Match",
    component: () =>
      import(/* webpackChunkName: "Match" */ "../views/Match.vue")
  },
  {
    path: "/user/:id",
    name: "User",
    component: () => import(/* webpackChunkName: "User" */ "../views/User.vue")
  },
  {
    path: "/user",
    name: "My User",
    component: () => import(/* webpackChunkName: "User" */ "../views/User.vue")
  },
  {
    path: "/seasons",
    name: "Seasons",
    component: () =>
      import(/* webpackChunkName: "Season" */ "../views/Seasons.vue")
  },
  {
    path: "/season/:id",
    name: "Season",
    component: () =>
      import(/* webpackChunkName: "Season" */ "../views/Season.vue")
  },
  {
    path: "/season/:id/toornament/schedule",
    name: "SeasonToornamentSchedule",
    component: () =>
      import(
        /* webpackChunkName: "Season" */ "../views/SeasonToornamentSchedule.vue"
      )
  },
  {
    path: "/season/:id/toornament",
    name: "SeasonToornament",
    component: () =>
      import(/* webpackChunkName: "Season" */ "../views/SeasonToornament.vue")
  },
  {
    path: "/season/:id/challonge",
    name: "SeasonChallonge",
    component: () =>
      import(/* webpackChunkName: "Season" */ "../views/SeasonChallonge.vue")
  },
  {
    path: "/servers",
    name: "Servers",
    component: () =>
      import(/* webpackChunkName: "Server" */ "../views/Servers.vue")
  },
  {
    path: "/servers/pterodactyl-link",
    name: "ServerPterodactylLink",
    component: () =>
      import(
        /* webpackChunkName: "Server" */ "../views/ServerPterodactylLink.vue"
      )
  },
  {
    path: "/metrics",
    name: "Metrics",
    component: () =>
      import(/* webpackChunkName: "Metrics" */ "../views/Metrics.vue")
  },
  {
    path: "/leaderboard",
    name: "Leaderboard",
    component: () =>
      import(
        /* webpackChunkName: "Leaderboards" */ "../views/PlayerLeaderboard.vue"
      )
  },
  {
    path: "/leaderboard/teams",
    name: "TeamBoard",
    component: () =>
      import(
        /* webpackChunkName: "Leaderboards" */ "../views/TeamLeaderboard.vue"
      )
  },
  {
    path: "/leaderboard/:seasonid",
    name: "SeasonPlayerBoard",
    component: () =>
      import(
        /* webpackChunkName: "Leaderboards" */ "../views/PlayerLeaderboard.vue"
      )
  },
  {
    path: "/leaderboard/:seasonid/teams",
    name: "SeasonTeamBoard",
    component: () =>
      import(
        /* webpackChunkName: "Leaderboards" */ "../views/TeamLeaderboard.vue"
      )
  },
  {
    path: "/leaderboard/:seasonid/:teamid",
    name: "TeamsSeasonPlayerBoard",
    component: () =>
      import(
        /* webpackChunkName: "Leaderboards" */ "../views/PlayerLeaderboard.vue"
      )
  },
  {
    path: "/stats",
    name: "GlobalStats",
    component: () =>
      import(/* webpackChunkName: "Stats" */ "../views/GlobalStats.vue")
  },
  {
    path: "/stats/player/:steam_id",
    name: "PlayerStats",
    component: () =>
      import(/* webpackChunkName: "Stats" */ "../views/PlayerStats.vue")
  },
  {
    path: "/stats/player/:steam_id/maps",
    name: "PlayerMapStats",
    component: () =>
      import(/* webpackChunkName: "Stats" */ "../views/PlayerMapStats.vue")
  },
  {
    path: "/cast",
    name: "Cast",
    meta: { hideChrome: false },
    component: () =>
      import(/* webpackChunkName: "Cast" */ "../views/CastView.vue")
  },
  {
    path: "/admin/settings",
    name: "AdminSettings",
    component: () =>
      import(/* webpackChunkName: "Admin" */ "../views/AdminSettings.vue")
  },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: () =>
      import(/* webpackChunkName: "Admin" */ "../views/AdminUsers.vue")
  },
  {
    path: "/image-settings",
    name: "ImageSettings",
    component: () =>
      import(
        /* webpackChunkName: "ImageSettings" */ "../views/ImageSettings.vue"
      )
  },
  {
    path: "/player-images",
    name: "PlayerImageSettings",
    component: () =>
      import(
        /* webpackChunkName: "PlayerImages" */ "../views/PlayerImageSettings.vue"
      )
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
