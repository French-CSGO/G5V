<template>
  <v-container fluid class="queue-page">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card flat color="transparent">
          <v-card-title class="text-h4">
            <v-icon large class="mr-3">mdi-account-group</v-icon>
            {{ $t("Queue.title") }}
          </v-card-title>
          <v-card-subtitle>
            {{ $t("Queue.subtitle") }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Not logged in -->
    <v-row v-if="user.id === null">
      <v-col cols="12">
        <v-alert type="warning" outlined>
          {{ $t("Queue.mustLogin") }}
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
            {{ $t("Queue.createBtn") }}
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
            {{ $t("Queue.serverStarting") }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Match created banner -->
      <v-row v-if="createdMatchId">
        <v-col cols="12">
          <v-alert type="success" prominent>
            <v-row align="center">
              <v-col class="grow">
                {{ $t("Queue.matchCreated") }}{{ createdMatchId }}
              </v-col>
              <v-col class="shrink">
                <v-btn :to="'/match/' + createdMatchId" color="white" outlined>
                  {{ $t("Queue.viewMatch") }}
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
                {{ $t("Queue.myQueue") }} {{ myQueue.name }}
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
                  <v-icon small left>mdi-lock</v-icon>{{ $t("Queue.private") }}
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
                  <v-subheader
                    >{{ $t("Queue.players") }} ({{
                      queuePlayers.length
                    }})</v-subheader
                  >
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
                      <v-list-item-title class="grey--text">{{
                        $t("Queue.waiting")
                      }}</v-list-item-title>
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
                  {{ $t("Queue.leaveQueue") }}
                </v-btn>
                <v-spacer />
                <v-btn
                  v-if="isQueueOwner"
                  text
                  :color="linkCopied ? 'success' : 'primary'"
                  @click="copyInviteLink"
                >
                  <v-icon left>{{
                    linkCopied ? "mdi-check" : "mdi-link-variant"
                  }}</v-icon>
                  {{
                    linkCopied ? $t("Queue.linkCopied") : $t("Queue.copyLink")
                  }}
                </v-btn>
                <v-btn
                  v-if="isQueueOwner"
                  text
                  color="error"
                  @click="deleteCurrentQueue"
                  :loading="deleting"
                >
                  <v-icon left>mdi-delete</v-icon>
                  {{ $t("Queue.delete") }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Manual team assignment panel (owner only, queue full) -->
      <template
        v-if="
          myQueue && myQueue.manualTeams && isQueueOwner && queueReadyForTeams
        "
      >
        <v-row class="mt-2">
          <v-col cols="12">
            <v-card outlined color="orange lighten-5">
              <v-card-title>
                <v-icon left color="orange darken-2">mdi-account-switch</v-icon>
                {{ $t("Queue.teamAssignTitle") }}
              </v-card-title>
              <v-card-subtitle>{{
                $t("Queue.teamAssignSubtitle")
              }}</v-card-subtitle>
              <v-card-text>
                <v-row>
                  <!-- Team 1 -->
                  <v-col cols="12" sm="6">
                    <v-card outlined>
                      <v-card-title class="subtitle-2 blue--text">
                        <v-icon small left color="blue"
                          >mdi-alpha-t-circle</v-icon
                        >
                        {{ $t("Queue.team1") }}
                        <v-chip x-small class="ml-2" color="blue" dark>{{
                          manualTeam1.length
                        }}</v-chip>
                      </v-card-title>
                      <v-list dense>
                        <v-list-item
                          v-for="player in manualTeam1"
                          :key="player.steamId"
                        >
                          <v-list-item-avatar size="24">
                            <v-icon small>mdi-account</v-icon>
                          </v-list-item-avatar>
                          <v-list-item-content>
                            <v-list-item-title>{{
                              player.nickname || player.steamId
                            }}</v-list-item-title>
                          </v-list-item-content>
                          <v-list-item-action>
                            <v-btn
                              icon
                              x-small
                              color="orange"
                              @click="moveToUnassigned(player, 1)"
                            >
                              <v-icon x-small>mdi-arrow-right</v-icon>
                            </v-btn>
                          </v-list-item-action>
                        </v-list-item>
                        <v-list-item v-if="manualTeam1.length === 0">
                          <v-list-item-content class="grey--text caption">{{
                            $t("Queue.teamEmpty")
                          }}</v-list-item-content>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                  <!-- Team 2 -->
                  <v-col cols="12" sm="6">
                    <v-card outlined>
                      <v-card-title class="subtitle-2 red--text">
                        <v-icon small left color="red"
                          >mdi-alpha-t-circle</v-icon
                        >
                        {{ $t("Queue.team2") }}
                        <v-chip x-small class="ml-2" color="red" dark>{{
                          manualTeam2.length
                        }}</v-chip>
                      </v-card-title>
                      <v-list dense>
                        <v-list-item
                          v-for="player in manualTeam2"
                          :key="player.steamId"
                        >
                          <v-list-item-avatar size="24">
                            <v-icon small>mdi-account</v-icon>
                          </v-list-item-avatar>
                          <v-list-item-content>
                            <v-list-item-title>{{
                              player.nickname || player.steamId
                            }}</v-list-item-title>
                          </v-list-item-content>
                          <v-list-item-action>
                            <v-btn
                              icon
                              x-small
                              color="orange"
                              @click="moveToUnassigned(player, 2)"
                            >
                              <v-icon x-small>mdi-arrow-left</v-icon>
                            </v-btn>
                          </v-list-item-action>
                        </v-list-item>
                        <v-list-item v-if="manualTeam2.length === 0">
                          <v-list-item-content class="grey--text caption">{{
                            $t("Queue.teamEmpty")
                          }}</v-list-item-content>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>
                <!-- Unassigned players -->
                <v-row v-if="manualUnassigned.length > 0" class="mt-2">
                  <v-col cols="12">
                    <div class="caption grey--text mb-1">
                      {{ $t("Queue.unassigned") }}
                    </div>
                    <v-chip-group>
                      <v-chip
                        v-for="player in manualUnassigned"
                        :key="player.steamId"
                        @click="assignPlayerDialog(player)"
                        small
                        outlined
                      >
                        <v-icon small left>mdi-account-plus</v-icon>
                        {{ player.nickname || player.steamId }}
                      </v-chip>
                    </v-chip-group>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions>
                <v-btn text small @click="autoBalance">
                  <v-icon left small>mdi-shuffle-variant</v-icon>
                  {{ $t("Queue.autoBalance") }}
                </v-btn>
                <v-spacer />
                <v-btn
                  color="success"
                  :disabled="!teamsValid || starting"
                  :loading="starting"
                  @click="startManualMatch"
                >
                  <v-icon left>mdi-play</v-icon>
                  {{ $t("Queue.startMatch") }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Assign player to team dialog -->
      <v-dialog v-model="assignDialog" max-width="300">
        <v-card v-if="assigningPlayer">
          <v-card-title class="subtitle-1">{{
            $t("Queue.assignTitle")
          }}</v-card-title>
          <v-card-subtitle>{{
            assigningPlayer.nickname || assigningPlayer.steamId
          }}</v-card-subtitle>
          <v-card-actions class="justify-center pb-4">
            <v-btn color="blue" dark @click="assignToTeam(assigningPlayer, 1)">
              {{ $t("Queue.team1") }}
            </v-btn>
            <v-btn color="red" dark @click="assignToTeam(assigningPlayer, 2)">
              {{ $t("Queue.team2") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Available queues -->
      <v-row>
        <v-col cols="12">
          <v-card-title class="pl-0 pt-4">
            {{ $t("Queue.available") }}
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
            {{ $t("Queue.noQueues") }}
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
                {{ $t("Queue.expires") }} {{ formatExpiry(queue.expiresAt) }}
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
                {{ $t("Queue.join") }}
              </v-btn>
              <v-btn
                v-else-if="myQueue.name === queue.name"
                small
                color="error"
                text
                @click="leaveCurrentQueue"
                :loading="leaving"
              >
                {{ $t("Queue.leave") }}
              </v-btn>
              <span v-else class="caption grey--text">{{
                $t("Queue.alreadyIn")
              }}</span>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Create Queue Dialog -->
    <v-dialog v-model="createDialog" max-width="420">
      <v-card>
        <v-card-title>{{ $t("Queue.dialogTitle") }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="newQueueSize"
            :items="queueSizeOptions"
            :label="$t('Queue.playerCount')"
            outlined
            dense
          />
          <v-switch
            v-model="newQueuePrivate"
            :label="$t('Queue.privateSwitch')"
          />
          <v-switch
            v-model="newQueueManual"
            :label="$t('Queue.manualTeamsSwitch')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="createDialog = false">{{
            $t("Queue.cancel")
          }}</v-btn>
          <v-btn color="primary" @click="createQueue" :loading="creating">
            {{ $t("Queue.create") }}
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
      starting: false,
      createDialog: false,
      newQueueSize: 2,
      newQueuePrivate: false,
      newQueueManual: false,
      createdMatchId: null,
      serverStarting: false,
      sseClient: null,
      linkCopied: false,
      snackbar: { show: false, text: "", color: "success" },
      queueReadyForTeams: false,
      manualTeam1: [],
      manualTeam2: [],
      assignDialog: false,
      assigningPlayer: null
    };
  },
  computed: {
    queueSizeOptions() {
      const opts = [];
      for (let i = 1; i <= 10; i++) {
        let label;
        if (i === 1) label = this.$t("Queue.playerTest");
        else if (i % 2 === 0)
          label = this.$t("Queue.players2", { n: i, h: i / 2 });
        else label = this.$t("Queue.playersN", { n: i });
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
    },
    manualUnassigned() {
      const assigned = new Set([
        ...this.manualTeam1.map(p => p.steamId),
        ...this.manualTeam2.map(p => p.steamId)
      ]);
      return this.queuePlayers.filter(p => !assigned.has(p.steamId));
    },
    teamsValid() {
      return (
        this.manualUnassigned.length === 0 &&
        this.manualTeam1.length > 0 &&
        this.manualTeam2.length > 0
      );
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    if (this.user.id !== null) {
      await this.refreshQueues();
      const joinSlug = this.$route.query.join;
      if (joinSlug && !this.myQueue) {
        await this.joinQueue(joinSlug);
      }
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
        this.showSnack(this.$t("Queue.errorLoad"), "error");
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
          this.showSnack(this.$t("Queue.matchCreatedRedir"), "success");
          setTimeout(() => this.$router.push("/match/" + result.matchId), 2000);
        } else {
          this.myQueue = await this.GetQueue(slug);
          this.queuePlayers = await this.GetQueuePlayers(slug);
          await this.connectSSE(slug);
          this.showSnack(this.$t("Queue.joinedQueue"), "success");
        }
        await this.refreshQueues();
      } catch (err) {
        const msg = err?.response?.data?.error || this.$t("Queue.errorJoin");
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
          this.newQueuePrivate,
          this.newQueueManual
        );
        this.createDialog = false;
        if (result.matchId) {
          this.showSnack(this.$t("Queue.matchCreatedRedir"), "success");
          setTimeout(() => this.$router.push("/match/" + result.matchId), 2000);
          return;
        }
        this.myQueue = result.queue;
        this.queuePlayers = await this.GetQueuePlayers(result.queue.name);
        await this.connectSSE(result.queue.name);
        this.showSnack(this.$t("Queue.queueCreated"), "success");
        await this.refreshQueues();
      } catch (err) {
        const msg = err?.response?.data?.error || this.$t("Queue.errorCreate");
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
        this.showSnack(this.$t("Queue.leftQueue"), "info");
        await this.refreshQueues();
      } catch (err) {
        this.showSnack(this.$t("Queue.errorLeave"), "error");
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
        this.showSnack(this.$t("Queue.queueDeleted"), "info");
        await this.refreshQueues();
      } catch (err) {
        this.showSnack(this.$t("Queue.errorDelete"), "error");
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
          this.queueReadyForTeams = false;
          this.disconnectSSE();
          this.showSnack(this.$t("Queue.queueFull"), "success");
          if (data.matchId) {
            setTimeout(() => {
              this.$router.push("/match/" + data.matchId);
            }, 2000);
          }
        });

        this.sseClient.on("queueReadyForTeams", () => {
          this.queueReadyForTeams = true;
          // Initialize unassigned — all players
          this.manualTeam1 = [];
          this.manualTeam2 = [];
          this.showSnack(this.$t("Queue.readyForTeams"), "info");
        });

        await this.sseClient.connect();
      } catch (err) {
        void err;
      }
    },

    disconnectSSE() {
      if (this.sseClient) {
        try {
          this.sseClient.disconnect();
        } catch (e) {
          void e;
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
      if (diff <= 0) return this.$t("Queue.expired");
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return this.$t("Queue.timeIn", { n: minutes });
      return this.$t("Queue.timeInH", { n: Math.floor(minutes / 60) });
    },

    copyInviteLink() {
      if (!this.myQueue) return;
      const url = window.location.origin + "/queue?join=" + this.myQueue.name;
      const done = () => {
        this.linkCopied = true;
        setTimeout(() => {
          this.linkCopied = false;
        }, 2500);
      };
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(url)
          .then(done)
          .catch(() => {
            this.fallbackCopy(url);
            done();
          });
      } else {
        this.fallbackCopy(url);
        done();
      }
    },

    fallbackCopy(text) {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    },

    assignPlayerDialog(player) {
      this.assigningPlayer = player;
      this.assignDialog = true;
    },

    assignToTeam(player, team) {
      this.assignDialog = false;
      this.assigningPlayer = null;
      if (team === 1) {
        this.manualTeam1.push(player);
      } else {
        this.manualTeam2.push(player);
      }
    },

    moveToUnassigned(player, fromTeam) {
      if (fromTeam === 1) {
        this.manualTeam1 = this.manualTeam1.filter(
          p => p.steamId !== player.steamId
        );
      } else {
        this.manualTeam2 = this.manualTeam2.filter(
          p => p.steamId !== player.steamId
        );
      }
    },

    autoBalance() {
      const all = [...this.queuePlayers];
      all.sort((a, b) => (b.hltvRating || 1) - (a.hltvRating || 1));
      this.manualTeam1 = [];
      this.manualTeam2 = [];
      all.forEach((p, i) => {
        if (i % 2 === 0) this.manualTeam1.push(p);
        else this.manualTeam2.push(p);
      });
    },

    async startManualMatch() {
      if (!this.myQueue || !this.teamsValid) return;
      this.starting = true;
      try {
        const team1Ids = this.manualTeam1.map(p => p.steamId);
        const team2Ids = this.manualTeam2.map(p => p.steamId);
        await this.SetQueueTeams(this.myQueue.name, team1Ids, team2Ids);
        const result = await this.StartManualQueue(this.myQueue.name);
        if (result.matchId) {
          this.createdMatchId = result.matchId;
          this.myQueue = null;
          this.queuePlayers = [];
          this.queueReadyForTeams = false;
          this.showSnack(this.$t("Queue.matchCreatedRedir"), "success");
          setTimeout(() => this.$router.push("/match/" + result.matchId), 2000);
        }
      } catch (err) {
        const msg = err?.response?.data?.error || this.$t("Queue.errorCreate");
        this.showSnack(msg, "error");
      } finally {
        this.starting = false;
      }
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
