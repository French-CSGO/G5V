<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon :to="`/season/${seasonId}`" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ seasonName }} — {{ $t("Toornament.MatchesTitle") }}
        <v-spacer />
        <v-btn v-if="canCreate" small :to="`/season/${seasonId}/toornament/schedule`" class="mr-2">
          <v-icon left small>mdi-calendar-clock</v-icon>
          {{ $t("Toornament.ScheduleTitle") }}
        </v-btn>
        <v-chip small color="primary">Toornament</v-chip>
      </v-card-title>

      <!-- Filters -->
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
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

      <!-- Matches table -->
      <v-data-table
        :headers="[
          { text: '#', value: 'number', width: '60px' },
          { text: $t('Toornament.ColTeam1'), value: 'team1', sortable: false },
          { text: $t('Toornament.ColTeam2'), value: 'team2', sortable: false },
          { text: $t('Toornament.ColFormat'), value: 'format', sortable: false },
          { text: $t('Toornament.ColStatus'), value: 'status', sortable: false },
          { text: $t('Toornament.ColDate'), value: 'scheduled_datetime' },
          { text: '', value: 'actions', sortable: false, align: 'end' }
        ]"
        :items="filteredMatches"
        :loading="loading"
        dense
        hide-default-footer
        :items-per-page="-1"
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
            :color="item.status === 'completed' ? 'success' : item.status === 'running' ? 'warning' : 'default'"
          >
            {{ $t("Toornament.Status_" + item.status) }}
          </v-chip>
        </template>
        <template v-slot:item.scheduled_datetime="{ item }">
          {{ item.scheduled_datetime ? new Date(item.scheduled_datetime).toLocaleString() : "—" }}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            v-if="canCreate && item.status === 'pending' && item.opponents[0].local_team && item.opponents[1].local_team"
            x-small
            color="primary"
            @click="openCreate(item)"
          >
            <v-icon left x-small>mdi-plus</v-icon>
            {{ $t("Toornament.CreateMatch") }}
          </v-btn>
          <v-tooltip v-else-if="canCreate" bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon small color="grey" v-bind="attrs" v-on="on">mdi-help-circle-outline</v-icon>
            </template>
            <span>{{ $t("Toornament.TeamNotLinked") }}</span>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card>

    <ToornamentMatchForm
      v-model="showForm"
      :prefill="prefill"
    />
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
      seasonTeams: [],
      loading: false,
      filterTeam: null,
      filterStatus: null,
      filterStage: null,
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
    filteredMatches() {
      if (!this.filterCreatable) return this.matches;
      return this.matches.filter(m =>
        m.status === "pending" &&
        m.opponents[0] && m.opponents[0].local_team &&
        m.opponents[1] && m.opponents[1].local_team
      );
    }
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const season = await this.GetSeasonInfo(this.seasonId);
    if (season) {
      this.seasonName = season.name;
      this.seasonUserId = season.user_id;
    }
    this.seasonTeams = await this.GetSeasonTeams(this.seasonId);
    if (!Array.isArray(this.seasonTeams)) this.seasonTeams = [];
    this.stages = await this.GetToornamentStages(this.seasonId);
    await this.loadMatches();
  },
  methods: {
    async loadMatches() {
      this.loading = true;
      this.matches = await this.GetToornamentMatches(this.seasonId, {
        team_id: this.filterTeam || undefined,
        status: this.filterStatus || undefined,
        stage_id: this.filterStage || undefined
      });
      this.loading = false;
    },
    async openCreate(match) {
      const data = await this.GetToornamentMatchPrefill(this.seasonId, match.id);
      if (data) {
        this.prefill = data;
        this.showForm = true;
      }
    },
    matchFormat(match) {
      const fmt = match.settings && match.settings.format;
      if (!fmt) return "";
      if (fmt.type === "single_set") return "BO1";
      if (fmt.type === "best_of" && fmt.options && fmt.options.nb_match_sets) {
        return "BO" + fmt.options.nb_match_sets;
      }
      return fmt.type;
    },
    opponentName(opp) {
      return opp.participant ? opp.participant.name : this.$t("Toornament.TeamTBD");
    }
  }
};
</script>
