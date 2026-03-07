<template>
  <v-container class="season" fluid>
    <v-card>
      <v-row>
        <v-col cols="12">
          <v-card-title
            v-if="seasonData.start_date != null && seasonData.end_date != null"
          >
            {{ seasonData.name }}
            <v-spacer />
            {{ isStarted }}:
            {{ new Date(seasonData.start_date).toLocaleDateString("en-CA") }}
            <br />
            {{ isEnding }}:
            {{ new Date(seasonData.end_date).toLocaleDateString("en-CA") }}
          </v-card-title>
          <v-card-title
            v-else-if="
              seasonData.start_date != null && seasonData.end_date == null
            "
          >
            {{ seasonData.name }}
            <v-spacer />
            {{ isStarted }}:
            {{ new Date(seasonData.start_date).toLocaleDateString("en-CA") }}
          </v-card-title>
          <v-card-title v-else>
            {{ seasonData.name }}
          </v-card-title>
          <v-card-title>
            <v-btn :to="`/leaderboard/${seasonData.id}`">
              {{ $t("misc.PLeader") }}
            </v-btn>
            <v-btn :to="`/leaderboard/${seasonData.id}/teams`">
              {{ $t("Leaderboard.TTitle") }}
            </v-btn>
            <v-btn
              v-if="isToornamentSeason"
              :to="`/season/${seasonData.id}/toornament`"
            >
              <v-icon left>mdi-tournament</v-icon>
              {{ $t("Toornament.MatchesTitle") }}
            </v-btn>
          </v-card-title>
        </v-col>

        <!-- Team management section (visible to owner or admin) -->
        <v-col cols="12" v-if="canManageTeams">
          <v-card outlined class="mx-4 mb-4">
            <v-card-title>
              {{ $t("Season.TeamsTitle") }}
              <v-spacer />
              <v-btn color="primary" small @click="showAddTeamDialog = true">
                <v-icon left>mdi-plus</v-icon>
                {{ $t("Season.AddTeam") }}
              </v-btn>
            </v-card-title>
            <v-card-text v-if="seasonTeams.length === 0">
              {{ $t("Season.NoTeams") }}
            </v-card-text>
            <v-list v-else>
              <v-list-item v-for="team in seasonTeams" :key="team.id">
                <v-list-item-avatar>
                  <v-img
                    v-if="team.flag"
                    :src="
                      `https://www.countryflags.io/${team.flag}/flat/32.png`
                    "
                    :alt="team.flag"
                  />
                  <v-icon v-else>mdi-account-group</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <router-link :to="{ path: '/teams/' + team.id }">{{
                      team.name
                    }}</router-link>
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon color="error" @click="confirmRemoveTeam(team)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12">
          <MatchesTable :user="user" />
        </v-col>
      </v-row>
    </v-card>

    <!-- Add team dialog -->
    <v-dialog v-model="showAddTeamDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t("Season.AddTeam") }}</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="teamsToAdd"
            :items="availableTeamsToAdd"
            item-text="name"
            item-value="id"
            :label="$t('Season.SelectTeams')"
            multiple
            chips
            deletable-chips
            return-object
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showAddTeamDialog = false">{{
            $t("misc.Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            :loading="isAddingTeams"
            :disabled="teamsToAdd.length === 0"
            @click="addTeamsToSeason"
          >
            {{ $t("misc.Add") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove team confirmation -->
    <v-dialog v-model="showRemoveDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ $t("Season.RemoveTeamTitle") }}</v-card-title>
        <v-card-text>
          {{
            $t("Season.RemoveTeamConfirm", {
              name: teamToRemove ? teamToRemove.name : ""
            })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showRemoveDialog = false">{{
            $t("misc.Cancel")
          }}</v-btn>
          <v-btn color="error" :loading="isRemovingTeam" @click="removeTeam">
            {{ $t("misc.Delete") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor">
      {{ snackbarMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">OK</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
// @ is an alias to /src
import MatchesTable from "@/components/MatchesTableNoLimits";
export default {
  name: "Season",
  components: {
    MatchesTable
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
      seasonData: {
        name: "",
        id: -1,
        user_id: -1,
        start_date: null,
        end_date: null
      },
      seasonTeams: [],
      allTeams: [],
      teamsToAdd: [],
      teamToRemove: null,
      showAddTeamDialog: false,
      showRemoveDialog: false,
      isAddingTeams: false,
      isRemovingTeam: false,
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "success"
    };
  },
  async created() {
    this.user = await this.IsLoggedIn();
    const info = await this.GetSeasonInfo(this.$route.params.id);
    this.seasonData = info;
    this.seasonData.start_date = new Date(this.seasonData.start_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    if (this.seasonData.end_date != null)
      this.seasonData.end_date = new Date(this.seasonData.end_date)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    if (this.canManageTeams) {
      await this.loadSeasonTeams();
      await this.loadAllTeams();
    }
  },
  computed: {
    isToornamentSeason() {
      return (
        this.seasonData.is_challonge &&
        typeof this.seasonData.challonge_url === "string" &&
        this.seasonData.challonge_url.startsWith("t:")
      );
    },
    isStarted() {
      if (
        this.seasonData.start_date >=
        new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ")
      )
        return "Starting";
      else return "Started";
    },
    isEnding() {
      if (
        this.seasonData.end_date != null &&
        this.seasonData.end_date <
          new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ")
      )
        return "Ended";
      else return "Ends";
    },
    canManageTeams() {
      return (
        this.user.id !== -1 &&
        (this.user.id === this.seasonData.user_id || this.IsAnyAdmin(this.user))
      );
    },
    availableTeamsToAdd() {
      const seasonTeamIds = new Set(this.seasonTeams.map(t => t.id));
      return this.allTeams.filter(t => !seasonTeamIds.has(t.id));
    }
  },
  methods: {
    async loadSeasonTeams() {
      const teams = await this.GetSeasonTeams(this.$route.params.id);
      this.seasonTeams = Array.isArray(teams) ? teams : [];
    },
    async loadAllTeams() {
      if (this.IsAnyAdmin(this.user)) {
        const teams = await this.GetPublicTeams();
        this.allTeams = Array.isArray(teams) ? teams : [];
      } else {
        let myTeams = await this.GetMyTeams();
        let publicTeams = await this.GetAllTeams();
        if (typeof myTeams === "string") myTeams = [];
        if (Array.isArray(publicTeams)) {
          publicTeams.forEach(team => {
            if (team.public_team == 1) myTeams.push(team);
          });
        }
        this.allTeams = myTeams;
      }
    },
    async addTeamsToSeason() {
      this.isAddingTeams = true;
      const teamIds = this.teamsToAdd.map(t => t.id);
      const res = await this.AddTeamsToSeason(this.$route.params.id, teamIds);
      this.isAddingTeams = false;
      this.showAddTeamDialog = false;
      this.teamsToAdd = [];
      if (res && res.message && res.message.includes("successfully")) {
        this.snackbarColor = "success";
        this.snackbarMessage = res.message;
        await this.loadSeasonTeams();
      } else {
        this.snackbarColor = "error";
        this.snackbarMessage =
          res && res.message ? res.message : "Error adding teams.";
      }
      this.snackbar = true;
    },
    confirmRemoveTeam(team) {
      this.teamToRemove = team;
      this.showRemoveDialog = true;
    },
    async removeTeam() {
      this.isRemovingTeam = true;
      const res = await this.RemoveTeamFromSeason(
        this.$route.params.id,
        this.teamToRemove.id
      );
      this.isRemovingTeam = false;
      this.showRemoveDialog = false;
      if (res && res.message && res.message.includes("successfully")) {
        this.snackbarColor = "success";
        this.snackbarMessage = res.message;
        await this.loadSeasonTeams();
      } else {
        this.snackbarColor = "error";
        this.snackbarMessage =
          res && res.message ? res.message : "Error removing team.";
      }
      this.teamToRemove = null;
      this.snackbar = true;
    }
  }
};
</script>
