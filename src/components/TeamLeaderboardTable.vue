<template>
  <v-container class="TeamLeaderboard" fluid>
    <v-data-table
      item-key="index"
      class="elevation-1"
      :loading="isLoading"
      :loading-text="$t('misc.LoadText')"
      :headers="headers"
      :items="teams"
      :sort-by="'wins'"
      :sort-desc="['wins']"
      ref="TeamLeaderboardTable"
    >
      <template v-slot:top>
        <v-toolbar flat>
          {{ $t("Leaderboard.TTitle") }}
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn
          v-if="seasonid"
          x-small
          color="secondary"
          :href="GetTeamSeasonImageUrl(seasonid, item.id)"
          target="_blank"
        >
          <v-icon left x-small>mdi-image</v-icon>
          Image
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  name: "TeamLeaderboard",
  props: {
    seasonid: Number
  },
  data() {
    return {
      teams: [],
      isLoading: true
    };
  },
  created() {
    this.GetLeaderboard();
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t("Leaderboard.TName"),
          align: "start",
          sortable: true,
          value: "name",
          groupable: false
        },
        {
          text: this.$t("Leaderboard.TWin"),
          sortable: true,
          value: "wins",
          groupable: false
        },
        {
          text: this.$t("Leaderboard.TLosses"),
          value: "losses",
          groupable: false
        },
        {
          text: this.$t("Leaderboard.TDiff"),
          value: "rounddiff",
          groupable: false
        },
        {
          text: "",
          value: "actions",
          sortable: false,
          groupable: false
        }
      ];
    }
  },
  methods: {
    async GetLeaderboard() {
      try {
        let res;
        if (this.seasonid)
          res = await this.GetSeasonTeamLeaderboard(this.seasonid);
        else res = await this.GetTeamLeaderboard();
        if (typeof res == "string") return;
        this.teams = res;
      } catch (error) {
        console.log("Our error: " + error);
      } finally {
        this.isLoading = false;
      }
      return;
    }
  }
};
</script>
