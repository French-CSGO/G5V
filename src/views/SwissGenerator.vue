<template>
  <v-container fluid class="swiss-gen">
    <div class="swiss-gen__app">
      <aside class="swiss-gen__aside">
        <h1 class="swiss-gen__title">Générateur Swiss Stage</h1>
        <p class="swiss-gen__hint">
          Importe les équipes d'une saison (ou des logos manuellement),
          sélectionne une équipe puis clique sur un emplacement du tableau.
        </p>

        <label class="swiss-gen__file-label">
          Ajouter des logos
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            multiple
            @change="onLogoFilesChange"
          />
        </label>
        <label class="swiss-gen__file-label">
          Changer l'image de fond
          <input
            ref="bgInput"
            type="file"
            accept="image/*"
            @change="onBgFileChange"
          />
        </label>

        <hr />
        <strong>Saison</strong>
        <p class="swiss-gen__hint" style="margin: 4px 0 8px">
          Charge les équipes, les matchs et le tableau déjà enregistré d'une
          saison. Toutes les modifications (placements, résultats, fond, style)
          se sauvegardent sur le serveur, pour cette saison.
        </p>
        <div class="swiss-gen__row">
          <input
            v-model="seasonIdInput"
            type="text"
            placeholder="ID de la saison"
          />
          <button type="button" @click="loadSeason">Charger</button>
        </div>
        <button
          type="button"
          class="primary"
          :disabled="!currentSeasonId || saving"
          @click="saveBoard"
        >
          {{ saving ? "Enregistrement..." : "Enregistrer sur le serveur" }}
        </button>
        <button type="button" @click="reapplyResultsClick">
          Réappliquer les résultats importés
        </button>
        <div class="swiss-gen__caption">{{ importStatus }}</div>

        <template v-if="importedMatches.length">
          <hr />
          <strong>Matchs importés</strong>
          <div class="swiss-gen__caption" style="margin-bottom: 6px">
            Sélectionne un match puis clique sur une case du tableau : les deux
            équipes sont placées d'un coup.
          </div>
          <div class="swiss-gen__match-list">
            <div
              v-for="m in unplacedMatches"
              :key="m.id"
              class="swiss-gen__match"
              :class="{ 'swiss-gen__match--active': m.id === selectedMatchId }"
              @click="selectMatch(m)"
            >
              {{ teamNameByG5Id(m.team1_id, m.team1_string) }} vs
              {{ teamNameByG5Id(m.team2_id, m.team2_string) }}
              <span v-if="m.end_time && !m.cancelled" class="swiss-gen__badge"
                >terminé</span
              >
            </div>
            <div v-if="!unplacedMatches.length" class="swiss-gen__empty">
              Tous les matchs importés sont placés.
            </div>
          </div>
        </template>

        <div class="swiss-gen__row">
          <button type="button" class="primary" @click="exportPng">
            Exporter PNG
          </button>
          <button type="button" @click="clearAll">Tout vider</button>
        </div>
        <button type="button" :disabled="!historyStack.length" @click="undo">
          Annuler (Ctrl+Z)
        </button>

        <hr />
        <label class="swiss-gen__small">
          <input v-model="showDebug" type="checkbox" @change="draw" />
          Afficher les zones de placement
        </label>
        <label class="swiss-gen__small">
          <input v-model="showNames" type="checkbox" @change="draw" />
          Afficher le nom sous le logo
        </label>
        <label class="swiss-gen__small">
          <input v-model="readabilityFill" type="checkbox" @change="draw" />
          Fond de lisibilité dans les cases
        </label>
        <div class="swiss-gen__row">
          <input
            v-model="readabilityFillColor"
            type="color"
            title="Couleur du fond de lisibilité"
            @input="draw"
          />
          <input
            v-model.number="readabilityFillOpacity"
            type="range"
            min="0"
            max="100"
            @input="draw"
          />
        </div>
        <div class="swiss-gen__caption">Couleur du fond + opacité</div>
        <label class="swiss-gen__small">
          <input v-model="readabilityShadow" type="checkbox" @change="draw" />
          Ombre portée sur les logos
        </label>
        <label class="swiss-gen__small">Taille globale des logos</label>
        <input
          v-model.number="logoScale"
          type="range"
          min="60"
          max="160"
          @input="draw"
        />
        <div class="swiss-gen__caption">
          {{ logoScale }}% — 100% = ajustement auto, au-dessus = plus grand
        </div>
        <div class="swiss-gen__status">{{ status }}</div>

        <hr />
        <strong>Équipes</strong>
        <div class="swiss-gen__row swiss-gen__row--search">
          <input
            v-model="teamSearch"
            type="text"
            placeholder="Rechercher une équipe..."
          />
          <button type="button" @click="clearSelection">Désélectionner</button>
        </div>
        <div class="swiss-gen__row">
          <button
            type="button"
            :class="{ 'active-mode': winnerMode }"
            @click="toggleWinnerMode"
          >
            Mode gagnant : {{ winnerMode ? "ON" : "OFF" }}
          </button>
          <button type="button" @click="clearResults">Effacer résultats</button>
        </div>
        <label class="swiss-gen__small">Couleur gagnant / perdant</label>
        <div class="swiss-gen__row">
          <input
            v-model="winnerColor"
            type="color"
            title="Couleur gagnant"
            @input="draw"
          />
          <input
            v-model="loserColor"
            type="color"
            title="Couleur perdant"
            @input="draw"
          />
        </div>
        <label class="swiss-gen__small"
          >Intensité de l'effet gagnant/perdant</label
        >
        <input
          v-model.number="resultOpacity"
          type="range"
          min="0"
          max="100"
          @input="draw"
        />
        <div class="swiss-gen__caption">
          {{ resultOpacity }}% — coloration des cases
        </div>
        <div class="swiss-gen__row">
          <button
            type="button"
            :class="{ 'active-lock': lockMode }"
            @click="toggleLockMode"
          >
            Mode verrouillage : {{ lockMode ? "ON" : "OFF" }}
          </button>
          <button type="button" @click="unlockAll">Tout déverrouiller</button>
        </div>
        <div class="swiss-gen__caption">
          En mode verrouillage, clique sur un match pour le verrouiller ou le
          déverrouiller.
        </div>

        <div class="swiss-gen__team-list">
          <div
            v-for="team in filteredTeams"
            :key="team.id"
            class="swiss-gen__team"
            :class="{ 'swiss-gen__team--active': team.id === selectedTeamId }"
            @click="selectTeam(team)"
          >
            <img :src="team.src" />
            <span :title="team.name"
              >{{ team.name
              }}<span v-if="team.g5Id != null" class="swiss-gen__badge"
                >G5</span
              ></span
            >
            <button
              type="button"
              class="swiss-gen__team-x"
              @click.stop="removeTeam(team)"
            >
              ×
            </button>
          </div>
          <div v-if="!filteredTeams.length" class="swiss-gen__empty">
            Aucune équipe trouvée.
          </div>
        </div>

        <hr />
        <p>
          <b>Utilisation rapide</b><br />
          1. Importe une saison ou ajoute des logos.<br />
          2. Clique sur une équipe.<br />
          3. Clique sur chaque rectangle correspondant.<br />
          4. Clic droit sur une zone pour la vider.<br />
          5. Exporte le PNG.
        </p>
        <p><kbd>Échap</kbd> désélectionne l'équipe.</p>
      </aside>

      <main class="swiss-gen__stage">
        <div class="swiss-gen__canvas-wrap">
          <canvas
            ref="canvas"
            width="1920"
            height="1080"
            @click="onCanvasClick"
            @contextmenu.prevent="onCanvasContextMenu"
          ></canvas>
        </div>
      </main>
    </div>

    <v-snackbar v-model="snack" :color="snackColor" timeout="3000" bottom>
      {{ snackMsg }}
    </v-snackbar>
  </v-container>
