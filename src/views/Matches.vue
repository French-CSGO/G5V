<template>
  <v-container class="home" fluid>
    <v-alert v-if="isMyMatches && user.id === null" type="warning">
      Vous devez être connecté pour accéder à vos matchs.
    </v-alert>
    <MatchesTable v-else-if="user.id !== -1" :user="user" />
  </v-container>
</template>

<script>
// @ is an alias to /src
import MatchesTable from "@/components/MatchesTable";
export default {
  name: "Home",
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
      }
    };
  },
  computed: {
    isMyMatches() {
      return this.$route.path === "/mymatches";
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  }
};
</script>
