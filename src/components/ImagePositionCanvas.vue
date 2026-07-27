<template>
  <div class="ipc-wrapper">
    <div class="ipc-stage" ref="stage" :style="stageStyle">
      <img
        v-if="background"
        v-show="!imgError"
        :src="background"
        alt=""
        aria-hidden="true"
        class="ipc-bg"
        draggable="false"
        @error="imgError = true"
        @load="imgError = false"
      />
      <div v-if="!background || imgError" class="ipc-bg-fallback">
        <v-icon>mdi-image-off</v-icon>
        <span v-if="!background">Aucun fond configuré</span>
        <span v-else>Fond introuvable ({{ background }})</span>
      </div>

      <div
        v-for="p in points"
        :key="p.markerId"
        class="ipc-point"
        :class="`ipc-point--${p.axis}`"
        :style="rootStyle(p)"
      >
        <div v-if="p.axis === 'y'" class="ipc-line ipc-line--h"></div>
        <div v-if="p.axis === 'x'" class="ipc-line ipc-line--v"></div>
        <div
          class="ipc-handle"
          role="button"
          tabindex="0"
          :aria-label="p.label"
          :class="{ 'ipc-handle--dragging': draggingId === p.markerId }"
          @pointerdown="startDrag(p, $event)"
        >
          <span class="ipc-dot" aria-hidden="true"></span>
          <span class="ipc-label">{{ p.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

export default {
  name: "ImagePositionCanvas",
  props: {
    background: { type: String, default: "" },
    canvasWidth: { type: Number, required: true },
    canvasHeight: { type: Number, required: true },
    // points: [{ markerId, path, label, x, y, axis: 'both'|'x'|'y' }]
    points: { type: Array, default: () => [] },
  },
  data() {
    return {
      imgError: false,
      draggingId: null,
    };
  },
  computed: {
    // Le fond est étiré pour remplir exactement canvasWidth x canvasHeight
    // côté serveur (ctx.drawImage(img, 0, 0, w, h)) — on reproduit le même
    // ratio ici pour que les points cliqués correspondent au pixel près.
    stageStyle() {
      return { aspectRatio: `${this.canvasWidth} / ${this.canvasHeight}` };
    },
  },
  methods: {
    rootStyle(p) {
      const leftPct = clamp(p.x, 0, this.canvasWidth) / (this.canvasWidth || 1) * 100;
      const topPct = clamp(p.y, 0, this.canvasHeight) / (this.canvasHeight || 1) * 100;
      if (p.axis === "y") {
        return { top: `${topPct}%` };
      }
      if (p.axis === "x") {
        return { left: `${leftPct}%` };
      }
      return { left: `${leftPct}%`, top: `${topPct}%` };
    },
    startDrag(p, evt) {
      evt.preventDefault();
      const stage = this.$refs.stage;
      this.draggingId = p.markerId;

      const move = (e) => {
        const rect = stage.getBoundingClientRect();
        const fx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const fy = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        const x =
          p.axis === "y" ? p.x : Math.round(fx * this.canvasWidth);
        const y =
          p.axis === "x" ? p.y : Math.round(fy * this.canvasHeight);
        this.$emit("drag", p.path, x, y, p.axis);
      };
      let onDestroy;
      const up = () => {
        this.draggingId = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (onDestroy) this.$off("hook:beforeDestroy", onDestroy);
      };
      onDestroy = () => up();
      this.$on("hook:beforeDestroy", onDestroy);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
  },
};
</script>

<style scoped>
.ipc-wrapper {
  width: 100%;
}
.ipc-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 50% /
    20px 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  user-select: none;
}
.ipc-bg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}
.ipc-bg-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ccc;
  font-size: 12px;
}
.ipc-point {
  position: absolute;
}
.ipc-point--both {
  transform: translate(-50%, -50%);
}
.ipc-point--y {
  left: 0;
  width: 100%;
  height: 0;
}
.ipc-point--x {
  top: 0;
  height: 100%;
  width: 0;
}
.ipc-line {
  position: absolute;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    rgba(232, 82, 58, 0.6) 0 6px,
    transparent 6px 12px
  );
}
.ipc-line--h {
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  width: 100%;
}
.ipc-line--v {
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: repeating-linear-gradient(
    180deg,
    rgba(232, 82, 58, 0.6) 0 6px,
    transparent 6px 12px
  );
}
.ipc-handle {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: grab;
  touch-action: none;
  padding: 2px 6px 2px 2px;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.3);
  white-space: nowrap;
  font-size: 11px;
  color: #fff;
  transform: translate(-50%, -50%);
}
.ipc-point--y .ipc-handle {
  left: 10px;
  top: 0;
}
.ipc-point--x .ipc-handle {
  top: 10px;
  left: 0;
}
.ipc-handle:hover {
  border-color: #e8523a;
}
.ipc-handle--dragging {
  cursor: grabbing;
  border-color: #e8523a;
  background: rgba(232, 82, 58, 0.85);
  z-index: 10;
}
.ipc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e8523a;
  flex: none;
}
.ipc-handle--dragging .ipc-dot {
  background: #fff;
}
</style>
