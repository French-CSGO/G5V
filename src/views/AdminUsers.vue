<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title class="headline">
        <v-icon left>mdi-account-group</v-icon>
        Gestion des utilisateurs
      </v-card-title>

      <v-progress-linear v-if="loadingUser" indeterminate color="primary" />

      <v-alert v-if="!loadingUser && !isSuperAdmin" type="error">
        Accès réservé aux super-administrateurs.
      </v-alert>

      <template v-if="!loadingUser && isSuperAdmin">
        <v-card-text>
          <v-text-field
            v-model="search"
            label="Rechercher (nom, Steam ID)"
            prepend-icon="mdi-magnify"
            clearable
            @keyup.enter="searchUsers"
            @click:clear="clearSearch"
          />
        </v-card-text>

        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :items-per-page="25"
          class="elevation-1"
        >
          <template v-slot:item.super_admin="{ item }">
            <v-chip
              small
              :color="item.super_admin === 1 ? 'primary' : 'grey lighten-1'"
            >
              {{ item.super_admin === 1 ? "Oui" : "Non" }}
            </v-chip>
          </template>
          <template v-slot:item.admin="{ item }">
            <v-chip
              small
              :color="item.admin === 1 ? 'orange' : 'grey lighten-1'"
            >
              {{ item.admin === 1 ? "Oui" : "Non" }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              small
              @click="openEdit(item)"
              title="Modifier les droits"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <!-- Dialog modification -->
        <v-dialog v-model="editDialog" max-width="450">
          <v-card v-if="editUser">
            <v-card-title>
              <v-avatar size="36" class="mr-2">
                <img :src="editUser.small_image" v-if="editUser.small_image" />
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              {{ editUser.name }}
            </v-card-title>
            <v-card-subtitle>{{ editUser.steam_id }}</v-card-subtitle>
            <v-card-text>
              <v-switch
                v-model="editUser.admin"
                :true-value="1"
                :false-value="0"
                label="Admin"
                color="orange"
              />
              <v-switch
                v-model="editUser.super_admin"
                :true-value="1"
                :false-value="0"
                label="Super Admin"
                color="primary"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text @click="editDialog = false">Annuler</v-btn>
              <v-btn color="primary" :loading="editSaving" @click="saveUser">
                <v-icon left>mdi-content-save</v-icon>
                Enregistrer
              </v-btn>
            </v-card-actions>
            <v-alert v-if="editError" type="error" class="ma-2">{{
              editError
            }}</v-alert>
          </v-card>
        </v-dialog>

        <v-alert v-if="successMsg" type="success" class="ma-4">{{
          successMsg
        }}</v-alert>
      </template>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "AdminUsers",
  data() {
    return {
      user: { id: null, super_admin: 0 },
      loadingUser: true,
      users: [],
      search: "",
      loading: false,
      headers: [
        { text: "Nom", value: "name" },
        { text: "Steam ID", value: "steam_id" },
        { text: "Super Admin", value: "super_admin", align: "center" },
        { text: "Admin", value: "admin", align: "center" },
        { text: "Actions", value: "actions", sortable: false, align: "center" }
      ],
      editDialog: false,
      editUser: null,
      editSaving: false,
      editError: "",
      successMsg: ""
    };
  },
  computed: {
    isSuperAdmin() {
      return Number(this.user.super_admin) === 1;
    }
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
    this.loadingUser = false;
    if (this.isSuperAdmin) await this.loadUsers();
  },
  methods: {
    async loadUsers(query = "") {
      this.loading = true;
      try {
        const url = query
          ? `${process.env?.VUE_APP_G5V_API_URL ||
              "/api"}/users?search=${encodeURIComponent(query)}`
          : `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users`;
        const res = await this.axioCall.get(url);
        this.users = Array.isArray(res.data) ? res.data : res.data.users || [];
      } catch {
        this.users = [];
      } finally {
        this.loading = false;
      }
    },
    async searchUsers() {
      await this.loadUsers(this.search);
    },
    clearSearch() {
      this.search = "";
      this.loadUsers();
    },
    openEdit(item) {
      this.editUser = {
        ...item,
        admin: Number(item.admin),
        super_admin: Number(item.super_admin)
      };
      this.editError = "";
      this.editDialog = true;
    },
    async saveUser() {
      this.editSaving = true;
      this.editError = "";
      this.successMsg = "";
      try {
        await this.axioCall.put(
          `${process.env?.VUE_APP_G5V_API_URL || "/api"}/users`,
          [
            {
              id: this.editUser.id,
              steam_id: this.editUser.steam_id,
              admin: this.editUser.admin,
              super_admin: this.editUser.super_admin
            }
          ]
        );
        // Mise à jour locale
        const idx = this.users.findIndex(u => u.id === this.editUser.id);
        if (idx !== -1) {
          this.users[idx].admin = this.editUser.admin;
          this.users[idx].super_admin = this.editUser.super_admin;
          this.users = [...this.users];
        }
        this.successMsg = `Droits de ${this.editUser.name} mis à jour.`;
        this.editDialog = false;
      } catch (err) {
        this.editError =
          err.response?.data?.message || "Erreur lors de la sauvegarde.";
      } finally {
        this.editSaving = false;
      }
    }
  }
};
</script>
