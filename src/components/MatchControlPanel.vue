<template>
  <v-card class="match-control-panel" dark outlined>
    <v-card-text class="text-overline pb-0 pt-3 px-4">MATCH CONTROLS</v-card-text>
    <v-divider class="mt-2" />

    <v-tabs v-model="tab" background-color="transparent" dense>
      <v-tab>Controls</v-tab>
      <v-tab>Backups</v-tab>
    </v-tabs>
    <v-divider />

    <!-- Controls tab -->
    <div v-if="tab === 0" class="pa-4">
      <!-- MATCH FLOW -->
      <div class="text-caption font-weight-bold text--secondary mb-2">MATCH FLOW</div>
      <div class="d-flex flex-wrap gap mb-4">
        <v-btn
          small
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          :loading="loadingAction === 'pause'"
          @click="doPause"
        >Pause</v-btn>
        <v-btn
          small
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          :loading="loadingAction === 'unpause'"
          @click="doUnpause"
        >Unpause</v-btn>
      </div>

      <!-- MAP CONTROLS -->
      <div class="text-caption font-weight-bold text--secondary mb-2">MAP CONTROLS</div>
      <div class="d-flex flex-wrap gap mb-4">
        <v-btn
          small
          color="orange darken-2"
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          @click="restartDialog = true"
        >Reset Map</v-btn>
        <v-btn
          small
          color="deep-orange darken-2"
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          @click="forfeitDialog = true"
        >Forfeit Map</v-btn>
      </div>

      <!-- SERVER MIGRATION -->
      <div class="text-caption font-weight-bold text--secondary mb-2">SERVER MIGRATION</div>
      <div class="d-flex flex-wrap gap mb-4">
        <v-btn
          small
          color="blue darken-2"
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          @click="openChangeServer"
        >
          <v-icon left small>mdi-server</v-icon>
          Migrate Server
        </v-btn>
      </div>

      <!-- MATCH ACTIONS -->
      <div class="text-caption font-weight-bold text--secondary mb-2">MATCH ACTIONS</div>
      <div class="d-flex flex-wrap gap mb-2">
        <v-btn
          small
          class="mr-2 mb-2"
          :disabled="isLoading"
          @click="tab = 1"
        >Restore Backup</v-btn>
        <v-btn
          small
          color="orange"
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          @click="forfeitMatchDialog = true"
        >Forfeit</v-btn>
        <v-btn
          small
          color="red darken-1"
          class="mr-2 mb-2"
          :disabled="!isLive || isLoading"
          @click="cancelDialog = true"
        >Cancel</v-btn>
      </div>

      <!-- RCON (super admin only) -->
      <template v-if="user.super_admin == 1">
        <v-divider class="my-3" />
        <div class="text-caption font-weight-bold text--secondary mb-2">RCON</div>
        <div class="d-flex align-center">
          <v-text-field
            v-model="rconCommand"
            dense
            outlined
            hide-details
            placeholder="mp_restartgame 1"
            style="max-width: 300px"
            class="mr-2"
            @keyup.enter="sendRcon"
          />
          <v-btn
            small
            color="primary"
            :disabled="!isLive || isLoading || !rconCommand"
            :loading="loadingAction === 'rcon'"
            @click="sendRcon"
          >Send</v-btn>
        </div>
      </template>
    </div>

    <!-- Backups tab -->
    <div v-if="tab === 1" class="pa-2">
      <MatchBackupsTable
        :matchId="matchInfo.id"
        @change-server="openChangeServerWithBackup"
      />
    </div>

    <!-- ── Dialogs ── -->

    <!-- Response -->
    <v-bottom-sheet v-model="responseSheet" inset persistent>
      <v-sheet class="text-center" height="180px">
        <v-btn class="mt-6" text color="success" @click="closeResponse">Fermer</v-btn>
        <div class="my-3">{{ response }}</div>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Cancel -->
    <v-dialog v-model="cancelDialog" persistent max-width="500px">
      <v-card>
        <v-card-title>{{ $t("MatchAdmin.CancelMatchConfirm") }}</v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="cancelDialog = false">{{ $t("misc.No") }}</v-btn>
          <v-btn text color="red darken-1" :loading="isLoading" @click="doCancelMatch">{{ $t("misc.Yes") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart -->
    <v-dialog v-model="restartDialog" persistent max-width="500px">
      <v-card>
        <v-card-title>{{ $t("MatchAdmin.MatchRestartInfo") }}</v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn text :disabled="isLoading" @click="restartDialog = false">{{ $t("misc.No") }}</v-btn>
          <v-btn text color="red darken-1" :loading="isLoading" @click="doRestartMatch">{{ $t("misc.Yes") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Forfeit Map (= Forfeit Match with winner choice) -->
    <v-dialog v-model="forfeitDialog" persistent max-width="500px">
      <v-card>
        <v-card-title>{{ $t("MatchAdmin.ForfeitConfirm") }}</v-card-title>
        <v-card-text>{{ $t("MatchAdmin.ForfeitChoice") }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text :disabled="isLoading" @click="forfeitDialog = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn text color="blue darken-1" :loading="isLoading" @click="doForfeit(1)">{{ $t("MatchAdmin.ForfeitWinner1") }}</v-btn>
          <v-btn text color="yellow darken-1" :loading="isLoading" @click="doForfeit(2)">{{ $t("MatchAdmin.ForfeitWinner2") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Forfeit Match -->
    <v-dialog v-model="forfeitMatchDialog" persistent max-width="500px">
      <v-card>
        <v-card-title>{{ $t("MatchAdmin.ForfeitConfirm") }}</v-card-title>
        <v-card-text>{{ $t("MatchAdmin.ForfeitChoice") }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text :disabled="isLoading" @click="forfeitMatchDialog = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn text color="blue darken-1" :loading="isLoading" @click="doForfeit(1)">{{ $t("MatchAdmin.ForfeitWinner1") }}</v-btn>
          <v-btn text color="yellow darken-1" :loading="isLoading" @click="doForfeit(2)">{{ $t("MatchAdmin.ForfeitWinner2") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Change Server -->
    <v-dialog v-model="serverChangeDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>{{ $t("MatchAdmin.ChangeServer") }}</v-card-title>
        <v-card-text>
          <v-form ref="serverForm">
            <v-card-text class="font-weight-bold pa-0 mb-3">{{ $t("MatchAdmin.ServerChangeNote") }}</v-card-text>
            <v-select
              v-model="selectedServer"
              :items="servers"
              item-text="display_name"
              item-value="id"
              :rules="[v => !!v || $t('misc.Required')]"
              :label="$t('CreateMatch.ServerLabel')"
              required
              outlined
              dense
            />
            <v-select
              v-model="selectedBackupFile"
              :items="formattedRemoteBackups"
              item-text="text"
              item-value="value"
              :rules="[v => !!v || $t('misc.Required')]"
              :label="$t('MatchAdmin.Backup')"
              required
              outlined
              dense
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="serverChangeDialog = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn text color="red darken-1" :loading="isLoading" @click="doServerChange">{{ $t("misc.Change") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import MatchBackupsTable from "./MatchBackupsTable";

export default {
  name: "MatchControlPanel",
  components: { MatchBackupsTable },
  props: {
    matchInfo: { type: Object, required: true },
    user: { type: Object, required: true }
  },
  data() {
    return {
      tab: 0,
      isLoading: false,
      loadingAction: null,
      response: "",
      responseSheet: false,

      cancelDialog: false,
      restartDialog: false,
      forfeitDialog: false,
      forfeitMatchDialog: false,
      serverChangeDialog: false,

      rconCommand: "",
      selectedServer: "",
      selectedBackupFile: "",
      servers: [],
      remoteBackups: []
    };
  },
  computed: {
    isLive() {
      return (
        this.matchInfo.end_time == null &&
        !this.matchInfo.cancelled &&
        !this.matchInfo.forfeit
      );
    },
    formattedRemoteBackups() {
      return this.remoteBackups.map(b => {
        if (typeof b === "object" && b.file) {
          const map   = b.mapNum  != null ? `M${b.mapNum + 1}`   : "";
          const round = b.round   != null ? `R${String(b.round).padStart(2, '0')}` : "";
          const label = [map, round].filter(Boolean).join(" · ");
          return { text: label ? `${label}  (${b.file})` : b.file, value: b.file };
        }
        const m = String(b).match(/map(\d+)_round(\d+)/i);
        if (m) return { text: `M${parseInt(m[1]) + 1} · R${m[2].padStart(2, '0')}  (${b})`, value: b };
        return { text: b, value: b };
      });
    }
  },
  methods: {
    async doPause() {
      this.loadingAction = "pause";
      this.isLoading = true;
      this.response = await this.PauseMatch(this.matchInfo.id);
      this.isLoading = false;
      this.loadingAction = null;
      this.responseSheet = true;
    },
    async doUnpause() {
      this.loadingAction = "unpause";
      this.isLoading = true;
      this.response = await this.UnpauseMatch(this.matchInfo.id);
      this.isLoading = false;
      this.loadingAction = null;
      this.responseSheet = true;
    },
    async doRestartMatch() {
      this.isLoading = true;
      const res = await this.RestartCurrentMatch(this.matchInfo.id);
      this.response = res;
      this.restartDialog = false;
      this.isLoading = false;
      this.responseSheet = true;
    },
    async doCancelMatch() {
      this.isLoading = true;
      const res = await this.CancelMatch(this.matchInfo.id);
      this.response = res;
      this.cancelDialog = false;
      this.isLoading = false;
      this.responseSheet = true;
    },
    async doForfeit(team) {
      this.isLoading = true;
      const res = await this.ForfeitMatch(this.matchInfo.id, team);
      this.response = res;
      this.forfeitDialog = false;
      this.forfeitMatchDialog = false;
      this.isLoading = false;
      this.responseSheet = true;
    },
    async sendRcon() {
      if (!this.rconCommand) return;
      this.loadingAction = "rcon";
      this.isLoading = true;
      const res = await this.SendRconCommandToMatch(this.matchInfo.id, [{ rcon_command: this.rconCommand }]);
      this.response = res.response ?? res.message ?? "Commande envoyée.";
      this.rconCommand = "";
      this.isLoading = false;
      this.loadingAction = null;
      this.responseSheet = true;
    },
    async openChangeServer() {
      await this._loadServerData();
      this.serverChangeDialog = true;
    },
    async openChangeServerWithBackup(file) {
      await this._loadServerData(file);
      this.serverChangeDialog = true;
    },
    async _loadServerData(preselectedBackup = null) {
      try {
        const serversRes = await this.GetAllAvailableServers();
        if (Array.isArray(serversRes)) {
          serversRes.sort((a, b) => a.user_id - this.user.id || b.public_server - a.public_server);
          this.servers = serversRes;
        }
        const backupsRes = await this.GetRemoteBackups(this.matchInfo.id);
        if (Array.isArray(backupsRes.response)) this.remoteBackups = backupsRes.response;
        if (preselectedBackup) this.selectedBackupFile = preselectedBackup;
      } catch {
        // ignored
      }
    },
    async doServerChange() {
      if (!this.$refs.serverForm.validate()) return;
      this.isLoading = true;
      this.serverChangeDialog = false;
      const res = await this.RestoreFromRemoteBackup(this.matchInfo.id, [{
        server_id: this.selectedServer,
        backup_file: this.selectedBackupFile
      }]);
      this.response = res.message;
      this.isLoading = false;
      this.responseSheet = true;
    },
    closeResponse() {
      this.responseSheet = false;
      this.response = "";
      this.$emit("force-reload");
    }
  }
};
</script>

<style scoped>
.gap > * {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
