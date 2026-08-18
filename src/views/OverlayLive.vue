<template>
  <div
    class="overlay-root"
    :class="{ 'overlay-root--transparent': transparent }"
  >
    <div v-if="loading" class="overlay-loading">
      <v-progress-circular indeterminate color="#e8523a" size="32" />
    </div>

    <div v-else-if="!match" class="overlay-no-match">
      <span class="no-match-text">{{ $t("OverlayLive.noMatch") }}</span>
    </div>

    <template v-else>
      <!-- Header : équipes + scores -->
      <div class="overlay-header">
        <span class="team-name team-name--left">{{ match.team1_string }}</span>
        <div class="scores-block">
          <!-- Score map courante -->
          <div class="map-row">
            <span class="map-name-label" v-if="currentMap">{{
              formatMapName(currentMap.map_name)
            }}</span>
            <span class="map-score-val">
              {{ currentMap ? currentMap.team1_score : 0 }}
              <span class="score-sep">–</span>
              {{ currentMap ? currentMap.team2_score : 0 }}
            </span>
          </div>
          <!-- Score série (affiché uniquement en bo3/bo5) -->
          <div class="serie-row" v-if="match.max_maps > 1">
            <span class="serie-label">{{ $t("OverlayLive.serie") }}</span>
            <span class="serie-score">
              {{
                match.team1_series_score != null ? match.team1_series_score : 0
              }}
              –
              {{
                match.team2_series_score != null ? match.team2_series_score : 0
              }}
            </span>
          </div>
        </div>
        <span class="team-name team-name--right">{{ match.team2_string }}</span>
      </div>

      <!-- Pseudo + numéro de map -->
      <div class="player-subheader" v-if="playerStats">
        <span class="player-label">{{ playerStats.name }}</span>
        <span class="map-number-label" v-if="currentMap">
          · Map {{ currentMap.map_number }}/{{ match.max_maps }}</span
        >
      </div>

      <!-- Panneaux alternants -->
      <transition name="fade" mode="out-in">
        <!-- Panneau joueur -->
        <div v-if="showPanel === 0" key="player" class="stat-panel">
          <div class="panel-title">
            {{ playerStats ? playerStats.name : "–" }}
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-label">K</span>
              <span class="stat-value">{{
                playerStats ? playerStats.kills : "–"
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">D</span>
              <span class="stat-value">{{
                playerStats ? playerStats.deaths : "–"
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">A</span>
              <span class="stat-value">{{
                playerStats ? playerStats.assists : "–"
              }}</span>
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
              <span class="stat-value">{{
                playerStats ? playerStats.kast : "–"
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rating</span>
              <span class="stat-value rating-value">{{ playerRating }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MVP</span>
              <span class="stat-value">{{
                playerStats ? playerStats.mvp : "–"
              }}</span>
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
              <span class="tr-kda"
                >{{ p.kills }}/{{ p.deaths }}/{{ p.assists }}</span
              >
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
      currentMap: null,
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
      return (this.playerStats.damage / this.playerStats.roundsplayed).toFixed(
        1,
      );
    },
    playerHsp() {
      if (!this.playerStats || !Number(this.playerStats.kills)) return "0%";
      return (
        Math.round(
          (this.playerStats.headshot_kills / this.playerStats.kills) * 100,
        ) + "%"
      );
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
      if (data.currentMap !== undefined) this.currentMap = data.currentMap;
      if (data.playerStats) this.playerStats = data.playerStats;
      if (data.teamStats && data.teamStats.length)
        this.teamStats = data.teamStats;
    },
    formatMapName(map) {
      if (!map) return "";
      const names = {
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
      };
      return (
        names[map] ||
        map
          .replace(/^(de_|cs_)/, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
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
      return (
        0.0073 * (p.kast || 0) +
        0.3591 * kpr -
        0.5329 * dpr +
        0.2372 * impact +
        0.0032 * (p.damage / r) +
        0.1587
      );
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
  margin-bottom: 4px;
}

.team-name {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #ccc;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scores-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.map-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-name-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-score-val {
  font-size: 22px;
  font-weight: 900;
  color: #e8523a;
  letter-spacing: 2px;
}

.score-sep {
  font-size: 16px;
  color: #666;
  margin: 0 2px;
}

.serie-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.serie-label {
  font-size: 10px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.serie-score {
  font-size: 12px;
  font-weight: 700;
  color: #aaa;
}

/* Pseudo + map number */
.player-subheader {
  text-align: center;
  margin-bottom: 8px;
}

.player-label {
  color: #e8523a;
  font-weight: 700;
  font-size: 12px;
}

.map-number-label {
  font-size: 11px;
  color: #666;
}

.overlay-root--transparent .map-score-val {
  color: #c0392b;
}
.overlay-root--transparent .map-name-label {
  color: #999;
}
.overlay-root--transparent .serie-label {
  color: #999;
}
.overlay-root--transparent .serie-score {
  color: #444;
}
.overlay-root--transparent .player-label {
  color: #c0392b;
}
.overlay-root--transparent .map-number-label {
  color: #777;
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
