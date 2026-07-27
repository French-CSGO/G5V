<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title class="headline">
        <v-icon left>mdi-account-box-multiple</v-icon>
        {{ $t("PlayerImages.title") }}
      </v-card-title>

      <v-progress-linear v-if="loadingUser" indeterminate color="primary" />

      <v-alert v-if="!loadingUser && !canAccess" type="error" class="ma-4">
        {{ $t("PlayerImages.accessDenied") }}
      </v-alert>

      <template v-if="!loadingUser && canAccess">
        <v-card-text>
          <v-autocomplete
            v-model="selectedPlayer"
            :items="autocompleteItems"
            :loading="loadingPlayers"
            :search-input.sync="searchQuery"
            item-text="name"
            item-value="steam_id"
            return-object
            clearable
            no-filter
            :label="$t('PlayerImages.searchLabel')"
            :no-data-text="$t('PlayerImages.noResults')"
            prepend-icon="mdi-magnify"
          >
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.steam_id }}</v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <template v-slot:selection="{ item }">
              {{ item.name }} ({{ item.steam_id }})
            </template>
          </v-autocomplete>

          <v-row v-if="selectedPlayer" align="center" class="mt-2">
            <v-col cols="auto">
              <v-avatar size="64">
                <img
                  v-if="selectedPlayerImageUrl"
                  :src="selectedPlayerImageUrl"
                />
                <v-icon v-else large>mdi-account</v-icon>
              </v-avatar>
            </v-col>
            <v-col>
              <v-file-input
                v-model="uploadFile"
                accept="image/*"
                :label="$t('PlayerImages.chooseFile')"
                prepend-icon="mdi-image"
                show-size
                hide-details
              />
            </v-col>
            <v-col cols="auto">
              <v-btn color="primary" :loading="uploading" @click="uploadImage">
                <v-icon left>mdi-upload</v-icon>
                {{ $t("PlayerImages.upload") }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-alert v-if="successMsg" type="success" dense class="mx-4">{{
          successMsg
        }}</v-alert>
        <v-alert v-if="errorMsg" type="error" dense class="mx-4">{{
          errorMsg
        }}</v-alert>

        <v-divider class="my-2" />

        <v-card-title class="subtitle-1">{{
          $t("PlayerImages.existingImages")
        }}</v-card-title>

        <v-progress-linear v-if="loadingImages" indeterminate color="primary" />

        <v-alert
          v-if="!loadingImages && images.length === 0"
          type="info"
          class="mx-4"
        >
          {{ $t("PlayerImages.noImages") }}
        </v-alert>

        <v-row class="pa-4" v-if="!loadingImages && images.length">
          <v-col
            v-for="img in decoratedImages"
            :key="img.filename"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="text-center"
          >
            <v-card outlined>
              <v-img :src="img.url" aspect-ratio="1" contain />
              <v-card-subtitle class="pb-0 text-truncate">
                <div>{{ img.name || $t("PlayerImages.unknownPlayer") }}</div>
                <div class="caption grey--text text-truncate">
                  {{ img.steamId }}
                </div>
              </v-card-subtitle>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  icon
                  small
                  color="error"
                  :title="$t('PlayerImages.delete')"
                  @click="confirmDelete(img)"
                >
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card v-if="imageToDelete">
        <v-card-title>{{ $t("PlayerImages.deleteConfirmTitle") }}</v-card-title>
        <v-card-text>{{ $t("PlayerImages.deleteConfirmBody") }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">{{
            $t("PlayerImages.cancel")
          }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteImage">{{
            $t("PlayerImages.confirm")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: "PlayerImages",
  data() {
    return {
      user: { id: null, admin: 0, super_admin: 0, cast: 0 },
      loadingUser: true,
      searchQuery: "",
      loadingPlayers: false,
      allPlayers: [],
      selectedPlayer: null,
      uploadFile: null,
      uploading: false,
      successMsg: "",
      errorMsg: "",
      images: [],
      loadingImages: false,
      deleteDialog: false,
      imageToDelete: null,
      deleting: false,
    };
  },
  computed: {
    canAccess() {
      return (
        Number(this.user.cast) === 1 ||
        Number(this.user.admin) === 1 ||
        Number(this.user.super_admin) === 1
      );
    },
    playerNameBySteamId() {
      const map = {};
      this.allPlayers.forEach((p) => {
        map[p.steam_id] = p.name;
      });
      return map;
    },
    filteredPlayers() {
      const query = (this.searchQuery || "").trim().toLowerCase();
      if (!query) return this.allPlayers;
      return this.allPlayers.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(query) ||
          (p.steam_id || "").toLowerCase().includes(query),
      );
    },
    autocompleteItems() {
      const items = [...this.filteredPlayers];
      if (
        this.selectedPlayer &&
        !items.find((i) => i.steam_id === this.selectedPlayer.steam_id)
      ) {
        items.unshift(this.selectedPlayer);
      }
      return items;
    },
    selectedPlayerImageUrl() {
      if (!this.selectedPlayer) return null;
      const match = this.images.find(
        (img) => img.steamId === this.selectedPlayer.steam_id,
      );
      return match ? match.url : null;
    },
    decoratedImages() {
      return this.images.map((img) => ({
        ...img,
        name: this.playerNameBySteamId[img.steamId] || null,
      }));
    },
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    this.loadingUser = false;
    if (this.canAccess) {
      // Charger la liste des joueurs avant les avatars pour pouvoir
      // afficher leur nom dans la galerie.
      await this.loadPlayers();
      await this.loadImages();
    }
  },
  methods: {
    async loadPlayers() {
      this.loadingPlayers = true;
      try {
        this.allPlayers = await this.SearchPlayers("");
      } catch {
        this.allPlayers = [];
      } finally {
        this.loadingPlayers = false;
      }
    },
    async loadImages() {
      this.loadingImages = true;
      try {
        const files = await this.GetPlayerImages();
        this.images = (files || []).map((filename) => ({
          filename,
          steamId: filename.replace(/\.[^.]+$/, ""),
          url: this.GetPlayerAvatarUrl(filename),
        }));
      } catch {
        this.images = [];
      } finally {
        this.loadingImages = false;
      }
    },
    async uploadImage() {
      this.successMsg = "";
      this.errorMsg = "";
      if (!this.selectedPlayer) {
        this.errorMsg = this.$t("PlayerImages.selectPlayerFirst");
        return;
      }
      if (!this.uploadFile) {
        this.errorMsg = this.$t("PlayerImages.chooseFileFirst");
        return;
      }
      this.uploading = true;
      try {
        const formData = new FormData();
        formData.append("file", this.uploadFile);
        formData.append("steam_id", this.selectedPlayer.steam_id);
        await this.UploadPlayerImage(formData);
        this.successMsg = this.$t("PlayerImages.uploadSuccess");
        this.uploadFile = null;
        await this.loadImages();
      } catch (err) {
        this.errorMsg =
          err.response?.data?.error || this.$t("PlayerImages.uploadError");
      } finally {
        this.uploading = false;
      }
    },
    confirmDelete(img) {
      this.imageToDelete = img;
      this.deleteDialog = true;
    },
    async deleteImage() {
      this.deleting = true;
      try {
        await this.DeletePlayerImage(this.imageToDelete.steamId);
        this.successMsg = this.$t("PlayerImages.deleteSuccess");
        this.deleteDialog = false;
        await this.loadImages();
      } catch (err) {
        this.errorMsg =
          err.response?.data?.error || this.$t("PlayerImages.deleteError");
      } finally {
        this.deleting = false;
      }
    },
  },
};
</script>
