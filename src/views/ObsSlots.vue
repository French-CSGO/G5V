<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title class="headline">
        <v-icon left>mdi-broadcast</v-icon>
        {{ $t("ObsSlots.title") }}
      </v-card-title>
      <v-card-subtitle>{{ $t("ObsSlots.subtitle") }}</v-card-subtitle>

      <v-progress-linear v-if="loadingUser" indeterminate color="primary" />

      <v-alert v-if="!loadingUser && !canAccess" type="error" class="ma-4">
        {{ $t("ObsSlots.accessDenied") }}
      </v-alert>

      <template v-if="!loadingUser && canAccess">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newSlotLabel"
                :label="$t('ObsSlots.newSlotLabel')"
                prepend-icon="mdi-plus-box"
                clearable
                @keyup.enter="createSlot"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="auto">
              <v-btn color="primary" :loading="creating" @click="createSlot">
                <v-icon left>mdi-plus</v-icon>
                {{ $t("ObsSlots.create") }}
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

        <v-progress-linear v-if="loadingSlots" indeterminate color="primary" />

        <v-alert
          v-if="!loadingSlots && slots.length === 0"
          type="info"
          class="mx-4"
        >
          {{ $t("ObsSlots.noSlots") }}
        </v-alert>

        <v-expansion-panels class="pa-4" multiple v-if="slots.length">
          <v-expansion-panel v-for="slot in slots" :key="slot.id">
            <v-expansion-panel-header>
              <v-row align="center" no-gutters class="flex-nowrap">
                <v-col cols="12" sm="4" class="text-truncate">
                  <strong>{{ slot.label || slot.slug }}</strong>
                  <div class="caption grey--text text-truncate">
                    {{ slot.slug }}
                  </div>
                </v-col>
                <v-col cols="auto" class="mr-2" @click.stop>
                  <v-chip small :color="statusColor(slot)">{{
                    statusText(slot)
                  }}</v-chip>
                </v-col>
                <v-col class="text-truncate" @click.stop>
                  <span v-if="slot.match_id">
                    {{ slot.team1_string }} vs {{ slot.team2_string }}
                  </span>
                  <span v-else class="grey--text">{{
                    $t("ObsSlots.noMatchAssigned")
                  }}</span>
                </v-col>
              </v-row>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row align="center">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="slot.label"
                    :label="$t('ObsSlots.slotLabel')"
                    hide-details
                    @change="renameSlot(slot)"
                  />
                </v-col>
                <v-col cols="12" sm="5">
                  <v-autocomplete
                    :value="slot.match_id"
                    :items="matchOptions"
                    item-text="text"
                    item-value="id"
                    :label="$t('ObsSlots.assignMatch')"
                    clearable
                    hide-details
                    @change="(value) => assignMatch(slot, value)"
                  />
                </v-col>
                <v-col cols="12" sm="1" class="text-right">
                  <v-btn
                    icon
                    color="error"
                    :title="$t('ObsSlots.deleteSlot')"
                    @click="confirmDeleteSlot(slot)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

              <template v-if="slot.match_id">
                <v-divider class="my-3" />
                <div
                  v-for="group in linkGroups(slot)"
                  :key="group.title"
                  class="mb-3"
                >
                  <div class="overline grey--text">{{ group.title }}</div>
                  <v-list dense>
                    <v-list-item v-for="link in group.links" :key="link.url">
                      <v-list-item-content>
                        <v-list-item-title>{{ link.label }}</v-list-item-title>
                        <v-list-item-subtitle class="text-truncate">{{
                          link.url
                        }}</v-list-item-subtitle>
                      </v-list-item-content>
                      <v-list-item-action>
                        <v-btn icon @click="copyLink(link.url)">
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                      </v-list-item-action>
                    </v-list-item>
                  </v-list>
                </div>
              </template>
              <v-alert v-else type="info" dense class="mt-3">
                {{ $t("ObsSlots.assignToSeeLinks") }}
              </v-alert>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card v-if="slotToDelete">
        <v-card-title>{{ $t("ObsSlots.deleteConfirmTitle") }}</v-card-title>
        <v-card-text>{{ $t("ObsSlots.deleteConfirmBody") }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">{{
            $t("ObsSlots.cancel")
          }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSlot">{{
            $t("ObsSlots.confirm")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: "ObsSlots",
  data() {
    return {
      user: { id: null, admin: 0, super_admin: 0, cast: 0 },
      loadingUser: true,
      slots: [],
      loadingSlots: false,
      allMatches: [],
      newSlotLabel: "",
      creating: false,
      successMsg: "",
      errorMsg: "",
      deleteDialog: false,
      slotToDelete: null,
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
    matchOptions() {
      const active = [];
      const rest = [];
      this.allMatches.forEach((m) => {
        const item = {
          id: m.id,
          text: `#${m.id} — ${m.team1_string} vs ${m.team2_string}`,
        };
        if (!m.cancelled && !m.end_time) active.push(item);
        else rest.push(item);
      });
      return [...active, ...rest];
    },
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    this.loadingUser = false;
    if (this.canAccess) {
      await Promise.all([this.loadMatches(), this.loadSlots()]);
    }
  },
  methods: {
    async loadSlots() {
      this.loadingSlots = true;
      try {
        this.slots = await this.GetObsSlots();
      } catch {
        this.slots = [];
      } finally {
        this.loadingSlots = false;
      }
    },
    async loadMatches() {
      try {
        this.allMatches = (await this.GetAllMatches()) || [];
      } catch {
        this.allMatches = [];
      }
    },
    statusColor(slot) {
      if (!slot.match_id) return "grey lighten-1";
      if (slot.cancelled) return "red";
      if (!slot.end_time) return "green";
      return "blue-grey";
    },
    statusText(slot) {
      if (!slot.match_id) return this.$t("ObsSlots.statusUnassigned");
      if (slot.cancelled) return this.$t("ObsSlots.statusCancelled");
      if (!slot.end_time) return this.$t("ObsSlots.statusLive");
      return this.$t("ObsSlots.statusFinished");
    },
    async createSlot() {
      this.successMsg = "";
      this.errorMsg = "";
      this.creating = true;
      try {
        const slot = await this.CreateObsSlot(this.newSlotLabel || null);
        this.slots.push(slot);
        this.newSlotLabel = "";
        this.successMsg = this.$t("ObsSlots.createSuccess");
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || this.$t("ObsSlots.createError");
      } finally {
        this.creating = false;
      }
    },
    async renameSlot(slot) {
      try {
        await this.UpdateObsSlot(slot.id, { label: slot.label || null });
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || this.$t("ObsSlots.updateError");
      }
    },
    async assignMatch(slot, matchId) {
      this.errorMsg = "";
      try {
        const updated = await this.UpdateObsSlot(slot.id, {
          match_id: matchId ?? null,
        });
        Object.assign(slot, updated);
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || this.$t("ObsSlots.updateError");
      }
    },
    confirmDeleteSlot(slot) {
      this.slotToDelete = slot;
      this.deleteDialog = true;
    },
    async deleteSlot() {
      this.deleting = true;
      try {
        await this.DeleteObsSlot(this.slotToDelete.id);
        this.slots = this.slots.filter((s) => s.id !== this.slotToDelete.id);
        this.deleteDialog = false;
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || this.$t("ObsSlots.deleteError");
      } finally {
        this.deleting = false;
      }
    },
    async copyLink(url) {
      const absoluteUrl = new URL(url, window.location.origin).href;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(absoluteUrl);
        } else {
          this.legacyCopy(absoluteUrl);
        }
        this.successMsg = this.$t("ObsSlots.linkCopied");
      } catch {
        this.errorMsg = this.$t("ObsSlots.copyError");
      }
    },
    legacyCopy(text) {
      // Fallback for non-secure contexts (plain HTTP) where the async
      // Clipboard API is unavailable — the browser still allows the
      // legacy execCommand copy from a focused, selected element.
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
    linkGroups(slot) {
      const slug = slot.slug;
      const totalMaps = slot.max_maps || 3;
      const url = (path) => this.GetObsSlotImageUrl(slug, path);

      const score = [
        { label: this.$t("ObsSlots.linkScoreFull"), url: url("/match") },
        {
          label: this.$t("ObsSlots.linkScoreCurrentMap"),
          url: url("/match/map"),
        },
      ];
      const mvp = [
        { label: this.$t("ObsSlots.linkMvpFull"), url: url("/mvp") },
      ];
      const team1 = [
        { label: this.$t("ObsSlots.linkTeamFull"), url: url("/team/1") },
      ];
      const team2 = [
        { label: this.$t("ObsSlots.linkTeamFull"), url: url("/team/2") },
      ];

      for (let i = 1; i <= totalMaps; i++) {
        score.push({
          label: this.$t("ObsSlots.linkScoreMap", { n: i }),
          url: url(`/match/map/${i}`),
        });
        mvp.push({
          label: this.$t("ObsSlots.linkMvpMap", { n: i }),
          url: url(`/map/${i}/mvp`),
        });
        team1.push({
          label: this.$t("ObsSlots.linkTeamMap", { n: i }),
          url: url(`/map/${i}/team/1`),
        });
        team2.push({
          label: this.$t("ObsSlots.linkTeamMap", { n: i }),
          url: url(`/map/${i}/team/2`),
        });
      }

      return [
        { title: this.$t("ObsSlots.groupScore"), links: score },
        { title: this.$t("ObsSlots.groupMvp"), links: mvp },
        { title: this.$t("ObsSlots.groupTeam1"), links: team1 },
        { title: this.$t("ObsSlots.groupTeam2"), links: team2 },
      ];
    },
  },
};
</script>
