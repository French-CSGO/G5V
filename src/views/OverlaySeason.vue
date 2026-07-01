<template>
  <div class="overlay-root" :class="{ 'overlay-root--transparent': transparent }">
    <div v-if="loading" class="overlay-loading">
      <v-progress-circular indeterminate color="#e8523a" size="32" />
    </div>

    <div v-else-if="!playerStats" class="overlay-no-match">
      <span class="no-match-text">{{ $t("OverlaySeason.noData") }}</span>
    </div>

    <template v-else>
      <!-- Header : titre saison -->
      <div class="overlay-header">
        <span class="season-label">{{ seasonName || ($t("OverlaySeason.season") + " #" + seasonid) }}</span>
        <span class="player-name-header">{{ playerStats.name || steamid }}</span>
      </div>

      <!-- Panneaux alternants -->
      <transition name="fade" mode="out-in">
        <!-- Panneau joueur -->
        <div v-if="showPanel === 0" key="player" class="stat-panel">
          <div class="panel-title">{{ playerStats.name || steamid }}</div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-label">Parties</span>
              <span class="stat-value">{{ playerStats.total_maps || "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Victoires</span>
              <span class="stat-value">{{ playerStats.wins || "–" }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">K</span>
              <span class="stat-value">{{ playerStats.kills }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">D</span>
              <span class="stat-value">{{ playerStats.deaths }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">A</span>
              <span class="stat-value">{{ playerStats.assists }}</span>
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
              <span class="stat-label">Rating</span>
              <span class="stat-value rating-value">{{ playerRating }}</span>
            </div>
          </div>
          <div class="panel-badge">{{ $t("OverlaySeason.playerBadge") }}</div>
        </div>

        <!-- Panneau équipe (leaderboard saison) -->
        <div v-else key="team" class="stat-panel">
          <div class="panel-title">{{ $t("OverlaySeason.teamBadge") }}</div>
          <div class="lb-header">
            <span class="lbh-rank">#</span>
            <span class="lbh-name"></span>
            <span class="lbh-kda">K / D / A</span>
            <span class="lbh-rating">RTG</span>
          </div>
          <div class="team-rows">
            <div
              v-for="(p, i) in teamLeaderboard"
              :key="p.steamId"
              class="team-row"
              :class="{ 'team-row--self': p.steamId === steamid }"
            >
              <span class="tr-rank">{{ i + 1 }}</span>
              <span class="tr-name">{{ p.name }}</span>
              <span class="tr-kda">{{ p.kills }}/{{ p.deaths }}/{{ p.assists }}</span>
              <span class="tr-rating">{{ calcRating(p).toFixed(2) }}</span>
            </div>
          </div>
          <div class="panel-badge">{{ $t("OverlaySeason.teamBadge") }}</div>
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
  name: "OverlaySeason",
  data() {
    return {
      steamid: this.$route.params.steamid,
      seasonid: this.$route.params.seasonid,
      transparent: this.$route.query.transparent === "1",
      loading: true,
      seasonName: null,
      playerStats: null,
      teamLeaderboard: [],
      showPanel: 0,
      rotateTimer: null,
    };
  },
  computed: {
    playerAdr() {
      if (!this.playerStats || !this.playerStats.trp) return "–";
      return (this.playerStats.total_damage / this.playerStats.trp).toFixed(1);
    },
    playerHsp() {
      if (!this.playerStats) return "0%";
      return parseFloat(this.playerStats.hsp).toFixed(1) + "%";
    },
    playerRating() {
      if (!this.playerStats) return "–";
      return parseFloat(this.playerStats.average_rating).toFixed(2);
    },
  },
  async mounted() {
    await this.fetchData();
    this.startRotate();
  },
  beforeDestroy() {
    clearInterval(this.rotateTimer);
  },
  methods: {
    async fetchData() {
      try {
        // Stats du joueur pour la saison
        const playerRes = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/playerstats/${this.steamid}/season/${this.seasonid}`,
        );
        const raw = playerRes.data?.playerstats;
        if (!raw) {
          this.playerStats = null;
          return;
        }
        // L'API retourne un objet unique déjà agrégé
        this.playerStats = raw;

        // Nom de la saison
        try {
          const seasonRes = await this.axiosCall.get(
            `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${this.seasonid}`,
          );
          this.seasonName = seasonRes.data?.season?.name || null;
        } catch (e) {
          console.warn("Could not fetch season name", e);
        }

        // Leaderboard de la saison (tous les joueurs) pour contexte équipe
        const lbRes = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/leaderboard/players/${this.seasonid}`,
        );
        const lb = lbRes.data?.leaderboard || [];
        // Garder les 5 premiers + le joueur s'il n'est pas dedans
        const top5 = lb.slice(0, 5);
        const inTop = top5.some((p) => p.steamId === this.steamid);
        if (!inTop) {
          const self = lb.find((p) => p.steamId === this.steamid);
          if (self) top5.push(self);
        }
        this.teamLeaderboard = top5;
      } catch (e) {
        console.error("OverlaySeason fetch error", e);
        this.playerStats = null;
      } finally {
        this.loading = false;
      }
    },
    startRotate() {
      this.rotateTimer = setInterval(() => {
        this.showPanel = this.showPanel === 0 ? 1 : 0;
      }, 6000);
    },
    calcRating(p) {
      if (!p) return 0;
      if (p.average_rating != null) return parseFloat(p.average_rating);
      if (!p.trp) return 0;
      const r = p.trp;
      const kpr = p.kills / r;
      const dpr = p.deaths / r;
      const impact = 2.13 * kpr + 0.42 * (p.assists / r) - 0.41;
      const adr = p.total_damage ? p.total_damage / r : 0;
      return (0.0073 * (p.kast || 0) + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587);
    },
  },
};
</script>

<style scoped>
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

.overlay-root--transparent .season-label {
  color: #555;
}

.overlay-root--transparent .player-name-header {
  color: #c0392b;
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

.overlay-root--transparent .tr-rating {
  color: #c0392b;
}

.overlay-root--transparent .panel-badge {
  color: #999;
}

.overlay-root--transparent .lb-header {
  color: #999;
  border-bottom-color: rgba(0,0,0,0.1);
}

.overlay-root--transparent .tr-rank {
  color: #999;
}

.overlay-root--transparent .team-row--self .tr-rank {
  color: #c0392b;
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

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.season-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
}

.player-name-header {
  font-size: 13px;
  font-weight: 700;
  color: #e8523a;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

.team-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* En-tête colonnes */
.lb-header {
  display: flex;
  align-items: center;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
  padding: 0 4px 3px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 3px;
}

.lbh-rank  { width: 18px; text-align: center; }
.lbh-name  { flex: 1; }
.lbh-kda   { width: 90px; text-align: center; }
.lbh-rating { width: 36px; text-align: right; }

.team-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

.team-row--self {
  background: rgba(232, 82, 58, 0.18);
  font-weight: 700;
}

.tr-rank {
  width: 18px;
  text-align: center;
  font-size: 10px;
  color: #666;
  flex-shrink: 0;
}

.team-row--self .tr-rank {
  color: #e8523a;
}

.tr-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ddd;
}

.tr-kda {
  width: 90px;
  text-align: center;
  color: #fff;
  font-weight: 600;
}

.tr-rating {
  width: 36px;
  text-align: right;
  color: #e8523a;
  font-size: 11px;
  font-weight: 700;
}

.panel-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #555;
}

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
