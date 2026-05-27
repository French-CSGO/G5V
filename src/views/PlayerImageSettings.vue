<template>
  <v-container fluid class="player-images-settings">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h5 mb-4">
          <v-icon left>mdi-account-circle</v-icon>
          {{ $t("PlayerImages.Title") }}
        </h1>
      </v-col>
    </v-row>

    <!-- Upload section -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon left>mdi-upload</v-icon>
            {{ $t("PlayerImages.UploadTitle") }}
          </v-card-title>
          <v-card-text>
            <v-form ref="uploadForm" @submit.prevent="uploadImage">
              <v-text-field
                v-model="steamId"
                :label="$t('PlayerImages.SteamId')"
                :hint="$t('PlayerImages.SteamIdHint')"
                persistent-hint
                :rules="steamIdRules"
                outlined
                dense
                class="mb-3"
                prepend-icon="mdi-steam"
              />
              <v-file-input
                v-model="selectedFile"
                :label="$t('PlayerImages.SelectImage')"
                accept="image/png, image/jpeg, image/webp"
                :rules="fileRules"
                outlined
                dense
                prepend-icon="mdi-image"
                show-size
                class="mb-3"
                @change="onFileChange"
              />

              <!-- Image preview -->
              <div v-if="imagePreview" class="text-center mb-3">
                <v-avatar size="80" color="grey darken-3" class="elevation-3">
                  <img :src="imagePreview" style="object-fit: cover; width: 100%; height: 100%;" />
                </v-avatar>
                <div class="text-caption mt-1 grey--text">Aperçu</div>
              </div>

              <v-btn
                color="primary"
                :loading="uploading"
                :disabled="uploading"
                type="submit"
                block
              >
                <v-icon left>mdi-upload</v-icon>
                {{ $t("PlayerImages.Upload") }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Alert messages -->
        <v-alert v-if="successMsg" type="success" dismissible class="mt-3" @input="successMsg = ''">
          {{ successMsg }}
        </v-alert>
        <v-alert v-if="errorMsg" type="error" dismissible class="mt-3" @input="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
      </v-col>

      <!-- Current images list -->
      <v-col cols="12" md="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon left>mdi-image-multiple</v-icon>
            {{ $t("PlayerImages.CurrentImages") }}
            <v-spacer />
            <v-btn icon small @click="loadImages" :loading="loadingImages">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loadingImages" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else-if="playerImages.length === 0" class="text-center py-4 grey--text">
              <v-icon large class="mb-2">mdi-image-off</v-icon>
              <div>{{ $t("PlayerImages.NoImages") }}</div>
            </div>
            <v-list v-else dense>
              <v-list-item
                v-for="img in playerImages"
                :key="img"
                class="px-0"
              >
                <v-list-item-avatar size="40" color="grey darken-3">
                  <img
                    :src="`${apiUrl}/static/img/players/${img}`"
                    :alt="img"
                    style="object-fit: cover;"
                    @error="e => e.target.src = '/img/default_player.png'"
                  />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="text-caption">
                    {{ img.replace('.png', '').replace('.jpg', '') }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption grey--text">
                    <router-link :to="`/stats/player/${img.replace(/\.[^.]+$/, '')}`">
                      Voir stats
                    </router-link>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "PlayerImageSettings",
  data() {
    return {
      steamId: "",
      selectedFile: null,
      imagePreview: null,
      uploading: false,
      loadingImages: false,
      playerImages: [],
      successMsg: "",
      errorMsg: "",
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
      steamIdRules: [
        v => !!v || this.$t("PlayerImages.SteamIdRequired"),
        v => /^\d{17}$/.test(v) || this.$t("PlayerImages.InvalidSteamId")
      ],
      fileRules: [
        v => !!v || this.$t("PlayerImages.ImageRequired")
      ]
    };
  },
  async mounted() {
    await this.loadImages();
  },
  methods: {
    onFileChange(file) {
      if (!file) {
        this.imagePreview = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    async loadImages() {
      this.loadingImages = true;
      try {
        const images = await this.GetPlayerImages();
        this.playerImages = Array.isArray(images) ? images : [];
      } catch (err) {
        this.playerImages = [];
      } finally {
        this.loadingImages = false;
      }
    },
    async uploadImage() {
      if (!this.$refs.uploadForm.validate()) return;
      if (!this.selectedFile) {
        this.errorMsg = this.$t("PlayerImages.ImageRequired");
        return;
      }
      this.uploading = true;
      this.successMsg = "";
      this.errorMsg = "";
      try {
        await this.UploadPlayerImage(this.steamId, this.selectedFile);
        this.successMsg = this.$t("PlayerImages.UploadSuccess");
        this.steamId = "";
        this.selectedFile = null;
        this.imagePreview = null;
        this.$refs.uploadForm.resetValidation();
        await this.loadImages();
      } catch (err) {
        this.errorMsg = this.$t("PlayerImages.UploadError") + ": " + (err?.response?.data?.error || err.message || "");
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>
