<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <v-card>
      <v-card-title class="title font-weight-regular justify-space-between">
        <span>{{ currentTitle }}</span>
        <v-avatar
          color="primary lighten-2"
          class="subheading white--text"
          size="24"
          v-text="step"
        />
      </v-card-title>

      <v-window v-model="step">
        <!-- Step 1 : Vérification -->
        <v-window-item :value="1">
          <v-card-text>
            <v-row>
              <!-- Équipes verrouillées -->
              <v-col cols="6">
                <v-text-field
                  :value="
                    prefill.team1 ? prefill.team1.name : $t('Challonge.TeamTBD')
                  "
                  :label="$t('CreateMatch.FormTeam1')"
                  readonly
                  outlined
                  dense
                  prepend-icon="mdi-lock"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  :value="
                    prefill.team2 ? prefill.team2.name : $t('Challonge.TeamTBD')
                  "
                  :label="$t('CreateMatch.FormTeam2')"
                  readonly
                  outlined
                  dense
                  prepend-icon="mdi-lock"
                />
              </v-col>

              <!-- Saison verrouillée -->
              <v-col cols="12">
                <v-text-field
                  :value="prefill.season_name"
                  :label="$t('CreateMatch.SeasonLabel')"
                  readonly
                  outlined
                  dense
                  prepend-icon="mdi-lock"
                />
              </v-col>

              <!-- Serveur -->
              <v-col cols="12">
                <v-select
                  v-model="selectedServer"
                  :items="prefill.available_servers || []"
                  item-text="display_name"
                  item-value="id"
                  :label="$t('CreateMatch.ServerLabel')"
                  :rules="[(v) => !!v || $t('misc.Required')]"
                  outlined
                  dense
                  required
                >
                  <template v-slot:item="{ item }">
                    {{ item.display_name }} {{ item.flag }}
                  </template>
                </v-select>
              </v-col>

              <!-- Format -->
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">
                  <strong>{{ $t("CreateMatch.FormSeriesType") }}</strong>
                  <span v-if="prefill.max_maps" class="ml-2 caption grey--text"
                    >({{
                      $t("Toornament.SuggestedFormat", { n: prefill.max_maps })
                    }})</span
                  >
                </div>
                <v-radio-group v-model="formData.maps_to_win" row>
                  <v-radio :label="$t('CreateMatch.BestOf') + 1" :value="1" />
                  <v-radio :label="$t('CreateMatch.BestOf') + 2" :value="2" />
                  <v-radio :label="$t('CreateMatch.BestOf') + 3" :value="3" />
                  <v-radio :label="$t('CreateMatch.BestOf') + 5" :value="5" />
                </v-radio-group>
              </v-col>

              <!-- Info match Challonge -->
              <v-col cols="12">
                <v-alert type="info" text dense>
                  {{ $t("Challonge.MatchInfo") }} #{{
                    prefill.challonge_match
                      ? prefill.challonge_match.suggested_play_order ||
                        prefill.challonge_match.id
                      : ""
                  }}
                  <span
                    v-if="
                      prefill.challonge_match &&
                      prefill.challonge_match.scheduled_time
                    "
                  >
                    —
                    {{
                      new Date(
                        prefill.challonge_match.scheduled_time,
                      ).toLocaleString()
                    }}
                  </span>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- Step 2 : Spectateurs + CVARs -->
        <v-window-item :value="2">
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="formData.spectators"
                  :label="$t('CreateMatch.Spectators')"
                  :hint="$t('Team.AuthHint')"
                  multiple
                  chips
                  deletable-chips
                />
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="formData.cvars"
                  :label="$t('CreateMatch.FormCVARS')"
                  multiple
                  chips
                  deletable-chips
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>
      </v-window>

      <v-divider />
      <v-alert v-if="isLoading" type="info" text dense class="ma-3 mb-0">
        <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
        {{ $t("Challonge.ServerStarting") }}
      </v-alert>
      <v-card-actions>
        <v-btn text @click="close">{{ $t("misc.Cancel") }}</v-btn>
        <v-btn :disabled="step === 1" text @click="step--">{{
          $t("misc.Back")
        }}</v-btn>
        <v-spacer />
        <v-btn v-if="step < 2" color="primary" depressed @click="step++">
          {{ $t("misc.Next") }}
        </v-btn>
        <v-btn
          v-else
          color="primary"
          depressed
          :loading="isLoading"
          @click="createMatch"
        >
          {{ $t("misc.Create") }}
        </v-btn>
      </v-card-actions>

      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000">
        {{ snackbarMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn text v-bind="attrs" @click="snackbar = false">OK</v-btn>
        </template>
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ChallongeMatchForm",
  props: {
    value: Boolean,
    prefill: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      step: 1,
      selectedServer: null,
      formData: {
        maps_to_win: 1,
        spectators: [],
        cvars: [],
      },
      isLoading: false,
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "success",
    };
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    currentTitle() {
      return this.step === 1
        ? this.$t("Challonge.StepVerify")
        : this.$t("Challonge.StepDetails");
    },
  },
  watch: {
    value(val) {
      if (val) this.reset();
    },
    prefill(val) {
      if (val && val.max_maps) {
        this.formData.maps_to_win = val.max_maps;
      }
      if (val && val.season_cvars) {
        this.formData.cvars = this.buildCvarArray(val.season_cvars);
      }
      if (val && val.available_servers && val.available_servers.length > 0) {
        this.selectedServer = val.available_servers[0].id;
      }
    },
  },
  methods: {
    reset() {
      this.step = 1;
      this.isLoading = false;
      if (this.prefill.max_maps)
        this.formData.maps_to_win = this.prefill.max_maps;
      if (this.prefill.season_cvars) {
        this.formData.cvars = this.buildCvarArray(this.prefill.season_cvars);
      }
      if (
        this.prefill.available_servers &&
        this.prefill.available_servers.length > 0
      ) {
        this.selectedServer = this.prefill.available_servers[0].id;
      }
    },
    buildCvarArray(cvars) {
      if (!cvars || typeof cvars !== "object") return [];
      const reserved = [
        "min_players_to_ready",
        "min_spectators_to_ready",
        "players_per_team",
        "maps_to_win",
        "wingman",
        "skip_veto",
        "map_pool",
        "side_type",
        "spectators",
        "map_sides",
      ];
      return Object.entries(cvars)
        .filter(([k]) => !reserved.includes(k))
        .map(([k, v]) => `${k} ${v}`);
    },
    splitCvar(x) {
      const parts = x.split(" ");
      const key = parts[0].trim();
      parts.splice(0, 1);
      const val = parts.join(" ").trim();
      return { [key]: isNaN(val) ? val : parseInt(val) };
    },
    close() {
      this.dialog = false;
    },
    async createMatch() {
      if (!this.selectedServer) {
        this.snackbarMessage = this.$t("misc.Required");
        this.snackbarColor = "error";
        this.snackbar = true;
        return;
      }
      if (!this.prefill.team1 || !this.prefill.team2) {
        this.snackbarMessage = this.$t("Challonge.TeamTBD");
        this.snackbarColor = "error";
        this.snackbar = true;
        return;
      }
      this.isLoading = true;

      const cvars = Object.assign(
        {},
        ...this.formData.cvars.map(this.splitCvar),
      );
      const sc = this.prefill.season_cvars || {};
      const matchObj = [
        {
          server_id: this.selectedServer,
          team1_id: this.prefill.team1.id,
          team2_id: this.prefill.team2.id,
          season_id: this.prefill.season_id,
          challonge_id: this.prefill.challonge_match_id ?? null,
          challonge_slug: this.prefill.challonge_match?.slug ?? null,
          start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
          max_maps: this.formData.maps_to_win,
          spectator_auths: this.formData.spectators.length
            ? this.formData.spectators
            : null,
          match_cvars: Object.keys(cvars).length ? cvars : null,
          skip_veto: sc.skip_veto != null ? !!parseInt(sc.skip_veto) : false,
          veto_first: "team1",
          side_type: sc.side_type || "standard",
          veto_mappool: sc.map_pool || null,
          map_sides: sc.map_sides
            ? sc.map_sides.trim().split(/\s+/).join(",")
            : null,
          min_players_to_ready:
            sc.min_players_to_ready != null
              ? parseInt(sc.min_players_to_ready)
              : null,
          min_spectators_to_ready:
            sc.min_spectators_to_ready != null
              ? parseInt(sc.min_spectators_to_ready)
              : null,
          players_per_team:
            sc.players_per_team != null ? parseInt(sc.players_per_team) : null,
          wingman: sc.wingman != null ? !!parseInt(sc.wingman) : null,
        },
      ];

      try {
        const res = await this.InsertMatch(matchObj);
        if (res && res.id != null) {
          this.$emit("match-created", res.id);
          this.close();
          this.$router.push({ name: "Match", params: { id: res.id } });
        } else {
          this.snackbarMessage =
            res?.message || this.$t("Challonge.CreateError");
          this.snackbarColor = "error";
          this.snackbar = true;
        }
      } catch (err) {
        this.snackbarMessage = err.message || this.$t("Challonge.CreateError");
        this.snackbarColor = "error";
        this.snackbar = true;
      }
      this.isLoading = false;
    },
  },
};
</script>
