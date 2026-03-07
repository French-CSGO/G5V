<template>
  <v-container fluid class="queue-page">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card flat color="transparent">
          <v-card-title class="text-h4">
            <v-icon large class="mr-3">mdi-account-group</v-icon>
            Queue 5v5
          </v-card-title>
          <v-card-subtitle>
            Rejoins une queue ou crée la tienne. Le match se lance
            automatiquement quand 10 joueurs sont prêts.
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Not logged in -->
    <v-row v-if="user.id === null">
      <v-col cols="12">
        <v-alert type="warning" outlined>
          Tu dois être connecté via Steam pour utiliser la queue.
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Actions bar -->
      <v-row class="mb-2">
        <v-col cols="12" class="d-flex align-center">
          <v-btn
            color="primary"
            @click="createDialog = true"
            :disabled="!!myQueue"
          >
            <v-icon left>mdi-plus</v-icon>
            Créer une queue
          </v-btn>
          <v-spacer />
          <v-btn icon @click="refreshQueues" :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <!-- Server starting banner -->
      <v-row v-if="serverStarting && !createdMatchId">
        <v-col cols="12">
          <v-alert type="info" prominent>
            <v-progress-circular
              indeterminate
              size="20"
              width="3"
              class="mr-3"
            />
            Démarrage du serveur en cours, cela peut prendre quelques minutes...
          </v-alert>
        </v-col>
      </v-row>

      <!-- Match created banner -->
      <v-row v-if="createdMatchId">
        <v-col cols="12">
          <v-alert type="success" prominent>
            <v-row align="center">
              <v-col class="grow">
                Match créé ! ID #{{ createdMatchId }}
              </v-col>
              <v-col class="shrink">
                <v-btn :to="'/match/' + createdMatchId" color="white" outlined>
                  Voir le match
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>
        </v-col>
      </v-row>

      <!-- My active queue -->
      <template v-if="myQueue">
        <v-row>
          <v-col cols="12">
            <v-card outlined color="primary lighten-5">
              <v-card-title>
                <v-icon left>mdi-timer-sand</v-icon>
                Ma queue : {{ myQueue.name }}
                <v-spacer />
                <v-chip color="primary" class="ml-2">
                  {{ myQueue.currentPlayers }} / {{ myQueue.maxSize }}
                </v-chip>
                <v-chip
                  v-if="myQueue.isPrivate"
                  class="ml-2"
                  color="grey"
                  small
                >
                  <v-icon small left>mdi-lock</v-icon>Privée
                </v-chip>
              </v-card-title>

              <!-- Progress bar -->
              <v-card-text>
                <v-progress-linear
                  :value="(myQueue.currentPlayers / myQueue.maxSize) * 100"
                  color="primary"
                  height="12"
                  rounded
                  class="mb-4"
                >
                  <template v-slot:default="{ value }">
                    <strong>{{ Math.ceil(value) }}%</strong>
                  </template>
                </v-progress-linear>

                <!-- Players list -->
                <v-list dense>
                  <v-subheader>Joueurs ({{ queuePlayers.length }})</v-subheader>
                  <v-list-item
                    v-for="player in queuePlayers"
                    :key="player.steamId"
                  >
                    <v-list-item-avatar size="28">
                      <v-icon>mdi-account-circle</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>{{
                        player.nickname || player.steamId
                      }}</v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action v-if="player.hltvRating">
                      <v-chip x-small :color="ratingColor(player.hltvRating)">
                        {{ parseFloat(player.hltvRating).toFixed(2) }}
                      </v-chip>
                    </v-list-item-action>
                  </v-list-item>
                  <v-list-item v-for="i in emptySlots" :key="'empty-' + i">
                    <v-list-item-avatar size="28">
                      <v-icon color="grey lighten-1"
                        >mdi-account-question</v-icon
                      >
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title class="grey--text"
                        >En attente...</v-list-item-title
                      >
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-card-text>

              <v-card-actions>
                <v-btn
                  text
                  color="error"
                  @click="leaveCurrentQueue"
                  :loading="leaving"
                >
                  <v-icon left>mdi-exit-to-app</v-icon>
                  Quitter la queue
                </v-btn>
                <v-spacer />
                <v-btn
                  v-if="isQueueOwner"
                  text
                  color="error"
                  @click="deleteCurrentQueue"
                  :loading="deleting"
                >
                  <v-icon left>mdi-delete</v-icon>
                  Supprimer
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Available queues -->
      <v-row>
        <v-col cols="12">
          <v-card-title class="pl-0 pt-4">
            Queues disponibles
            <v-chip class="ml-2" small>{{ publicQueues.length }}</v-chip>
          </v-card-title>
        </v-col>
      </v-row>

      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
      </v-row>

      <v-row v-else-if="publicQueues.length === 0 && !myQueue">
        <v-col cols="12">
          <v-alert type="info" outlined>
            Aucune queue disponible. Crée-en une !
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="queue in publicQueues"
          :key="queue.name"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            outlined
            :class="{
              'primary lighten-5': myQueue && myQueue.name === queue.name
            }"
          >
            <v-card-title class="subtitle-1">
              <v-icon small left>mdi-gamepad-variant</v-icon>
              {{ queue.name }}
              <v-spacer />
              <v-chip
                small
                :color="
                  queue.currentPlayers >= queue.maxSize ? 'error' : 'success'
                "
              >
                {{ queue.currentPlayers }}/{{ queue.maxSize }}
              </v-chip>
            </v-card-title>

            <v-card-text class="pt-0">
              <v-progress-linear
                :value="(queue.currentPlayers / queue.maxSize) * 100"
                :color="
                  queue.currentPlayers >= queue.maxSize ? 'error' : 'primary'
                "
                rounded
                height="6"
              />
              <div class="caption mt-1 grey--text">
                Expire {{ formatExpiry(queue.expiresAt) }}
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="!myQueue"
                small
                color="primary"
                :disabled="queue.currentPlayers >= queue.maxSize"
                @click="joinQueue(queue.name)"
                :loading="joiningQueue === queue.name"
              >
                <v-icon small left>mdi-account-plus</v-icon>
                Rejoindre
              </v-btn>
              <v-btn
                v-else-if="myQueue.name === queue.name"
                small
                color="error"
                text
                @click="leaveCurrentQueue"
                :loading="leaving"
              >
                Quitter
              </v-btn>
              <span v-else class="caption grey--text">Déjà en queue</span>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Create Queue Dialog -->
    <v-dialog v-model="createDialog" max-width="420">
      <v-card>
        <v-card-title>Créer une queue</v-card-title>
        <v-card-text>
          <v-select
            v-model="newQueueSize"
            :items="queueSizeOptions"
            label="Nombre de joueurs (par équipe × 2)"
            outlined
            dense
          />
          <v-switch
            v-model="newQueuePrivate"
            label="Queue privée (accessible seulement via le lien)"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="createDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="createQueue" :loading="creating">
            Créer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      top
      :timeout="4000"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">OK</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "Queue",
  sse: { cleanup: true },
  data() {
    return {
      user: {
        admin: false,
        steam_id: "",
        id: null,
        super_admin: false,
        name: ""
      },
      queues: [],
      myQueue: null,
      queuePlayers: [],
      loading: false,
      joining: false,
      joiningQueue: null,
      leaving: false,
      deleting: false,
      creating: false,
      createDialog: false,
      newQueueSize: 2,
      newQueuePrivate: false,
      createdMatchId: null,
      serverStarting: false,
      sseClient: null,
      snackbar: { show: false, text: "", color: "success" }
    };
  },
  computed: {
    queueSizeOptions() {
      const opts = [];
      for (let i = 1; i <= 10; i++) {
        let label;
        if (i === 1) label = "1 joueur (test)";
        else if (i % 2 === 0) label = `${i} joueurs (${i / 2}v${i / 2})`;
        else label = `${i} joueurs`;
        opts.push({ text: label, value: i });
      }
      return opts;
    },
    publicQueues() {
      if (!this.myQueue) return this.queues;
      return this.queues.filter(q => q.name !== this.myQueue.name);
    },
    emptySlots() {
      if (!this.myQueue) return 0;
      return Math.max(0, this.myQueue.maxSize - this.queuePlayers.length);
    },
    isQueueOwner() {
      return this.myQueue && this.myQueue.ownerId === this.user.steam_id;
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    if (this.user.id !== null) {
      await this.refreshQueues();
    }
  },
  beforeDestroy() {
    this.disconnectSSE();
  },
  methods: {
    async refreshQueues() {
      this.loading = true;
      try {
        this.queues = (await this.GetQueues()) || [];
        // Check if I'm already in a queue
        for (const q of this.queues) {
          const players = await this.GetQueuePlayers(q.name);
          const me = players.find(p => p.steamId === this.user.steam_id);
          if (me) {
            this.myQueue = q;
            this.queuePlayers = players;
            await this.connectSSE(q.name);
            break;
          }
        }
      } catch (err) {
        this.showSnack("Erreur lors du chargement des queues", "error");
      } finally {
        this.loading = false;
      }
    },

    async joinQueue(slug) {
      this.joiningQueue = slug;
      const startingTimer = setTimeout(() => {
        this.serverStarting = true;
      }, 3000);
      try {
        const result = await this.JoinQueue(slug);
        if (result.matchId) {
          this.createdMatchId = result.matchId;
          this.myQueue = null;
          this.queuePlayers = [];
          this.showSnack("Match créé ! Redirection...", "success");
          setTimeout(() => this.$router.push("/match/" + result.matchId), 2000);
        } else {
          this.myQueue = await this.GetQueue(slug);
          this.queuePlayers = await this.GetQueuePlayers(slug);
          await this.connectSSE(slug);
          this.showSnack("Tu as rejoint la queue !", "success");
        }
        await this.refreshQueues();
      } catch (err) {
        const msg = err?.response?.data?.error || "Erreur lors de la jonction";
        this.showSnack(msg, "error");
      } finally {
        clearTimeout(startingTimer);
        this.serverStarting = false;
        this.joiningQueue = null;
      }
    },

    async createQueue() {
      this.creating = true;
      try {
        const result = await this.CreateQueue(
          this.newQueueSize,
          this.newQueuePrivate
        );
        this.createDialog = false;
        if (result.matchId) {
          this.showSnack("Match créé ! Redirection...", "success");
          setTimeout(() => this.$router.push("/match/" + result.matchId), 2000);
          return;
        }
        this.myQueue = result.queue;
        this.queuePlayers = await this.GetQueuePlayers(result.queue.name);
        await this.connectSSE(result.queue.name);
        this.showSnack("Queue créée !", "success");
        await this.refreshQueues();
      } catch (err) {
        const msg = err?.response?.data?.error || "Erreur lors de la création";
        this.showSnack(msg, "error");
      } finally {
        this.creating = false;
      }
    },

    async leaveCurrentQueue() {
      if (!this.myQueue) return;
      this.leaving = true;
      try {
        await this.LeaveQueue(this.myQueue.name);
        this.disconnectSSE();
        this.myQueue = null;
        this.queuePlayers = [];
        this.showSnack("Tu as quitté la queue.", "info");
        await this.refreshQueues();
      } catch (err) {
        this.showSnack("Erreur en quittant la queue", "error");
      } finally {
        this.leaving = false;
      }
    },

    async deleteCurrentQueue() {
      if (!this.myQueue) return;
      this.deleting = true;
      try {
        await this.DeleteQueue(this.myQueue.name);
        this.disconnectSSE();
        this.myQueue = null;
        this.queuePlayers = [];
        this.showSnack("Queue supprimée.", "info");
        await this.refreshQueues();
      } catch (err) {
        this.showSnack("Erreur lors de la suppression", "error");
      } finally {
        this.deleting = false;
      }
    },

    async connectSSE(slug) {
      this.disconnectSSE();
      try {
        this.sseClient = await this.GetEventQueueData(slug);

        this.sseClient.on("queueInit", data => {
          if (data.players) this.queuePlayers = data.players;
          if (data.meta) this.myQueue = data.meta;
        });

        this.sseClient.on("playerJoined", data => {
          this.queuePlayers = [...(this.queuePlayers || [])];
          if (
            data.player &&
            !this.queuePlayers.find(p => p.steamId === data.player.steamId)
          ) {
            this.queuePlayers.push(data.player);
          }
          if (this.myQueue) {
            this.myQueue = {
              ...this.myQueue,
              currentPlayers: data.currentPlayers
            };
          }
          // Update in main list too
          const idx = this.queues.findIndex(q => q.name === data.slug);
          if (idx !== -1) {
            this.$set(this.queues, idx, {
              ...this.queues[idx],
              currentPlayers: data.currentPlayers
            });
          }
        });

        this.sseClient.on("playerLeft", data => {
          this.queuePlayers = this.queuePlayers.filter(
            p => p.steamId !== data.steamId
          );
          if (this.myQueue) {
            this.myQueue = {
              ...this.myQueue,
              currentPlayers: data.currentPlayers
            };
          }
        });

        this.sseClient.on("queueStarting", () => {
          this.serverStarting = true;
        });

        this.sseClient.on("queueFull", data => {
          this.serverStarting = false;
          this.createdMatchId = data.matchId;
          this.myQueue = null;
          this.queuePlayers = [];
          this.disconnectSSE();
          this.showSnack(
            "Queue pleine ! Match créé, redirection...",
            "success"
          );
          if (data.matchId) {
            setTimeout(() => {
              this.$router.push("/match/" + data.matchId);
            }, 2000);
          }
        });

        await this.sseClient.connect();
      } catch (err) {
        console.error("SSE queue error:", err);
      }
    },

    disconnectSSE() {
      if (this.sseClient) {
        try {
          this.sseClient.disconnect();
        } catch (e) {
          console.debug("SSE disconnect:", e);
        }
        this.sseClient = null;
      }
    },

    ratingColor(rating) {
      if (rating >= 1.3) return "success";
      if (rating >= 1.0) return "primary";
      if (rating >= 0.8) return "warning";
      return "error";
    },

    formatExpiry(timestamp) {
      const diff = timestamp - Date.now();
      if (diff <= 0) return "expiré";
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `dans ${minutes}min`;
      return `dans ${Math.floor(minutes / 60)}h`;
    },

    showSnack(text, color = "success") {
      this.snackbar = { show: true, text, color };
    }
  }
};
</script>

<style scoped>
.queue-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