</template>

<script>
import defaultBg from "@/assets/swiss-background.png";
import SLOTS from "@/assets/swiss-slots.json";

const HISTORY_LIMIT = 100;

export default {
  name: "SwissGenerator",
  data() {
    return {
      teams: [],
      selectedTeamId: null,
      selectedMatchId: null,
      assignments: {},
      matchResults: {},
      lockedMatches: {},
      importedMatches: [],
      showDebug: false,
      showNames: false,
      teamSearch: "",
      readabilityFill: false,
      readabilityFillColor: "#111318",
      readabilityFillOpacity: 55,
      readabilityShadow: true,
      logoScale: 100,
      winnerMode: false,
      winnerColor: "#2fbf71",
      loserColor: "#c13d4f",
      resultOpacity: 45,
      lockMode: false,
      historyStack: [],
      status: "Aucune équipe sélectionnée.",
      bgSrc: defaultBg,
      seasonIdInput: "",
      currentSeasonId: null,
      importStatus: "Aucune saison chargée.",
      saving: false,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
      snack: false,
      snackMsg: "",
      snackColor: "success",
    };
  },
  computed: {
    filteredTeams() {
      const q = this.teamSearch.toLowerCase();
      return this.teams.filter((t) => t.name.toLowerCase().includes(q));
    },
    placedPairKeys() {
      const keys = new Set();
      const bases = new Set(SLOTS.map((s) => this.getMatchBase(s.id)));
      bases.forEach((base) => {
        const a = this.teams.find(
          (t) => t.id === this.assignments[base + "-A"],
        );
        const b = this.teams.find(
          (t) => t.id === this.assignments[base + "-B"],
        );
        if (a && b && a.g5Id != null && b.g5Id != null) {
          keys.add([a.g5Id, b.g5Id].sort().join(":"));
        }
      });
      return keys;
    },
    unplacedMatches() {
      return this.importedMatches.filter(
        (m) =>
          !this.placedPairKeys.has([m.team1_id, m.team2_id].sort().join(":")),
      );
    },
  },
  created() {
    // Non-reactive: canvas Image elements are wrapped by Vue's reactivity
    // system otherwise, which is both wasteful and unnecessary since only
    // draw() ever reads them.
    this.teamImages = new Map();
    this.bgImage = new Image();
    this.bgImage.onload = () => this.draw();
    this.bgImage.onerror = () => {
      this.status = "Impossible de charger l'image de fond.";
      this.draw();
    };
    this.bgImage.src = this.bgSrc;
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.draw();
    window.addEventListener("keydown", this.onKeydown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    notify(msg, color = "success") {
      this.snackMsg = msg;
      this.snackColor = color;
      this.snack = true;
    },
    uid() {
      return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random();
    },
    fitRect(imgW, imgH, box, padding = 8) {
      const maxW = Math.max(1, box.w - padding * 2);
      const maxH = Math.max(1, box.h - padding * 2);
      const ratio = Math.min(maxW / imgW, maxH / imgH);
      const scaleMultiplier = Math.max(10, this.logoScale) / 100;
      const w = imgW * ratio * scaleMultiplier;
      const h = imgH * ratio * scaleMultiplier;
      return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
    },
    hexToRgba(hex, opacityPercent = 100) {
      const h = (hex || "#111318").replace("#", "");
      const full =
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h;
      const num = parseInt(full, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    },
    getMatchBase(slotId) {
      return slotId.replace(/-(A|B)$/, "");
    },
    getSlotSide(slotId) {
      const m = slotId.match(/-(A|B)$/);
      return m ? m[1] : null;
    },
    getOpponentSlotId(slotId) {
      const side = this.getSlotSide(slotId);
      if (!side) return null;
      return this.getMatchBase(slotId) + "-" + (side === "A" ? "B" : "A");
    },
    setBackground(src) {
      if (!src) return;
      this.bgSrc = src;
      this.bgImage.src = src;
    },
    clearSelection() {
      this.selectedTeamId = null;
      this.selectedMatchId = null;
      this.status = "Aucune équipe sélectionnée.";
    },
    teamNameByG5Id(gid, fallback) {
      const t = this.teams.find((team) => team.g5Id === gid);
      return (t && t.name) || fallback || `#${gid}`;
    },
    selectMatch(m) {
      this.selectedTeamId = null;
      this.selectedMatchId = this.selectedMatchId === m.id ? null : m.id;
      this.status = this.selectedMatchId
        ? `Match sélectionné : ${this.teamNameByG5Id(m.team1_id, m.team1_string)} vs ${this.teamNameByG5Id(m.team2_id, m.team2_string)}`
        : "Aucune équipe sélectionnée.";
    },
    loadTeamImage(team) {
      const img = new Image();
      img.onload = () => this.draw();
      img.src = team.src;
      this.teamImages.set(team.id, img);
    },
    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      const W = this.canvas.width;
      const H = this.canvas.height;
      ctx.clearRect(0, 0, W, H);
      if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
        ctx.drawImage(this.bgImage, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#111318";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Fond en cours de chargement...", W / 2, H / 2);
      }

      for (const slot of SLOTS) {
        const teamId = this.assignments[slot.id];
        const team = this.teams.find((t) => t.id === teamId);
        const img = teamId ? this.teamImages.get(teamId) : null;
        if (team && img && img.complete) {
          if (this.readabilityFill) {
            ctx.save();
            ctx.fillStyle = this.hexToRgba(
              this.readabilityFillColor,
              this.readabilityFillOpacity,
            );
            ctx.fillRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
            ctx.restore();
          }

          const base = this.getMatchBase(slot.id);
          const side = this.getSlotSide(slot.id);
          if (this.matchResults[base]) {
            ctx.save();
            const isWinner = this.matchResults[base] === side;
            ctx.fillStyle = this.hexToRgba(
              isWinner ? this.winnerColor : this.loserColor,
              this.resultOpacity,
            );
            ctx.fillRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
            ctx.restore();
          }

          const r = this.fitRect(
            img.naturalWidth,
            img.naturalHeight,
            slot,
            this.showNames ? 13 : 7,
          );
          ctx.save();
          if (this.readabilityShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.55)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 2;
          }
          ctx.drawImage(img, r.x, r.y, r.w, r.h);
          ctx.restore();

          if (this.showNames) {
            ctx.save();
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "white";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 3;
            ctx.fillText(
              team.name,
              slot.x + slot.w / 2,
              slot.y + slot.h - 2,
              slot.w - 6,
            );
            ctx.restore();
          }
        }

        if (this.lockedMatches[this.getMatchBase(slot.id)]) {
          ctx.save();
          ctx.strokeStyle = "rgba(111,160,255,0.95)";
          ctx.lineWidth = 3;
          ctx.strokeRect(slot.x + 1.5, slot.y + 1.5, slot.w - 3, slot.h - 3);
          ctx.fillStyle = "rgba(111,160,255,0.08)";
          ctx.fillRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
          ctx.restore();
        }

        if (this.showDebug) {
          ctx.save();
          ctx.strokeStyle = this.assignments[slot.id] ? "#00ff88" : "#e8523a";
          ctx.lineWidth = 2;
          ctx.strokeRect(slot.x + 0.5, slot.y + 0.5, slot.w - 1, slot.h - 1);
          ctx.fillStyle = "#000a";
          ctx.fillRect(slot.x, slot.y, Math.min(slot.w, 110), 16);
          ctx.fillStyle = "white";
          ctx.font = "10px Arial";
          ctx.fillText(slot.id, slot.x + 3, slot.y + 11);
          ctx.restore();
        }
      }
    },
    snapshotState() {
      return {
        teams: this.teams.map((t) => ({
          id: t.id,
          name: t.name,
          src: t.src,
          g5Id: t.g5Id ?? null,
        })),
        assignments: { ...this.assignments },
        matchResults: { ...this.matchResults },
        lockedMatches: { ...this.lockedMatches },
        importedMatches: [...this.importedMatches],
        selectedTeamId: this.selectedTeamId,
        selectedMatchId: this.selectedMatchId,
        bgSrc: this.bgSrc,
        winnerMode: this.winnerMode,
        lockMode: this.lockMode,
      };
    },
    restoreState(state) {
      this.teams = state.teams || [];
      this.teamImages = new Map();
      this.teams.forEach((t) => this.loadTeamImage(t));
      this.assignments = state.assignments || {};
      this.matchResults = state.matchResults || {};
      this.lockedMatches = state.lockedMatches || {};
      this.importedMatches = state.importedMatches || [];
      this.selectedTeamId = state.selectedTeamId || null;
      this.selectedMatchId = state.selectedMatchId || null;
      this.winnerMode = !!state.winnerMode;
      this.lockMode = !!state.lockMode;
      if (state.bgSrc) this.setBackground(state.bgSrc);
      this.draw();
    },
    pushHistory() {
      this.historyStack.push(JSON.stringify(this.snapshotState()));
      if (this.historyStack.length > HISTORY_LIMIT) this.historyStack.shift();
    },
    undo() {
      if (!this.historyStack.length) return;
      const state = JSON.parse(this.historyStack.pop());
      this.restoreState(state);
      this.status = "Dernière action annulée.";
    },
    canvasPoint(evt) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((evt.clientX - rect.left) * this.canvas.width) / rect.width,
        y: ((evt.clientY - rect.top) * this.canvas.height) / rect.height,
      };
    },
    hitSlot(p) {
      return SLOTS.find(
        (s) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h,
      );
    },
    onCanvasClick(e) {
      const slot = this.hitSlot(this.canvasPoint(e));
      if (!slot) return;
      const base = this.getMatchBase(slot.id);

      if (this.lockMode) {
        this.pushHistory();
        if (this.lockedMatches[base]) {
          this.$delete(this.lockedMatches, base);
          this.status = "Match déverrouillé : " + base;
        } else {
          this.$set(this.lockedMatches, base, true);
          this.status = "Match verrouillé : " + base;
        }
        this.draw();
        return;
      }

      if (this.winnerMode) {
        if (this.lockedMatches[base]) {
          this.status =
            "Ce match est verrouillé. Déverrouille-le avant de modifier le résultat.";
          return;
        }
        const assignedTeamId = this.assignments[slot.id];
        const opponentSlotId = this.getOpponentSlotId(slot.id);
        const opponentAssignedTeamId = opponentSlotId
          ? this.assignments[opponentSlotId]
          : null;
        if (!assignedTeamId || !opponentAssignedTeamId) {
          this.status =
            "Pour désigner un gagnant, les deux équipes du match doivent être placées.";
          return;
        }
        this.pushHistory();
        const side = this.getSlotSide(slot.id);
        if (this.matchResults[base] === side) {
          this.$delete(this.matchResults, base);
          this.status = "Résultat retiré pour " + slot.label;
        } else {
          this.$set(this.matchResults, base, side);
          const team = this.teams.find((t) => t.id === assignedTeamId);
          this.status = team.name + " déclaré gagnant dans " + slot.label;
        }
        this.draw();
        return;
      }

      if (this.selectedMatchId) {
        if (this.lockedMatches[base]) {
          this.status =
            "Ce match est verrouillé. Déverrouille-le avant de modifier ses équipes.";
          return;
        }
        const match = this.importedMatches.find(
          (m) => m.id === this.selectedMatchId,
        );
        if (!match) {
          this.selectedMatchId = null;
          return;
        }
        const teamA = this.teams.find((t) => t.g5Id === match.team1_id);
        const teamB = this.teams.find((t) => t.g5Id === match.team2_id);
        if (!teamA || !teamB) {
          this.status = "Les deux équipes de ce match doivent être importées.";
          return;
        }
        this.pushHistory();
        this.$set(this.assignments, base + "-A", teamA.id);
        this.$set(this.assignments, base + "-B", teamB.id);
        this.$delete(this.matchResults, base);
        this.status = `${teamA.name} vs ${teamB.name} placés dans ${base}`;
        this.autoFillResult(base);
        this.selectedMatchId = null;
        this.draw();
        return;
      }

      if (!this.selectedTeamId) {
        const assignedTeamId = this.assignments[slot.id];
        if (assignedTeamId) {
          this.selectedTeamId = assignedTeamId;
          const selectedTeam = this.teams.find((t) => t.id === assignedTeamId);
          this.status =
            "Équipe sélectionnée depuis le bracket : " + selectedTeam.name;
          return;
        }
        this.status = "Sélectionne d'abord une équipe.";
        return;
      }

      if (this.lockedMatches[base]) {
        this.status =
          "Ce match est verrouillé. Déverrouille-le avant de modifier ses équipes.";
        return;
      }

      this.pushHistory();
      this.$set(this.assignments, slot.id, this.selectedTeamId);
      const team = this.teams.find((t) => t.id === this.selectedTeamId);
      this.$delete(this.matchResults, base);
      this.status = `${team.name} placé dans ${slot.label}`;
      this.autoFillResult(base);
      this.draw();
    },
    onCanvasContextMenu(e) {
      const slot = this.hitSlot(this.canvasPoint(e));
      if (!slot) return;
      const base = this.getMatchBase(slot.id);
      if (this.lockedMatches[base]) {
        this.status =
          "Ce match est verrouillé. Déverrouille-le avant de le vider.";
        return;
      }
      this.pushHistory();
      this.$delete(this.assignments, slot.id);
      this.$delete(this.matchResults, base);
      this.status = slot.label + " vidé.";
      this.draw();
    },
    selectTeam(team) {
      this.selectedMatchId = null;
      this.selectedTeamId = team.id;
      this.status = "Équipe sélectionnée : " + team.name;
    },
    removeTeam(team) {
      this.pushHistory();
      this.teams = this.teams.filter((t) => t.id !== team.id);
      this.teamImages.delete(team.id);
      Object.keys(this.assignments).forEach((k) => {
        if (this.assignments[k] === team.id) {
          this.$delete(this.assignments, k);
          this.$delete(this.matchResults, this.getMatchBase(k));
        }
      });
      if (this.selectedTeamId === team.id) this.selectedTeamId = null;
      this.draw();
    },
    toggleWinnerMode() {
      this.winnerMode = !this.winnerMode;
      this.status = this.winnerMode
        ? "Mode gagnant activé : clique sur une équipe posée pour la déclarer gagnante."
        : "Mode gagnant désactivé.";
    },
    toggleLockMode() {
      this.lockMode = !this.lockMode;
      this.status = this.lockMode
        ? "Mode verrouillage activé : clique sur un match pour le verrouiller ou le déverrouiller."
        : "Mode verrouillage désactivé.";
    },
    unlockAll() {
      if (!Object.keys(this.lockedMatches).length) return;
      this.pushHistory();
      this.lockedMatches = {};
      this.status = "Tous les matchs ont été déverrouillés.";
      this.draw();
    },
    clearResults() {
      if (!Object.keys(this.matchResults).length) return;
      this.pushHistory();
      this.matchResults = {};
      this.status = "Tous les résultats ont été effacés.";
      this.draw();
    },
    clearAll() {
      if (!confirm("Vider tous les emplacements ?")) return;
      this.pushHistory();
      this.assignments = {};
      this.matchResults = {};
      this.lockedMatches = {};
      this.draw();
    },
    async uploadImage(file) {
      const form = new FormData();
      form.append("file", file);
      const res = await this.axiosCall.post(
        `${this.apiUrl}/image/upload/img`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return `${this.apiUrl}/static/img/${res.data.filename}`;
    },
    async onBgFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.pushHistory();
      try {
        const url = await this.uploadImage(file);
        this.setBackground(url);
        this.status = "Image de fond mise à jour : " + file.name;
      } catch (err) {
        this.notify("Erreur lors de l'upload du fond.", "error");
      }
      e.target.value = "";
    },
    async onLogoFilesChange(e) {
      if (e.target.files.length) this.pushHistory();
      for (const file of e.target.files) {
        try {
          const url = await this.uploadImage(file);
          const name = file.name.replace(/\.[^.]+$/, "");
          const team = { id: this.uid(), g5Id: null, name, src: url };
          this.teams.push(team);
          this.loadTeamImage(team);
        } catch (err) {
          this.notify(`Erreur lors de l'upload de ${file.name}.`, "error");
        }
      }
      this.draw();
      e.target.value = "";
    },
    exportPng() {
      const prev = this.showDebug;
      this.showDebug = false;
      this.draw();
      const a = document.createElement("a");
      a.download = "round-suisse.png";
      a.href = this.canvas.toDataURL("image/png");
      a.click();
      this.showDebug = prev;
      this.draw();
    },
    async loadSeason() {
      const seasonId = this.seasonIdInput.trim();
      if (!seasonId) {
        this.importStatus = "Indique un ID de saison.";
        return;
      }
      this.importStatus = "Chargement...";
      try {
        const [seasonTeams, seasonMatches, board] = await Promise.all([
          this.GetSeasonTeams(seasonId),
          this.GetSeasonRecentMatches(seasonId),
          this.GetSwissBoard(seasonId),
        ]);
        if (!Array.isArray(seasonTeams)) {
          throw new Error(
            typeof seasonTeams === "string"
              ? seasonTeams
              : "Saison introuvable.",
          );
        }
        this.pushHistory();
        this.currentSeasonId = seasonId;

        this.teamImages = new Map();
        const g5Teams = seasonTeams.map((t) => {
          const team = {
            id: this.uid(),
            g5Id: t.id,
            name: t.name,
            src: t.logo ? `${this.apiUrl}/static/img/logos/${t.logo}.png` : "",
          };
          this.loadTeamImage(team);
          return team;
        });
        const customTeams = ((board && board.customTeams) || []).map((t) => {
          const team = { id: t.id, g5Id: null, name: t.name, src: t.src };
          this.loadTeamImage(team);
          return team;
        });
        this.teams = [...g5Teams, ...customTeams];

        this.importedMatches = (
          Array.isArray(seasonMatches) ? seasonMatches : []
        ).map((m) => ({
          id: m.id,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          team1_string: m.team1_string,
          team2_string: m.team2_string,
          winner: m.winner,
          cancelled: !!m.cancelled,
          end_time: m.end_time,
        }));

        if (board) {
          const assignments = {};
          Object.entries(board.assignments || {}).forEach(([slotId, ref]) => {
            const team =
              ref && ref.kind === "g5"
                ? this.teams.find((t) => t.g5Id === ref.value)
                : this.teams.find((t) => t.g5Id == null && t.id === ref?.value);
            if (team) assignments[slotId] = team.id;
          });
          this.assignments = assignments;
          this.matchResults = board.matchResults || {};
          this.lockedMatches = board.lockedMatches || {};
          this.showNames = !!board.showNames;
          this.readabilityFill = !!board.readabilityFill;
          this.readabilityFillColor = board.readabilityFillColor || "#111318";
          this.readabilityFillOpacity = Number.isFinite(
            board.readabilityFillOpacity,
          )
            ? board.readabilityFillOpacity
            : 55;
          this.readabilityShadow =
            board.readabilityShadow !== undefined
              ? !!board.readabilityShadow
              : true;
          this.logoScale = Number.isFinite(board.logoScale)
            ? board.logoScale
            : 100;
          this.winnerColor = board.winnerColor || "#2fbf71";
          this.loserColor = board.loserColor || "#c13d4f";
          this.resultOpacity = Number.isFinite(board.resultOpacity)
            ? board.resultOpacity
            : 45;
          this.setBackground(board.backgroundSrc || defaultBg);
          this.importStatus = `${g5Teams.length} équipe(s), ${this.importedMatches.length} match(s) — tableau sauvegardé chargé.`;
        } else {
          this.assignments = {};
          this.matchResults = {};
          this.lockedMatches = {};
          this.setBackground(defaultBg);
          this.importStatus = `${g5Teams.length} équipe(s), ${this.importedMatches.length} match(s) importé(s). Aucun tableau sauvegardé pour cette saison.`;
        }
        this.selectedTeamId = null;
        this.selectedMatchId = null;
        this.reapplyResults();
      } catch (err) {
        this.importStatus = "Erreur : " + (err.message || err);
      }
    },
    async saveBoard() {
      if (!this.currentSeasonId) return;
      this.saving = true;
      try {
        const assignments = {};
        Object.entries(this.assignments).forEach(([slotId, teamId]) => {
          const team = this.teams.find((t) => t.id === teamId);
          if (!team) return;
          assignments[slotId] =
            team.g5Id != null
              ? { kind: "g5", value: team.g5Id }
              : { kind: "custom", value: team.id };
        });
        const customTeams = this.teams
          .filter((t) => t.g5Id == null)
          .map((t) => ({ id: t.id, name: t.name, src: t.src }));
        const board = {
          version: 1,
          backgroundSrc: this.bgSrc,
          customTeams,
          assignments,
          matchResults: this.matchResults,
          lockedMatches: this.lockedMatches,
          showNames: this.showNames,
          readabilityFill: this.readabilityFill,
          readabilityFillColor: this.readabilityFillColor,
          readabilityFillOpacity: this.readabilityFillOpacity,
          readabilityShadow: this.readabilityShadow,
          logoScale: this.logoScale,
          winnerColor: this.winnerColor,
          loserColor: this.loserColor,
          resultOpacity: this.resultOpacity,
        };
        await this.SaveSwissBoard(this.currentSeasonId, board);
        this.notify("Enregistré sur le serveur.");
      } catch (err) {
        this.notify(
          "Erreur lors de l'enregistrement : " + (err.message || err),
          "error",
        );
      } finally {
        this.saving = false;
      }
    },
    reapplyResultsClick() {
      this.pushHistory();
      this.reapplyResults();
      this.status = "Résultats importés réappliqués.";
    },
    reapplyResults() {
      const bases = new Set(SLOTS.map((s) => this.getMatchBase(s.id)));
      for (const base of bases) {
        if (this.lockedMatches[base]) continue;
        this.autoFillResult(base);
      }
      this.draw();
    },
    autoFillResult(base) {
      const slotA = SLOTS.find((s) => s.id === base + "-A");
      const slotB = SLOTS.find((s) => s.id === base + "-B");
      if (!slotA || !slotB) return;
      const teamA = this.teams.find((t) => t.id === this.assignments[slotA.id]);
      const teamB = this.teams.find((t) => t.id === this.assignments[slotB.id]);
      if (!teamA || !teamB || teamA.g5Id == null || teamB.g5Id == null) return;

      const match = this.importedMatches.find(
        (m) =>
          !m.cancelled &&
          m.end_time &&
          ((m.team1_id === teamA.g5Id && m.team2_id === teamB.g5Id) ||
            (m.team1_id === teamB.g5Id && m.team2_id === teamA.g5Id)),
      );
      if (!match || match.winner == null) return;
      if (match.winner === teamA.g5Id) this.$set(this.matchResults, base, "A");
      else if (match.winner === teamB.g5Id)
        this.$set(this.matchResults, base, "B");
    },
    onKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
        return;
      }
      if (e.key === "Escape") this.clearSelection();
    },
  },
};
</script>

