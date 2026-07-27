<template>
  <v-container fluid class="cast-view pa-3">
    <!-- Accès refusé -->
    <v-alert v-if="!loadingUser && !hasAccess" type="error" class="mb-4">
      Accès réservé aux utilisateurs avec le rôle Cast ou Admin.
    </v-alert>

    <template v-if="!loadingUser && hasAccess">
      <!-- En-tête -->
      <v-row class="mb-2" align="center">
        <v-col>
          <h2>
            <v-icon left color="teal">mdi-broadcast</v-icon>
            Cast / Observer
          </h2>
        </v-col>
        <v-col cols="auto">
          <v-chip :color="connected ? 'teal' : 'grey'" small dark>
            <v-icon left small>{{
              connected ? "mdi-wifi" : "mdi-wifi-off"
            }}</v-icon>
            {{ connected ? "Connecté" : "Déconnecté" }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- Layout principal : tableaux gauche (8/12) + flux droite (4/12) -->
      <v-row no-gutters class="layout-row">
        <!-- Colonne gauche : matchs -->
        <v-col cols="8" class="pr-2 tables-col">
          <!-- Matchs en cours -->
          <v-card class="mb-3">
            <v-card-title class="subtitle-1 py-2 primary white--text">
              <v-icon left small dark>mdi-play-circle</v-icon>
              Matchs en cours
              <v-chip x-small class="ml-2" color="green" dark>{{
                activeMatches.length
              }}</v-chip>
            </v-card-title>
            <v-simple-table dense v-if="activeMatches.length">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Équipe 1</th>
                  <th class="text-center">Série</th>
                  <th>Équipe 2</th>
                  <th v-for="n in 3" :key="'ah' + n" class="text-center">
                    Map {{ n }}
                  </th>
                  <th class="text-center">Connexion</th>
                  <th class="text-center">Pages</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in activeMatches" :key="match.id">
                  <td>
                    <router-link
                      :to="'/match/' + match.id"
                      class="teal--text font-weight-bold"
                    >
                      #{{ match.id }}
                    </router-link>
                  </td>
                  <td class="font-weight-medium">{{ match.team1_string }}</td>
                  <td class="text-center">
                    <span class="font-weight-bold">
                      {{ match.team1_series_score }} –
                      {{ match.team2_series_score }}
                    </span>
                    <span class="grey--text caption ml-1"
                      >BO{{ match.max_maps }}</span
                    >
                  </td>
                  <td class="font-weight-medium">{{ match.team2_string }}</td>
                  <td v-for="n in 3" :key="'am' + n" class="text-center">
                    <template v-if="match.maps[n - 1]">
                      <div class="caption font-weight-bold">
                        {{ mapShortName(match.maps[n - 1].map) }}
                      </div>
                      <div
                        class="caption"
                        :class="match.maps[n - 1].started ? '' : 'grey--text'"
                      >
                        {{
                          match.maps[n - 1].started
                            ? match.maps[n - 1].team1_score +
                              " – " +
                              match.maps[n - 1].team2_score
                            : "– –"
                        }}
                      </div>
                    </template>
                    <span v-else class="grey--text">—</span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex flex-column" style="gap: 2px">
                      <v-btn
                        x-small
                        dark
                        color="blue darken-2"
                        :href="connectUrl(match, 'server')"
                        target="_blank"
                      >
                        <v-icon x-small left>mdi-server</v-icon>Serveur
                      </v-btn>
                      <v-btn
                        x-small
                        dark
                        color="indigo"
                        :href="connectUrl(match, 'tv90')"
                        target="_blank"
                      >
                        <v-icon x-small left>mdi-television-play</v-icon>TV 90s
                      </v-btn>
                      <v-btn
                        x-small
                        dark
                        color="deep-purple"
                        @click="copyConnectText(match)"
                      >
                        <v-icon x-small left>mdi-content-copy</v-icon>TV 0s
                      </v-btn>
                    </div>
                  </td>
                  <td class="text-center py-2">
                    <div class="d-flex flex-column" style="gap: 5px">
                      <div
                        v-for="(map, i) in match.maps"
                        :key="'img-a-' + match.id + '-' + i"
                        class="d-flex"
                        style="gap: 3px"
                      >
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="
                            '/api/image/match/' +
                            match.id +
                            '/map/' +
                            (map.map_number + 1)
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-chart-bar</v-icon>Map
                          {{ map.map_number + 1 }}
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="amber darken-2"
                          :href="
                            '/api/image/match/' +
                            match.id +
                            '/map/' +
                            (map.map_number + 1) +
                            '/mvp'
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-star</v-icon>MVP
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="
                            GetTeamMatchImageUrl(
                              match.id,
                              1,
                              map.map_number + 1,
                            )
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Éq. 1
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="
                            GetTeamMatchImageUrl(
                              match.id,
                              2,
                              map.map_number + 1,
                            )
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Éq. 2
                        </v-btn>
                      </div>
                      <div class="d-flex" style="gap: 3px">
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="'/api/image/match/' + match.id"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-chart-bar</v-icon>Stats Match
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="warning"
                          :href="'/api/image/match/' + match.id + '/mvp'"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-star-circle</v-icon>MVP Match
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="GetTeamMatchImageUrl(match.id, 1)"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Stats
                          Éq. 1
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="GetTeamMatchImageUrl(match.id, 2)"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Stats
                          Éq. 2
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="orange darken-2"
                          :to="'/match/' + match.id + '/veto'"
                        >
                          <v-icon x-small left>mdi-map-marker-multiple</v-icon
                          >Veto
                        </v-btn>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-card-text v-else class="grey--text text-center">
              Aucun match en cours
            </v-card-text>
          </v-card>

          <!-- Matchs terminés -->
          <v-card>
            <v-card-title class="subtitle-1 py-2">
              <v-icon left small>mdi-check-circle</v-icon>
              Matchs terminés
              <v-chip x-small class="ml-2">{{ finishedMatches.length }}</v-chip>
            </v-card-title>
            <v-simple-table dense v-if="finishedMatches.length">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Équipe 1</th>
                  <th class="text-center">Série</th>
                  <th>Équipe 2</th>
                  <th v-for="n in 3" :key="'fh' + n" class="text-center">
                    Map {{ n }}
                  </th>
                  <th class="text-center">Pages</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in finishedMatches" :key="match.id">
                  <td>
                    <router-link
                      :to="'/match/' + match.id"
                      class="grey--text text--lighten-1 font-weight-bold"
                    >
                      #{{ match.id }}
                    </router-link>
                  </td>
                  <td>{{ match.team1_string }}</td>
                  <td class="text-center">
                    <span class="font-weight-bold">
                      {{ match.team1_series_score }} –
                      {{ match.team2_series_score }}
                    </span>
                    <span class="grey--text caption ml-1"
                      >BO{{ match.max_maps }}</span
                    >
                  </td>
                  <td>{{ match.team2_string }}</td>
                  <td v-for="n in 3" :key="'fm' + n" class="text-center">
                    <template v-if="match.maps[n - 1]">
                      <div class="caption font-weight-bold">
                        {{ mapShortName(match.maps[n - 1].map) }}
                      </div>
                      <div class="caption grey--text">
                        {{ match.maps[n - 1].team1_score }} –
                        {{ match.maps[n - 1].team2_score }}
                      </div>
                    </template>
                    <span v-else class="grey--text">—</span>
                  </td>
                  <td class="text-center py-2">
                    <div
                      class="d-flex flex-column"
                      style="gap: 5px; align-items: center"
                    >
                      <div
                        v-for="(map, i) in match.maps"
                        :key="'img-f-' + match.id + '-' + i"
                        class="d-flex"
                        style="gap: 3px"
                      >
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="
                            '/api/image/match/' +
                            match.id +
                            '/map/' +
                            (map.map_number + 1)
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-chart-bar</v-icon>Map
                          {{ map.map_number + 1 }}
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="amber darken-2"
                          :href="
                            '/api/image/match/' +
                            match.id +
                            '/map/' +
                            (map.map_number + 1) +
                            '/mvp'
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-star</v-icon>MVP
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="
                            GetTeamMatchImageUrl(
                              match.id,
                              1,
                              map.map_number + 1,
                            )
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Éq. 1
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="
                            GetTeamMatchImageUrl(
                              match.id,
                              2,
                              map.map_number + 1,
                            )
                          "
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Éq. 2
                        </v-btn>
                      </div>
                      <div class="d-flex" style="gap: 3px">
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="'/api/image/match/' + match.id"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-chart-bar</v-icon>Stats Match
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="warning"
                          :href="'/api/image/match/' + match.id + '/mvp'"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-star-circle</v-icon>MVP Match
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal"
                          :href="GetTeamMatchImageUrl(match.id, 1)"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Stats
                          Éq. 1
                        </v-btn>
                        <v-btn
                          x-small
                          dark
                          color="teal darken-2"
                          :href="GetTeamMatchImageUrl(match.id, 2)"
                          target="_blank"
                        >
                          <v-icon x-small left>mdi-account-group</v-icon>Stats
                          Éq. 2
                        </v-btn>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-card-text v-else class="grey--text text-center">
              Aucun match terminé
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Colonne droite : flux d'événements (1/3) -->
        <v-col cols="4" class="event-col">
          <v-card class="event-sidebar">
            <v-card-title class="subtitle-1 py-2">
              <v-icon left small>mdi-timeline-clock</v-icon>
              Flux d'événements
            </v-card-title>
            <v-divider />
            <div class="event-log" ref="eventLog">
              <div
                v-if="events.length === 0"
                class="text-center grey--text pa-4"
              >
                Aucun événement
              </div>
              <v-list dense class="transparent py-0">
                <v-list-item
                  v-for="(ev, i) in eventsReversed"
                  :key="i"
                  class="event-item py-1"
                  :class="eventClass(ev.event_type)"
                  dense
                >
                  <v-list-item-icon class="my-auto mr-2">
                    <v-icon small :color="eventColor(ev.event_type)">{{
                      eventIcon(ev.event_type)
                    }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title
                      class="body-2"
                      style="white-space: normal; word-break: break-word"
                    >
                      {{ formatEventLabel(ev) }}
                      <router-link
                        :to="'/match/' + ev.match_id"
                        class="ml-1 grey--text text--lighten-1"
                        style="font-size: 11px"
                        >#{{ ev.match_id }}</router-link
                      >
                    </v-list-item-title>
                    <v-list-item-subtitle class="caption grey--text">
                      {{ formatTime(ev.event_time) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-snackbar v-model="copySnackbar" :color="copySnackbarColor" timeout="3000">
      {{ copyMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "CastView",
  sse: { cleanup: true },
  data() {
    return {
      user: { id: null, admin: 0, super_admin: 0, cast: 0 },
      loadingUser: true,
      connected: false,
      events: [],
      activeMatches: [],
      finishedMatches: [],
      sseClient: null,
      copySnackbar: false,
      copyMessage: "",
      copySnackbarColor: "success",
    };
  },
  computed: {
    hasAccess() {
      return (
        Number(this.user.cast) === 1 ||
        Number(this.user.admin) === 1 ||
        Number(this.user.super_admin) === 1
      );
    },
    eventsReversed() {
      return this.events;
    },
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    this.loadingUser = false;
    if (this.hasAccess) {
      await this.connectSSE();
    }
  },
  beforeDestroy() {
    if (this.sseClient) {
      this.sseClient.disconnect();
    }
  },
  methods: {
    async connectSSE() {
      this.sseClient = await this.GetCastStream();
      if (!this.sseClient) return;
      await this.sseClient.connect();
      this.connected = true;
      this.sseClient.on("castData", (data) => {
        this.events = data.events || [];
        this.activeMatches = data.activeMatches || [];
        this.finishedMatches = data.finishedMatches || [];
      });
      this.sseClient.on("error", () => {
        this.connected = false;
      });
    },

    connectUrl(match, type) {
      const ip = match.ip_cast || match.ip_string;
      const steamId = this.user.steam_id;
      if (!ip || !steamId) return "#";
      const base = `steam://rungame/730/${steamId}/`;
      if (type === "server") {
        return `${base}+connect%20${ip}:${match.port}`;
      }
      if (!match.gotv_port) return "#";
      return `${base}+connect%20${ip}:${match.gotv_port}`;
    },

    gotvConnectText(match) {
      const ip = match.ip_cast || match.ip_string;
      if (!ip || !match.gotv_port) return "";
      return `connect ${ip}:${match.gotv_port + 100}; password croissant`;
    },

    legacyCopyToClipboard(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const succeeded = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!succeeded) throw new Error("execCommand copy failed");
    },

    async copyConnectText(match) {
      const text = this.gotvConnectText(match);
      if (!text) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          this.legacyCopyToClipboard(text);
        }
        this.copyMessage = "Commande copiée : " + text;
        this.copySnackbarColor = "success";
      } catch (error) {
        void error;
        this.copyMessage = "Échec de la copie";
        this.copySnackbarColor = "error";
      }
      this.copySnackbar = true;
    },

    mapShortName(map) {
      if (!map) return "?";
      return map.replace(/^de_/, "").replace(/^cs_/, "");
    },

    eventIcon(type) {
      const icons = {
        match_created: "mdi-sword-cross",
        map_end: "mdi-flag-checkered",
        match_end: "mdi-trophy",
      };
      return icons[type] || "mdi-circle";
    },

    eventColor(type) {
      const colors = {
        match_created: "blue lighten-2",
        map_end: "orange",
        match_end: "teal",
      };
      return colors[type] || "grey";
    },

    eventClass(type) {
      const classes = {
        match_created: "event-created",
        map_end: "event-map-end",
        match_end: "event-match-end",
      };
      return classes[type] || "";
    },

    formatEventLabel(ev) {
      if (ev.event_type === "match_created") {
        return `Match #${ev.match_id} créé : ${ev.team1} vs ${ev.team2}`;
      }
      if (ev.event_type === "map_end") {
        const map = this.mapShortName(ev.map_name);
        return `${map} terminée : ${ev.team1} ${ev.team1_score} – ${ev.team2_score} ${ev.team2}`;
      }
      if (ev.event_type === "match_end") {
        return `Match terminé : ${ev.team1} ${ev.team1_series} – ${ev.team2_series} ${ev.team2}`;
      }
      return ev.event_type;
    },

    formatTime(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      if (isNaN(d)) return ts;
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.layout-row {
  align-items: flex-start;
}
.tables-col {
  min-width: 0;
}
.event-col {
  position: sticky;
  top: 64px;
  align-self: flex-start;
}
.event-sidebar {
  max-height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
}
.event-log {
  flex: 1;
  overflow-y: auto;
}
.event-item {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
.event-created {
  border-left: 3px solid #42a5f5;
}
.event-map-end {
  border-left: 3px solid #ffa726;
}
.event-match-end {
  border-left: 3px solid #26a69a;
}
</style>
