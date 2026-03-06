<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon :to="`/season/${seasonId}/toornament`" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ seasonName }} — {{ $t("Toornament.ScheduleTitle") }}
        <v-spacer />
        <v-chip small color="primary">Toornament</v-chip>
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <!-- Stage filter -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="selectedStageId"
              :items="stageOptions"
              item-text="text"
              item-value="value"
              :label="$t('Toornament.FilterStage')"
              clearable
              dense
              outlined
              hide-details
            />
          </v-col>

          <!-- Round selector -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="selectedRound"
              :items="filteredRounds"
              item-text="label"
              item-value="id"
              :label="$t('Toornament.FilterRound')"
              clearable
              dense
              outlined
              hide-details
              return-object
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Round matches preview -->
      <template v-if="selectedRound">
        <v-divider />
        <v-card-text>
          <div class="text-subtitle-1 mb-3">
            <strong>{{ selectedRound.stage_name }}</strong> — {{ selectedRound.name }}
            <span class="grey--text ml-2">({{ roundMatches.length }} match{{ roundMatches.length > 1 ? 's' : '' }})</span>
          </div>

          <v-data-table
            :headers="[
              { text: '#', value: 'number', width: '50px' },
              { text: $t('Toornament.ColTeam1'), value: 'team1', sortable: false },
              { text: $t('Toornament.ColTeam2'), value: 'team2', sortable: false },
              { text: $t('Toornament.ColDate'), value: 'scheduled_datetime', sortable: false }
            ]"
            :items="roundMatches"
            :loading="loadingMatches"
            dense
            hide-default-footer
            :items-per-page="-1"
          >
            <template v-slot:item.team1="{ item }">
              {{ opponentName(item.opponents[0]) }}
            </template>
            <template v-slot:item.team2="{ item }">
              {{ opponentName(item.opponents[1]) }}
            </template>
            <template v-slot:item.scheduled_datetime="{ item }">
              <span class="grey--text">
                {{ item.scheduled_datetime ? new Date(item.scheduled_datetime).toLocaleString() : "—" }}
              </span>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider />

        <!-- Date/time picker -->
        <v-card-text>
          <div class="text-subtitle-2 mb-3">{{ $t("Toornament.ScheduleSetDate") }}</div>
          <v-row dense align="center">
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="scheduledDate"
                type="date"
                :label="$t('Toornament.ScheduleDate')"
                dense
                outlined
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="scheduledTime"
                type="time"
                :label="$t('Toornament.ScheduleTime')"
                dense
                outlined
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="auto">
              <v-btn
                color="primary"
                :loading="saving"
                :disabled="!scheduledDate || !scheduledTime || !roundMatches.length"
                @click="saveSchedule"
              >
                <v-icon left>mdi-content-save</v-icon>
                {{ $t("Toornament.ScheduleSave") }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </template>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "SeasonToornamentSchedule",
  data() {
    return {
      user: { id: -1, admin: false, super_admin: false },
      seasonName: "",
      seasonUserId: -1,
      stages: [],
      rounds: [],
      roundMatches: [],
      selectedStageId: null,
      selectedRound: null,
      scheduledDate: "",
      scheduledTime: "",
      loadingMatches: false,
      saving: false,
      snackbar: { show: false, text: "", color: "success" }
    };
  },
  computed: {
    seasonId() {
      return this.$route.params.id;
    },
    canEdit() {
      return (
        this.user.id !== -1 &&
        (this.user.id === this.seasonUserId || this.IsAnyAdmin(this.user))
      );
    },
    stageOptions() {
      return this.stages.map(s => ({ value: s.id, text: s.name }));
    },
    filteredRounds() {
      const list = this.selectedStageId
        ? this.rounds.filter(r => r.stage_id === this.selectedStageId)
        : this.rounds;
      return list.map(r => ({
        ...r,
        label: `${r.stage_name} — ${r.name}`
      }));
    }
  },
  watch: {
    selectedRound(val) {
      if (val) this.loadRoundMatches();
      else this.roundMatches = [];
    }
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const season = await this.GetSeasonInfo(this.seasonId);
    if (season) {
      this.seasonName = season.name;
      this.seasonUserId = season.user_id;
    }
    [this.stages, this.rounds] = await Promise.all([
      this.GetToornamentStages(this.seasonId),
      this.GetToornamentRounds(this.seasonId)
    ]);
  },
  methods: {
    async loadRoundMatches() {
      this.loadingMatches = true;
      this.roundMatches = await this.GetToornamentMatches(this.seasonId, {
        stage_id: this.selectedRound.stage_id
      });
      this.roundMatches = this.roundMatches.filter(
        m => m.round_id === this.selectedRound.id
      );
      this.loadingMatches = false;
    },
    async saveSchedule() {
      if (!this.scheduledDate || !this.scheduledTime || !this.selectedRound) return;
      this.saving = true;
      // Build ISO datetime with Europe/Paris offset (+01:00 or +02:00)
      const dt = new Date(`${this.scheduledDate}T${this.scheduledTime}:00`);
      const offset = -dt.getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const pad = n => String(Math.floor(Math.abs(n))).padStart(2, "0");
      const isoStr = `${this.scheduledDate}T${this.scheduledTime}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;

      const result = await this.ScheduleToornamentRound(
        this.seasonId,
        this.selectedRound.id,
        isoStr
      );
      this.saving = false;
      if (result?.message) {
        this.snackbar = { show: true, text: result.message, color: "success" };
        await this.loadRoundMatches();
      } else {
        this.snackbar = { show: true, text: this.$t("Toornament.ScheduleError"), color: "error" };
      }
    },
    opponentName(opp) {
      return opp?.participant ? opp.participant.name : this.$t("Toornament.TeamTBD");
    }
  }
};
</script>
