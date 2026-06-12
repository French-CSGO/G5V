<template>
  <v-container class="home" fluid>
    <v-progress-linear v-if="user.id === -1" indeterminate color="primary" />
    <v-alert v-else-if="isMyMatches && !isAdmin" type="error">
      Accès réservé aux administrateurs.
    </v-alert>
    <MatchesTable v-else :user="user" />
  </v-container>
</template>

<script>
// @ is an alias to /src
import MatchesTable from "@/components/MatchesTable";
export default {
  name: "Home",
  components: {
    MatchesTable,
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
        large_image: "",
      },
    };
  },
  computed: {
    isMyMatches() {
      return this.$route.path === "/mymatches";
    },
    isAdmin() {
      return (
        Number(this.user.admin) === 1 || Number(this.user.super_admin) === 1
      );
    },
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  },
};
</script>
