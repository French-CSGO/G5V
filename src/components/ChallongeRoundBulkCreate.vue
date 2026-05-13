<template>
  <v-dialog v-model="dialog" max-width="820px" persistent>
    <v-card>
      <v-card-title class="subtitle-1 font-weight-bold">
        <v-icon left>mdi-plus-box-multiple</v-icon>
        Créer les matchs — Round {{ round }}
      </v-card-title>
      <v-divider />

      <v-card-text class="pt-4">
        <!-- Format global -->
        <div class="mb-3">
          <span class="caption text--secondary">Format pour tous les matchs</span>
          <v-btn-toggle v-model="globalFormat" mandatory dense class="ml-3">
            <v-btn :value="1" small>BO1</v-btn>
            <v-btn :value="3" small>BO3</v-btn>
            <v-btn :value="5" small>BO5</v-btn>
          </v-btn-toggle>
        </div>

        <!-- Table des matchs -->
        <v-simple-table dense>
          <thead>
            <tr>
              <th style="width:30px">#</th>
              <th>Équipe 1</th>
              <th>Équipe 2</th>
              <th style="width:280px">Serveur</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.challonge_id"
              :class="row.server_id ? '' : 'grey--text'"
            >
              <td class="caption">{{ row.suggested_play_order || '—' }}</td>
              <td>{{ row.team1_name }}</td>
              <td>{{ row.team2_name }}</td>
              <td>
                <v-select
                  v-model="row.server_id"
                  :items="serverItems"
                  item-text="display_name"
                  item-value="id"
                  dense
                  outlined
                  hide-details
                  clearable
                  placeholder="(ne sera pas créé)"
                  class="my-1"
                  style="font-size:12px"
                />
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <!-- Résumé -->
        <div class="mt-3 caption">
          <v-icon small :color="createCount > 0 ? 'success' : 'grey'">mdi-information-outline</v-icon>
          <span class="ml-1">
            <strong>{{ createCount }}</strong> match{{ createCount !== 1 ? 's' : '' }} sera{{ createCount !== 1 ? 'ont' : '' }} créé{{ createCount !== 1 ? 's' : '' }}
            <span v-if="skipCount" class="grey--text ml-1">({{ skipCount }} ignoré{{ skipCount !== 1 ? 's' : '' }} — pas de serveur)</span>
          </span>
        </div>

        <!-- Progression -->
        <v-alert v-if="progress.total > 0" type="info" text dense class="mt-3 mb-0">
          <v-progress-linear
            :value="(progress.done / progress.total) * 100"
            height="6"
            rounded
            class="mb-1"
          />
          {{ progress.done }} / {{ progress.total }}
          <span v-if="progress.errors.length" class="ml-2 error--text">
            — {{ progress.errors.length }} erreur(s)
          </span>
        </v-alert>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-btn text :disabled="isLoading" @click="close">Annuler</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          depressed
          :disabled="createCount === 0"
          :loading="isLoading"
          @click="createAll"
        >
          <v-icon left small>mdi-plus</v-icon>
          Créer {{ createCount }} match{{ createCount !== 1 ? 's' : '' }}
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
  name: "ChallongeRoundBulkCreate",
  props: {
    value: Boolean,
    round: { type: Number, default: 0 },
    matches: { type: Array, default: () => [] },
    prefillData: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      globalFormat: 1,
      rows: [],
      isLoading: false,
      progress: { total: 0, done: 0, errors: [] },
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "success"
    };
  },
  computed: {
    dialog: {
      get() { return this.value; },
      set(val) { this.$emit("input", val); }
    },
    serverItems() {
      return this.prefillData.available_servers || [];
    },
    createCount() {
      return this.rows.filter(r => r.server_id).length;
    },
    skipCount() {
      return this.rows.filter(r => !r.server_id).length;
    }
  },
  watch: {
    value(val) {
      if (val) this.init();
    },
    prefillData() {
      if (this.value) this.init();
    }
  },
  methods: {
    init() {
      const servers = this.prefillData.available_servers || [];
      this.progress = { total: 0, done: 0, errors: [] };

      // Défaut format depuis les CVARs de saison
      const sc = this.prefillData.season_cvars || {};
      if (sc.maps_to_win) this.globalFormat = parseInt(sc.maps_to_win) || 1;
      else this.globalFormat = 1;

      // Construire les lignes, préremplir serveurs en round-robin
      this.rows = this.matches.map((m, i) => ({
        challonge_id: m.id,
        suggested_play_order: m.suggested_play_order,
        team1_name: m.player1?.local_team?.name || m.player1?.name || "?",
        team2_name: m.player2?.local_team?.name || m.player2?.name || "?",
        team1_id: m.player1?.local_team?.id ?? null,
        team2_id: m.player2?.local_team?.id ?? null,
        server_id: i < servers.length ? servers[i].id : null
      }));
    },
    close() {
      if (!this.isLoading) this.dialog = false;
    },
    buildMatchPayload(row) {
      const sc = this.prefillData.season_cvars || {};
      const reserved = [
        "min_players_to_ready", "min_spectators_to_ready", "players_per_team",
        "maps_to_win", "wingman", "skip_veto", "map_pool", "side_type",
        "spectators", "map_sides"
      ];
      const cvars = Object.fromEntries(
        Object.entries(sc).filter(([k]) => !reserved.includes(k))
      );
      return [{
        server_id: row.server_id,
        team1_id: row.team1_id,
        team2_id: row.team2_id,
        season_id: this.prefillData.season_id,
        challonge_id: row.challonge_id,
        start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
        max_maps: this.globalFormat,
        skip_veto: sc.skip_veto != null ? !!parseInt(sc.skip_veto) : false,
        veto_first: "team1",
        side_type: sc.side_type || "standard",
        veto_mappool: sc.map_pool || null,
        map_sides: sc.map_sides ? sc.map_sides.trim().split(/\s+/).join(",") : null,
        min_players_to_ready: sc.min_players_to_ready != null ? parseInt(sc.min_players_to_ready) : null,
        min_spectators_to_ready: sc.min_spectators_to_ready != null ? parseInt(sc.min_spectators_to_ready) : null,
        players_per_team: sc.players_per_team != null ? parseInt(sc.players_per_team) : null,
        wingman: sc.wingman != null ? !!parseInt(sc.wingman) : null,
        match_cvars: Object.keys(cvars).length ? cvars : null
      }];
    },
    async createAll() {
      const toCreate = this.rows.filter(r => r.server_id);
      if (!toCreate.length) return;

      this.isLoading = true;
      this.progress = { total: toCreate.length, done: 0, errors: [] };
      const created = [];

      for (const row of toCreate) {
        try {
          const res = await this.InsertMatch(this.buildMatchPayload(row));
          if (res && res.id != null) {
            created.push(res.id);
          } else {
            this.progress.errors.push({ row, message: res?.message || "Erreur inconnue" });
          }
        } catch (err) {
          this.progress.errors.push({ row, message: err.message || "Erreur inconnue" });
        }
        this.progress.done++;
      }

      this.isLoading = false;

      if (this.progress.errors.length === 0) {
        this.$emit("matches-created", created);
        this.dialog = false;
      } else {
        this.snackbarMessage = `${created.length} créé(s), ${this.progress.errors.length} erreur(s)`;
        this.snackbarColor = created.length > 0 ? "warning" : "error";
        this.snackbar = true;
        if (created.length > 0) this.$emit("matches-created", created);
      }
    }
  }
};
</script>
