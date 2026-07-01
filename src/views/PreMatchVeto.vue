<template>
  <div class="preveto-page">
    <div v-if="loading" class="center-state">
      <v-progress-circular indeterminate color="grey" size="48" />
      <div class="mt-4">{{ $t("PreMatchVeto.Loading") }}</div>
    </div>
    <div v-else-if="!state" class="center-state">
      <v-icon size="48" color="grey">mdi-alert-circle-outline</v-icon>
      <div class="mt-4">{{ $t("PreMatchVeto.NotFound") }}</div>
    </div>
    <template v-else>
      <div class="preveto-header">
        <div class="team-vs">
          <span :class="{ 'active-team': isAwaitingTeam('team1') }">{{
            state.team1_name
          }}</span>
          <span class="vs">vs</span>
          <span :class="{ 'active-team': isAwaitingTeam('team2') }">{{
            state.team2_name
          }}</span>
        </div>
        <v-chip small class="role-chip" color="primary" outlined>
          {{ $t(`PreMatchVeto.Role${roleSuffix}`) }}
        </v-chip>
      </div>

      <v-progress-linear
        v-if="state.timer_enabled && remainingSeconds !== null && isActive"
        :value="timerPercent"
        height="10"
        color="orange"
        class="mb-2"
      />
      <div
        v-if="state.timer_enabled && remainingSeconds !== null && isActive"
        class="timer-label"
      >
        {{ $t("PreMatchVeto.TimeLeft", { sec: remainingSeconds }) }}
      </div>

      <!-- Ready check -->
      <template v-if="state.status === 'awaiting_ready'">
        <v-alert type="info" dense text class="mt-2">
          {{ $t("PreMatchVeto.ReadyWaitingBoth") }}
        </v-alert>
        <div class="ready-row">
          <v-chip
            :color="state.ready.team1 ? 'success' : 'grey darken-2'"
            label
          >
            {{ state.team1_name }} —
            {{
              $t(
                state.ready.team1
                  ? "PreMatchVeto.ReadyDone"
                  : "PreMatchVeto.ReadyPending",
              )
            }}
          </v-chip>
          <v-chip
            :color="state.ready.team2 ? 'success' : 'grey darken-2'"
            label
          >
            {{ state.team2_name }} —
            {{
              $t(
                state.ready.team2
                  ? "PreMatchVeto.ReadyDone"
                  : "PreMatchVeto.ReadyPending",
              )
            }}
          </v-chip>
        </div>
        <div class="action-row">
          <v-btn
            v-if="state.ready.can_ready_team1"
            color="primary"
            :loading="busy"
            @click="markReady('team1')"
          >
            {{ $t("PreMatchVeto.ReadyButton") }}
            <span v-if="state.role === 'tablet'"
              >&nbsp;({{ state.team1_name }})</span
            >
          </v-btn>
          <v-btn
            v-if="state.ready.can_ready_team2"
            color="primary"
            :loading="busy"
            @click="markReady('team2')"
          >
            {{ $t("PreMatchVeto.ReadyButton") }}
            <span v-if="state.role === 'tablet'"
              >&nbsp;({{ state.team2_name }})</span
            >
          </v-btn>
        </div>
      </template>

      <!-- Status banner -->
      <v-alert
        v-if="state.status === 'awaiting_start'"
        type="info"
        dense
        text
        class="mt-2"
      >
        {{ $t("PreMatchVeto.WaitingStart", { team: state.team1_name }) }}
      </v-alert>
      <v-alert
        v-else-if="state.status === 'completed'"
        type="success"
        dense
        text
        class="mt-2"
      >
        <div>{{ $t("PreMatchVeto.Completed") }}</div>
        <div>{{ $t("PreMatchVeto.CompletedInfo") }}</div>
      </v-alert>
      <v-alert
        v-else-if="state.status === 'cancelled'"
        type="warning"
        dense
        text
        class="mt-2"
      >
        {{ $t("PreMatchVeto.Cancelled") }}
      </v-alert>
      <v-alert
        v-else-if="awaitingLabel"
        :type="state.can_act ? 'success' : 'info'"
        dense
        text
        class="mt-2"
      >
        {{ awaitingLabel }}
      </v-alert>

      <!-- Start choice -->
      <div
        v-if="state.status === 'awaiting_start' && state.can_act"
        class="action-row"
      >
        <v-btn color="primary" :loading="busy" @click="chooseStart('start')">
          {{ $t("PreMatchVeto.StartButton") }}
        </v-btn>
        <v-btn
          color="secondary"
          outlined
          :loading="busy"
          @click="chooseStart('swap')"
        >
          {{ $t("PreMatchVeto.SwapButton") }}
        </v-btn>
      </div>

      <!-- Side choice -->
      <div v-if="isSideChoice && state.can_act" class="action-row">
        <v-btn color="blue darken-2" :loading="busy" @click="chooseSide('ct')">
          {{ $t("PreMatchVeto.SideCT") }}
        </v-btn>
        <v-btn color="amber darken-3" :loading="busy" @click="chooseSide('t')">
          {{ $t("PreMatchVeto.SideT") }}
        </v-btn>
      </div>

      <!-- Map pool grid -->
      <div class="preveto-row">
        <div v-for="card in mapCards" :key="card.map" class="map-card-wrapper">
          <div
            :class="[
              'map-card',
              card.state,
              { clickable: card.clickable },
              { decider: card.isDecider },
            ]"
            @click="card.clickable ? chooseAction(card.map) : null"
          >
            <img class="map-bg" :src="mapImg(card.map)" @error="imgFallback" />
            <div v-if="card.state === 'ban'" class="ban-overlay" />
            <div class="card-footer">
              <div
                v-if="card.state !== 'pending'"
                class="action-badge"
                :class="card.state"
              >
                {{ actionLabel(card) }}
              </div>
              <div
                class="map-name"
                :class="{ 'map-name--ban': card.state === 'ban' }"
              >
                {{ formatMapName(card.map) }}
              </div>
              <div v-if="card.team_name" class="team-name">
                {{ card.team_name }}
              </div>
              <div v-if="card.side" class="side-name">
                {{ card.side_team }} {{ card.side.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin controls -->
      <div v-if="state.is_admin && isActive" class="admin-row">
        <v-btn color="warning" outlined :loading="busy" @click="forceStep">
          {{ $t("PreMatchVeto.AdminForce") }}
        </v-btn>
        <v-btn color="error" outlined @click="resetDialog = true">
          {{ $t("PreMatchVeto.AdminReset") }}
        </v-btn>
      </div>
      <div v-else-if="state.is_admin" class="admin-row">
        <v-btn color="error" outlined @click="resetDialog = true">
          {{ $t("PreMatchVeto.AdminReset") }}
        </v-btn>
      </div>
    </template>

    <v-dialog v-model="resetDialog" max-width="480">
      <v-card>
        <v-card-title>{{
          $t("PreMatchVeto.AdminResetConfirmTitle")
        }}</v-card-title>
        <v-card-text>{{
          $t("PreMatchVeto.AdminResetConfirmBody")
        }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="resetDialog = false">{{
            $t("PreMatchVeto.Cancel")
          }}</v-btn>
          <v-btn color="error" text @click="confirmReset">{{
            $t("PreMatchVeto.Confirm")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="showError" color="error" timeout="4000">
      {{ actionError }}
    </v-snackbar>
  </div>
</template>

<script>
const MAP_NAMES = {
  de_dust2: "Dust 2",
  de_mirage: "Mirage",
  de_inferno: "Inferno",
  de_nuke: "Nuke",
  de_overpass: "Overpass",
  de_anubis: "Anubis",
  de_ancient: "Ancient",
  de_vertigo: "Vertigo",
  de_cache: "Cache",
  de_train: "Train",
  de_cbble: "Cobblestone",
  de_tuscan: "Tuscan",
  de_basalt: "Basalt",
  cs_office: "Office",
  cs_agency: "Agency",
};

export default {
  name: "PreMatchVeto",
  sse: { cleanup: true },
  data() {
    return {
      token: null,
      loading: true,
      state: null,
      sseHandle: null,
      tickHandle: null,
      now: Date.now(),
      busy: false,
      resetDialog: false,
      actionError: "",
      showError: false,
    };
  },
  computed: {
    roleSuffix() {
      if (!this.state) return "";
      return this.state.role.charAt(0).toUpperCase() + this.state.role.slice(1);
    },
    isActive() {
      return (
        this.state &&
        (this.state.status === "awaiting_ready" ||
          this.state.status === "awaiting_start" ||
          this.state.status === "in_progress")
      );
    },
    isSideChoice() {
      return (
        this.state &&
        this.state.awaiting &&
        this.state.awaiting.type === "side_choice"
      );
    },
    remainingSeconds() {
      if (!this.state || !this.state.deadline) return null;
      const diff = Math.ceil(
        (new Date(this.state.deadline).getTime() - this.now) / 1000,
      );
      return diff > 0 ? diff : 0;
    },
    timerPercent() {
      if (
        !this.state ||
        !this.state.timer_seconds ||
        this.remainingSeconds === null
      )
        return 0;
      return Math.max(
        0,
        Math.min(100, (this.remainingSeconds / this.state.timer_seconds) * 100),
      );
    },
    awaitingLabel() {
      if (!this.state || !this.state.awaiting) return "";
      const awaiting = this.state.awaiting;
      const teamName = this.teamName(awaiting.team);
      if (awaiting.type === "side_choice") {
        return this.$t("PreMatchVeto.ChooseSide", {
          team: teamName,
          map: this.formatMapName(awaiting.map),
        });
      }
      if (this.state.can_act) {
        return awaiting.type === "ban"
          ? this.$t("PreMatchVeto.YourTurnBan")
          : this.$t("PreMatchVeto.YourTurnPick");
      }
      return this.$t("PreMatchVeto.WaitingTurn", {
        team: teamName,
        action:
          awaiting.type === "ban"
            ? this.$t("PreMatchVeto.ToBan")
            : this.$t("PreMatchVeto.ToPick"),
      });
    },
    mapCards() {
      if (!this.state) return [];
      const historyByMap = new Map(this.state.history.map((h) => [h.map, h]));
      const canPickNow =
        this.state.can_act &&
        this.state.awaiting &&
        (this.state.awaiting.type === "ban" ||
          this.state.awaiting.type === "pick");
      return this.state.map_pool.map((map) => {
        const entry = historyByMap.get(map);
        if (!entry) {
          return {
            map,
            state: "pending",
            clickable: canPickNow,
            team_name: null,
            side: null,
          };
        }
        return {
          map,
          state: entry.pick_or_veto === "pick" ? "pick" : "ban",
          clickable: false,
          team_name: entry.team_name !== "Decider" ? entry.team_name : null,
          isDecider: entry.team_name === "Decider",
          side: entry.side,
          side_team: entry.side_team,
        };
      });
    },
  },
  async mounted() {
    this.token = this.$route.params.token;
    await this.loadState();
    this.loading = false;
    if (this.state) {
      this.startTicker();
      await this.startStream();
    }
  },
  beforeDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle);
  },
  methods: {
    async loadState() {
      const res = await this.GetPreVetoState(this.token);
      if (res && res.role) {
        this.state = res;
      } else {
        this.state = null;
      }
    },
    startTicker() {
      this.tickHandle = setInterval(() => {
        this.now = Date.now();
      }, 1000);
    },
    async startStream() {
      try {
        this.sseHandle = await this.GetStreamedPreVeto(this.token);
        await this.sseHandle
          .on("prevetodata", (data) => {
            this.state = data;
          })
          .on("error", (err) =>
            console.error("Pre-match veto stream error:", err),
          )
          .connect();
      } catch (e) {
        console.error("Failed to start pre-match veto stream", e);
      }
    },
    teamName(teamKey) {
      if (!this.state) return "";
      return teamKey === "team1"
        ? this.state.team1_name
        : this.state.team2_name;
    },
    isAwaitingTeam(teamKey) {
      return (
        this.isActive &&
        this.state.awaiting &&
        this.state.awaiting.type !== "side_choice" &&
        this.state.awaiting.team === teamKey
      );
    },
    async handleResult(promise) {
      this.busy = true;
      try {
        const res = await promise;
        if (!res || res.ok === false) {
          this.actionError =
            (res && res.message) || this.$t("PreMatchVeto.ActionFailed");
          this.showError = true;
        }
      } finally {
        this.busy = false;
      }
    },
    markReady(team) {
      return this.handleResult(this.SubmitPreVetoReady(this.token, team));
    },
    chooseStart(choice) {
      return this.handleResult(
        this.SubmitPreVetoStartChoice(this.token, choice),
      );
    },
    chooseAction(map) {
      if (!this.state || !this.state.awaiting) return;
      return this.handleResult(
        this.SubmitPreVetoAction(this.token, this.state.awaiting.type, map),
      );
    },
    chooseSide(side) {
      return this.handleResult(this.SubmitPreVetoSide(this.token, side));
    },
    forceStep() {
      return this.handleResult(this.ForcePreVetoAdmin(this.token));
    },
    async confirmReset() {
      this.resetDialog = false;
      await this.handleResult(this.ResetPreVetoAdmin(this.token));
    },
    mapImg(map) {
      return `/img/maps/${map}.jpg`;
    },
    imgFallback(e) {
      e.target.src = "/img/maps/_unknown.jpg";
    },
    formatMapName(map) {
      if (!map) return "";
      return (
        MAP_NAMES[map] ||
        map
          .replace(/^(de_|cs_|ar_)/, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
    },
    actionLabel(card) {
      if (card.isDecider) return this.$t("PreMatchVeto.Decider");
      return card.state === "ban"
        ? this.$t("PreMatchVeto.Ban")
        : this.$t("PreMatchVeto.Pick");
    },
  },
};
</script>

<style scoped>
.preveto-page {
  background: transparent;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
}

.center-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  text-align: center;
}

.preveto-header {
  text-align: center;
  margin-bottom: 12px;
}

.team-vs {
  font-size: 24px;
  font-weight: 700;
}

.team-vs .vs {
  color: #888;
  font-size: 16px;
  margin: 0 10px;
}

.active-team {
  color: #e8523a;
}

.role-chip {
  margin-top: 6px;
}

.timer-label {
  text-align: center;
  font-size: 13px;
  color: #ccc;
  margin-bottom: 8px;
}

.ready-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 12px 0;
}

.action-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 16px 0;
}

.admin-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.preveto-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
}

.map-card-wrapper {
  flex: 1 1 calc(100% / 7 - 10px);
  max-width: calc(100% / 7 - 10px);
  min-width: 100px;
  box-sizing: border-box;
}

.map-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  height: 165px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: #1a1a1a;
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    transform 0.15s ease;
}

