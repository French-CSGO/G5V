<template>
  <v-data-table
    item-key="name"
    class="elevation-1"
    :loading="isLoading"
    :loading-text="$t('misc.LoadText')"
    :headers="headers"
    :items="matches"
    :sort-by="['id']"
    sort-desc
    ref="MatchesTable"
  >
    <template v-slot:item.id="{ item }">
      <router-link
        :to="{ path: '/match/' + item.id }"
        v-if="item.match_status != 'Cancelled'"
      >
        {{ item.id }}
      </router-link>
      <div v-else>
        {{ item.id }}
      </div>
    </template>
    <template v-slot:item.owner="{ item }">
      <router-link :to="{ path: '/user/' + item.user_id }">
        {{ item.owner }}
      </router-link>
    </template>
    <template v-slot:item.team1_string="{ item }">
      <router-link
        :to="{ path: '/teams/' + item.team1_id }"
        v-if="item.team1_id !== null"
      >
        {{ item.team1_string }}
      </router-link>
      <div v-else>
        {{ item.team1_string }}
      </div>
    </template>
    <template v-slot:item.team2_string="{ item }">
      <router-link
        :to="{ path: '/teams/' + item.team2_id }"
        v-if="item.team2_id !== null"
      >
        {{ item.team2_string }}
      </router-link>
      <div v-else>
        {{ item.team2_string }}
      </div>
    </template>
    <template v-slot:top>
      <div v-if="isMyMatches && isThereCancelledMatches">
        <v-toolbar flat>
          <v-toolbar-title>
            <v-btn primary @click="deleteCancelled" :loading="deletePending">
              {{ $t("Matches.DeleteButton") }}
            </v-btn>
          </v-toolbar-title>
        </v-toolbar>
      </div>
      <div v-else />
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    user: Object,
    propMatches: { type: Array, default: null },
  },
  data() {
    return {
      matches: [],
      isLoading: true,
      deletePending: false,
      isThereCancelledMatches: false,
    };
  },
  created() {
    this.GetMatches();
  },
  computed: {
    myMatches() {
      return (
        this.$route.path != "/mymatches" &&
        this.$route.path != "/" &&
        !this.$route.path.toString().includes("season")
      );
    },
    isMyMatches() {
      return this.$route.path == "/mymatches";
    },
    headers() {
      return [
        {
          text: this.$t("Matches.MatchID"),
          align: "start",
          sortable: true,
          value: "id",
        },
        {
          text: this.$t("Matches.Team1"),
          value: "team1_string",
        },
        {
          text: this.$t("Matches.Team2"),
          value: "team2_string",
        },
        {
          text: this.$t("Matches.Status"),
          value: "match_status",
        },
        {
          text: this.$t("Matches.Owner"),
          value: "owner",
        },
      ];
    },
  },
  methods: {
    async GetMatches() {
      try {
        let res;
        if (this.propMatches !== null) {
          res = this.propMatches;
        } else if (this.$route.path == "/mymatches") {
          res = await this.GetMyMatches();
        } else if (this.$route.path.includes("team")) {
          const teamId = this.$route.params.id;
          if (teamId && !isNaN(parseInt(teamId))) {
            res = await this.GetTeamRecentMatches(teamId);
          } else {
            res = [];
          }
        } else if (this.$route.path.includes("user")) {
          if (this.$route.params.id == undefined) {
            res = await this.GetUserRecentMatches(this.user.id);
          } else {
            res = await this.GetUserRecentMatches(this.$route.params.id);
          }
          if (res.length == 0)
            res = await this.GetPlayerStatRecentMatches(this.$route.params.id);
        } else if (this.$route.path.includes("season")) {
          res = await this.GetSeasonRecentMatches(this.$route.params.id);
        } else {
          res = await this.GetAllMatches();
        }
        if (typeof res == "string") res = [];
        // If matches come from season endpoint, owner and match_status are already embedded
        if (this.propMatches !== null) {
          this.matches = res.map((match) => {
            if (match.cancelled == 1) this.isThereCancelledMatches = true;
            return match;
          });
        } else {
          const userCache = new Map();
          const getUserCached = (id) => {
            if (!userCache.has(id)) userCache.set(id, this.GetUserData(id));
            return userCache.get(id);
          };
          this.matches = await Promise.all(
            res.map(async (match) => {
              const teamId = match.team1_id ?? match.team2_id;
              const [ownerRes, statusRes] = await Promise.all([
                getUserCached(match.user_id),
                this.GetMatchResult(teamId, match.id),
              ]);
              match.owner = ownerRes.name;
              match.match_status = statusRes;
              if (match.cancelled == 1) this.isThereCancelledMatches = true;
              return match;
            }),
          );
        }
      } catch (error) {
        void error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteCancelled() {
      this.deletePending = true;
      await this.DeleteMyCancelledMatches();
      this.deletePending = false;
      this.matches = [];
      this.isLoading = true;
      this.isThereCancelledMatches = false;
      await this.GetMatches();
    },
  },
};
</script>