<style scoped>
.swiss-gen {
  --sg-bg: #0b0d12;
  --sg-panel: #191c23;
  --sg-line: #343946;
  --sg-text: #f4f6fb;
  --sg-muted: #a8afbf;
  --sg-accent: #e8523a;
  color: var(--sg-text);
}

.swiss-gen__app {
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 16px;
  min-height: 80vh;
}

.swiss-gen__aside {
  background: var(--sg-panel);
  border: 1px solid var(--sg-line);
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  max-height: calc(100vh - 120px);
}

.swiss-gen__title {
  font-size: 20px;
  margin: 0 0 6px;
}

.swiss-gen__hint,
.swiss-gen p {
  color: var(--sg-muted);
  font-size: 13px;
  line-height: 1.4;
}

.swiss-gen button,
.swiss-gen__file-label,
.swiss-gen select,
.swiss-gen input[type="text"],
.swiss-gen input[type="color"],
.swiss-gen input[type="range"] {
  width: 100%;
  border: 1px solid var(--sg-line);
  background: #232733;
  color: var(--sg-text);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 5px 0;
  font-size: 14px;
  box-sizing: border-box;
}

.swiss-gen button,
.swiss-gen__file-label {
  cursor: pointer;
  text-align: center;
}

.swiss-gen input[type="color"] {
  padding: 4px;
  height: 42px;
}

