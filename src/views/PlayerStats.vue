<template>
  <v-container fluid>
    <!-- Player Header -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon x-large class="mr-3">mdi-account-circle</v-icon>
        <span class="text-h5">{{ playerName }}</span>
        <a
          v-if="steamId"
          :href="`https://steamcommunity.com/profiles/${steamId}`"
          target="_blank"
          class="ml-2"
          style="text-decoration:none"
        >
          <v-icon color="primary">mdi-steam</v-icon>
        </a>
        <v-spacer />
        <v-btn text small :to="'/user/' + userId" v-if="userId > 0">
          <v-icon left>mdi-account</v-icon>
          {{ $t("GlobalStats.ProfilePage") }}
        </v-btn>
      </v-card-title>
      <v-card-text class="pb-0">
        <v-btn text small color="primary" :to="'/stats/player/' + steamId">
          <v-icon left small>mdi-chart-line</v-icon>
          {{ $t("GlobalStats.GlobalStats") }}
        </v-btn>
        <v-btn text small :to="'/stats/player/' + steamId + '/maps'">
          <v-icon left small>mdi-map</v-icon>
          {{ $t("GlobalStats.MapStats") }}
        </v-btn>
      </v-card-text>
    </v-card>

    <div v-if="isLoading">
      <v-skeleton-loader type="article" />
      <v-skeleton-loader type="article" class="mt-4" />
    </div>

    <v-alert v-else-if="stats.length === 0" type="info">
      {{ $t("PlayerStats.NoStatFound") }}
    </v-alert>

    <div v-else>
      <!-- Global Statistics -->
      <v-card class="mb-4">
        <v-card-title class="primary white--text">
          <v-icon left dark>mdi-chart-line</v-icon>
          {{ $t("GlobalStats.GlobalStats") }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-row>
            <v-col
              v-for="stat in globalStatCards"
              :key="stat.label"
              cols="6"
              sm="4"
              md="3"
              lg="2"
            >
              <v-card outlined class="text-center pa-2">
                <div
                  class="text-caption text--secondary text-uppercase font-weight-bold"
                >
                  {{ stat.label }}
                </div>
                <div class="text-h6 font-weight-bold mt-1">
                  {{ stat.value }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Multi-kill and Clutch stats -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-card height="100%">
            <v-card-title class="secondary white--text">
              <v-icon left dark>mdi-skull-crossbones</v-icon>
              {{ $t("GlobalStats.MultiKills") }}
            </v-card-title>
            <v-simple-table dense>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-center">{{ $t("PlayerStats.1kill") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.2kill") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.3kill") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.4kill") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.5kill") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center">{{ computedK1 }}</td>
                    <td class="text-center">{{ totalStat("k2") }}</td>
                    <td class="text-center">{{ totalStat("k3") }}</td>
                    <td class="text-center">{{ totalStat("k4") }}</td>
                    <td class="text-center font-weight-bold primary--text">
                      {{ totalStat("k5") }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card height="100%">
            <v-card-title class="secondary white--text">
              <v-icon left dark>mdi-trophy</v-icon>
              {{ $t("GlobalStats.Clutches") }}
            </v-card-title>
            <v-simple-table dense>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-center">{{ $t("PlayerStats.v1") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.v2") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.v3") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.v4") }}</th>
                    <th class="text-center">{{ $t("PlayerStats.v5") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-weight-bold">
                      {{ totalStat("v1") }}
                    </td>
                    <td class="text-center">{{ totalStat("v2") }}</td>
                    <td class="text-center">{{ totalStat("v3") }}</td>
                    <td class="text-center">{{ totalStat("v4") }}</td>
                    <td class="text-center">{{ totalStat("v5") }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Other statistics -->
      <v-card class="mb-4">
        <v-card-title class="grey darken-2 white--text">
          <v-icon left dark>mdi-information-outline</v-icon>
          {{ $t("GlobalStats.OtherStats") }}
        </v-card-title>
        <v-simple-table>
          <template v-slot:default>
            <tbody>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.BombPlants") }}
                </td>
                <td>{{ totalStat("bomb_plants") }}</td>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.BombDefuses") }}
                </td>
                <td>{{ totalStat("bomb_defuses") }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.KnifeKills") }}
                </td>
                <td>{{ totalStat("knife_kills") }}</td>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.UtilDamage") }}
                </td>
                <td>{{ totalStat("util_damage") }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.EnemyFlash") }}
                </td>
                <td>{{ totalStat("enemies_flashed") }}</td>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.FlashbangAssists") }}
                </td>
                <td>{{ totalStat("flashbang_assists") }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.Suicides") }}
                </td>
                <td>{{ totalStat("suicides") }}</td>
                <td class="font-weight-bold">{{ $t("PlayerStats.MVP") }}</td>
                <td>{{ totalStat("mvp") }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("PlayerStats.ContribScore") }}
                </td>
                <td>{{ totalStat("contribution_score") }}</td>
                <td class="font-weight-bold">
                  {{ $t("GlobalStats.FirstKillCT") }}
                </td>
                <td>{{ totalStat("firstkill_ct") }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  {{ $t("GlobalStats.FirstKillT") }}
                </td>
                <td>{{ totalStat("firstkill_t") }}</td>
                <td class="font-weight-bold">
                  {{ $t("GlobalStats.FirstDeathCT") }}
                </td>
                <td>{{ totalStat("firstdeath_ct") }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card>

      <!-- Recent Matches -->
      <v-card class="mb-4">
        <v-card-title class="grey darken-3 white--text">
          <v-icon left dark>mdi-history</v-icon>
          {{ $t("GlobalStats.RecentMatches") }}
        </v-card-title>
        <v-data-table
          :headers="matchHeaders"
          :items="recentMatches"
          :items-per-page="10"
          hide-default-footer
          class="elevation-0"
        >
          <template v-slot:item.match_id="{ item }">
            <router-link :to="'/match/' + item.match_id"
              >#{{ item.match_id }}</router-link
            >
          </template>
          <template v-slot:item.kd="{ item }">
            {{
              item.deaths > 0
                ? (item.kills / item.deaths).toFixed(2)
                : item.kills
            }}
          </template>
          <template v-slot:item.hsp="{ item }">
            {{
              item.kills > 0
                ? Math.round((item.headshot_kills / item.kills) * 100)
                : 0
            }}%
          </template>
          <template v-slot:item.adr="{ item }">
            {{
              item.roundsplayed > 0
                ? (item.damage / item.roundsplayed).toFixed(1)
                : 0
            }}
          </template>
        </v-data-table>
      </v-card>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "PlayerStats",
  data() {
    return {
      stats: [],
      isLoading: true,
      userId: -1
    };
  },
  async created() {
    const steamId = this.$route.params.steam_id;
    try {
      const res = await this.GetUserPlayerStats(steamId);
      if (Array.isArray(res)) {
        this.stats = res;
      }
      if (this.stats.length > 0) {
        const userData = await this.GetUserData(steamId);
        if (userData && userData.id > 0) {
          this.userId = userData.id;
        }
      }
    } catch {
      // ignored
    } finally {
      this.isLoading = false;
    }
  },
  computed: {
    steamId() {
      return this.$route.params.steam_id;
    },
    playerName() {
      if (this.stats.length > 0) return this.stats[0].name;
      return this.$route.params.steam_id;
    },
    totalKills() {
      return this.stats.reduce((sum, s) => sum + (s.kills || 0), 0);
    },
    totalDeaths() {
      return this.stats.reduce((sum, s) => sum + (s.deaths || 0), 0);
    },
    totalRounds() {
      return this.stats.reduce((sum, s) => sum + (s.roundsplayed || 0), 0);
    },
    totalDamage() {
      return this.stats.reduce((sum, s) => sum + (s.damage || 0), 0);
    },
    totalHSKills() {
      return this.stats.reduce((sum, s) => sum + (s.headshot_kills || 0), 0);
    },
    // k1 = total kills - 5×aces - 4×quads - 3×triples - 2×doubles
    computedK1() {
      const k2 = this.totalStat("k2");
      const k3 = this.totalStat("k3");
      const k4 = this.totalStat("k4");
      const k5 = this.totalStat("k5");
      return Math.max(0, this.totalKills - 5 * k5 - 4 * k4 - 3 * k3 - 2 * k2);
    },
    kd() {
      if (this.totalDeaths === 0) return this.totalKills.toFixed(2);
      return (this.totalKills / this.totalDeaths).toFixed(2);
    },
    hsp() {
      if (this.totalKills === 0) return "0.00";
      return ((this.totalHSKills / this.totalKills) * 100).toFixed(2);
    },
    adr() {
      if (this.totalRounds === 0) return "0.00";
      return (this.totalDamage / this.totalRounds).toFixed(2);
    },
    avgKast() {
      const kastVals = this.stats.filter(
        s => s.kast != null && s.roundsplayed > 0
      );
      if (kastVals.length === 0) return "N/A";
      const avg =
        kastVals.reduce((sum, s) => sum + parseFloat(s.kast), 0) /
        kastVals.length;
      return avg.toFixed(2) + "%";
    },
    avgRating() {
      if (this.stats.length === 0) return "0.00";
      const total = this.stats.reduce((sum, s) => {
        return (
          sum +
          parseFloat(
            this.GetRating(
              s.kills,
              s.roundsplayed,
              s.deaths,
              s.k1,
              s.k2,
              s.k3,
              s.k4,
              s.k5
            )
          )
        );
      }, 0);
      return (total / this.stats.length).toFixed(2);
    },
    globalStatCards() {
      return [
        { label: this.$t("GlobalStats.Maps"), value: this.stats.length },
        { label: this.$t("GlobalStats.Rounds"), value: this.totalRounds },
        { label: this.$t("PlayerStats.Kills"), value: this.totalKills },
        { label: this.$t("PlayerStats.Deaths"), value: this.totalDeaths },
        {
          label: this.$t("PlayerStats.Assists"),
          value: this.totalStat("assists")
        },
        { label: this.$t("PlayerStats.KDR"), value: this.kd },
        { label: this.$t("PlayerStats.Headshot") + "%", value: this.hsp + "%" },
        { label: this.$t("PlayerStats.ADR"), value: this.adr },
        { label: this.$t("PlayerStats.KAST"), value: this.avgKast },
        { label: this.$t("PlayerStats.Rating"), value: this.avgRating }
      ];
    },
    recentMatches() {
      return [...this.stats]
        .sort((a, b) => b.match_id - a.match_id)
        .slice(0, 10);
    },
    matchHeaders() {
      return [
        { text: "Match", value: "match_id", sortable: false },
        { text: this.$t("PlayerStats.Kills"), value: "kills" },
        { text: this.$t("PlayerStats.Deaths"), value: "deaths" },
        { text: this.$t("PlayerStats.Assists"), value: "assists" },
        { text: this.$t("PlayerStats.KDR"), value: "kd", sortable: false },
        {
          text: this.$t("PlayerStats.Headshot") + "%",
          value: "hsp",
          sortable: false
        },
        { text: this.$t("PlayerStats.ADR"), value: "adr", sortable: false }
      ];
    }
  },
  methods: {
    totalStat(field) {
      return this.stats.reduce((sum, s) => sum + (s[field] || 0), 0);
    }
  }
};
</script>
