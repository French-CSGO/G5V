<script>
import axios from "axios";
export default {
  name: "api",
  data() {
    return {
      axiosCall: axios.create({
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true
      }),
      languageAlert: false
    };
  },
  methods: {
    ChangeLanguage: function(lang) {
      localStorage.setItem("language", lang);
      this.$i18n.locale = lang;
    },
    GetPlayerImageUrl(matchId, steamId) {
      return `${process.env?.VUE_APP_G5V_API_URL ||
        "/api"}/image/match/${matchId}/player/${steamId}`;
    },
    GetTeamSeasonImageUrl(seasonId, teamId) {
      return `${process.env?.VUE_APP_G5V_API_URL ||
        "/api"}/image/season/${seasonId}/team/${teamId}`;
    }
  }
};
</script>