.swiss-gen button.primary {
  background: var(--sg-accent);
  border-color: var(--sg-accent);
  font-weight: 700;
}

.swiss-gen button:hover,
.swiss-gen__file-label:hover {
  filter: brightness(1.1);
}

.swiss-gen input[type="file"] {
  display: none;
}

.swiss-gen hr {
  border: 0;
  border-top: 1px solid var(--sg-line);
  margin: 14px 0;
}

.swiss-gen__team-list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.swiss-gen__team {
  display: grid;
  grid-template-columns: 46px 1fr 34px;
  gap: 8px;
  align-items: center;
  padding: 7px;
  border: 1px solid var(--sg-line);
  border-radius: 8px;
  background: #20242e;
  cursor: pointer;
}

.swiss-gen__team--active {
  outline: 2px solid var(--sg-accent);
}

.swiss-gen__team img {
  width: 46px;
  height: 38px;
  object-fit: contain;
  background: #15171d;
  border-radius: 5px;
}

.swiss-gen__team span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.swiss-gen__badge {
  color: #6fa0ff;
  font-size: 10px;
  margin-left: 4px;
}

.swiss-gen__team-x {
  width: 30px;
  padding: 6px;
  margin: 0;
  background: #8f1f2f;
  border-color: #b33045;
  color: #fff;
  font-weight: 700;
}

