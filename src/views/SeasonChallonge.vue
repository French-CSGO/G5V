<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon :to="`/season/${seasonId}`" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ seasonName }} — {{ $t("Challonge.MatchesTitle") }}
        <v-spacer />
        <v-chip small color="primary">Challonge</v-chip>
      </v-card-title>

      <!-- Onglets par bracket -->
      <v-tabs v-model="activeTournament" background-color="transparent" class="px-4">
        <v-tab v-for="t in tournaments" :key="t.id">
          {{ t.label }}
        </v-tab>
      </v-tabs>
      <v-divider />

      <!-- Filtres -->
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filterState"
              :items="[
                { text: $t('Challonge.StateOpen'), value: 'open' },
                { text: $t('Challonge.StateComplete'), value: 'complete' }
              ]"
              :label="$t('Challonge.FilterState')"
              clearable
              dense
              outlined
              hide-details
              @change="loadMatches"
            />
          </v-col>
          <v-col cols="12" sm="auto">
            <v-switch
              v-model="filterCreatable"
              :label="$t('Challonge.FilterCreatable')"
              hide-details
              dense
              class="mt-1"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Contenu par bracket actif -->
      <div v-if="currentTournament">
        <v-card-text v-if="!loading && groupedByRound.length">
          <div
            v-for="group in groupedByRound"
            :key="group.round"
            class="mb-6"
          >
            <div class="d-flex align-center mb-2">
              <v-chip small color="secondary" class="mr-2 font-weight-bold">
                {{ $t("Challonge.Round") }} {{ group.round }}
              </v-chip>
              <v-spacer />
              <span class="caption grey--text">
                {{ group.matches.length }} {{ $t("Challonge.Matches") }}
              </span>
            </div>

            <v-data-table
              :headers="tableHeaders"
              :items="group.matches"
              dense
              hide-default-footer
              :items-per-page="-1"
              class="elevation-1"
            >
              <template v-slot:item.player1="{ item }">
                <span :class="{ 'grey--text': !item.player1 }">
                  {{ item.player1 ? item.player1.name : $t("Challonge.TeamTBD") }}
                </span>
              </template>
              <template v-slot:item.player2="{ item }">
                <span :class="{ 'grey--text': !item.player2 }">
                  {{ item.player2 ? item.player2.name : $t("Challonge.TeamTBD") }}
                </span>
              </template>
              <template v-slot:item.state="{ item }">
                <v-chip
                  x-small
                  :color="
                    item.state === 'complete'
                      ? 'success'
                      : item.state === 'open'
                      ? 'warning'
                      : 'default'
                  "
                >
                  {{ $t("Challonge.State_" + item.state) }}
                </v-chip>
              </template>
              <template v-slot:item.scheduled_time="{ item }">
                {{
                  item.scheduled_time
                    ? new Date(item.scheduled_time).toLocaleString()
                    : "—"
                }}
              </template>
              <template v-slot:item.actions="{ item }">
                <template v-if="item.g5_match_id">
                  <v-btn
                    x-small
                    color="success"
                    outlined
                    :to="`/match/${item.g5_match_id}`"
                  >
                    <v-icon left x-small>mdi-check-circle</v-icon>
                    {{ $t("Challonge.MatchCreated") }} #{{ item.g5_match_id }}
                  </v-btn>
                </template>
                <template v-else-if="canCreate">
                  <v-btn
                    v-if="
                      item.state === 'open' &&
                        item.player1 &&
                        item.player1.local_team &&
                        item.player2 &&
                        item.player2.local_team
                    "
                    x-small
                    color="primary"
                    @click="openCreate(item)"
                  >
                    <v-icon left x-small>mdi-plus</v-icon>
                    {{ $t("Challonge.CreateMatch") }}
                  </v-btn>
                  <v-tooltip v-else bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small color="grey" v-bind="attrs" v-on="on">
                        mdi-help-circle-outline
                      </v-icon>
                    </template>
                    <span>{{ $t("Challonge.TeamNotLinked") }}</span>
                  </v-tooltip>
                </template>
              </template>
            </v-data-table>
          </div>
        </v-card-text>

        <v-card-text v-else-if="loading">
          <v-progress-linear indeterminate />
        </v-card-text>

        <v-card-text v-else>
          <span class="grey--text">{{ $t("Challonge.NoMatches") }}</span>
        </v-card-text>
      </div>

      <v-card-text v-else-if="loadingTournaments">
        <v-progress-linear indeterminate />
      </v-card-text>

      <v-card-text v-else>
        <span class="grey--text">{{ $t("Challonge.NoBracket") }}</span>
      </v-card-text>
    </v-card>

    <ChallongeMatchForm v-model="showForm" :prefill="prefill" />
  </v-container>
