<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="primary white--text py-3">
        <v-icon left dark>mdi-chart-bar</v-icon>
        {{ $t("GlobalStats.Title") }}
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          :label="$t('misc.Search')"
          single-line
          hide-details
          dark
          class="mt-0 pt-0"
          style="max-width:250px"
        />
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="players"
        :search="search"
        :loading="isLoading"
        :loading-text="$t('misc.LoadText')"
        sort-by="kills"
        :sort-desc="true"
        class="elevation-1"
      >
        <template v-slot:item.name="{ item }">
          <router-link :to="'/stats/player/' + item.steamId">
            {{ item.name }}
          </router-link>
        </template>
        <template v-slot:item.kd="{ item }">
          {{
            item.deaths > 0
              ? (item.kills / item.deaths).toFixed(2)
              : item.kills.toFixed(2)
          }}
        </template>
        <template v-slot:item.hsp="{ item }"> {{ item.hsp }}% </template>
        <template v-slot:item.adr="{ item }">
          {{
            item.trp > 0 ? (item.total_damage / item.trp).toFixed(2) : "0.00"
          }}
        </template>
        <template v-slot:item.average_rating="{ item }">
          <strong>{{ item.average_rating }}</strong>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "GlobalStats",
  data() {
    return {
      players: [],
      search: "",
      isLoading: true
    };
  },
  async created() {
    try {
      const res = await this.GetTotalPlayerLeaderboard();
      if (Array.isArray(res)) {
        this.players = res;
      }
    } catch {
      // ignored
    } finally {
      this.isLoading = false;
    }
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t("PlayerStats.User"),
          value: "name",
          sortable: true
        },
        {
          text: this.$t("GlobalStats.Maps"),
          value: "total_maps",
          sortable: true
        },
        {
          text: this.$t("PlayerStats.Kills"),
          value: "kills",
          sortable: true
        },
        {
          text: this.$t("PlayerStats.Deaths"),
          value: "deaths",
          sortable: true
        },
        {
          text: this.$t("PlayerStats.Assists"),
          value: "assists",
          sortable: true
        },
        {
          text: this.$t("PlayerStats.KDR"),
          value: "kd",
          sortable: false
        },
        {
          text: this.$t("PlayerStats.Headshot") + "%",
          value: "hsp",
          sortable: true
        },
        {
          text: this.$t("PlayerStats.ADR"),
          value: "adr",
          sortable: false
        },
        {
          text: this.$t("PlayerStats.Rating"),
          value: "average_rating",
          sortable: true
        }
      ];
    }
  }
};
</script>
