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
          class="mr-1"
        >
          <v-icon left x-small>mdi-image</v-icon>
          Image
        </v-btn>
        <v-btn
          v-if="seasonid"
          x-small
          color="teal"
          :href="GetSeasonTeamRosterImageUrl(seasonid, item.id)"
          target="_blank"
        >
          <v-icon left x-small>mdi-account-group</v-icon>
          Roster
        </v-btn>
      </template>
    </v-data-table>

    <v-card v-if="seasonid && teams.length" outlined class="mt-3 pa-3">
      <div class="text-subtitle-2 mb-2">
        <v-icon left small>mdi-sword-cross</v-icon>
        Versus (deux équipes, stats de la saison)
      </div>
      <v-row dense align="center">
        <v-col cols="4">
          <v-select
            v-model="versusTeam1"
            :items="teams"
            item-text="name"
            item-value="id"
            label="Équipe 1"
            outlined
            dense
            hide-details
          />
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="versusTeam2"
            :items="teams"
            item-text="name"
            item-value="id"
            label="Équipe 2"
            outlined
            dense
            hide-details
          />
        </v-col>
        <v-col cols="auto">
          <v-btn
            small
            color="teal darken-2"
            :disabled="
              !versusTeam1 || !versusTeam2 || versusTeam1 === versusTeam2
            "
            :href="versusImageUrl"
            target="_blank"
          >
            <v-icon left small>mdi-image</v-icon>
            Générer l'image
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "TeamLeaderboard",
  props: {
    seasonid: Number,
  },
  data() {
    return {
      teams: [],
      isLoading: true,
      versusTeam1: null,
      versusTeam2: null,
    };
  },
  created() {
    this.GetLeaderboard();
  },
  computed: {
    versusImageUrl() {
      if (
        !this.seasonid ||
        !this.versusTeam1 ||
        !this.versusTeam2 ||
        this.versusTeam1 === this.versusTeam2
      )
        return "";
      return this.GetSeasonVersusImageUrl(
        this.seasonid,
        this.versusTeam1,
        this.versusTeam2,
      );
    },
    headers() {
      return [
        {
          text: this.$t("Leaderboard.TName"),
          align: "start",
          sortable: true,
          value: "name",
          groupable: false,
        },
        {
          text: this.$t("Leaderboard.TWin"),
          sortable: true,
          value: "wins",
          groupable: false,
        },
        {
          text: this.$t("Leaderboard.TLosses"),
          value: "losses",
          groupable: false,
        },
        {
          text: this.$t("Leaderboard.TDiff"),
          value: "rounddiff",
          groupable: false,
        },
        {
          text: "",
          value: "actions",
          sortable: false,
          groupable: false,
        },
      ];
    },
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
        console.error(error);
      } finally {
        this.isLoading = false;
      }
      return;
    },
  },
};
</script>
