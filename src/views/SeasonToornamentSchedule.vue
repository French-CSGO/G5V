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

      <v-card-text v-if="loading" class="text-center py-6">
        <v-progress-circular indeterminate color="primary" />
      </v-card-text>

      <!-- Stages accordion -->
      <v-expansion-panels v-else accordion flat>
        <v-expansion-panel v-for="stage in stagesWithRounds" :key="stage.id">
          <v-expansion-panel-header class="font-weight-bold">
            {{ stage.name }}
            <span class="grey--text ml-2 font-weight-regular">
              ({{ stage.rounds.length }} round{{
                stage.rounds.length > 1 ? "s" : ""
              }})
            </span>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <!-- Rounds accordion -->
            <v-expansion-panels accordion flat>
              <v-expansion-panel
                v-for="round in stage.rounds"
                :key="round.id"
                @change="onRoundToggle(round)"
              >
                <v-expansion-panel-header>
                  {{ round.name }}
                  <span class="grey--text ml-2">
                    ({{ (matchesByRound[round.id] || []).length }} matchs)
                  </span>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <div v-if="loadingRound[round.id]" class="text-center py-4">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="24"
                    />
                  </div>
                  <template v-else-if="matchesByRound[round.id]">
                    <!-- Bulk date/time editor -->
                    <v-card outlined class="mb-3">
                      <v-card-text class="pb-2">
                        <div class="text-caption grey--text mb-2">
                          {{ $t("Toornament.ScheduleSetDate") }}
                        </div>
                        <v-row dense align="center">
                          <v-col cols="6" sm="3">
                            <v-text-field
                              v-model="bulkDate[round.id]"
                              type="date"
                              :label="$t('Toornament.ScheduleDate')"
                              dense
                              outlined
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" sm="2">
                            <v-text-field
                              v-model="bulkTime[round.id]"
                              type="time"
                              :label="$t('Toornament.ScheduleTime')"
                              dense
                              outlined
                              hide-details
                            />
                          </v-col>
                          <v-col cols="12" sm="auto">
                            <v-btn
                              small
                              color="primary"
                              :loading="savingRound[round.id]"
                              :disabled="
                                !bulkDate[round.id] || !bulkTime[round.id]
                              "
                              @click="saveRound(round)"
                            >
                              <v-icon left small
                                >mdi-calendar-multiple-check</v-icon
                              >
                              {{ $t("Toornament.ScheduleSaveAll") }}
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>

                    <!-- Matches table -->
                    <v-simple-table dense>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{{ $t("Toornament.ColTeam1") }}</th>
                          <th>{{ $t("Toornament.ColTeam2") }}</th>
                          <th>{{ $t("Toornament.ColDate") }}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="match in matchesByRound[round.id]"
                          :key="match.id"
                        >
                          <td>{{ match.number }}</td>
                          <td>{{ opponentName(match.opponents[0]) }}</td>
                          <td>{{ opponentName(match.opponents[1]) }}</td>
                          <td>
                            <v-text-field
                              v-model="matchDatetime[match.id]"
                              type="datetime-local"
                              dense
                              outlined
                              hide-details
                              class="my-1"
                              style="min-width:200px"
                            />
                          </td>
                          <td>
                            <v-btn
                              x-small
                              color="primary"
                              :loading="savingMatch[match.id]"
                              :disabled="!matchDatetime[match.id]"
                              @click="saveMatch(match)"
                            >
                              <v-icon x-small>mdi-content-save</v-icon>
                            </v-btn>
                          </td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </template>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      top
    >
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
      loading: false,
      matchesByRound: {},
      loadingRound: {},
      bulkDate: {},
      bulkTime: {},
      savingRound: {},
      matchDatetime: {},
      savingMatch: {},
      snackbar: { show: false, text: "", color: "success" }
    };
  },
  computed: {
    seasonId() {
      return this.$route.params.id;
    },
    stagesWithRounds() {
      return this.stages.map(stage => ({
        ...stage,
        rounds: this.rounds.filter(r => r.stage_id === stage.id)
      }));
    }
  },
  async created() {
    this.loading = true;
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
    this.loading = false;
  },
  methods: {
    async onRoundToggle(round) {
      if (this.matchesByRound[round.id]) return;
      this.$set(this.loadingRound, round.id, true);
      const all = await this.GetToornamentMatches(this.seasonId, {
        stage_id: round.stage_id
      });
      const matches = all.filter(m => m.round_id === round.id);
      this.$set(this.matchesByRound, round.id, matches);
      for (const m of matches) {
        if (m.scheduled_datetime) {
          const dt = new Date(m.scheduled_datetime);
          const pad = n => String(n).padStart(2, "0");
          this.$set(
            this.matchDatetime,
            m.id,
            `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
              dt.getDate()
            )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
          );
        }
      }
      this.$set(this.loadingRound, round.id, false);
    },
    buildIso(date, time) {
      const dt = new Date(`${date}T${time}:00`);
      const offset = -dt.getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const pad = n => String(Math.floor(Math.abs(n))).padStart(2, "0");
      return `${date}T${time}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
    },
    async saveRound(round) {
      const date = this.bulkDate[round.id];
      const time = this.bulkTime[round.id];
      if (!date || !time) return;
      this.$set(this.savingRound, round.id, true);
      const iso = this.buildIso(date, time);
      const result = await this.ScheduleToornamentRound(
        this.seasonId,
        round.id,
        iso
      );
      if (result?.message) {
        this.snackbar = { show: true, text: result.message, color: "success" };
        // Refresh matches for this round
        this.$delete(this.matchesByRound, round.id);
        await this.onRoundToggle(round);
      } else {
        this.snackbar = {
          show: true,
          text: this.$t("Toornament.ScheduleError"),
          color: "error"
        };
      }
      this.$set(this.savingRound, round.id, false);
    },
    async saveMatch(match) {
      const raw = this.matchDatetime[match.id];
      if (!raw) return;
      this.$set(this.savingMatch, match.id, true);
      const [date, time] = raw.split("T");
      const iso = this.buildIso(date, time);
      const result = await this.ScheduleToornamentMatch(
        this.seasonId,
        match.id,
        iso
      );
      if (result?.message) {
        this.snackbar = { show: true, text: result.message, color: "success" };
      } else {
        this.snackbar = {
          show: true,
          text: this.$t("Toornament.ScheduleError"),
          color: "error"
        };
      }
      this.$set(this.savingMatch, match.id, false);
    },
    opponentName(opp) {
      return opp?.participant
        ? opp.participant.name
        : this.$t("Toornament.TeamTBD");
    }
  }
};
</script>
