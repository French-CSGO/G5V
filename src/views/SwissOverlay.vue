<template>
  <div class="swiss-overlay">
    <canvas ref="canvas" width="1920" height="1080"></canvas>
    <div v-if="loadError" class="swiss-overlay__error">{{ loadError }}</div>
  </div>
</template>

<script>
import defaultBg from "@/assets/swiss-background.png";
import SLOTS from "@/assets/swiss-slots.json";

export default {
  name: "SwissOverlay",
  data() {
    return {
      seasonId: this.$route.params.seasonId,
      resolvedAssignments: {},
      matchResults: {},
      lockedMatches: {},
      liveMatches: [],
      showNames: false,
      readabilityFill: false,
      readabilityFillColor: "#111318",
      readabilityFillOpacity: 55,
      readabilityShadow: true,
      logoScale: 100,
      winnerColor: "#2fbf71",
      loserColor: "#c13d4f",
      resultOpacity: 45,
      bgSrc: defaultBg,
      loadError: null,
    };
  },
  created() {
    // Non-reactive, same reasoning as SwissGenerator.vue: canvas Image
    // elements only ever get read by draw(), wrapping them in Vue's
    // reactivity system is pure overhead.
    this.teamImages = new Map();
    this.bgImage = new Image();
    this.bgImage.onload = () => this.draw();
    this.bgImage.onerror = () => this.draw();
    this.bgImage.src = this.bgSrc;
    this.refreshTimer = null;
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 30000);
  },
  beforeDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  },
  methods: {
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
    teamTagText(team) {
      if (team.tag) return team.tag;
      return (team.name || "?").trim().slice(0, 4).toUpperCase();
    },
    setBackground(src) {
      if (!src) return;
      this.bgSrc = src;
      this.bgImage.src = src;
    },
    async load() {
      try {
        const [board, liveMatches] = await Promise.all([
          this.GetSwissBoard(this.seasonId),
          this.GetSeasonRecentMatches(this.seasonId),
        ]);
        if (!board) {
          this.loadError = "Aucun tableau Swiss enregistré pour cette saison.";
          this.draw();
          return;
        }
        this.loadError = null;
        this.resolvedAssignments = board.resolvedAssignments || {};
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
        this.liveMatches = Array.isArray(liveMatches) ? liveMatches : [];
        this.loadLogos();
        this.reapplyResults();
      } catch (err) {
        this.loadError = "Impossible de charger la saison.";
        this.draw();
      }
    },
    loadLogos() {
      this.teamImages = new Map();
      Object.entries(this.resolvedAssignments).forEach(([slotId, team]) => {
        if (!team.src) return;
        const img = new Image();
        img.onload = () => this.draw();
        img.onerror = () => this.draw();
        img.src = team.src;
        this.teamImages.set(slotId, img);
      });
    },
    // Mirrors SwissGenerator.vue's autoFillResult/reapplyResults, but reads
    // team g5Ids straight from the denormalized resolvedAssignments instead
    // of a local teams array, and never writes anything back to the server
    // (this view is read-only).
    autoFillResult(base) {
      const a = this.resolvedAssignments[base + "-A"];
      const b = this.resolvedAssignments[base + "-B"];
      if (!a || !b || a.g5Id == null || b.g5Id == null) return;
      const match = this.liveMatches.find(
        (m) =>
          !m.cancelled &&
          m.end_time &&
          ((m.team1_id === a.g5Id && m.team2_id === b.g5Id) ||
            (m.team1_id === b.g5Id && m.team2_id === a.g5Id)),
      );
      if (!match || match.winner == null) return;
      if (match.winner === a.g5Id) this.$set(this.matchResults, base, "A");
      else if (match.winner === b.g5Id) this.$set(this.matchResults, base, "B");
    },
    reapplyResults() {
      const bases = new Set(SLOTS.map((s) => this.getMatchBase(s.id)));
      for (const base of bases) {
        if (this.lockedMatches[base]) continue;
        this.autoFillResult(base);
      }
      this.draw();
    },
    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      const W = this.canvas.width;
      const H = this.canvas.height;
      ctx.clearRect(0, 0, W, H);
      if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
        ctx.drawImage(this.bgImage, 0, 0, W, H);
      }

      for (const slot of SLOTS) {
        const team = this.resolvedAssignments[slot.id];
        if (!team) continue;
        const img = this.teamImages.get(slot.id);
        const hasLogo = !!(img && img.complete && img.naturalWidth > 0);

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
    },
  },
};
</script>

<style scoped>
.swiss-overlay {
  background: transparent;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.swiss-overlay canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}

.swiss-overlay__error {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
}
</style>
