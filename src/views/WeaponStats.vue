<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title>
        <v-icon x-large class="mr-3">mdi-account-circle</v-icon>
        <span class="text-h5">{{ playerName }}</span>
        <a
          v-if="steamId"
          :href="`https://steamcommunity.com/profiles/${steamId}`"
          target="_blank"
          class="ml-2"
          style="text-decoration:none"
        >
          <v-icon color="primary">mdi-steam</v-icon>
        </a>
      </v-card-title>
      <v-card-text class="pb-0">
        <v-btn text small :to="'/stats/player/' + steamId">
          <v-icon left small>mdi-chart-line</v-icon>
          {{ $t("GlobalStats.GlobalStats") }}
        </v-btn>
        <v-btn text small color="primary" :to="'/stats/player/' + steamId + '/weapons'">
          <v-icon left small>mdi-pistol</v-icon>
          {{ $t("GlobalStats.WeaponStats") }}
        </v-btn>
        <v-btn text small :to="'/stats/player/' + steamId + '/maps'">
          <v-icon left small>mdi-map</v-icon>
          {{ $t("GlobalStats.MapStats") }}
        </v-btn>
      </v-card-text>
    </v-card>

    <div v-if="isLoading">
      <v-skeleton-loader type="table" />
    </div>

    <v-alert v-else-if="weaponStats.length === 0" type="info">
      {{ $t("PlayerStats.NoStatFound") }}
    </v-alert>

    <v-card v-else>
      <v-card-title class="primary white--text">
        <v-icon left dark>mdi-pistol</v-icon>
        {{ $t("GlobalStats.WeaponStats") }}
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="weaponStats"
        sort-by="kills"
        :sort-desc="true"
        :items-per-page="20"
        class="elevation-1"
      >
        <template v-slot:item.weapon="{ item }">
          <strong>{{ formatWeapon(item.weapon) }}</strong>
        </template>
        <template v-slot:item.hsp="{ item }">
          <v-progress-linear
            :value="item.hsp"
            color="primary"
            height="16"
            rounded
          >
            <span class="white--text text-caption">{{ item.hsp }}%</span>
          </v-progress-linear>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "WeaponStats",
  data() {
    return {
      extraStats: [],
      isLoading: true,
      playerName: ""
    };
  },
  async created() {
    try {
      const res = await this.GetUserExtraStats(this.steamId);
      if (Array.isArray(res)) {
        this.extraStats = res;
        const mine = res.find(e => e.attacker_steam_id === this.steamId);
        if (mine) this.playerName = mine.attacker_name;
        else {
          const victim = res.find(e => e.player_steam_id === this.steamId);
          if (victim) this.playerName = victim.player_name;
        }
      }
    } catch {
      // ignored
    } finally {
      this.isLoading = false;
    }
  },
  computed: {
    steamId() {
      return this.$route.params.steam_id;
    },
    weaponStats() {
      const myKills = this.extraStats.filter(
        e => e.attacker_steam_id === this.steamId && !e.suicide && !e.friendly_fire
      );
      const map = {};
      myKills.forEach(e => {
        const w = e.weapon || "unknown";
        if (!map[w]) {
          map[w] = { weapon: w, kills: 0, hs: 0, blind: 0, smoke: 0, noscope: 0 };
        }
        map[w].kills++;
        if (e.headshot) map[w].hs++;
        if (e.attacker_blind) map[w].blind++;
        if (e.thru_smoke) map[w].smoke++;
        if (e.no_scope) map[w].noscope++;
      });
      return Object.values(map).map(w => ({
        ...w,
        hsp: w.kills > 0 ? Math.round((w.hs / w.kills) * 100) : 0
      }));
    },
    headers() {
      return [
        { text: this.$t("GlobalStats.Weapon"), value: "weapon", sortable: true },
        { text: this.$t("PlayerStats.Kills"), value: "kills", sortable: true },
        { text: this.$t("PlayerStats.Headshot") + "%", value: "hsp", sortable: true, width: "180px" },
        { text: this.$t("GlobalStats.HSKills"), value: "hs", sortable: true },
        { text: this.$t("GlobalStats.BlindKills"), value: "blind", sortable: true },
        { text: this.$t("GlobalStats.SmokeKills"), value: "smoke", sortable: true },
        { text: this.$t("GlobalStats.NoScope"), value: "noscope", sortable: true }
      ];
    }
  },
  methods: {
    formatWeapon(name) {
      if (!name) return "Unknown";
      return name
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace("Hkp2000", "HKP2000")
        .replace("Usp Silencer", "USP-S")
        .replace("M4a1 Silencer", "M4A1-S")
        .replace("Ak47", "AK-47")
        .replace("Aug", "AUG")
        .replace("Sg556", "SG 553")
        .replace("Famas", "FAMAS")
        .replace("Galilar", "Galil AR")
        .replace("Awp", "AWP")
        .replace("Ssg08", "SSG 08")
        .replace("G3sg1", "G3SG1")
        .replace("Scar20", "SCAR-20")
        .replace("Mp5sd", "MP5-SD")
        .replace("Mp9", "MP9")
        .replace("Mac10", "MAC-10")
        .replace("Bizon", "PP-Bizon");
    }
  }
};
</script>
