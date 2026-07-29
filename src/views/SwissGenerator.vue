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
          se sauvegardent sur le serveur, pour cette saison. Une fois une saison
          chargée, les résultats se rafraîchissent automatiquement toutes les
          30s.
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
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="copyOverlayLink"
        >
          Copier le lien overlay OBS
        </button>
        <div class="swiss-gen__caption" style="margin-bottom: 6px">
          Lien en fond transparent pour une source navigateur OBS : reflète
          automatiquement le dernier tableau enregistré (clique sur "Enregistrer
          sur le serveur" après chaque changement) et se rafraîchit tout seul
          toutes les 30s.
        </div>
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="reapplyResultsClick"
        >
          Actualiser les résultats
        </button>
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="autoPlaceAll"
        >
          Placer automatiquement
        </button>
        <div class="swiss-gen__caption" style="margin-bottom: 6px">
          Si la saison est liée à Challonge, utilise directement le round et
          l'ordre des matchs du bracket swiss. Sinon, déduit le round de chaque
          match importé à partir des résultats déjà entrés (victoires/défaites).
          Dans les deux cas, place les matchs — ainsi que les équipes qualifiées
          (3-0/3-1/3-2) ou éliminées (0-3/1-3/2-3) — dans les bonnes cases.
        </div>
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

        <template v-if="unplacedChallongeMatches.length">
          <hr />
          <strong>Matchs Challonge non placés</strong>
          <div class="swiss-gen__caption" style="margin-bottom: 6px">
            Ces matchs viennent du dernier "Placer automatiquement" et n'ont pas
            pu être placés — la raison est indiquée sous chacun.
          </div>
          <div class="swiss-gen__match-list">
            <div
              v-for="(m, i) in unplacedChallongeMatches"
              :key="i"
              class="swiss-gen__match swiss-gen__match--unplaced"
            >
              {{ m.label }}
              <div class="swiss-gen__match-reason">{{ m.reason }}</div>
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
            <img v-if="team.src" :src="team.src" />
            <div v-else class="swiss-gen__team-tag">
              {{ teamTagText(team) }}
            </div>
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
      unplacedChallongeMatches: [],
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
    this.refreshTimer = null;
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.draw();
    window.addEventListener("keydown", this.onKeydown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeydown);
    if (this.refreshTimer) clearInterval(this.refreshTimer);
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
    // Boxes where the record already has 3 wins or 3 losses (e.g. 3-0, 1-3)
    // don't host a match: each of their A/B slots shows one qualified or
    // eliminated team, independent of the other slot in the same box.
    terminalKind(base) {
      const m = base.match(/^(\d+)-(\d+)-\d+$/);
      if (!m) return null;
      const wins = parseInt(m[1], 10);
      const losses = parseInt(m[2], 10);
      if (wins === 3) return "win";
      if (losses === 3) return "loss";
      return null;
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
      if (!team.src) return;
      const img = new Image();
      img.onload = () => this.draw();
      img.onerror = () => this.draw();
      img.src = team.src;
      this.teamImages.set(team.id, img);
    },
    teamTagText(team) {
      if (team.tag) return team.tag;
      return (team.name || "?").trim().slice(0, 4).toUpperCase();
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
        const hasLogo = !!(img && img.complete && img.naturalWidth > 0);
        if (team) {
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
          const terminal = this.terminalKind(base);
          if (terminal) {
            ctx.save();
            ctx.fillStyle = this.hexToRgba(
              terminal === "win" ? this.winnerColor : this.loserColor,
              this.resultOpacity,
            );
            ctx.fillRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
            ctx.restore();
          } else if (this.matchResults[base]) {
            ctx.save();
            const isWinner = this.matchResults[base] === side;
            ctx.fillStyle = this.hexToRgba(
              isWinner ? this.winnerColor : this.loserColor,
              this.resultOpacity,
            );
            ctx.fillRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
            ctx.restore();
          }

          if (hasLogo) {
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
          } else {
            // No logo (or it failed to load): fall back to the team tag so
            // the slot never renders blank.
            ctx.save();
            const fontSize = Math.max(14, Math.min(slot.w, slot.h) * 0.34);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            if (this.readabilityShadow) {
              ctx.shadowColor = "rgba(0,0,0,0.55)";
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
            }
            ctx.fillText(
              this.teamTagText(team),
              slot.x + slot.w / 2,
              slot.y + slot.h / 2 - (this.showNames ? 6 : 0),
              slot.w - 10,
            );
            ctx.restore();
          }

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
          tag: t.tag ?? null,
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
        if (this.terminalKind(base)) {
          this.status =
            "Cette case affiche une équipe qualifiée/éliminée : la couleur est automatique, il n'y a pas de gagnant à désigner.";
          return;
        }
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
        if (this.terminalKind(base)) {
          this.status =
            "Cette case affiche des équipes individuelles (qualifiée/éliminée), pas un match. Sélectionne une équipe seule pour la placer ici.";
          return;
        }
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
            tag: t.tag || null,
            src: t.logo ? `${this.apiUrl}/static/img/logos/${t.logo}.png` : "",
          };
          this.loadTeamImage(team);
          return team;
        });
        const customTeams = ((board && board.customTeams) || []).map((t) => {
          const team = {
            id: t.id,
            g5Id: null,
            name: t.name,
            tag: t.tag || null,
            src: t.src,
          };
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
        this.placeFromRecordsQuiet();
        this.startAutoRefresh();
      } catch (err) {
        this.importStatus = "Erreur : " + (err.message || err);
      }
    },
    async refreshMatches(silent = false) {
      if (!this.currentSeasonId) return;
      try {
        const seasonMatches = await this.GetSeasonRecentMatches(
          this.currentSeasonId,
        );
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
        this.placeFromRecordsQuiet();
        if (!silent) this.status = "Résultats des matchs actualisés.";
      } catch (err) {
        if (!silent)
          this.notify("Erreur lors de l'actualisation des résultats.", "error");
      }
    },
    startAutoRefresh() {
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      // Picks up matches that finish after the board was loaded/placed, so
      // the winner/loser coloring appears without anyone clicking anything —
      // it never overwrites locked matches (reapplyResults skips those) and
      // never auto-saves, so it can't clobber a concurrent editor's save.
      this.refreshTimer = setInterval(() => this.refreshMatches(true), 30000);
    },
    async copyOverlayLink() {
      if (!this.currentSeasonId) return;
      const url = new URL(
        `/overlay/swiss/${this.currentSeasonId}`,
        window.location.origin,
      ).href;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          this.legacyCopy(url);
        }
        this.notify("Lien overlay copié : " + url);
      } catch (err) {
        this.notify("Impossible de copier le lien.", "error");
      }
    },
    legacyCopy(text) {
      // Fallback for non-secure contexts (plain HTTP), where the async
      // Clipboard API is unavailable — the browser still allows the legacy
      // execCommand copy from a focused, selected element.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!ok) throw new Error("execCommand copy failed");
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
        // Denormalized team display data per slot, so the public read-only
        // OBS overlay can render the board from this one saved payload
        // without needing an authenticated call to fetch team info.
        const resolvedAssignments = {};
        Object.entries(this.assignments).forEach(([slotId, teamId]) => {
          const team = this.teams.find((t) => t.id === teamId);
          if (!team) return;
          resolvedAssignments[slotId] = {
            name: team.name,
            tag: team.tag || null,
            src: team.src || null,
            g5Id: team.g5Id ?? null,
          };
        });
        const board = {
          version: 1,
          backgroundSrc: this.bgSrc,
          customTeams,
          assignments,
          resolvedAssignments,
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
      this.refreshMatches();
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
      if (this.terminalKind(base)) return;
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
    // Boxes are grouped by "W-L" record (e.g. "2-1"), each box being one
    // real match except for terminal records (3 wins or 3 losses) whose
    // boxes just display individual teams. Walking the imported matches in
    // chronological order lets us derive each team's record *before* every
    // match they play, so every match (and every team that finishes with a
    // terminal record) can be dropped into its correct box automatically —
    // exactly what the previous rounds' results already imply.
    slotBucketBoxes() {
      const buckets = new Map();
      const seenBases = new Set();
      for (const slot of SLOTS) {
        const base = this.getMatchBase(slot.id);
        if (seenBases.has(base)) continue;
        seenBases.add(base);
        const m = base.match(/^(\d+)-(\d+)-(\d+)$/);
        if (!m) continue;
        const key = `${m[1]}-${m[2]}`;
        const n = parseInt(m[3], 10);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push({ base, n });
      }
      buckets.forEach((arr) => arr.sort((a, b) => a.n - b.n));
      return buckets;
    },
    // Shared box-filling core for both auto-placement strategies below: walks
    // `matches` (already in the right processing order) and, for each one,
    // drops the pair into the W-L bucket implied by each team's record
    // *before* that match, then updates the running record from the linked
    // G5 result before moving on.
    //
    // `overwrite: true` (Challonge path) always assigns the Nth non-locked
    // box of a bucket to the Nth match of that bucket, regardless of what
    // currently occupies it — Challonge is the authoritative source, so a
    // stale box left over from a previous run (or from the local-record
    // heuristic) must not block a real match from being placed. Without
    // this, once every box of a bucket held *some* team, no further match
    // for that bucket — including one that simply hadn't been played yet —
    // could ever find a slot. `overwrite: false` (local heuristic) only
    // ever fills genuinely empty boxes, since it's a best-effort guess and
    // shouldn't clobber existing placements.
    fillBoardFromOrderedMatches(matches, { overwrite = false } = {}) {
      const buckets = this.slotBucketBoxes();
      const usedIndex = new Map(); // bucket key -> next box index (overwrite mode)
      const isBoxUsable = (base) =>
        !this.lockedMatches[base] &&
        !this.assignments[base + "-A"] &&
        !this.assignments[base + "-B"];
      const nextBox = (key) => {
        const boxes = buckets.get(key) || [];
        if (!overwrite) return boxes.find((b) => isBoxUsable(b.base));
        let idx = usedIndex.get(key) || 0;
        while (idx < boxes.length && this.lockedMatches[boxes[idx].base]) idx++;
        usedIndex.set(key, idx + 1);
        return idx < boxes.length ? boxes[idx] : null;
      };
      const nextEmptyTerminalSlot = (key) => {
        for (const b of buckets.get(key) || []) {
          if (this.lockedMatches[b.base]) continue;
          if (!this.assignments[b.base + "-A"]) return b.base + "-A";
          if (!this.assignments[b.base + "-B"]) return b.base + "-B";
        }
        return null;
      };

      const records = new Map(); // g5Id -> { w, l }
      const getRecord = (gid) => records.get(gid) || { w: 0, l: 0 };

      let placedCount = 0;
      const skipReasons = { noTeam: 0, recordMismatch: 0, noBox: 0 };
      const skippedList = [];

      for (const { teamA, teamB, winnerG5Id, concluded, label } of matches) {
        if (!teamA || !teamB) {
          skipReasons.noTeam++;
          skippedList.push({ label, reason: "équipe non liée" });
        } else {
          const pairKey = [teamA.g5Id, teamB.g5Id].sort().join(":");
          if (overwrite || !this.placedPairKeys.has(pairKey)) {
            const recA = getRecord(teamA.g5Id);
            const recB = getRecord(teamB.g5Id);
            const key = `${recA.w}-${recA.l}`;
            const isTerminalRecord = recA.w === 3 || recA.l === 3;
            if (
              !isTerminalRecord &&
              key === `${recB.w}-${recB.l}` &&
              buckets.has(key)
            ) {
              const box = nextBox(key);
              if (box) {
                this.$set(this.assignments, box.base + "-A", teamA.id);
                this.$set(this.assignments, box.base + "-B", teamB.id);
                this.$delete(this.matchResults, box.base);
                // Prefer the winner already known from this match's own
                // source (Challonge's winner_id, or the linked G5 result)
                // over re-deriving purely from G5 data, since a round can
                // be resolved on Challonge without any G5 match backing it.
                if (concluded && winnerG5Id === teamA.g5Id) {
                  this.$set(this.matchResults, box.base, "A");
                } else if (concluded && winnerG5Id === teamB.g5Id) {
                  this.$set(this.matchResults, box.base, "B");
                } else {
                  this.autoFillResult(box.base);
                }
                placedCount++;
              } else {
                skipReasons.noBox++;
                skippedList.push({ label, reason: "case indisponible" });
              }
            } else {
              skipReasons.recordMismatch++;
              skippedList.push({
                label,
                reason:
                  "round pas encore atteint (résultat du round précédent manquant)",
              });
            }
          }

          if (concluded && winnerG5Id != null) {
            const recA = getRecord(teamA.g5Id);
            const recB = getRecord(teamB.g5Id);
            if (winnerG5Id === teamA.g5Id) {
              records.set(teamA.g5Id, { w: recA.w + 1, l: recA.l });
              records.set(teamB.g5Id, { w: recB.w, l: recB.l + 1 });
            } else if (winnerG5Id === teamB.g5Id) {
              records.set(teamB.g5Id, { w: recB.w + 1, l: recB.l });
              records.set(teamA.g5Id, { w: recA.w, l: recA.l + 1 });
            }
          }
        }
      }

      let terminalPlaced = 0;
      const placedTeamIds = new Set(Object.values(this.assignments));
      records.forEach((rec, gid) => {
        if (rec.w !== 3 && rec.l !== 3) return;
        const team = this.teams.find((t) => t.g5Id === gid);
        if (!team || placedTeamIds.has(team.id)) return;
        const slotId = nextEmptyTerminalSlot(`${rec.w}-${rec.l}`);
        if (slotId) {
          this.$set(this.assignments, slotId, team.id);
          placedTeamIds.add(team.id);
          terminalPlaced++;
        }
      });

      this.reapplyResults();
      const skipped =
        skipReasons.noTeam + skipReasons.recordMismatch + skipReasons.noBox;
      return { placedCount, terminalPlaced, skipped, skipReasons, skippedList };
    },
    describeSkips(skipReasons) {
      if (!skipReasons) return "";
      const parts = [];
      if (skipReasons.noTeam)
        parts.push(`${skipReasons.noTeam} équipe non liée`);
      if (skipReasons.recordMismatch)
        parts.push(`${skipReasons.recordMismatch} round pas encore atteint`);
      if (skipReasons.noBox)
        parts.push(`${skipReasons.noBox} case indisponible`);
      return parts.join(", ");
    },
    // Entry point for the "Placer automatiquement" button: prefers the
    // authoritative Challonge round/identifier ordering when the season is
    // Challonge-linked with a swiss/group stage, and falls back to the local
    // chronological-record heuristic otherwise (or if the Challonge call
    // fails, e.g. season not linked to Challonge at all).
    async autoPlaceAll() {
      if (!this.currentSeasonId) return;
      this.unplacedChallongeMatches = [];
      let challongeMatches = null;
      try {
        challongeMatches = await this.GetSeasonChallongeMatches(
          this.currentSeasonId,
        );
      } catch (err) {
        challongeMatches = null;
      }
      const placed =
        Array.isArray(challongeMatches) &&
        this.autoPlaceAllFromChallonge(challongeMatches);
      if (!placed) this.autoPlaceAllFromRecords();
    },
    // Challonge identifiers are short alphabetical codes (A, B, ... Z, AA...)
    // assigned in match order; compare by length first so "Z" < "AA".
    compareIdentifier(a, b) {
      const sa = String(a ?? "");
      const sb = String(b ?? "");
      if (sa.length !== sb.length) return sa.length - sb.length;
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    },
    labelForChallongeMatch(cm) {
      const name1 = cm.player1?.local_team?.name || cm.player1?.name || "?";
      const name2 = cm.player2?.local_team?.name || cm.player2?.name || "?";
      const round = cm.round != null ? `round ${cm.round}` : "round ?";
      const ident = cm.identifier ? ` (${cm.identifier})` : "";
      return `${name1} vs ${name2} — ${round}${ident}`;
    },
    // Returns false when the season has no Challonge swiss/group matches at
    // all (group_id unset), so the caller can fall back to the heuristic.
    autoPlaceAllFromChallonge(challongeMatches) {
      const importedById = new Map(this.importedMatches.map((m) => [m.id, m]));
      const groupMatches = challongeMatches.filter((m) => m.group_id != null);
      if (!groupMatches.length) return false;

      // Matches whose Challonge participant never resolved to a local G5
      // team at all (challonge_team_id missing on the G5 side) can't be
      // placed no matter what — surfaced directly instead of attempted.
      const unlinked = groupMatches.filter(
        (m) => !m.player1?.local_team || !m.player2?.local_team,
      );
      const swissMatches = groupMatches
        .filter((m) => m.player1?.local_team && m.player2?.local_team)
        .slice()
        .sort((a, b) => {
          if (a.round !== b.round) return (a.round || 0) - (b.round || 0);
          return this.compareIdentifier(a.identifier, b.identifier);
        });

      this.unplacedChallongeMatches = unlinked.map((m) => ({
        label: this.labelForChallongeMatch(m),
        reason:
          "équipe non liée à Challonge (challonge_team_id manquant côté G5)",
      }));

      // Even with nothing placeable via Challonge, let the caller still try
      // the local heuristic — it only depends on G5 data, so it's an
      // independent recovery path. The unlinked list above stays visible
      // either way.
      if (!swissMatches.length) return false;

      this.pushHistory();

      // GetSeasonTeams only returns teams explicitly added to the season's
      // roster, but Challonge's local_team resolution looks teams up
      // globally by challonge_team_id — a team can be in the Challonge
      // bracket without ever having been added to the G5 season roster.
      // Auto-register any such team here instead of silently dropping every
      // match it plays.
      swissMatches.forEach((cm) => {
        [cm.player1.local_team, cm.player2.local_team].forEach((lt) => {
          if (this.teams.some((t) => t.g5Id === lt.id)) return;
          const team = {
            id: this.uid(),
            g5Id: lt.id,
            name: lt.name,
            tag: lt.tag || null,
            src: lt.logo
              ? `${this.apiUrl}/static/img/logos/${lt.logo}.png`
              : "",
          };
          this.teams.push(team);
          this.loadTeamImage(team);
        });
      });

      // Challonge is authoritative for every team it references here: wipe
      // their existing non-locked placements first, so a stale/incorrect
      // box from an earlier run can't block (or duplicate) the correct one
      // computed below.
      const challongeTeamG5Ids = new Set();
      swissMatches.forEach((cm) => {
        challongeTeamG5Ids.add(cm.player1.local_team.id);
        challongeTeamG5Ids.add(cm.player2.local_team.id);
      });
      Object.keys(this.assignments).forEach((slotId) => {
        const base = this.getMatchBase(slotId);
        if (this.lockedMatches[base]) return;
        const placedTeam = this.teams.find(
          (t) => t.id === this.assignments[slotId],
        );
        if (
          placedTeam?.g5Id != null &&
          challongeTeamG5Ids.has(placedTeam.g5Id)
        ) {
          this.$delete(this.assignments, slotId);
          this.$delete(this.matchResults, base);
        }
      });

      const ordered = swissMatches.map((cm) => {
        const teamA = this.teams.find(
          (t) => t.g5Id === cm.player1.local_team.id,
        );
        const teamB = this.teams.find(
          (t) => t.g5Id === cm.player2.local_team.id,
        );
        // Prefer Challonge's own winner_id: a round can be resolved
        // directly on Challonge (score reported there) without a G5 match
        // ever being created or finished for it, and record progression
        // needs to know that regardless of G5's state. Fall back to the
        // linked G5 match's result when Challonge hasn't got one yet.
        let winnerG5Id = null;
        if (cm.winner_id != null) {
          if (cm.winner_id === cm.player1.id)
            winnerG5Id = cm.player1.local_team.id;
          else if (cm.winner_id === cm.player2.id)
            winnerG5Id = cm.player2.local_team.id;
        }
        let concluded = winnerG5Id != null;
        if (!concluded) {
          const g5m = cm.g5_match_id ? importedById.get(cm.g5_match_id) : null;
          if (g5m && !g5m.cancelled && g5m.end_time && g5m.winner != null) {
            concluded = true;
            winnerG5Id = g5m.winner;
          }
        }
        return {
          teamA,
          teamB,
          winnerG5Id,
          concluded,
          label: this.labelForChallongeMatch(cm),
        };
      });

      const { placedCount, terminalPlaced, skipped, skipReasons, skippedList } =
        this.fillBoardFromOrderedMatches(ordered, { overwrite: true });
      this.unplacedChallongeMatches =
        this.unplacedChallongeMatches.concat(skippedList);
      const skipDetail = this.describeSkips(skipReasons);
      this.status = `Placement automatique (Challonge) : ${placedCount} match(s) placé(s), ${terminalPlaced} équipe(s) qualifiée(s)/éliminée(s) placée(s)${skipped ? `, ${skipped} match(s) ignoré(s) (${skipDetail})` : ""}.`;
      this.notify(this.status);
      return true;
    },
    // Chronological-record ordering shared by the interactive fallback
    // button and the silent periodic pass below — derived purely from G5
    // match data, no Challonge call involved.
    orderedRecordMatches() {
      return this.importedMatches
        .filter((m) => !m.cancelled)
        .slice()
        .sort((a, b) => {
          const ta = a.end_time
            ? new Date(a.end_time).getTime()
            : Number.POSITIVE_INFINITY;
          const tb = b.end_time
            ? new Date(b.end_time).getTime()
            : Number.POSITIVE_INFINITY;
          if (ta !== tb) return ta - tb;
          return a.id - b.id;
        })
        .map((m) => ({
          teamA: this.teams.find((t) => t.g5Id === m.team1_id),
          teamB: this.teams.find((t) => t.g5Id === m.team2_id),
          winnerG5Id: m.winner,
          concluded: !!m.end_time,
        }));
    },
    autoPlaceAllFromRecords() {
      if (!this.importedMatches.length) {
        this.notify("Aucun match importé à placer.", "error");
        return;
      }
      this.pushHistory();

      const { placedCount, terminalPlaced, skipped, skipReasons } =
        this.fillBoardFromOrderedMatches(this.orderedRecordMatches());
      const skipDetail = this.describeSkips(skipReasons);
      this.status = `Placement automatique : ${placedCount} match(s) placé(s), ${terminalPlaced} équipe(s) qualifiée(s)/éliminée(s) placée(s)${skipped ? `, ${skipped} match(s) ignoré(s) (${skipDetail})` : ""}.`;
      this.notify(this.status);
    },
    // Runs on every load and on every 30s auto-refresh: picks up matches
    // that now exist internally in G5 (freshly created, or just concluded)
    // and drops them into any still-empty box their record implies — pure
    // local G5 data, never touches the Challonge API, so it can run on a
    // timer without burning through Challonge's rate limit. Non-destructive
    // (only fills empty boxes) and silent (no history entry, no toast),
    // since it fires automatically rather than from a user action.
    placeFromRecordsQuiet() {
      if (!this.importedMatches.length) {
        this.reapplyResults();
        return;
      }
      this.fillBoardFromOrderedMatches(this.orderedRecordMatches());
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

.swiss-gen__team-tag {
  width: 46px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #15171d;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--sg-text);
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

.swiss-gen__match--unplaced {
  cursor: default;
  border-color: #6d3a3a;
  background: #2a2020;
}

.swiss-gen__match-reason {
  color: #e08a8a;
  font-size: 11px;
  margin-top: 2px;
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
