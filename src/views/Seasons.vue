<template>
  <v-container class="seasons" fluid>
    <v-progress-linear v-if="user.id === -1" indeterminate color="primary" />
    <v-alert v-else-if="isMySeasons && !isSuperAdmin" type="error">
      Accès réservé aux super-administrateurs.
    </v-alert>
    <SeasonsTable v-else :user="user" />
  </v-container>
</template>

<script>
// @ is an alias to /src
import SeasonsTable from "@/components/SeasonsTable";
export default {
  name: "Seasons",
  components: {
    SeasonsTable
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
      }
    };
  },
  computed: {
    isMySeasons() {
      return this.$route.path === "/myseasons";
    },
    isSuperAdmin() {
      return Number(this.user.super_admin) === 1;
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  }
};
</script>
