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
          <h2 class="white--text">
            <v-icon left color="teal">mdi-broadcast</v-icon>
            Cast / Observer
          </h2>
        </v-col>
        <v-col cols="auto">
          <v-chip :color="connected ? 'teal' : 'grey'" small dark>
            <v-icon left small>{{ connected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
            {{ connected ? 'Connecté' : 'Déconnecté' }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- Flux d'événements -->
      <v-card dark class="mb-4" color="grey darken-4">
        <v-card-title class="subtitle-1 py-2">
          <v-icon left small>mdi-timeline-clock</v-icon>
          Flux d'événements
        </v-card-title>
        <v-card-text class="pa-0">
          <div class="event-log" ref="eventLog">
            <div v-if="events.length === 0" class="text-center grey--text pa-4">
              Aucun événement
            </div>
            <v-list dense dark class="transparent py-0">
              <v-list-item
                v-for="(ev, i) in eventsReversed"
                :key="i"
                class="event-item py-1"
                :class="eventClass(ev.event_type)"
                dense
              >
                <v-list-item-icon class="my-auto mr-2">
                  <v-icon small :color="eventColor(ev.event_type)">{{ eventIcon(ev.event_type) }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="body-2">
                    <span class="font-weight-bold">{{ formatEventLabel(ev) }}</span>
                    <router-link
                      :to="'/match/' + ev.match_id"
                      class="ml-1 grey--text text--lighten-1"
                      style="font-size:11px"
                    >#{{ ev.match_id }}</router-link>
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action class="my-auto">
                  <span class="caption grey--text">{{ formatTime(ev.event_time) }}</span>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
      </v-card>

      <!-- Matchs en cours -->
      <v-card dark class="mb-4" color="grey darken-3">
        <v-card-title class="subtitle-1 py-2">
          <v-icon left small color="green">mdi-play-circle</v-icon>
          Matchs en cours
          <v-chip x-small class="ml-2" color="green">{{ activeMatches.length }}</v-chip>
        </v-card-title>
        <v-simple-table dark dense v-if="activeMatches.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>Équipe 1</th>
              <th class="text-center">Série</th>
              <th>Équipe 2</th>
              <th v-for="n in 3" :key="'ah'+n" class="text-center">Map {{ n }}</th>
              <th class="text-center">Connexion</th>
              <th class="text-center">Pages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="match in activeMatches" :key="match.id">
              <td>
                <router-link :to="'/match/' + match.id" class="teal--text font-weight-bold">
                  #{{ match.id }}
                </router-link>
              </td>
              <td class="font-weight-medium">{{ match.team1_string }}</td>
              <td class="text-center">
                <span class="font-weight-bold white--text">
                  {{ match.team1_series_score }} – {{ match.team2_series_score }}
                </span>
                <span class="grey--text caption ml-1">BO{{ match.max_maps }}</span>
              </td>
              <td class="font-weight-medium">{{ match.team2_string }}</td>
              <td v-for="n in 3" :key="'am'+n" class="text-center">
                <template v-if="match.maps[n-1]">
                  <div class="caption font-weight-bold">{{ mapShortName(match.maps[n-1].map) }}</div>
                  <div class="caption white--text">
                    {{ match.maps[n-1].team1_score }} – {{ match.maps[n-1].team2_score }}
                  </div>
                </template>
                <span v-else class="grey--text">—</span>
              </td>
              <td class="text-center">
                <div class="d-flex flex-column" style="gap:2px">
                  <v-btn
                    x-small dark color="blue darken-2"
                    :href="connectUrl(match, 'server')"
                    target="_blank"
                  >
                    <v-icon x-small left>mdi-server</v-icon>Serveur
                  </v-btn>
                  <v-btn
                    x-small dark color="indigo"
                    :href="connectUrl(match, 'tv90')"
                    target="_blank"
                  >
                    <v-icon x-small left>mdi-television-play</v-icon>TV 90s
                  </v-btn>
                  <v-btn
                    x-small dark color="deep-purple"
                    :href="connectUrl(match, 'tv0')"
                    target="_blank"
                  >
                    <v-icon x-small left>mdi-television-play</v-icon>TV 0s
                  </v-btn>
                </div>
              </td>
              <td class="text-center">
                <div class="d-flex flex-column" style="gap:2px">
                  <v-btn x-small dark color="teal" :to="'/match/' + match.id">
                    <v-icon x-small left>mdi-chart-bar</v-icon>Stats
                  </v-btn>
                  <v-btn x-small dark color="orange darken-2" :to="'/match/' + match.id + '/veto'">
                    <v-icon x-small left>mdi-map-marker-multiple</v-icon>Veto
                  </v-btn>
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
      <v-card dark color="grey darken-4">
        <v-card-title class="subtitle-1 py-2">
          <v-icon left small color="grey lighten-1">mdi-check-circle</v-icon>
          Matchs terminés
          <v-chip x-small class="ml-2" color="grey">{{ finishedMatches.length }}</v-chip>
        </v-card-title>
        <v-simple-table dark dense v-if="finishedMatches.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>Équipe 1</th>
              <th class="text-center">Série</th>
              <th>Équipe 2</th>
              <th v-for="n in 3" :key="'fh'+n" class="text-center">Map {{ n }}</th>
              <th class="text-center">Pages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="match in finishedMatches" :key="match.id">
              <td>
                <router-link :to="'/match/' + match.id" class="grey--text text--lighten-1 font-weight-bold">
                  #{{ match.id }}
                </router-link>
              </td>
              <td>{{ match.team1_string }}</td>
              <td class="text-center">
                <span class="font-weight-bold white--text">
                  {{ match.team1_series_score }} – {{ match.team2_series_score }}
                </span>
                <span class="grey--text caption ml-1">BO{{ match.max_maps }}</span>
              </td>
              <td>{{ match.team2_string }}</td>
              <td v-for="n in 3" :key="'fm'+n" class="text-center">
                <template v-if="match.maps[n-1]">
                  <div class="caption font-weight-bold">{{ mapShortName(match.maps[n-1].map) }}</div>
                  <div class="caption grey--text">
                    {{ match.maps[n-1].team1_score }} – {{ match.maps[n-1].team2_score }}
                  </div>
                </template>
                <span v-else class="grey--text">—</span>
              </td>
              <td class="text-center">
                <div class="d-flex" style="gap:4px; justify-content:center">
                  <v-btn x-small dark color="teal" :to="'/match/' + match.id">
                    <v-icon x-small left>mdi-chart-bar</v-icon>Stats
                  </v-btn>
                  <v-btn x-small dark color="orange darken-2" :to="'/match/' + match.id + '/veto'">
                    <v-icon x-small left>mdi-map-marker-multiple</v-icon>Veto
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
        <v-card-text v-else class="grey--text text-center">
          Aucun match terminé
        </v-card-text>
      </v-card>

    </template>
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
      sseClient: null
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
      return [...this.events].reverse();
    }
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
      this.sseClient.on("castData", data => {
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
      if (!ip) return "#";
      if (type === "server") {
        return `steam://connect/${ip}:${match.port}`;
      }
      if (!match.gotv_port) return "#";
      if (type === "tv90") {
        return `steam://connect/${ip}:${match.gotv_port}`;
      }
      return `steam://connect/${ip}:${match.gotv_port + 100}`;
    },

    mapShortName(map) {
      if (!map) return "?";
      return map.replace(/^de_/, "").replace(/^cs_/, "");
    },

    eventIcon(type) {
      const icons = {
        match_created: "mdi-sword-cross",
        map_end: "mdi-flag-checkered",
        match_end: "mdi-trophy"
      };
      return icons[type] || "mdi-circle";
    },

    eventColor(type) {
      const colors = {
        match_created: "blue lighten-2",
        map_end: "orange",
        match_end: "teal"
      };
      return colors[type] || "grey";
    },

    eventClass(type) {
      const classes = {
        match_created: "event-created",
        map_end: "event-map-end",
        match_end: "event-match-end"
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
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
  }
};
</script>

<style scoped>
.cast-view {
  background: #1a1a2e;
  min-height: 100vh;
}
.event-log {
  max-height: 220px;
  overflow-y: auto;
}
.event-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
