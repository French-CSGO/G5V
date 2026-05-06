<template>
  <div class="match-backups-table">
    <div v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!backups.length" class="text-center py-6 text--secondary">
      Aucun backup disponible.
    </div>
    <v-simple-table v-else dense dark>
      <template #default>
        <thead>
          <tr>
            <th class="text-left">MAP</th>
            <th class="text-left">ROUND</th>
            <th class="text-left">SCORE</th>
            <th class="text-left">TIMESTAMP</th>
            <th class="text-left">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in backups" :key="b.file">
            <td><strong>M{{ b.mapNum != null ? b.mapNum + 1 : '?' }}</strong></td>
            <td>R{{ b.round != null ? String(b.round).padStart(2, '0') : '??' }}</td>
            <td class="backup-score">
              <span v-if="b.team1Score != null" :class="b.team1Score > b.team2Score ? 'green--text' : ''">{{ b.team1Score }}</span>
              <span v-if="b.team1Score != null" class="mx-1 text--secondary">:</span>
              <span v-if="b.team2Score != null" :class="b.team2Score > b.team1Score ? 'green--text' : ''">{{ b.team2Score }}</span>
              <span v-if="b.team1Score == null" class="text--secondary">—</span>
            </td>
            <td class="text-caption text--secondary">{{ formatTime(b.mtimeMs) }}</td>
            <td>
              <v-btn
                x-small
                color="amber darken-2"
                :loading="restoring === b.file"
                :disabled="!!restoring"
                @click="doRestore(b.file)"
              >
                <v-icon left x-small>mdi-restore</v-icon>
                Restore
              </v-btn>
              <v-btn
                x-small
                color="blue darken-1"
                class="ml-1"
                :disabled="!!restoring"
                @click="$emit('change-server', b.file)"
              >
                <v-icon left x-small>mdi-server</v-icon>
                Change Server
              </v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <v-bottom-sheet v-model="responseSheet" inset>
      <v-sheet class="text-center" height="160px">
        <v-btn class="mt-6" text color="success" @click="responseSheet = false">Fermer</v-btn>
        <div class="my-3">{{ response }}</div>
      </v-sheet>
    </v-bottom-sheet>
  </div>
</template>

<script>
export default {
  name: "MatchBackupsTable",
  props: {
    matchId: { type: Number, required: true }
  },
  emits: ["change-server"],
  data() {
    return {
      loading: false,
      backups: [],
      restoring: null,
      response: "",
      responseSheet: false
    };
  },
  async mounted() {
    await this.loadBackups();
  },
  methods: {
    async loadBackups() {
      this.loading = true;
      try {
        const res = await this.GetRemoteBackups(this.matchId);
        if (Array.isArray(res.response)) {
          this.backups = res.response.map(b => {
            if (typeof b === "object") return b;
            const m = b.match(/map(\d+)_round(\d+)/i);
            return {
              file: b,
              mapNum: m ? parseInt(m[1]) : null,
              round: m ? parseInt(m[2]) : null,
              team1Score: null,
              team2Score: null,
              mtimeMs: null
            };
          }).sort((a, b) => {
            if (a.mapNum !== b.mapNum) return (a.mapNum ?? 0) - (b.mapNum ?? 0);
            return (a.round ?? 0) - (b.round ?? 0);
          });
        }
      } catch {
        // ignored
      } finally {
        this.loading = false;
      }
    },
    async doRestore(filename) {
      this.restoring = filename;
      try {
        const res = await this.RestoreFromBackup(this.matchId, [{ backup_name: filename }]);
        this.response = res.message || "Backup restauré.";
        this.responseSheet = true;
      } catch {
        this.response = "Erreur lors de la restauration.";
        this.responseSheet = true;
      } finally {
        this.restoring = null;
      }
    },
    formatTime(ms) {
      if (!ms) return "—";
      return new Date(ms).toLocaleString();
    }
  }
};
</script>

<style scoped>
.backup-score {
  font-family: monospace;
  min-width: 60px;
}
</style>
