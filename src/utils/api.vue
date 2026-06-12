<script>
import axios from "axios";
export default {
  name: "api",
  data() {
    return {
      axiosCall: axios.create({
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }),
      languageAlert: false,
    };
  },
  methods: {
    ChangeLanguage: function (lang) {
      localStorage.setItem("language", lang);
      this.$i18n.locale = lang;
    },
    // BEGIN USER CALLS
    async IsLoggedIn() {
      const res = await this.axiosCall.get(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/isLoggedIn`,
      );
      if (res.data === false) {
        return {
          admin: false,
          steam_id: "",
          id: null,
          super_admin: false,
          name: "",
          small_image: "",
          medium_image: "",
          large_image: "",
        };
      }
      return res.data;
    },
    async GetUserData(userid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users/${userid}`,
        );
        message = res.data.user;
      } catch (err) {
        message = {
          id: 0,
          steam_id: "",
          name: "ERROR",
          admin: 0,
          super_admin: 0,
        };
      }
      return message;
    },
    async GetUserMapList(userid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/maps/${userid}`,
        );
        message = res.data.maplist;
      } catch (err) {
        message = [];
      }
      return message;
    },
    async GetUserEnabledMapList(userid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/maps/${userid}/enabled`,
        );
        message = res.data.maplist;
      } catch (err) {
        message = [];
      }
      return message;
    },
    async UpdateUserMap(mapdata) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/maps/`,
          mapdata,
        );
        message = res.data;
      } catch (err) {
        message = {
          error: true,
          message: err?.response?.data?.message || "Failed to update map",
          data: err?.response?.data || null,
        };
      }
      return message;
    },
    async DeleteUserMap(mapdata) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/maps/`,
          { data: mapdata },
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async InsertUserMapInfo(mapdata) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/maps/`,
          mapdata,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetUserRecentMatches(userid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users/${userid}/recent`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetAllUsers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users/`,
        );
        message = res.data.users;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async UpdateUserInfo(userInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users/`,
          userInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    // END USER CALLS
    // BEGIN TEAM CALLS
    async GetTeamData(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/${teamid}`,
        );
        message = res.data.team;
      } catch (err) {
        message = {
          id: 0,
          user_id: 0,
          name: "NON EXISTENT TEAM",
          tag: "",
          flag: "",
          logo: "",
          auth_name: {},
          public_team: false,
        };
      }
      return message;
    },
    async GetTeamName(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/${teamid}/basic`,
        );
        message = res.data.team.name;
      } catch (err) {
        message = {
          id: 0,
          user_id: 0,
          name: "NON EXISTENT TEAM",
          tag: "",
          flag: "",
          logo: "",
          auth_name: {},
          public_team: false,
        };
      }
      return message;
    },
    async GetBasicTeamInfo(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/${teamid}/basic`,
        );
        message = res.data.team;
      } catch (err) {
        message = {
          id: 0,
          user_id: 0,
          name: "NON EXISTENT TEAM",
          tag: "",
          flag: "",
          logo: "",
          auth_name: {},
          public_team: false,
        };
      }
      return message;
    },
    async GetAllTeams() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams`,
        );
        message = res.data.teams;
      } catch (error) {
        message = error.response?.data?.message || "Failed to fetch teams";
      }
      return message;
    },
    async GetPublicTeams() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/public`,
        );
        message = res.data.teams;
      } catch (error) {
        message =
          error.response?.data?.message || "Failed to fetch public teams";
      }
      return message;
    },
    async GetMyTeams() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/myteams`,
        );
        message = res.data.teams;
      } catch (error) {
        message = error.response?.data?.message || "Failed to fetch your teams";
      }
      return message;
    },
    async GetTeamRecentMatches(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/${teamid}/recent`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async InsertTeamInfo(teamInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/`,
          teamInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async UpdateTeamInfo(teamInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/`,
          teamInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async DeleteFromTeam(member) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/`,
          { data: member },
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async ImportChallongeTeams(tournamentInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/challonge`,
          tournamentInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    // END TEAM CALLS
    // BEGIN MATCH CALLS
    async GetMatchData(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/${matchid}`,
        );
        message = res.data.match;
      } catch (err) {
        //console.log(err);
        message = {
          id: 0,
          user_id: null,
          server_id: null,
          team1_id: null,
          team2_id: null,
          winner: null,
          team1_score: 0,
          team2_score: null,
          cancelled: 0,
          title: "ERROR",
        };
      }
      return message;
    },
    async GetEventMatchData(matchid) {
      let retVal;
      try {
        retVal = this.$sse
          .create({
            url: `${
              process.env?.VUE_APP_G5V_API_URL || "/api"
            }/matches/${matchid}/stream`,
            format: "json",
            withCredentials: true,
            polyfill: true,
          })
          .on("error", (err) =>
            console.error("Failed to parse or lost connection:", err),
          );
      } catch (error) {
        retVal = error.response.data.message;
      }
      return retVal;
    },
    async GetCastStream() {
      let retVal;
      try {
        retVal = this.$sse
          .create({
            url: `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/cast/stream`,
            format: "json",
            withCredentials: true,
            polyfill: true,
          })
          .on("error", (err) => console.error("Cast SSE error:", err));
      } catch (error) {
        retVal = null;
      }
      return retVal;
    },
    async GetRecentMatches(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/teams/${teamid}/recent`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMatchResult(team, match) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/teams/${team}/result/${match}`,
        );
        message = res.data.result;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetAllMatches() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetLimitMatches(limit) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/limit/${limit}`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetPagedMatches(offset, limit) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/page/${offset}&${limit}`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMyMatches() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/mymatches`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async InsertMatch(matchInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/`,
          matchInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async UpdateMatchInfo(matchInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/`,
          matchInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async DeleteMyCancelledMatches() {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/matches/`,
          { data: [{ all_cancelled: true }] },
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    // END MATCH CALLS
    // BEGIN SERVER CALLS
    async GetServerData(serverid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/${serverid}`,
        );
        message = res.data.server;
      } catch (err) {
        //console.log(err)
        message = {
          id: 0,
          in_use: 0,
          ip_string: "",
          port: 0,
          rcon_password: null,
          display_name: "ERROR RETRIEVING SERVER",
          public_server: 0,
          name: "ERROR",
        };
      }
      return message;
    },
    async GetAllServers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers`,
        );
        return res.data.servers;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetPublicServerCount() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/publiccount`,
        );
        return res.data.servers;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMyServers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/myservers`,
        );
        return res.data.servers;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async DeleteServer(serverData) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/`,
          { data: serverData },
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetAllAvailableServers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/available`,
        );
        return res.data.servers;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async InsertServer(serverInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/`,
          serverInfo,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetServerStatus(serverId) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/servers/${serverId}/status`,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async UpdateServer(serverInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/servers/`,
          serverInfo,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetPterodactylServers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/servers/pterodactyl-list`,
        );
        message = res.data.servers;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    // END SERVER CALLS
    // BEGIN SEASON CALLS
    async GetAllSeasons() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons`,
        );
        message = res.data.seasons;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSeasonRecentMatches(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMySeasons() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/myseasons`,
        );
        message = res.data.seasons;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMyAvailableSeasons() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/myavailable`,
        );
        message = res.data.seasons;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSeasonInfo(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}`,
        );
        message = res.data.season;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSeasonData(seasonid) {
      try {
        const res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}`,
        );
        return { season: res.data.season, matches: res.data.matches || [] };
      } catch (error) {
        return { season: null, matches: [] };
      }
    },
    async GetSeasonCVARs(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/cvar`,
        );
        message = res.data.cvars;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async DeleteSeason(seasonData) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/`,
          { data: seasonData },
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async InsertSeason(seasonInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/`,
          seasonInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async UpdateSeasonInfo(seasonInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/`,
          seasonInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async ImportSeason(challongeInfo) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/challonge`,
          challongeInfo,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async GetSeasonTeams(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/teams`,
        );
        message = res.data.teams;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async AddTeamsToSeason(seasonid, teamIds) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/teams`,
          { team_ids: teamIds },
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async RemoveTeamFromSeason(seasonid, teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/teams/${teamid}`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async GetToornamentMatches(seasonid, filters = {}) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/toornament/matches`,
          { params: filters },
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetToornamentStages(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/toornament/stages`,
        );
        message = res.data.stages;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetToornamentRounds(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/toornament/rounds`,
        );
        message = res.data.rounds;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async ScheduleToornamentMatch(seasonId, matchId, scheduled_datetime) {
      try {
        const res = await this.axiosCall.patch(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonId}/toornament/matches/${matchId}/schedule`,
          { scheduled_datetime },
        );
        return res.data;
      } catch (error) {
        return error.response?.data || null;
      }
    },
    async ScheduleToornamentRound(seasonId, roundId, scheduled_datetime) {
      try {
        const res = await this.axiosCall.patch(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonId}/toornament/rounds/${roundId}/schedule`,
          { scheduled_datetime },
        );
        return res.data;
      } catch (error) {
        return error.response?.data || null;
      }
    },
    async GetToornamentMatchPrefill(seasonid, toornamentMatchId) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/toornament/matches/${toornamentMatchId}/prefill`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetToornamentGroups(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/toornament/groups`,
        );
        message = res.data.groups;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetChallongeTournaments(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}/challonge/tournaments`,
        );
        message = res.data.tournaments;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async AddChallongeTournament(seasonid, challonge_slug, label) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}/challonge/tournaments`,
          { challonge_slug, label },
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async DeleteChallongeTournament(seasonid, tournamentId) {
      let res;
      let message;
      try {
        res = await this.axiosCall.delete(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}/challonge/tournaments/${tournamentId}`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async GetChallongeMatches(seasonid, filters = {}) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/challonge/matches`,
          { params: filters },
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetChallongeMatchPrefill(seasonid, challongeMatchId) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/seasons/${seasonid}/challonge/matches/${challongeMatchId}/prefill`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetChallongeBulkPrefill(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/seasons/${seasonid}/challonge/bulk-prefill`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    // END SEASON CALLS
    // BEGIN PLAYER STATS
    async GetUserPlayerStats(steamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/playerstats/${steamid}`,
        );
        message = res.data.playerstats;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetAllPlayers() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/playerstats/unique`,
        );
        message = res.data.count;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetPlayerStats(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/playerstats/match/${matchid}`,
        );
        message = res.data.playerstats;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetEventPlayerStats(matchid) {
      return this.$sse
        .create({
          url: `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/playerstats/match/${matchid}/stream`,
          format: "json",
          withCredentials: true,
          polyfill: true,
        })
        .on("error", (err) =>
          console.error("Failed to parse or lost connection:", err),
        );
    },
    async GetPlayerStatRecentMatches(steamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/playerstats/${steamid}/recent`,
        );
        message = res.data.matches;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    // END PLAYER STATS
    // BEGIN MAP STATS
    async GetAllMapStats() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/mapstats/`,
        );
        message = res.data.mapstats;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSingleMapStat(matchid, mapnumber) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/mapstats/${matchid}/${mapnumber}`,
        );
        message = res.data.mapstat;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMapStats(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/mapstats/${matchid}`,
        );
        message = res.data.mapstats;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetEventMapStats(matchid) {
      return this.$sse
        .create({
          url: `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/mapstats/${matchid}/stream`,
          format: "json",
          withCredentials: true,
          polyfill: true,
        })
        .on("error", (err) =>
          console.error("Failed to parse or lost connection:", err),
        );
    },
    // END MAP STATS
    // BEGIN MATCH ADMIN CALLS
    async PauseMatch(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/pause`,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async UnpauseMatch(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/unpause`,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetMatchBackups(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/backup`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async CancelMatch(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/cancel`,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async AddUserToSpectator(matchid, matchObject) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/addspec`,
          matchObject,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async AddUserToTeam(matchid, matchObject) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/adduser`,
          matchObject,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async ForfeitMatch(matchid, winner) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/forfeit/${winner}`,
        );
        message = res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async SendRconCommandToMatch(matchid, rconBody) {
      let res;
      let message;
      try {
        res = await this.axiosCall.put(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/rcon/`,
          rconBody,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async GetRemoteBackups(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/backup/remote`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async RestoreFromBackup(matchid, backupBody) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/backup/`,
          backupBody,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async RestoreFromRemoteBackup(matchid, backupBody) {
      let res;
      let message;
      try {
        res = await this.axiosCall.post(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/backup/remote`,
          backupBody,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    async RestartCurrentMatch(matchid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/matches/${matchid}/restart/`,
        );
        message = res.data;
      } catch (error) {
        message = error.response.data;
      }
      return message;
    },
    // END MATCH ADMIN CALLS
    // BEGIN VETO CALLS
    async GetVetoesOfMatch(matchid) {
      let res;
      let vetoMessage = "";
      let vetoSideMessage;
      let combinedVetoInfo = [];
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/vetoes/${matchid}`,
        );
        vetoMessage = res.data.vetoes;
        try {
          res = await this.axiosCall.get(
            `${process.env?.VUE_APP_G5V_API_URL || "/api"}/vetosides/${matchid}`,
          );
          vetoSideMessage = res.data.vetoes;
        } catch (ignored) {
          // ignore errors
        }
        vetoMessage.forEach((vetoData) => {
          if (vetoSideMessage) {
            let combinedFind = vetoSideMessage.find((vetoSideChoice) => {
              return (
                vetoData["id"] === vetoSideChoice["veto_id"] &&
                vetoData["map"] === vetoSideChoice["map"]
              );
            });
            combinedFind
              ? combinedVetoInfo.push({
                  id: vetoData.id,
                  match_id: vetoData.match_id,
                  team_name: vetoData.team_name,
                  map: vetoData.map,
                  pick_or_veto: vetoData.pick_or_veto,
                  team_name_side: combinedFind.team_name,
                  side: combinedFind.side,
                })
              : combinedVetoInfo.push({
                  id: vetoData.id,
                  match_id: vetoData.match_id,
                  team_name: vetoData.team_name,
                  map: vetoData.map,
                  pick_or_veto: vetoData.pick_or_veto,
                });
          } else {
            combinedVetoInfo.push({
              id: vetoData.id,
              match_id: vetoData.match_id,
              team_name: vetoData.team_name,
              map: vetoData.map,
              pick_or_veto: vetoData.pick_or_veto,
            });
          }
        });
        return combinedVetoInfo;
      } catch (error) {
        combinedVetoInfo = error.response.data.message;
      }
      return combinedVetoInfo;
    },
    async GetStreamedVetoesOfMatch(matchid) {
      let combinedVetoInfo;
      try {
        combinedVetoInfo = await this.$sse
          .create({
            url: `${
              process.env?.VUE_APP_G5V_API_URL || "/api"
            }/vetoes/${matchid}/stream`,
            format: "json",
            withCredentials: true,
            polyfill: true,
          })
          .on("error", (err) =>
            console.error("Failed to parse or lost connection:", err),
          );
      } catch (error) {
        combinedVetoInfo = error.response.data.message;
      }
      return combinedVetoInfo;
    },
    async GetStreamedVetoSidesOfMatch(matchid) {
      let retVal;
      try {
        retVal = await this.$sse.create({
          url: `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/vetosides/${matchid}/stream`,
          format: "json",
          withCredentials: true,
          polyfill: true,
        });
      } catch (error) {
        retVal = error.response.data.message;
      }
      return retVal;
    },
    // END VETO CALLS
    // BEGIN LEADERBOARD CALLS
    async GetTotalPlayerLeaderboard() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/leaderboard/players`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetTeamLeaderboard() {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/leaderboard`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSeasonPlayerLeaderboard(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/leaderboard/players/${seasonid}`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetSeasonTeamLeaderboard(seasonid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/leaderboard/${seasonid}`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async GetTeamPlayerLeaderboard(teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/leaderboard/teams/${teamid}`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response?.data?.message;
      }
      return message;
    },
    async GetSeasonTeamPlayerLeaderboard(seasonid, teamid) {
      let res;
      let message;
      try {
        res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/leaderboard/teams/${teamid}/${seasonid}`,
        );
        return res.data.leaderboard;
      } catch (error) {
        message = error.response?.data?.message;
      }
      return message;
    },
    // END LEADERBOARD CALLS
    // BEGIN QUEUE CALLS
    async GetQueues() {
      try {
        const res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue`,
        );
        return res.data;
      } catch (error) {
        return [];
      }
    },
    async GetQueue(slug) {
      const res = await this.axiosCall.get(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}`,
      );
      return res.data;
    },
    async GetQueuePlayers(slug) {
      try {
        const res = await this.axiosCall.get(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}/players`,
        );
        return res.data;
      } catch (error) {
        return [];
      }
    },
    GetEventQueueData(slug) {
      return this.$sse
        .create({
          url: `${
            process.env?.VUE_APP_G5V_API_URL || "/api"
          }/queue/${slug}/stream`,
          format: "json",
          withCredentials: true,
          polyfill: true,
        })
        .on("error", (err) => console.error("Queue SSE error:", err));
    },
    async CreateQueue(maxPlayers = 10, isPrivate = false, manualTeams = false) {
      const res = await this.axiosCall.post(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue`,
        [{ maxPlayers, private: isPrivate, manualTeams }],
      );
      return res.data;
    },
    async JoinQueue(slug) {
      const res = await this.axiosCall.put(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}`,
        [{ action: "join" }],
      );
      return res.data;
    },
    async LeaveQueue(slug) {
      const res = await this.axiosCall.put(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}`,
        [{ action: "leave" }],
      );
      return res.data;
    },
    async SetQueueTeams(slug, team1, team2) {
      const res = await this.axiosCall.put(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}/teams`,
        { team1, team2 },
      );
      return res.data;
    },
    async StartManualQueue(slug) {
      const res = await this.axiosCall.post(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue/${slug}/start`,
      );
      return res.data;
    },
    async DeleteQueue(slug) {
      const res = await this.axiosCall.delete(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/queue`,
        { data: [{ slug }] },
      );
      return res.data;
    },
    // END QUEUE CALLS
    // BEGIN REGISTRATION CALLS
    async login(userinfo) {
      let message;
      let res;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/login`,
          userinfo,
        );
        return res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    async registerUser(userinfo) {
      let message;
      let res;
      try {
        res = await this.axiosCall.post(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/register`,
          userinfo,
        );
        return res.data.message;
      } catch (error) {
        message = error.response.data.message;
      }
      return message;
    },
    // END REGISTRATION CALLS
    GetSteamURL: function (steamid) {
      return `https://steamcommunity.com/profiles/${steamid}`;
    },
    get_logo_or_flag_link: function (team1, team2) {
      // get_logo_or_flag_link(team1)
      if (team1.logo && team2.logo) {
        return {
          // team1: get_logo_link(team1),
          // team2: get_logo_link(team2)
        };
      } else {
        return {
          team1: this.get_flag_link(team1),
          team2: this.get_flag_link(team2),
        };
      }
    },
    get_loser: function (matchdata) {
      // returns loser's teamname
      if (matchdata.team1_score > matchdata.team2_score) {
        return matchdata.team2_name;
      } else if (matchdata.team1_score < matchdata.team2_score) {
        return matchdata.team1_name;
      } else {
        return "";
      }
    },
    get_flag_link: function (team) {
      if (team.flag === null || team.flag === undefined || team.flag === "") {
        return `/img/_unknown.png`;
      }
      return `/img/valve_flags/${team.flag.toLowerCase()}.png`;
    },
    GetKDR: function (playerstat) {
      if (playerstat.deaths === 0) {
        return playerstat.kills;
      }
      return (playerstat.kills / playerstat.deaths).toFixed(2);
    },
    GetHSP: function (playerstat) {
      if (playerstat.kills === 0) {
        return playerstat.kills;
      }
      return ((playerstat.headshot_kills / playerstat.kills) * 100).toFixed(2);
    },
    GetADR: function (playerstat) {
      if (playerstat.roundsplayed === 0) {
        return 0.0;
      }
      return (playerstat.damage / playerstat.roundsplayed).toFixed(2);
    },
    GetFPR: function (playerstat) {
      if (playerstat.roundsplayed === 0) {
        return 0.0;
      }
      return (playerstat.kills / playerstat.roundsplayed).toFixed(2);
    },
    AdminToolsAvailable: function (match) {
      if (
        (this.user.id === match.user_id || this.IsAnyAdmin(this.user)) &&
        (match.end_time == null || match.end_time == "") &&
        (match.cancelled == 0 || match.cancelled == null) &&
        (match.forfeit == 0 || match.forfeit == null)
      )
        return true;
      return false;
    },
    IsAnyAdmin: function (user) {
      let adminCheck = user.admin + user.super_admin;
      if (adminCheck > 0) {
        return true;
      } else {
        return false;
      }
    },
    GetScoreSymbol: function (score1, score2) {
      if (score1 > score2) return ">";
      else if (score1 < score2) return "<";
      else return "==";
    },
    GetFlags: function () {
      return [
        "AE",
        "AR",
        "AT",
        "AU",
        "BD",
        "BE",
        "BG",
        "BR",
        "BY",
        "CA",
        "CC",
        "CH",
        "CL",
        "CN",
        "CZ",
        "DE",
        "DK",
        "DZ",
        "EE",
        "ES",
        "EU",
        "FI",
        "FR",
        "GB",
        "GP",
        "GR",
        "HK",
        "HR",
        "HU",
        "ID",
        "IE",
        "IL",
        "IN",
        "IR",
        "IS",
        "IT",
        "JP",
        "KR",
        "KZ",
        "LT",
        "LU",
        "LV",
        "LY",
        "MK",
        "MO",
        "MX",
        "MY",
        "NL",
        "NO",
        "NZ",
        "PE",
        "PH",
        "PK",
        "PL",
        "PT",
        "RE",
        "RO",
        "RS",
        "RU",
        "SA",
        "SE",
        "SG",
        "SI",
        "SK",
        "SQ",
        "TH",
        "TR",
        "TW",
        "UA",
        "US",
        "VE",
        "VN",
        "ZA",
      ];
    },
    GetRating: function (
      kills = 0,
      roundsplayed = 0,
      deaths = 0,
      k1 = 0, // eslint-disable-line no-unused-vars
      k2 = 0,
      k3 = 0,
      k4 = 0,
      k5 = 0,
    ) {
      try {
        let AverageKPR = 0.679;
        let AverageSPR = 0.317;
        let AverageRMK = 1.277;
        let KillRating =
          roundsplayed === 0 ? 0 : kills / roundsplayed / AverageKPR;
        let SurvivalRating =
          roundsplayed === 0
            ? 0
            : (roundsplayed - deaths) / roundsplayed / AverageSPR;
        let computed_k1 = Math.max(0, roundsplayed - k2 - k3 - k4 - k5);
        let killcount = computed_k1 + 4 * k2 + 9 * k3 + 16 * k4 + 25 * k5;
        let RoundsWithMultipleKillsRating =
          roundsplayed === 0 ? 0 : killcount / roundsplayed / AverageRMK;
        let rating =
          (KillRating + 0.7 * SurvivalRating + RoundsWithMultipleKillsRating) /
          2.7;

        return rating.toFixed(2);
      } catch (err) {
        console.error("HELPER GetRating Failed:", err);
        return 0;
      }
    },
    // IMAGE SETTINGS
    async GetImageFonts() {
      const res = await this.axiosCall.get(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/image/fonts`,
      );
      return res.data;
    },
    async GetImageSettings() {
      const res = await this.axiosCall.get(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/image/settings`,
      );
      return res.data;
    },
    async SaveImageSettings(settings) {
      const res = await this.axiosCall.put(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/image/settings`,
        settings,
      );
      return res.data;
    },
    async UploadImageBackground(formData) {
      const res = await this.axiosCall.post(
        `${
          process.env?.VUE_APP_G5V_API_URL || "/api"
        }/image/settings/background`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data;
    },
    async UploadImageFont(formData) {
      const res = await this.axiosCall.post(
        `${process.env?.VUE_APP_G5V_API_URL || "/api"}/image/settings/font`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data;
    },
    GetPlayerImageUrl(matchId, steamId) {
      return `${
        process.env?.VUE_APP_G5V_API_URL || "/api"
      }/image/match/${matchId}/player/${steamId}`;
    },
    GetTeamSeasonImageUrl(seasonId, teamId) {
      return `${
        process.env?.VUE_APP_G5V_API_URL || "/api"
      }/image/season/${seasonId}/team/${teamId}`;
    },
  },
};
</script>
