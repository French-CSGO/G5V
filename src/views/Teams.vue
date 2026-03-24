<template>
  <v-container class="teams" fluid>
    <v-progress-linear v-if="user.id === null" indeterminate color="primary" />
    <v-alert v-else-if="isMyTeams && !isSuperAdmin" type="error">
      Accès réservé aux super-administrateurs.
    </v-alert>
    <TeamsTable v-else :user="user" />
  </v-container>
</template>

<script>
// @ is an alias to /src
import TeamsTable from "@/components/TeamsTable";
export default {
  name: "Teams",
  components: {
    TeamsTable
  },
  data() {
    return {
      user: {
        admin: false,
        steam_id: "",
        id: null,
        super_admin: false,
        name: "",
        small_image: "",
        medium_image: "",
        large_image: ""
      }
    };
  },
  computed: {
    isMyTeams() {
      return this.$route.path === "/myteams";
    },
    isSuperAdmin() {
      return Number(this.user.super_admin) === 1;
    },
    isAdmin() {
      return (
        Number(this.user.admin) === 1 || Number(this.user.super_admin) === 1
      );
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  }
};
</script>