</template>

<script>
import ChallongeMatchForm from "@/components/ChallongeMatchForm";
export default {
  name: "SeasonChallonge",
  components: { ChallongeMatchForm },
  data() {
    return {
      user: { id: -1, admin: false, super_admin: false },
      seasonName: "",
      seasonUserId: -1,
      tournaments: [],
      activeTournament: 0,
      allMatches: [],
      loading: false,
      loadingTournaments: false,
      filterState: null,
      filterCreatable: false,
      showForm: false,
      prefill: {},
    };
  },
  computed: {
    seasonId() {
      return this.$route.params.id;
    },
    canCreate() {
      return (
        this.user.id !== -1 &&
        (this.user.id === this.seasonUserId || this.IsAnyAdmin(this.user))
      );
    },
    currentTournament() {
      return this.tournaments[this.activeTournament] ?? null;
    },
    currentMatches() {
      if (!this.currentTournament) return [];
      return this.allMatches.filter(
        m => m.slug === this.currentTournament.challonge_slug
      );
    },
    filteredMatches() {
      let list = this.currentMatches;
      if (this.filterCreatable) {
        list = list.filter(
          m =>
            !m.g5_match_id &&
            m.state === "open" &&
            m.player1 &&
            m.player1.local_team &&
            m.player2 &&
            m.player2.local_team
        );
      }
      return list;
    },
    groupedByRound() {
      const byRound = new Map();
      for (const match of this.filteredMatches) {
        const key = match.round ?? 0;
        if (!byRound.has(key)) {
          byRound.set(key, { round: key, matches: [] });
        }
        byRound.get(key).matches.push(match);
      }
      return [...byRound.values()].sort((a, b) => a.round - b.round);
    },
    tableHeaders() {
      return [
        { text: "#", value: "suggested_play_order", width: "60px" },
        { text: this.$t("Challonge.ColPlayer1"), value: "player1", sortable: false },
        { text: this.$t("Challonge.ColPlayer2"), value: "player2", sortable: false },
        { text: this.$t("Challonge.ColState"), value: "state", sortable: false },
        { text: this.$t("Challonge.ColDate"), value: "scheduled_time" },
        { text: "", value: "actions", sortable: false, align: "end", width: "200px" }
      ];
    }
  },
  watch: {
    activeTournament(val) {
      this.pushQuery();
      this.loadMatches();
    },
    filterState() { this.pushQuery(); },
    filterCreatable() { this.pushQuery(); }
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const season = await this.GetSeasonInfo(this.seasonId);
    if (season) {
      this.seasonName = season.name;
      this.seasonUserId = season.user_id;
    }
    this.loadingTournaments = true;
    const t = await this.GetChallongeTournaments(this.seasonId);
    this.tournaments = Array.isArray(t) ? t : [];
    this.loadingTournaments = false;
    // Restore filters from URL query params
    const q = this.$route.query;
    if (q.state) this.filterState = q.state;
    if (q.creatable === "1") this.filterCreatable = true;
    if (q.tab !== undefined) {
      const idx = parseInt(q.tab);
      if (!isNaN(idx) && idx < this.tournaments.length) this.activeTournament = idx;
    }
    if (this.tournaments.length) {
      await this.loadMatches();
    }
  },
  methods: {
    pushQuery() {
      const query = {};
      if (this.filterState) query.state = this.filterState;
      if (this.filterCreatable) query.creatable = "1";
      if (this.activeTournament) query.tab = String(this.activeTournament);
      this.$router.replace({ query }).catch(() => {});
    },
    async loadMatches() {
      if (!this.currentTournament) return;
      this.loading = true;
      const filters = { tournament_id: this.currentTournament.id };
      if (this.filterState) filters.state = this.filterState;
      const result = await this.GetChallongeMatches(this.seasonId, filters);
      if (result && Array.isArray(result)) {
        // Remplace les matchs du bracket actif, garde les autres
        const slug = this.currentTournament.challonge_slug;
        this.allMatches = [
          ...this.allMatches.filter(m => m.slug !== slug),
          ...result
        ];
      }
      this.loading = false;
    },
    async openCreate(match) {
      const data = await this.GetChallongeMatchPrefill(this.seasonId, match.id);
      if (data) {
        this.prefill = data;
        this.showForm = true;
      }
    }
  }
};
</script>
