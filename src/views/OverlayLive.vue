<template>
  <div class="overlay-root" :class="{ 'overlay-root--transparent': transparent }">
    <div v-if="loading" class="overlay-loading">
      <v-progress-circular indeterminate color="#e8523a" size="32" />
    </div>

    <div v-else-if="!match" class="overlay-no-match">
      <span class="no-match-text">{{ $t("OverlayLive.noMatch") }}</span>
    </div>

    <template v-else>
      <!-- Header : score du match -->
      <div class="overlay-header">
        <span class="team-name team-name--left">{{ match.team1_string }}</span>
        <div class="score-block">
          <span class="score">{{ match.team1_series_score != null ? match.team1_series_score : 0 }}</span>
          <span class="score-sep">–</span>
          <span class="score">{{ match.team2_series_score != null ? match.team2_series_score : 0 }}</span>
        </div>
        <span class="team-name team-name--right">{{ match.team2_string }}</span>
      </div>

      <!-- Pseudo du joueur + map score -->
      <div class="map-score">
        <span v-if="playerStats" class="player-label">{{ playerStats.name }}</span>
        <span class="map-score-sep" v-if="playerStats"> · </span>
        {{ $t("OverlayLive.map") }} {{ match.team1_score }} – {{ match.team2_score }}
      </div>

      <!-- Panneaux alternants -->
      <transition name="fade" mode="out-in">
        <!-- Panneau joueur -->
        <div v-if="showPanel === 0" key="player" class="stat-panel">
          <div class="panel-title">{{ playerStats ? playerStats.name : "–" }}</div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-label">K</span>
              <span class="stat-value">{{ playerStats ? playerStats.kills : "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">D</span>
              <span class="stat-value">{{ playerStats ? playerStats.deaths : "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">A</span>
              <span class="stat-value">{{ playerStats ? playerStats.assists : "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">ADR</span>
              <span class="stat-value">{{ playerAdr }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">HS%</span>
              <span class="stat-value">{{ playerHsp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">KAST</span>
              <span class="stat-value">{{ playerStats ? playerStats.kast : "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rating</span>
              <span class="stat-value rating-value">{{ playerRating }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MVP</span>
              <span class="stat-value">{{ playerStats ? playerStats.mvp : "–" }}</span>
            </div>
          </div>
          <div class="panel-badge">{{ $t("OverlayLive.playerBadge") }}</div>
        </div>

        <!-- Panneau équipe -->
        <div v-else key="team" class="stat-panel">
          <div class="panel-title">{{ teamName }}</div>
          <div class="team-rows">
            <div
              v-for="p in teamStats"
              :key="p.steam_id"
              class="team-row"
              :class="{ 'team-row--self': p.steam_id === steamid }"
            >
              <span class="tr-name">{{ p.name }}</span>
              <span class="tr-kda">{{ p.kills }}/{{ p.deaths }}/{{ p.assists }}</span>
              <span class="tr-adr">{{ calcAdr(p) }}</span>
              <span class="tr-rating">{{ calcRating(p).toFixed(2) }}</span>
            </div>
          </div>
          <div class="panel-badge">{{ $t("OverlayLive.teamBadge") }}</div>
        </div>
      </transition>

      <!-- Indicateurs de panneau -->
      <div class="panel-dots">
        <span class="dot" :class="{ active: showPanel === 0 }" />
        <span class="dot" :class="{ active: showPanel === 1 }" />
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "OverlayLive",
  sse: { cleanup: true },
  data() {
    return {
      steamid: this.$route.params.steamid,
      transparent: this.$route.query.transparent === "1",
      loading: true,
      match: null,
      playerStats: null,
      teamStats: [],
      showPanel: 0,
      rotateTimer: null,
      pollTimer: null,
    };
  },
  computed: {
    teamName() {
      if (!this.match || !this.teamStats.length) return "";
      const tid = this.teamStats[0]?.team_id;
      return tid === this.match.team1_id
        ? this.match.team1_string
        : this.match.team2_string;
    },
    playerAdr() {
      if (!this.playerStats || !this.playerStats.roundsplayed) return "–";
      return (this.playerStats.damage / this.playerStats.roundsplayed).toFixed(1);
    },
    playerHsp() {
      if (!this.playerStats || !Number(this.playerStats.kills)) return "0%";
      return Math.round((this.playerStats.headshot_kills / this.playerStats.kills) * 100) + "%";
    },
    playerRating() {
      if (!this.playerStats || !this.playerStats.roundsplayed) return "–";
      return this.calcRating(this.playerStats).toFixed(2);
    },
  },
  async mounted() {
    await this.fetchLive();
    this.startRotate();
    this.startPoll();
  },
  beforeDestroy() {
    clearInterval(this.rotateTimer);
    clearInterval(this.pollTimer);
  },
  methods: {
    async fetchLive() {
      try {
        const res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/playerstats/${this.steamid}/live`,
        );
        this.applyPayload(res.data);
      } catch (_) {
        // garde les données existantes si le poll échoue
      } finally {
        this.loading = false;
      }
    },
    applyPayload(data) {
      if (!data) return;
      if (data.match !== undefined) this.match = data.match;
      if (data.playerStats) this.playerStats = data.playerStats;
      if (data.teamStats && data.teamStats.length) this.teamStats = data.teamStats;
    },
    startRotate() {
      this.rotateTimer = setInterval(() => {
        this.showPanel = this.showPanel === 0 ? 1 : 0;
      }, 6000);
    },
    startPoll() {
      this.pollTimer = setInterval(() => {
        this.fetchLive();
      }, 10000);
    },
    calcAdr(p) {
      if (!p || !p.roundsplayed) return "–";
      return (p.damage / p.roundsplayed).toFixed(1);
    },
    calcRating(p) {
      if (!p || !p.roundsplayed) return 0;
      const r = p.roundsplayed;
      const kpr = p.kills / r;
      const dpr = p.deaths / r;
      const impact = 2.13 * kpr + 0.42 * (p.assists / r) - 0.41;
      return (0.0073 * (p.kast || 0) + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * (p.damage / r) + 0.1587);
    },
  },
};
</script>

<style scoped>
/* ── Racine : fond transparent pour l'intégration en overlay ── */
.overlay-root {
  background: rgba(11, 13, 18, 0.88);
  border: 1px solid rgba(232, 82, 58, 0.4);
  border-radius: 8px;
  width: 380px;
  padding: 10px 14px 8px;
  font-family: "Roboto", sans-serif;
  color: #fff;
  box-sizing: border-box;
  user-select: none;
}

/* Mode transparent : fond invisible, texte sombre */
.overlay-root--transparent {
  background: transparent;
  border-color: transparent;
  color: #111;
}

.overlay-root--transparent .team-name {
  color: #222;
}

.overlay-root--transparent .score {
  color: #c0392b;
}

.overlay-root--transparent .score-sep {
  color: #555;
}

.overlay-root--transparent .map-score {
  color: #555;
}

.overlay-root--transparent .panel-title {
  color: #c0392b;
}

.overlay-root--transparent .stat-label {
  color: #555;
}

.overlay-root--transparent .stat-value {
  color: #111;
}

.overlay-root--transparent .rating-value {
  color: #c0392b;
}

.overlay-root--transparent .tr-name {
  color: #222;
}

.overlay-root--transparent .tr-kda {
  color: #111;
}

.overlay-root--transparent .tr-adr {
  color: #555;
}

.overlay-root--transparent .panel-badge {
  color: #999;
}

.overlay-root--transparent .team-row--self {
  background: rgba(192, 57, 43, 0.12);
}

.overlay-root--transparent .dot {
  background: #bbb;
}

.overlay-root--transparent .dot.active {
  background: #c0392b;
}

.overlay-root--transparent .no-match-text {
  color: #555;
}

.overlay-loading,
.overlay-no-match {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.no-match-text {
  color: #888;
  font-size: 13px;
}

/* Header */
.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.team-name {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #ccc;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-block {
  display: flex;
  align-items: center;
  gap: 4px;
}

.score {
  font-size: 20px;
  font-weight: 900;
  color: #e8523a;
}

.score-sep {
  font-size: 16px;
  color: #666;
}

.map-score {
  text-align: center;
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}

.player-label {
  color: #e8523a;
  font-weight: 700;
  font-size: 12px;
}

.overlay-root--transparent .player-label {
  color: #c0392b;
}

/* Panneaux */
.stat-panel {
  min-height: 120px;
  position: relative;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #e8523a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Grille joueur */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.rating-value {
  color: #e8523a;
}

/* Tableau équipe */
.team-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.team-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

.team-row--self {
  background: rgba(232, 82, 58, 0.18);
  font-weight: 700;
}

.tr-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ddd;
}

.tr-kda {
  width: 70px;
  text-align: center;
  color: #fff;
  font-weight: 600;
}

.tr-adr {
  width: 48px;
  text-align: right;
  color: #aaa;
  font-size: 11px;
}

.tr-rating {
  width: 40px;
  text-align: right;
  color: #e8523a;
  font-size: 12px;
  font-weight: 700;
}

.overlay-root--transparent .tr-rating {
  color: #c0392b;
}

/* Badge panneau */
.panel-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #555;
}

/* Dots */
.panel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #444;
  transition: background 0.3s;
}

.dot.active {
  background: #e8523a;
}

/* Transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
