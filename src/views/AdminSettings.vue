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
        </v-tabs>

        <v-tabs-items v-model="tab">

          <!-- DISCORD -->
          <v-tab-item>
            <v-card flat class="pa-4">
              <v-switch v-model="settings['discord.enabled']" true-value="true" false-value="false"
                label="Activer le bot Discord" />
              <v-text-field v-model="settings['discord.token']" label="Token Discord"
                :type="showTokens ? 'text' : 'password'"
                :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showTokens = !showTokens" />
              <v-text-field v-model="settings['discord.announceChannelId']" label="Channel Annonces (ID)" />
              <v-text-field v-model="settings['discord.scoreboardChannelId']" label="Channel Scoreboard (ID)" />
              <v-text-field v-model="settings['discord.scheduleChannelId']" label="Channel Planning (ID)" />
              <v-text-field v-model="settings['discord.guildId']" label="Guild ID (optionnel)" />
            </v-card>
          </v-tab-item>

          <!-- TWITCH -->
          <v-tab-item>
            <v-card flat class="pa-4">
              <v-switch v-model="settings['twitch.enabled']" true-value="true" false-value="false"
                label="Activer le bot Twitch" />
              <v-text-field v-model="settings['twitch.username']" label="Nom du compte bot (login Twitch)" />
              <v-text-field v-model="settings['twitch.token']" label="Access Token (oauth:xxx...)"
                :type="showTokens ? 'text' : 'password'"
                :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showTokens = !showTokens" />
              <v-text-field v-model="settings['twitch.channels']" label='Channels (JSON : ["channel1","channel2"])' />
            </v-card>
          </v-tab-item>

          <!-- PTERODACTYL -->
          <v-tab-item>
            <v-card flat class="pa-4">
              <v-switch v-model="settings['pterodactyl.enabled']" true-value="true" false-value="false"
                label="Activer Pterodactyl" />
              <v-text-field v-model="settings['pterodactyl.url']" label="URL du panel (https://panel.example.com)" />
              <v-text-field v-model="settings['pterodactyl.apiKey']" label="Client API Key"
                :type="showTokens ? 'text' : 'password'"
                :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showTokens = !showTokens" />
              <v-text-field v-model="settings['pterodactyl.shutdownDelay']" label="Délai d'arrêt (ms)" type="number" />
            </v-card>
          </v-tab-item>

          <!-- TOORNAMENT -->
          <v-tab-item>
            <v-card flat class="pa-4">
              <v-text-field v-model="settings['toornament.clientId']" label="Client ID" />
              <v-text-field v-model="settings['toornament.clientSecret']" label="Client Secret"
                :type="showTokens ? 'text' : 'password'"
                :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showTokens = !showTokens" />
              <v-text-field v-model="settings['toornament.apiKey']" label="API Key"
                :type="showTokens ? 'text' : 'password'"
                :append-icon="showTokens ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showTokens = !showTokens" />
            </v-card>
          </v-tab-item>

        </v-tabs-items>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="saveSettings">
            <v-icon left>mdi-content-save</v-icon>
            Enregistrer
          </v-btn>
        </v-card-actions>

        <v-alert v-if="successMsg" type="success" class="ma-4">{{ successMsg }}</v-alert>
        <v-alert v-if="errorMsg" type="error" class="ma-4">{{ errorMsg }}</v-alert>
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
      showTokens: false,
      saving: false,
      successMsg: "",
      errorMsg: ""
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
        const res = await this.axioCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/settings`
        );
        this.settings = res.data;
      } catch (err) {
        this.errorMsg = "Impossible de charger les paramètres.";
      }
    },
    async saveSettings() {
      this.saving = true;
      this.successMsg = "";
      this.errorMsg = "";
      try {
        await this.axioCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/settings`,
          this.settings
        );
        this.successMsg = "Paramètres enregistrés et services rechargés.";
      } catch (err) {
        this.errorMsg = err.response?.data?.message || "Erreur lors de la sauvegarde.";
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>