.swiss-gen__empty {
  color: var(--sg-muted);
  font-size: 13px;
}

.swiss-gen__match-list {
  display: grid;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.swiss-gen__match {
  padding: 8px 10px;
  border: 1px solid var(--sg-line);
  border-radius: 8px;
  background: #20242e;
  cursor: pointer;
  font-size: 13px;
}

.swiss-gen__match--active {
  outline: 2px solid var(--sg-accent);
}

.swiss-gen__stage {
  position: relative;
  overflow: auto;
  background: #090a0d;
  border-radius: 8px;
  border: 1px solid var(--sg-line);
}

.swiss-gen__canvas-wrap {
  min-width: 960px;
  min-height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.swiss-gen__stage canvas {
  max-width: 100%;
  max-height: calc(100vh - 160px);
  box-shadow: 0 10px 40px #0008;
  cursor: crosshair;
}

.swiss-gen__status {
  font-size: 12px;
  color: var(--sg-muted);
  min-height: 34px;
  margin-top: 8px;
}

.swiss-gen__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.swiss-gen__row--search {
  grid-template-columns: 1fr 120px;
}

.swiss-gen__small {
  font-size: 12px;
  display: block;
}

.swiss-gen__caption {
  font-size: 12px;
  color: var(--sg-muted);
  margin-top: 2px;
}

.swiss-gen button.active-mode {
  background: #236d47;
  border-color: #2fbf71;
  color: #fff;
  font-weight: 700;
}

.swiss-gen button.active-lock {
  background: #2b4f85;
  border-color: #6fa0ff;
  color: #fff;
  font-weight: 700;
}

.swiss-gen button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.swiss-gen kbd {
  background: #0f1116;
  border: 1px solid var(--sg-line);
  border-bottom-width: 2px;
  border-radius: 4px;
  padding: 1px 5px;
}
</style>