.map-card.clickable {
  cursor: pointer;
  border-color: #e8523a;
}

.map-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow:
    0 0 0 2px #e8523a,
    0 0 22px 5px rgba(232, 82, 58, 0.5);
}

.map-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ban-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 10, 10, 0.38);
  z-index: 1;
}

.card-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.88));
  padding: 24px 8px 8px;
  z-index: 2;
  text-align: center;
  line-height: 1.3;
}

.action-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 3px;
  margin-bottom: 2px;
}
.action-badge.ban {
  color: #ff6b6b;
}
.action-badge.pick {
  color: #69db7c;
}

.map-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-name--ban {
  color: #aaa;
  text-decoration: line-through;
}

.team-name {
  font-size: 13px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-name {
  font-size: 12px;
  color: #aaa;
  font-style: italic;
}

.map-card.ban {
  border-color: #e53935;
  box-shadow:
    0 0 0 2px #e53935,
    0 0 18px 4px rgba(229, 57, 53, 0.4);
}

.map-card.pick {
  border-color: #43a047;
  box-shadow:
    0 0 0 2px #43a047,
    0 0 18px 4px rgba(67, 160, 71, 0.4);
}

.map-card.pick.decider {
  border-color: #fb8c00;
  box-shadow:
    0 0 0 2px #fb8c00,
    0 0 18px 4px rgba(251, 140, 0, 0.4);
}
</style>
