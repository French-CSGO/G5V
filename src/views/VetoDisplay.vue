<template>
  <div class="veto-display">
    <div v-if="!matchData" class="loading-state">
      <v-progress-circular indeterminate color="grey" size="48" />
    </div>
    <template v-else>
      <!-- Ligne 1 : maps restantes (pending) — toujours présente pour garder les décidées en bas -->
      <div class="veto-row pending-row">
        <div
          v-for="map in pendingMaps"
          :key="'p-' + map"
          class="map-card-wrapper"
        >
          <div class="map-card pending">
            <img class="map-bg" :src="mapImg(map)" @error="imgFallback" />
            <div class="card-footer">
              <div class="map-name">{{ formatMapName(map) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row-divider" />

      <!-- Ligne 2 : maps décidées dans l'ordre du veto -->
      <div v-if="decidedCards.length > 0" class="veto-row decided-row">
        <div
          v-for="card in decidedCards"
          :key="'d-' + card.id"
          class="map-card-wrapper"
        >
          <div
            :class="[
              'map-card',
              card.state,
              { decider: card.team_name === 'Decider' },
              {
                'waiting-side':
                  card.state === 'pick' &&
                  !card.side &&
                  card.team_name !== 'Decider',
              },
            ]"
          >
            <img class="map-bg" :src="mapImg(card.map)" @error="imgFallback" />
            <div v-if="card.state === 'ban'" class="ban-overlay" />

            <div class="card-footer">
              <div
                v-if="card.state !== 'standby'"
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
              <div
                v-if="
                  card.state !== 'standby' &&
                  card.team_name &&
                  card.team_name !== 'Decider'
                "
                class="team-name"
              >
                {{ card.team_name }}
              </div>
              <div
                v-if="
                  card.state === 'pick' && card.side && card.side !== 'none'
                "
                class="side-name"
              >
                {{ opposingTeam(card.team_name) }} {{ card.side.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
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
  name: "VetoDisplay",
  // Configuration for the SSE plugin/mixin: when `cleanup` is true,
  // all SSE connections opened by this component are automatically
  // closed when the component is destroyed/unmounted.
  sse: { cleanup: true },
  data() {
    return {
      vetoSSE: null,
      vetoSideSSE: null,
      matchData: null,
      mapPool: [], // ex: ['de_mirage', 'de_nuke', ...]
      vetoList: [], // [{id, map, team_name, pick_or_veto}]
      vetoSideList: [], // [{veto_id, team_name, side}]
    };
  },
  computed: {
    // Decider en standby si des bans ne sont pas encore arrivés
    deciderStandby() {
      const decidedMaps = new Set(this.vetoList.map((v) => v.map));
      return this.mapPool.some((m) => !decidedMaps.has(m));
    },
    // Ligne bas : maps pending + decider si standby
    pendingMaps() {
      return this.mapPool.filter((m) => {
        const veto = this.vetoList.find((v) => v.map === m);
        if (!veto) return true;
        return veto.team_name === "Decider" && this.deciderStandby;
      });
    },
    // Ligne haut : maps décidées (decider exclu si standby)
    decidedCards() {
      return [...this.vetoList]
        .filter(
          (veto) => !(veto.team_name === "Decider" && this.deciderStandby),
        )
        .sort((a, b) => a.id - b.id)
        .map((veto) => {
          const side = this.vetoSideList.find((s) => s.veto_id === veto.id);
          return {
            id: veto.id,
            map: veto.map,
            state: veto.pick_or_veto === "pick" ? "pick" : "ban",
            team_name: veto.team_name,
            side_team: side ? side.team_name : null,
            side: side ? side.side : null,
          };
        });
    },
  },
  async mounted() {
    const id = Number(this.$route.params.id);
    this.matchData = await this.GetMatchData(id);
    if (this.matchData && this.matchData.veto_mappool) {
      this.mapPool = this.matchData.veto_mappool.split(" ").filter(Boolean);
    }
    // Charger l'état existant (page ouverte en cours de veto)
    const combined = await this.GetVetoesOfMatch(id);
    if (Array.isArray(combined)) {
      this.vetoList = combined.map((v) => ({
        id: v.id,
        map: v.map,
        team_name: v.team_name,
        pick_or_veto: v.pick_or_veto,
      }));
      this.vetoSideList = combined
        .filter((v) => v.side)
        .map((v) => ({
          veto_id: v.id,
          team_name: v.team_name_side,
          side: v.side,
        }));
    }
    // Streaming si match en cours
    if (!this.matchData.end_time) {
      await this.startStreams(id);
    }
  },
  methods: {
    async startStreams(matchId) {
      try {
        this.vetoSSE = await this.GetStreamedVetoesOfMatch(matchId);
        await this.vetoSSE
          .on("vetodata", (arr) => {
            this.vetoList = arr.map((v) => ({
              id: v.id,
              map: v.map,
              team_name: v.team_name,
              pick_or_veto: v.pick_or_veto,
            }));
          })
          .connect();

        this.vetoSideSSE = await this.GetStreamedVetoSidesOfMatch(matchId);
        await this.vetoSideSSE
          .on("vetosidedata", (arr) => {
            this.vetoSideList = arr.map((s) => ({
              veto_id: s.veto_id,
              team_name: s.team_name,
              side: s.side,
            }));
          })
          .connect();
      } catch (e) {
        // Données statiques déjà chargées ou erreur lors de l'initialisation des streams :
        // on journalise l'erreur pour faciliter le diagnostic sans interrompre l'UI.
        console.error("Failed to start veto streams for match", matchId, e);
      }
    },
    mapImg(map) {
      return `/img/maps/${map}.jpg`;
    },
    imgFallback(e) {
      e.target.src = "/img/maps/_unknown.jpg";
    },
    formatMapName(map) {
      return (
        MAP_NAMES[map] ||
        map
          .replace(/^(de_|cs_|ar_)/, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
    },
    actionLabel(card) {
      if (card.state === "standby") return "...";
      if (card.team_name === "Decider") return "DECIDER";
      return card.state === "ban" ? "BAN" : "PICK";
    },
    opposingTeam(pickerName) {
      if (!this.matchData) return "";
      return pickerName === this.matchData.team1_string
        ? this.matchData.team2_string
        : this.matchData.team1_string;
    },
  },
};
</script>

<style scoped>
/* ── Conteneur global ───────────────────────────────── */
.veto-display {
  background: transparent;
  padding: 8px 16px;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

/* ── Ligne de cartes ────────────────────────────────── */
.veto-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  width: 100%;
}

/* Hauteur fixe par ligne */
.pending-row {
  min-height: 181px;
}

.row-divider {
  height: 10px;
}

.map-card-wrapper {
  flex: 1 1 calc(100% / 7 - 10px);
  max-width: calc(100% / 7 - 10px);
  min-width: 100px;
  box-sizing: border-box;
}

/* ── Carte de base ──────────────────────────────────── */
.map-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  height: 165px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition:
    box-shadow 0.35s ease,
    border-color 0.35s ease;
  background: #1a1a1a;
}

/* Image de fond */
.map-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Overlay rouge pour les bans ────────────────────── */
.ban-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 10, 10, 0.38);
  z-index: 1;
}

/* ── Footer texte ───────────────────────────────────── */
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
  font-size: 13px;
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
.action-badge.decider {
  color: #ffa94d;
}
.action-badge.standby {
  color: #aaaaaa;
  letter-spacing: 4px;
}

/* Map name */
.map-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Grisé + barré pour les bans */
.map-name--ban {
  color: #aaa;
  text-decoration: line-through;
}

/* Équipe */
.team-name {
  font-size: 15px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Side (ex: Team B CT) */
.side-name {
  font-size: 13px;
  color: #aaa;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Halos selon l'état ─────────────────────────────── */
.map-card.ban {
  border-color: #e53935;
  box-shadow:
    0 0 0 2px #e53935,
    0 0 22px 5px rgba(229, 57, 53, 0.55);
}

.map-card.pick {
  border-color: #43a047;
  box-shadow:
    0 0 0 2px #43a047,
    0 0 22px 5px rgba(67, 160, 71, 0.55);
}

.map-card.pick.decider {
  border-color: #fb8c00;
  box-shadow:
    0 0 0 2px #fb8c00,
    0 0 22px 5px rgba(251, 140, 0, 0.55);
}

/* Carte pending : légère lueur blanche */
.map-card.pending {
  border-color: rgba(255, 255, 255, 0.2);
}

/* Standby : même apparence que pending */
.map-card.standby {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

/* Pick en attente du side : pulse gris */
.map-card.pick.waiting-side {
  border-color: #888;
  box-shadow:
    0 0 0 2px #888,
    0 0 22px 5px rgba(150, 150, 150, 0.4);
  animation: pulse-waiting 1.5s ease-in-out infinite;
}

@keyframes pulse-waiting {
  0%,
  100% {
    box-shadow:
      0 0 0 2px #888,
      0 0 18px 4px rgba(150, 150, 150, 0.35);
  }
  50% {
    box-shadow:
      0 0 0 2px #aaa,
      0 0 30px 10px rgba(180, 180, 180, 0.65);
  }
}
</style>
