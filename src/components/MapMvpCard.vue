<template>
  <v-card class="mvp-card" elevation="4" :style="cardStyle">
    <!-- Header with map background -->
    <div class="mvp-map-header" :style="headerStyle">
      <div class="mvp-map-overlay pa-3">
        <!-- Map name + score -->
        <div class="d-flex justify-space-between align-center">
          <v-chip small color="rgba(0,0,0,0.7)" text-color="white" class="map-chip">
            <v-icon small left>mdi-map</v-icon>
            {{ mapDisplayName }}
          </v-chip>
          <v-chip
            v-if="mvpData.team1_score !== null && mvpData.team2_score !== null"
            small
            color="rgba(0,0,0,0.7)"
            text-color="white"
          >
            {{ matchData.team1_name }} {{ mvpData.team1_score }} - {{ mvpData.team2_score }} {{ matchData.team2_name }}
          </v-chip>
        </div>

        <!-- Team logos row -->
        <div class="d-flex justify-center align-center mt-2">
          <div class="team-logo-wrapper mr-3">
            <img
              v-if="matchData.team1_logo"
              :src="`${apiUrl}/static/img/logos/${matchData.team1_logo}.png`"
              class="team-logo"
              @error="onLogoError"
              :alt="matchData.team1_name"
            />
            <span v-else class="team-name-text">{{ matchData.team1_name }}</span>
          </div>
          <span class="vs-separator white--text font-weight-bold mx-2">VS</span>
          <div class="team-logo-wrapper ml-3">
            <img
              v-if="matchData.team2_logo"
              :src="`${apiUrl}/static/img/logos/${matchData.team2_logo}.png`"
              class="team-logo"
              @error="onLogoError"
              :alt="matchData.team2_name"
            />
            <span v-else class="team-name-text">{{ matchData.team2_name }}</span>
          </div>
        </div>

        <!-- MVP label -->
        <div class="text-center mt-1">
          <v-chip small color="primary" class="font-weight-bold">
            <v-icon small left>mdi-crown</v-icon>
            MVP
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Player section -->
    <v-card-text class="pt-3 pb-2">
      <v-row align="center" no-gutters>
        <!-- Player avatar -->
        <v-col cols="3">
          <v-avatar size="56" color="grey darken-3" class="elevation-3">
            <img
              v-if="!avatarError"
              :src="playerImageUrl"
              :alt="mvpData.name"
              @error="onAvatarError"
              style="object-fit: cover; width: 100%; height: 100%;"
            />
            <v-icon v-else large color="grey lighten-1">mdi-account</v-icon>
          </v-avatar>
        </v-col>

        <!-- Player info -->
        <v-col cols="9" class="pl-3">
          <div class="player-name font-weight-bold text-subtitle-1 text-truncate">
            <router-link :to="`/stats/player/${mvpData.steam_id}`" class="player-link">
              {{ mvpData.name }}
            </router-link>
          </div>
          <div class="team-text text-caption grey--text">
            {{ mvpData.team_name }}
          </div>
          <v-chip x-small color="primary" class="mt-1 font-weight-bold">
            <v-icon x-small left>mdi-star</v-icon>
            Rating {{ mvpData.rating }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- Main stats row -->
      <v-row class="stats-row mt-3" no-gutters>
        <v-col
          v-for="stat in mainStats"
          :key="stat.label"
          cols="2"
          class="text-center stat-col"
        >
          <div class="stat-value font-weight-bold">{{ stat.value }}</div>
          <div class="stat-label text-caption grey--text">{{ stat.label }}</div>
        </v-col>
      </v-row>

      <!-- Multi-kill chips -->
      <div class="mt-2 d-flex flex-wrap" v-if="hasMultikills">
        <v-chip
          v-if="mvpData.k2 > 0"
          x-small
          color="blue darken-1"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.k2 }}x 2K</v-chip>
        <v-chip
          v-if="mvpData.k3 > 0"
          x-small
          color="orange darken-1"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.k3 }}x 3K</v-chip>
        <v-chip
          v-if="mvpData.k4 > 0"
          x-small
          color="deep-orange darken-2"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.k4 }}x 4K</v-chip>
        <v-chip
          v-if="mvpData.k5 > 0"
          x-small
          color="red darken-3"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.k5 }}x ACE</v-chip>
        <v-chip
          v-if="mvpData.v1 > 0"
          x-small
          color="teal"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.v1 }}x 1v1</v-chip>
        <v-chip
          v-if="mvpData.v2 > 0"
          x-small
          color="teal darken-1"
          text-color="white"
          class="mr-1 mb-1"
        >{{ mvpData.v2 }}x 1v2</v-chip>
        <v-chip
          v-if="mvpData.v3 > 0 || mvpData.v4 > 0 || mvpData.v5 > 0"
          x-small
          color="purple darken-2"
          text-color="white"
          class="mr-1 mb-1"
        >Clutch Pro</v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "MapMvpCard",
  props: {
    mvpData: {
      type: Object,
      required: true
    },
    matchData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      avatarError: false,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api"
    };
  },
  computed: {
    mapDisplayName() {
      if (!this.mvpData.map_name) return "Map";
      const name = this.mvpData.map_name;
      if (name.startsWith("de_") || name.startsWith("cs_") || name.startsWith("ar_")) {
        return name.split("_").slice(1).join(" ").replace(/\b\w/g, c => c.toUpperCase());
      }
      return name;
    },
    mapImageUrl() {
      if (!this.mvpData.map_name) return "/img/maps/_unknown.jpg";
      return `/img/maps/${this.mvpData.map_name}.jpg`;
    },
    playerImageUrl() {
      return `${this.apiUrl}/static/img/players/${this.mvpData.steam_id}.png`;
    },
    headerStyle() {
      return {
        backgroundImage: `url(${this.mapImageUrl}), url(/img/maps/_unknown.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "110px",
        position: "relative"
      };
    },
    cardStyle() {
      return {
        overflow: "hidden",
        minWidth: "220px"
      };
    },
    mainStats() {
      return [
        { label: "K", value: this.mvpData.kills },
        { label: "D", value: this.mvpData.deaths },
        { label: "A", value: this.mvpData.assists },
        { label: "HS%", value: `${this.mvpData.hsp}%` },
        { label: "ADR", value: this.mvpData.adr },
        { label: "K/D", value: this.mvpData.kdr }
      ];
    },
    hasMultikills() {
      return (
        this.mvpData.k2 > 0 ||
        this.mvpData.k3 > 0 ||
        this.mvpData.k4 > 0 ||
        this.mvpData.k5 > 0 ||
        this.mvpData.v1 > 0 ||
        this.mvpData.v2 > 0 ||
        this.mvpData.v3 > 0 ||
        this.mvpData.v4 > 0 ||
        this.mvpData.v5 > 0
      );
    }
  },
  methods: {
    onAvatarError() {
      this.avatarError = true;
    },
    onLogoError(event) {
      event.target.style.display = "none";
    }
  }
};
</script>

<style scoped>
.mvp-map-overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.75) 100%
  );
  min-height: 110px;
}

.team-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8));
}

.team-name-text {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.vs-separator {
  font-size: 0.7rem;
  opacity: 0.85;
}

.map-chip {
  font-size: 0.7rem;
}

.player-link {
  text-decoration: none;
  color: inherit;
}

.player-link:hover {
  text-decoration: underline;
}

.stats-row {
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  padding-top: 8px;
}

.stat-col {
  border-right: 1px solid rgba(128, 128, 128, 0.15);
}

.stat-col:last-child {
  border-right: none;
}

.stat-value {
  font-size: 0.9rem;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.62rem;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
</style>
