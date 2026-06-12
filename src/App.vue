<template>
  <v-app :class="{ 'transparent-app': $route.meta.hideChrome }">
    <Navbar v-if="!$route.meta.hideChrome" :user="user" />
    <v-main>
      <router-view :key="$route.path" />
    </v-main>
    <Footer v-if="!$route.meta.hideChrome" />
  </v-app>
</template>

<script>
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default {
  name: "App",
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
      }, // should be object from JSON response
    };
  },
  components: {
    Navbar,
    Footer,
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  },
};
</script>

<style>
.transparent-app,
.transparent-app .v-application--wrap,
.transparent-app .v-main,
.transparent-app .v-main__wrap {
  background: transparent !important;
}

.transparent-app .v-main {
  padding: 0 !important;
}
</style>
