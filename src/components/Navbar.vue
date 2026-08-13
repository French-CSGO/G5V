<template>
  <v-card>
    <v-system-bar color="primary darken-3"></v-system-bar>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ $t("Navbar.title") }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn rounded :href="apiUrl + '/auth/steam'" v-if="user.id == null">
        <img src="/img/login_small.png" v-if="user.id == null" />
      </v-btn>
      <v-tooltip v-if="user.id !== null" bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            rounded
            fab
            small
            color="grey darken-2"
            :href="apiUrl + '/logout'"
            v-if="user.id !== null"
          >
            <v-icon>mdi-logout-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Navbar.Logout") }}</span>
      </v-tooltip>
      <v-tooltip v-else bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            rounded
            fab
            small
            color="grey darken-2"
            @click="loginDialog = true"
            v-if="user.id === null"
          >
            <v-icon>mdi-login-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Login.title") }}</span>
      </v-tooltip>
      <v-btn
        :to="'/stats/player/' + user.steam_id"
        v-if="user.id !== null"
        fab
        small
      >
        <img :src="user.small_image" style="border-radius: 15px" />
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" temporary fixed app>
      <v-list nav>
        <v-list-item-group
          v-model="group"
          active-class="primary--text text--accent-4"
        >
          <v-list-item index="Home" :to="'/'">
            <v-list-item-title>{{ $t("Navbar.Home") }}</v-list-item-title>
          </v-list-item>

          <v-list-item index="Matches" :to="'/matches'">
            <v-list-item-title>{{ $t("Navbar.AllMatches") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="user.id != null" index="queue" :to="'/queue'">
            <v-list-item-title>Queue 5v5</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isAdmin" index="mymatches" :to="'/mymatches'">
            <v-list-item-title>{{ $t("Navbar.MyMatches") }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="isAdmin"
            index="match_create"
            :to="'/match/create'"
          >
            <v-list-item-title>{{
              $t("Navbar.CreateMatch")
            }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isSuperAdmin" :to="'/myteams'">
            <v-list-item-title>{{ $t("Navbar.MyTeams") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/teams'" exact>
            <v-list-item-title>{{ $t("Navbar.AllTeams") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isAdmin" :to="'/teams/create'" exact>
            <v-list-item-title>{{ $t("Navbar.CreateTeam") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isSuperAdmin" :to="'/myservers'">
            <v-list-item-title>{{ $t("Navbar.MyServers") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isSuperAdmin" @click="newDialog = true">
            <v-list-item-title>{{ $t("Navbar.AddServer") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/seasons'">
            <v-list-item-title>{{ $t("Navbar.AllSeasons") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isSuperAdmin" :to="'/myseasons'">
            <v-list-item-title>{{ $t("Navbar.MySeasons") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/stats'">
            <v-list-item-title>
              {{ $t("Navbar.PlayerLeader") }}
            </v-list-item-title>
          </v-list-item>
        </v-list-item-group>

        <v-list-item v-if="isCast || isAdmin" index="cast" :to="'/cast'">
          <v-list-item-title>Cast / Observer</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isCast || isAdmin"
          index="player_images"
          :to="'/cast/players'"
        >
          <v-list-item-title>{{ $t("Navbar.PlayerImages") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isCast || isAdmin"
          index="obs_slots"
          :to="'/cast/obs-slots'"
        >
          <v-list-item-title>{{ $t("Navbar.ObsSlots") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isCast || isAdmin"
          index="swiss_generator"
          :to="'/cast/swiss-generator'"
        >
          <v-list-item-title>{{
            $t("Navbar.SwissGenerator")
          }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isCast || isAdmin"
          index="round_robin_generator"
          :to="'/cast/round-robin-generator'"
        >
          <v-list-item-title>{{
            $t("Navbar.RoundRobinGenerator")
          }}</v-list-item-title>
        </v-list-item>

        <!-- Menu Administration (super_admin uniquement) -->
        <template v-if="user.super_admin == 1">
          <v-divider class="my-2" />
          <v-subheader>Administration</v-subheader>
          <v-list-item-group active-class="primary--text text--accent-4">
            <v-list-item :to="'/admin/users'">
              <v-list-item-icon
                ><v-icon small>mdi-account-group</v-icon></v-list-item-icon
              >
              <v-list-item-title>Utilisateurs</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/admin/settings'">
              <v-list-item-icon
                ><v-icon small>mdi-cog</v-icon></v-list-item-icon
              >
              <v-list-item-title>Paramètres</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/image-settings'">
              <v-list-item-icon
                ><v-icon small>mdi-image-edit</v-icon></v-list-item-icon
              >
              <v-list-item-title>{{
                $t("Navbar.ImageSettings")
              }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </template>
      </v-list>
    </v-navigation-drawer>
    <ServerDialog
      v-model="newDialog"
      :serverInfo="{}"
      :title="$t('MyServers.New')"
    />
    <LoginDialog v-model="loginDialog" :title="$t('Login.title')" />
  </v-card>
</template>
<script>
import ServerDialog from "./ServerDialog";
import LoginDialog from "./LoginDialog";
export default {
  name: "Navbar",
  props: {
    user: Object,
  },
  components: {
    ServerDialog,
    LoginDialog,
  },
  computed: {
    isAdmin() {
      return (
        Number(this.user.admin) === 1 || Number(this.user.super_admin) === 1
      );
    },
    isSuperAdmin() {
      return Number(this.user.super_admin) === 1;
    },
    isCast() {
      return Number(this.user.cast) === 1;
    },
  },
  data() {
    return {
      drawer: false,
      group: null,
      newDialog: false,
      loginDialog: false,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
    };
  },
  watch: {
    group() {
      this.drawer = false;
    },
  },
};
</script>
