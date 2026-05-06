<template>
  <v-container class="match" fluid>
    <v-row class="pb-5">
      <v-col cols="12" class="flex-grow-1">
        <v-card>
          <MatchInfo
            v-if="this.$route.params.id != null"
            :match_id="Number(this.$route.params.id)"
            :user="user"
            @match-loaded="onMatchLoaded"
          />
          <VetoInfo :match_id="Number(this.$route.params.id)" />
          <PlayerStats :user="user" :match_id="Number(this.$route.params.id)" />
        </v-card>
      </v-col>

      <!-- Admin panel (match controls + backups table) -->
      <v-col v-if="showAdminPanel" cols="12">
        <MatchControlPanel
          :matchInfo="matchData"
          :user="user"
          @force-reload="reloadMatch"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PlayerStats from "@/components/PlayerStatTable";
import MatchInfo from "@/components/MatchInfo";
import VetoInfo from "@/components/VetoTable";
import MatchControlPanel from "@/components/MatchControlPanel";

export default {
  name: "Match",
  components: {
    PlayerStats,
    MatchInfo,
    VetoInfo,
    MatchControlPanel
  },
  data() {
    return {
      user: {
        admin: false,
        steam_id: "",
        id: -1,
        super_admin: false,
        name: "",
        small_image: "",
        medium_image: "",
        large_image: ""
      },
      matchData: {
        id: -1,
        end_time: null,
        cancelled: 0,
        forfeit: 0,
        user_id: -1
      }
    };
  },
  computed: {
    showAdminPanel() {
      return (
        this.matchData.id !== -1 &&
        (this.user.id === this.matchData.user_id ||
          this.user.admin == 1 ||
          this.user.super_admin == 1)
      );
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    await this.reloadMatch();
  },
  methods: {
    async reloadMatch() {
      if (!this.$route.params.id) return;
      try {
        const res = await this.GetMatchData(Number(this.$route.params.id));
        if (res && res.id) {
          this.matchData = {
            id: res.id,
            end_time: res.end_time,
            cancelled: res.cancelled,
            forfeit: res.forfeit,
            user_id: res.user_id
          };
        }
      } catch {
        // ignored
      }
    },
    onMatchLoaded(data) {
      if (data && data.id) {
        this.matchData = {
          id: data.id,
          end_time: data.end_time,
          cancelled: data.cancelled,
          forfeit: data.forfeit,
          user_id: data.user_id
        };
      }
    }
  }
};
</script>
