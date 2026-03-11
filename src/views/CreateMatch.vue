<template>
  <v-container class="match" fluid>
    <v-row class="pb-5">
      <v-col cols="12" class="flex-grow-1">
        <v-card>
          <v-progress-linear v-if="user.id === -1" indeterminate color="primary" />
          <v-alert v-else-if="!isAdmin" type="error">
            Accès réservé aux administrateurs.
          </v-alert>
          <NewMatchForm v-else :user="user" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NewMatchForm from "@/components/NewMatchForm";
export default {
  name: "Match",
  components: {
    NewMatchForm
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
      } // should be object from JSON response
    };
  },
  computed: {
    isAdmin() {
      return Number(this.user.admin) === 1 || Number(this.user.super_admin) === 1;
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  }
};
</script>
