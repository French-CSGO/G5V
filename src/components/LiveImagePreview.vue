<template>
  <div class="lip-wrapper">
    <div v-if="!url" class="lip-placeholder caption grey--text">
      {{ placeholder }}
    </div>
    <template v-else>
      <div class="lip-stage">
        <img v-if="imgUrl" :src="imgUrl" class="lip-img" />
        <div v-if="loading" class="lip-loading">
          <v-progress-circular
            indeterminate
            size="22"
            width="2"
            color="primary"
          />
        </div>
      </div>
      <v-alert v-if="error" type="error" dense class="mt-2">{{
        error
      }}</v-alert>
    </template>
  </div>
</template>

<script>
export default {
  name: "LiveImagePreview",
  props: {
    // URL POST complète (vide = aperçu désactivé, ex: ID manquant)
    url: { type: String, default: "" },
    // Objet settings complet à envoyer dans le body ({ settings })
    settings: { type: Object, required: true },
    placeholder: {
      type: String,
      default: "Renseignez un ID ci-dessus pour activer l'aperçu en direct.",
    },
  },
  data() {
    return {
      imgUrl: "",
      loading: false,
      error: "",
      debounceTimer: null,
      requestSeq: 0,
    };
  },
  watch: {
    settings: {
      deep: true,
      handler() {
        this.scheduleRefresh();
      },
    },
    url() {
      this.scheduleRefresh();
    },
  },
  mounted() {
    this.scheduleRefresh();
  },
  beforeDestroy() {
    clearTimeout(this.debounceTimer);
    if (this.imgUrl) URL.revokeObjectURL(this.imgUrl);
  },
  methods: {
    scheduleRefresh() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.refresh(), 500);
    },
    async refresh() {
      if (!this.url) {
        // Invalide toute requête en vol pour éviter qu'une réponse tardive réaffiche l'image
        this.requestSeq += 1;
        this.loading = false;
        if (this.imgUrl) URL.revokeObjectURL(this.imgUrl);
        this.imgUrl = "";
        this.error = "";
        return;
      }
      const seq = ++this.requestSeq;
      this.loading = true;
      try {
        const res = await this.axiosCall.post(
          this.url,
          { settings: this.settings },
          { responseType: "blob" },
        );
        if (seq !== this.requestSeq) return;
        const oldUrl = this.imgUrl;
        this.imgUrl = URL.createObjectURL(res.data);
        this.error = "";
        if (oldUrl) URL.revokeObjectURL(oldUrl);
      } catch (err) {
        if (seq !== this.requestSeq) return;
        let message = "Impossible de générer l'aperçu.";
        const data = err?.response?.data;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            message = JSON.parse(text)?.error || message;
          } catch {
            // keep default message
          }
        } else if (data?.error) {
          message = data.error;
        }
        const oldUrl = this.imgUrl;
        this.imgUrl = "";
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        this.error = message;
      } finally {
        if (seq === this.requestSeq) this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.lip-wrapper {
  width: 100%;
}
.lip-placeholder {
  padding: 24px;
  text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.lip-stage {
  position: relative;
  width: 100%;
}
.lip-img {
  display: block;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.lip-loading {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  padding: 6px;
  display: flex;
}
</style>
