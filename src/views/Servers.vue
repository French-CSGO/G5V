<template>
  <v-container class="servers" fluid>
    <v-progress-linear v-if="user.id === -1" indeterminate color="primary" />
    <v-alert v-else-if="Number(user.super_admin) !== 1" type="error">
      Accès réservé aux super-administrateurs.
    </v-alert>
    <ServersTable v-else :user="user" />
  </v-container>
</template>

<script>
// @ is an alias to /src
import ServersTable from "@/components/ServersTable";
export default {
  name: "Servers",
  components: {
    ServersTable,
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
  async mounted() {
    this.user = await this.IsLoggedIn();
  },
};
</script>
