<template>
  <v-container fluid>
    <v-card class="mx-auto" max-width="900">
      <v-card-title class="headline">
        <v-icon left>mdi-cog</v-icon>
        Paramètres du serveur
      </v-card-title>

      <v-progress-linear v-if="loadingUser" indeterminate color="primary" />

      <v-alert v-if="!loadingUser && !isSuperAdmin" type="error">
        Accès réservé aux super-administrateurs.
      </v-alert>

      <div v-if="!loadingUser && isSuperAdmin">
        <v-tabs v-model="tab" background-color="primary" dark>
          <v-tab>Discord</v-tab>
          <v-tab>Twitch</v-tab>
          <v-tab>Pterodactyl</v-tab>
          <v-tab>Toornament</v-tab>
          <v-tab>Challonge</v-tab>
          <v-tab>VPS Relay</v-tab>
          <v-tab>Demo</v-tab>
        </v-tabs>

        <!-- DISCORD -->
        <v-card v-if="tab === 0" flat class="pa-4">
          <v-switch
            v-model="settings['discord.enabled']"
            true-value="true"
            false-value="false"
            label="Activer le bot Discord"
          />
          <v-text-field
            v-model="settings['discord.token']"
            label="Token Discord"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
          <v-text-field
            v-model="settings['discord.guildId']"
            label="Guild ID (optionnel)"
          />
          <v-text-field
            v-model="settings['discord.frontendUrl']"
            label="URL du frontend G5V (pour les liens planning)"
          />

          <v-divider class="my-4" />
          <div class="text-subtitle-2 mb-3">Channels de notification</div>
          <div
            v-for="type in notifTypes"
            :key="type.key"
            class="d-flex align-center gap-3 mb-2"
          >
            <div style="min-width:200px" class="text-body-2">{{ type.label }}</div>
            <v-combobox
              v-model="notifChannels[type.key]"
              :label="type.webhook ? 'Channel IDs ou Webhook URLs' : 'Channel IDs (bot uniquement)'"
              multiple
              chips
              deletable-chips
              dense
              hide-details
            />
          </div>
        </v-card>

        <!-- TWITCH -->
        <v-card v-if="tab === 1" flat class="pa-4">
          <v-switch
            v-model="settings['twitch.enabled']"
            true-value="true"
            false-value="false"
            label="Activer le bot Twitch"
          />
          <v-text-field
            v-model="settings['twitch.username']"
            label="Nom du compte bot (login Twitch)"
          />
          <v-text-field
            v-model="settings['twitch.token']"
            label="Access Token (oauth:xxx...)"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
          <v-combobox
            v-model="twitchChannels"
            label="Channels Twitch"
            multiple
            chips
            deletable-chips
            hint="Appuie sur Entrée pour ajouter un channel"
            persistent-hint
          />
        </v-card>

        <!-- PTERODACTYL -->
        <v-card v-if="tab === 2" flat class="pa-4">
          <v-switch
            v-model="settings['pterodactyl.enabled']"
            true-value="true"
            false-value="false"
            label="Activer Pterodactyl"
          />
          <v-text-field
            v-model="settings['pterodactyl.url']"
            label="URL du panel (https://panel.example.com)"
          />
          <v-text-field
            v-model="settings['pterodactyl.apiKey']"
            label="Client API Key"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
          <v-text-field
            v-model="settings['pterodactyl.shutdownDelay']"
            label="Délai d'arrêt (s)"
            type="number"
          />
        </v-card>

        <!-- TOORNAMENT -->
        <v-card v-if="tab === 3" flat class="pa-4">
          <v-text-field
            v-model="settings['toornament.clientId']"
            label="Client ID"
          />
          <v-text-field
            v-model="settings['toornament.clientSecret']"
            label="Client Secret"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
          <v-text-field
            v-model="settings['toornament.apiKey']"
            label="API Key"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
        </v-card>

        <!-- CHALLONGE -->
        <v-card v-if="tab === 4" flat class="pa-4">
          <v-text-field
            v-model="settings['challonge.apiKey']"
            label="Challonge API Key (v1)"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
            hint="Clé disponible sur challonge.com/settings/developer"
            persistent-hint
          />
        </v-card>

        <!-- VPS RELAY -->
        <v-card v-if="tab === 5" flat class="pa-4">
          <v-switch
            v-model="settings['vpsRelay.enabled']"
            true-value="true"
            false-value="false"
            label="Activer le VPS Relay (transfert de démos)"
          />
          <v-text-field
            v-model="settings['vpsRelay.url']"
            label="URL du VPS (https://vps.example.com)"
          />
          <v-text-field
            v-model="settings['vpsRelay.apiKey']"
            label="API Key"
            :type="showTokens ? 'text' : 'password'"
            :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showTokens = !showTokens"
          />
        </v-card>

        <!-- DEMO -->
        <v-card v-if="tab === 6" flat class="pa-4">
          <v-card-subtitle class="pa-0 mb-3">
            Upload de fichiers .dem — ils seront zippés et associés à la map_stats correspondante.
          </v-card-subtitle>

          <v-file-input
            v-model="demoFiles"
            label="Fichiers .dem"
            accept=".dem,.zip"
            multiple
            chips
            show-size
            prepend-icon="mdi-file-video"
            hint="Nommage attendu : YYYY-MM-DD_HH-MM-SS_MATCHID_de_MAP_….dem ou .zip"
            persistent-hint
          />

          <v-btn
            class="mt-3"
            color="primary"
            :loading="demoUploading && demoProgress === 0"
            :disabled="!demoFiles || !demoFiles.length"
            @click="uploadDemos"
          >
            <v-icon left>mdi-upload</v-icon>
            Uploader
          </v-btn>

          <div v-if="demoUploading" class="mt-3">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>{{ demoProgress < 100 ? 'Envoi en cours...' : 'Traitement serveur...' }}</span>
              <span>{{ demoProgress }}%</span>
            </div>
            <v-progress-linear
              :value="demoProgress"
              :indeterminate="demoProgress === 100"
              color="primary"
              height="6"
              rounded
            />
          </div>

          <div v-if="demoResults.length" class="mt-4">
            <v-list dense>
              <v-list-item v-for="r in demoResults" :key="r.file">
                <v-list-item-icon>
                  <v-icon :color="r.status === 'ok' ? 'success' : r.status === 'skipped' ? 'warning' : 'error'">
                    {{ r.status === 'ok' ? 'mdi-check-circle' : r.status === 'skipped' ? 'mdi-skip-next-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="text-caption">{{ r.file }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ r.message }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-card>

        <v-card-actions v-if="tab !== 6" class="pa-4">
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="saveSettings">
            <v-icon left>mdi-content-save</v-icon>
            Enregistrer
          </v-btn>
        </v-card-actions>

        <v-alert v-if="successMsg" type="success" class="ma-4">{{
          successMsg
        }}</v-alert>
        <v-alert v-if="errorMsg" type="error" class="ma-4">{{
          errorMsg
        }}</v-alert>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "AdminSettings",
  data() {
    return {
      tab: 0,
      user: { id: null, super_admin: 0 },
      loadingUser: true,
      settings: {},
      twitchChannels: [],
      showTokens: false,
      saving: false,
      successMsg: "",
      errorMsg: "",
      demoFiles: [],
      demoUploading: false,
      demoProgress: 0,
      demoResults: [],
      notifChannels: {
        announce: [],
        schedule: [],
        scoreboard: [],
        veto: [],
        demo: [],
        streamer: [],
        default: [],
      },
      notifTypes: [
        { key: "announce",   label: "Match Annonce",              webhook: false },
        { key: "schedule",   label: "Match à Lancer",             webhook: false },
        { key: "scoreboard", label: "Suivi des matchs",           webhook: false },
        { key: "veto",       label: "Veto Finish",                webhook: true  },
        { key: "demo",       label: "Demo Available",             webhook: true  },
        { key: "streamer",   label: "Streamer",                   webhook: true  },
        { key: "default",    label: "Défaut (autres notifs)",     webhook: true  },
      ]
    };
  },
  computed: {
    isSuperAdmin() {
      return Number(this.user.super_admin) === 1;
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    this.loadingUser = false;
    if (this.isSuperAdmin) await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/settings`
        );
        this.settings = res.data;
        try {
          this.twitchChannels = JSON.parse(
            this.settings["twitch.channels"] || "[]"
          );
        } catch {
          this.twitchChannels = [];
        }
        const parseArr = (key) => {
          try { return JSON.parse(this.settings[key] || "[]") || []; }
          catch { return []; }
        };
        for (const type of this.notifTypes) {
          this.notifChannels[type.key] = parseArr(`discord.channels.${type.key}`);
        }
      } catch (err) {
        this.errorMsg = "Impossible de charger les paramètres.";
      }
    },
    async uploadDemos() {
      this.demoUploading = true;
      this.demoProgress = 0;
      this.demoResults = [];
      try {
        const form = new FormData();
        for (const f of this.demoFiles) form.append("demos", f);
        const res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/v2/demoadmin`,
          form,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              this.demoProgress = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
            },
          }
        );
        this.demoResults = res.data.results || [];
      } catch (err) {
        this.demoResults = [{ file: "—", status: "error", message: err.response?.data?.message || err.message }];
      } finally {
        this.demoUploading = false;
        this.demoProgress = 0;
        this.demoFiles = [];
      }
    },
    async saveSettings() {
      this.saving = true;
      this.successMsg = "";
      this.errorMsg = "";
      this.settings["twitch.channels"] = JSON.stringify(this.twitchChannels);
      for (const type of this.notifTypes) {
        this.settings[`discord.channels.${type.key}`] = JSON.stringify(this.notifChannels[type.key]);
      }
      try {
        await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/settings`,
          this.settings
        );
        this.successMsg = "Paramètres enregistrés et services rechargés.";
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || "Erreur lors de la sauvegarde.";
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>
