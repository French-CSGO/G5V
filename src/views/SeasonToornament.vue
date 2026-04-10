<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon :to="`/season/${seasonId}`" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ seasonName }} — {{ $t("Toornament.MatchesTitle") }}
        <v-spacer />
        <v-btn
          v-if="canCreate"
          small
          :to="`/season/${seasonId}/toornament/schedule`"
          class="mr-2"
        >
          <v-icon left small>mdi-calendar-clock</v-icon>
          {{ $t("Toornament.ScheduleTitle") }}
        </v-btn>
        <v-chip small color="primary">Toornament</v-chip>
      </v-card-title>

      <!-- Filters -->
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterTeam"
              :items="seasonTeams"
              item-text="name"
              item-value="id"
              :label="$t('Toornament.FilterTeam')"
              clearable
              dense
              outlined
              hide-details
              @change="loadMatches"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterStatus"
              :items="[
                { text: $t('Toornament.StatusPending'), value: 'pending' },
                { text: $t('Toornament.StatusRunning'), value: 'running' },
                { text: $t('Toornament.StatusCompleted'), value: 'completed' }
              ]"
              :label="$t('Toornament.FilterStatus')"
              clearable
              dense
              outlined
              hide-details
              @change="loadMatches"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterStage"
              :items="stages"
              item-text="name"
              item-value="id"
              :label="$t('Toornament.FilterStage')"
              clearable
              dense
              outlined
              hide-details
              @change="onStageFilter"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterGroup"
              :items="availableGroups"
              item-text="name"
              item-value="id"
              :label="$t('Toornament.FilterGroup')"
              clearable
              dense
              outlined
              hide-details
              :disabled="!filterStage"
              @change="loadMatches"
            />
          </v-col>
          <v-col cols="12" sm="auto">
            <v-switch
              v-model="filterCreatable"
              :label="$t('Toornament.FilterCreatable')"
              hide-details
              dense
              class="mt-1"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Grouped by round -->
      <v-card-text v-if="!loading && groupedByRound.length">
        <div
          v-for="group in groupedByRound"
          :key="group.roundKey"
          class="mb-6"
        >
          <!-- Round header -->
          <div class="d-flex align-center mb-2">
            <v-chip small color="secondary" class="mr-2 font-weight-bold">
              {{ group.stageName }}
            </v-chip>
            <span v-if="group.groupName" class="caption grey--text mr-2">
              {{ group.groupName }} —
            </span>
            <span class="subtitle-2">{{ group.roundName }}</span>
            <v-spacer />
            <span class="caption grey--text">
              {{ group.matches.length }} {{ $t("Toornament.Matches") }}
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
            <template v-slot:item.team1="{ item }">
              <span :class="{ 'grey--text': !item.opponents[0].participant }">
                {{ opponentName(item.opponents[0]) }}
              </span>
            </template>
            <template v-slot:item.team2="{ item }">
              <span :class="{ 'grey--text': !item.opponents[1].participant }">
                {{ opponentName(item.opponents[1]) }}
              </span>
            </template>
            <template v-slot:item.format="{ item }">
              {{ matchFormat(item) }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                x-small
                :color="
                  item.status === 'completed'
                    ? 'success'
                    : item.status === 'running'
                    ? 'warning'
                    : 'default'
                "
              >
                {{ $t("Toornament.Status_" + item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.scheduled_datetime="{ item }">
              {{
                item.scheduled_datetime
                  ? new Date(item.scheduled_datetime).toLocaleString()
                  : "—"
              }}
            </template>
            <template v-slot:item.actions="{ item }">
              <!-- Already created -->
              <template v-if="item.g5_match_id">
                <v-btn
                  x-small
                  color="success"
                  outlined
                  :to="`/match/${item.g5_match_id}`"
                >
                  <v-icon left x-small>mdi-check-circle</v-icon>
                  {{ $t("Toornament.MatchCreated") }} #{{ item.g5_match_id }}
                </v-btn>
              </template>
              <!-- Create button -->
              <template v-else-if="canCreate">
                <v-btn
                  v-if="
                    item.status === 'pending' &&
                      item.opponents[0].local_team &&
                      item.opponents[1].local_team
                  "
                  x-small
                  color="primary"
                  @click="openCreate(item)"
                >
                  <v-icon left x-small>mdi-plus</v-icon>
                  {{ $t("Toornament.CreateMatch") }}
                </v-btn>
                <v-tooltip v-else bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="grey" v-bind="attrs" v-on="on">
                      mdi-help-circle-outline
                    </v-icon>
                  </template>
                  <span>{{ $t("Toornament.TeamNotLinked") }}</span>
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
        <span class="grey--text">{{ $t("Toornament.NoMatches") }}</span>
      </v-card-text>
    </v-card>

    <ToornamentMatchForm v-model="showForm" :prefill="prefill" />
  </v-container>
</template>

<script>
import ToornamentMatchForm from "@/components/ToornamentMatchForm";
export default {
  name: "SeasonToornament",
  components: { ToornamentMatchForm },
  data() {
    return {
      user: { id: -1, admin: false, super_admin: false },
      seasonName: "",
      seasonUserId: -1,
      matches: [],
      stages: [],
      groups: [],
      rounds: [],
      seasonTeams: [],
      loading: false,
      filterTeam: null,
      filterStatus: null,
      filterStage: null,
      filterGroup: null,
      filterCreatable: false,
      showForm: false,
      prefill: {}
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
    availableGroups() {
      if (!this.filterStage) return [];
      return this.groups.filter(g => g.stage_id === this.filterStage);
    },
    filteredMatches() {
      let list = this.matches;
      if (this.filterCreatable) {
        list = list.filter(
          m =>
            !m.g5_match_id &&
            m.status === "pending" &&
            m.opponents[0] &&
            m.opponents[0].local_team &&
            m.opponents[1] &&
            m.opponents[1].local_team
        );
      }
      return list;
    },
    groupedByRound() {
      const stageMap = new Map(this.stages.map(s => [s.id, s.name]));
      const groupMap = new Map(this.groups.map(g => [g.id, g.name]));
      const roundMap = new Map(this.rounds.map(r => [r.id, r]));

      const byRound = new Map();
      for (const match of this.filteredMatches) {
        const key = match.round_id || "none";
        if (!byRound.has(key)) {
          const round = roundMap.get(match.round_id);
          byRound.set(key, {
            roundKey: key,
            stageName: stageMap.get(match.stage_id) || match.stage_id || "",
            groupName: groupMap.get(match.group_id) || "",
            roundName: round ? round.name : (match.round_id || ""),
            roundNumber: round ? round.number : 0,
            stageId: match.stage_id,
            groupId: match.group_id,
            matches: []
          });
        }
        byRound.get(key).matches.push(match);
      }

      // Sort: by stage, then group, then round number
      return [...byRound.values()].sort((a, b) => {
        if (a.stageId !== b.stageId) return a.stageId > b.stageId ? 1 : -1;
        if (a.groupId !== b.groupId) return a.groupId > b.groupId ? 1 : -1;
        return a.roundNumber - b.roundNumber;
      });
    },
    tableHeaders() {
      return [
        { text: "#", value: "number", width: "50px" },
        { text: this.$t("Toornament.ColTeam1"), value: "team1", sortable: false },
        { text: this.$t("Toornament.ColTeam2"), value: "team2", sortable: false },
        { text: this.$t("Toornament.ColFormat"), value: "format", sortable: false },
        { text: this.$t("Toornament.ColStatus"), value: "status", sortable: false },
        { text: this.$t("Toornament.ColDate"), value: "scheduled_datetime" },
        { text: "", value: "actions", sortable: false, align: "end", width: "200px" }
      ];
    }
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const season = await this.GetSeasonInfo(this.seasonId);
    if (season) {
      this.seasonName = season.name;
      this.seasonUserId = season.user_id;
    }
    const [teams, stages, groups, rounds] = await Promise.all([
      this.GetSeasonTeams(this.seasonId),
      this.GetToornamentStages(this.seasonId),
      this.GetToornamentGroups(this.seasonId),
      this.GetToornamentRounds(this.seasonId)
    ]);
    this.seasonTeams = Array.isArray(teams) ? teams : [];
    this.stages = Array.isArray(stages) ? stages : [];
    this.groups = Array.isArray(groups) ? groups : [];
    this.rounds = Array.isArray(rounds) ? rounds : [];
    await this.loadMatches();
  },
  methods: {
    async loadMatches() {
      this.loading = true;
      this.matches = await this.GetToornamentMatches(this.seasonId, {
        team_id: this.filterTeam || undefined,
        status: this.filterStatus || undefined,
        stage_id: this.filterStage || undefined,
        group_id: this.filterGroup || undefined
      });
      if (!Array.isArray(this.matches)) this.matches = [];
      this.loading = false;
    },
    onStageFilter() {
      this.filterGroup = null;
      this.loadMatches();
    },
    async openCreate(match) {
      const data = await this.GetToornamentMatchPrefill(
        this.seasonId,
        match.id
      );
      if (data) {
        this.prefill = data;
        this.showForm = true;
      }
    },
    matchFormat(match) {
      let fmt = match.settings && match.settings.format;
      if (!fmt) {
        const stage = this.stages.find(s => s.id === match.stage_id);
        fmt =
          (stage && stage.match_settings && stage.match_settings.format) ||
          (stage &&
            stage.settings &&
            stage.settings.match_settings &&
            stage.settings.match_settings.format);
      }
      if (!fmt) return "";
      if (fmt.type === "single_set") return "BO1";
      if (fmt.type === "best_of" && fmt.options && fmt.options.nb_match_sets) {
        return "BO" + fmt.options.nb_match_sets;
      }
      return fmt.type;
    },
    opponentName(opp) {
      return opp.participant
        ? opp.participant.name
        : this.$t("Toornament.TeamTBD");
    }
  }
};
</script>
