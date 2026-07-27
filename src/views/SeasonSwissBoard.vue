<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon :to="`/season/${seasonId}/challonge`" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ seasonName }} — {{ $t("Swiss.Title") }}
        <v-spacer />
        <v-btn
          color="primary"
          small
          :href="imageUrl"
          target="_blank"
          :disabled="!currentTournament"
        >
          <v-icon left small>mdi-download</v-icon>
          {{ $t("Swiss.Download") }}
        </v-btn>
      </v-card-title>

      <v-tabs
        v-model="activeTournament"
        background-color="transparent"
        class="px-4"
      >
        <v-tab v-for="t in tournaments" :key="t.id">
          {{ t.label }}
        </v-tab>
      </v-tabs>
      <v-divider />

      <v-card-text v-if="loadingTournaments">
        <v-progress-linear indeterminate />
      </v-card-text>

      <v-card-text v-else-if="!currentTournament">
        <span class="grey--text">{{ $t("Challonge.NoBracket") }}</span>
      </v-card-text>

      <v-row v-else no-gutters>
        <!-- ─── Canvas ─────────────────────────────────────────────────── -->
        <v-col cols="12" md="9" class="pa-4">
          <v-row align="center" dense class="mb-2">
            <v-col cols="12" sm="auto">
              <v-file-input
                v-model="bgFile"
                :label="$t('Swiss.UploadBackground')"
                accept="image/png,image/jpeg"
                outlined
                dense
                hide-details
                style="max-width: 320px"
                prepend-icon="mdi-image"
              />
            </v-col>
            <v-col cols="12" sm="auto">
              <v-btn
                small
                color="secondary"
                :disabled="!bgFile || !canEdit"
                :loading="uploadingBg"
                @click="uploadBackground"
              >
                <v-icon left small>mdi-upload</v-icon>
                {{ $t("Swiss.UploadBackground") }}
              </v-btn>
            </v-col>
            <v-spacer />
            <v-col cols="12" sm="auto" class="caption grey--text">
              {{ $t("Swiss.DragHint") }}
            </v-col>
          </v-row>

          <div ref="board" class="swiss-board" :style="boardStyle">
            <div
              v-for="placed in placedMatches"
              :key="placed.position.challonge_match_id"
              class="swiss-chip"
              :class="{ 'swiss-chip--draggable': canEdit }"
              :style="chipStyle(placed)"
              @pointerdown="canEdit && startDrag($event, placed)"
            >
              <div class="swiss-chip__row">
                <span
                  :class="{ 'swiss-chip__winner': isWinner(placed.match, 0) }"
                >
                  {{ teamName(placed.match, 0) }}
                </span>
                <span v-if="scoreOf(placed.match)">{{
                  scoreOf(placed.match)[0]
                }}</span>
              </div>
              <div class="swiss-chip__row">
                <span
                  :class="{ 'swiss-chip__winner': isWinner(placed.match, 1) }"
                >
                  {{ teamName(placed.match, 1) }}
                </span>
                <span v-if="scoreOf(placed.match)">{{
                  scoreOf(placed.match)[1]
                }}</span>
              </div>
              <v-icon
                v-if="canEdit"
                small
                class="swiss-chip__remove"
                @pointerdown.stop
                @click="unplace(placed.position.challonge_match_id)"
              >
                mdi-close
              </v-icon>
            </div>
          </div>
        </v-col>

        <!-- ─── Matchs à placer ────────────────────────────────────────── -->
        <v-col cols="12" md="3" class="pa-4">
          <v-subheader class="font-weight-bold px-0">
            {{ $t("Swiss.Unplaced") }}
          </v-subheader>
          <v-progress-linear v-if="loadingMatches" indeterminate class="mb-2" />
          <div v-for="group in groupedUnplaced" :key="group.round" class="mb-3">
            <v-chip small color="secondary" class="mb-1 font-weight-bold">
              {{ $t("Challonge.Round") }} {{ group.round }}
            </v-chip>
            <v-list dense>
              <v-list-item v-for="m in group.matches" :key="m.id" class="px-2">
                <v-list-item-content class="py-1">
                  <v-list-item-title class="caption">
                    {{ teamName(m, 0) }} vs {{ teamName(m, 1) }}
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action v-if="canEdit">
                  <v-btn icon small @click="place(m)">
                    <v-icon small>mdi-plus-box</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </div>
          <span
            v-if="!groupedUnplaced.length && !loadingMatches"
            class="caption grey--text"
          >
            {{ $t("Swiss.AllPlaced") }}
          </span>
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar v-model="snack" :color="snackColor" timeout="3000" bottom>
      {{ snackMsg }}
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "SeasonSwissBoard",
  data() {
    return {
      user: { id: -1, admin: false, super_admin: false },
      seasonName: "",
      seasonUserId: -1,
      tournaments: [],
      activeTournament: 0,
      matches: [],
      positions: [],
      loadingTournaments: false,
      loadingMatches: false,
      settings: null,
      bgFile: null,
      uploadingBg: false,
      previewTs: Date.now(),
      snack: false,
      snackMsg: "",
      snackColor: "success",
      drag: null,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
      resizeTick: 0,
    };
  },
  computed: {
    seasonId() {
      return this.$route.params.id;
    },
    canEdit() {
      return (
        this.user.id !== -1 &&
        (this.user.id === this.seasonUserId || this.IsAnyAdmin(this.user))
      );
    },
    currentTournament() {
      return this.tournaments[this.activeTournament] ?? null;
    },
    imageUrl() {
      if (!this.currentTournament) return "#";
      return `${this.GetSwissImageUrl(this.seasonId, this.currentTournament.id)}?t=${this.previewTs}`;
    },
    canvasSize() {
      return this.settings?.canvas ?? { width: 1920, height: 1080 };
    },
    boxSize() {
      const box = this.settings?.swiss?.box ?? { width: 340, height: 80 };
      return { width: box.width, height: box.height };
    },
    boardStyle() {
      return {
        aspectRatio: `${this.canvasSize.width} / ${this.canvasSize.height}`,
        backgroundImage: this.settings?.swiss?.background
          ? `url(${this.apiUrl}/static/img/${this.settings.swiss.background})`
          : "none",
      };
    },
    placedMatches() {
      const byId = new Map(this.matches.map((m) => [m.id, m]));
      return this.positions
        .filter((p) => byId.has(p.challonge_match_id))
        .map((p) => ({ position: p, match: byId.get(p.challonge_match_id) }));
    },
    groupedUnplaced() {
      const placedIds = new Set(
        this.positions.map((p) => p.challonge_match_id),
      );
      const unplaced = this.matches.filter((m) => !placedIds.has(m.id));
      const byRound = new Map();
      for (const m of unplaced) {
        const key = m.round ?? 0;
        if (!byRound.has(key)) byRound.set(key, { round: key, matches: [] });
        byRound.get(key).matches.push(m);
      }
      return [...byRound.values()].sort((a, b) => a.round - b.round);
    },
  },
  watch: {
    async activeTournament() {
      await this.loadMatches();
      await this.loadPositions();
      this.$nextTick(() => this.resizeTick++);
    },
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const season = await this.GetSeasonInfo(this.seasonId);
    if (season) {
      this.seasonName = season.name;
      this.seasonUserId = season.user_id;
    }
    this.settings = await this.GetImageSettings();
    this.loadingTournaments = true;
    const t = await this.GetChallongeTournaments(this.seasonId);
    this.tournaments = Array.isArray(t) ? t : [];
    this.loadingTournaments = false;
    if (this.tournaments.length) {
      await this.loadMatches();
      await this.loadPositions();
    }
    this.$nextTick(() => this.resizeTick++);
    window.addEventListener("resize", this.onResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onDrag);
  },
  methods: {
    onResize() {
      this.resizeTick++;
    },
    notify(msg, color = "success") {
      this.snackMsg = msg;
      this.snackColor = color;
      this.snack = true;
    },
    async loadMatches() {
      if (!this.currentTournament) return;
      this.loadingMatches = true;
      const result = await this.GetChallongeMatches(this.seasonId, {
        tournament_id: this.currentTournament.id,
      });
      this.matches = Array.isArray(result) ? result : [];
      this.loadingMatches = false;
    },
    async loadPositions() {
      if (!this.currentTournament) return;
      const result = await this.GetSwissPositions(
        this.seasonId,
        this.currentTournament.id,
      );
      this.positions = Array.isArray(result) ? result : [];
    },
    teamName(match, side) {
      const p = side === 0 ? match?.player1 : match?.player2;
      return p ? p.name : this.$t("Challonge.TeamTBD");
    },
    scoreOf(match) {
      if (!match?.score_in_sets?.length) return null;
      return match.score_in_sets.reduce(
        (acc, [a, b]) => [acc[0] + (a > b ? 1 : 0), acc[1] + (b > a ? 1 : 0)],
        [0, 0],
      );
    },
    isWinner(match, side) {
      if (match?.state !== "complete") return false;
      const score = this.scoreOf(match);
      if (!score) return false;
      return side === 0 ? score[0] > score[1] : score[1] > score[0];
    },
    chipStyle(placed) {
      const scaleX = this.boardWidth() / this.canvasSize.width;
      const w = this.boxSize.width * scaleX;
      const h = this.boxSize.height * scaleX;
      return {
        left: `${placed.position.x * scaleX - w / 2}px`,
        top: `${placed.position.y * scaleX - h / 2}px`,
        width: `${w}px`,
        height: `${h}px`,
      };
    },
    boardWidth() {
      // eslint-disable-next-line no-unused-expressions
      this.resizeTick; // dependency for reactivity on window resize
      return this.$refs.board?.clientWidth || this.canvasSize.width;
    },
    async place(match) {
      const x = Math.round(this.canvasSize.width / 2);
      const y = Math.round(this.canvasSize.height / 2);
      await this.SaveSwissPositions(this.seasonId, this.currentTournament.id, [
        { challonge_match_id: match.id, x, y },
      ]);
      this.positions.push({ challonge_match_id: match.id, x, y });
    },
    async unplace(challongeMatchId) {
      await this.DeleteSwissPosition(
        this.seasonId,
        this.currentTournament.id,
        challongeMatchId,
      );
      this.positions = this.positions.filter(
        (p) => p.challonge_match_id !== challongeMatchId,
      );
      this.previewTs = Date.now();
    },
    startDrag(event, placed) {
      const scaleX = this.boardWidth() / this.canvasSize.width;
      this.drag = {
        challongeMatchId: placed.position.challonge_match_id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: placed.position.x,
        startY: placed.position.y,
        scaleX,
      };
      window.addEventListener("pointermove", this.onDrag);
      window.addEventListener("pointerup", this.stopDrag, { once: true });
    },
    onDrag(event) {
      if (!this.drag) return;
      const dx = (event.clientX - this.drag.startClientX) / this.drag.scaleX;
      const dy = (event.clientY - this.drag.startClientY) / this.drag.scaleX;
      const pos = this.positions.find(
        (p) => p.challonge_match_id === this.drag.challongeMatchId,
      );
      if (!pos) return;
      pos.x = Math.max(
        0,
        Math.min(this.canvasSize.width, Math.round(this.drag.startX + dx)),
      );
      pos.y = Math.max(
        0,
        Math.min(this.canvasSize.height, Math.round(this.drag.startY + dy)),
      );
    },
    async stopDrag() {
      window.removeEventListener("pointermove", this.onDrag);
      if (!this.drag) return;
      const pos = this.positions.find(
        (p) => p.challonge_match_id === this.drag.challongeMatchId,
      );
      this.drag = null;
      if (!pos) return;
      await this.SaveSwissPositions(this.seasonId, this.currentTournament.id, [
        { challonge_match_id: pos.challonge_match_id, x: pos.x, y: pos.y },
      ]);
      this.previewTs = Date.now();
    },
    async uploadBackground() {
      if (!this.bgFile) return;
      this.uploadingBg = true;
      try {
        const form = new FormData();
        form.append("file", this.bgFile);
        const res = await this.UploadImageFile(form);
        this.settings.swiss.background = res.filename;
        await this.SaveImageSettings(this.settings);
        this.bgFile = null;
        this.previewTs = Date.now();
        this.notify(this.$t("Swiss.BackgroundSaved"));
      } catch {
        this.notify(this.$t("Swiss.BackgroundError"), "error");
      } finally {
        this.uploadingBg = false;
      }
    },
  },
};
</script>

<style scoped>
.swiss-board {
  position: relative;
  width: 100%;
  background-color: #0b0d12;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.swiss-chip {
  position: absolute;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 12px;
  color: #ffffff;
  user-select: none;
}

.swiss-chip--draggable {
  cursor: grab;
}

.swiss-chip--draggable:active {
  cursor: grabbing;
}

.swiss-chip__row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.swiss-chip__winner {
  color: #4caf50;
  font-weight: bold;
}

.swiss-chip__remove {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #1a1a2e;
  border-radius: 50%;
  cursor: pointer;
}
</style>
