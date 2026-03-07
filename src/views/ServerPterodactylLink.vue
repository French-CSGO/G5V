<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <v-btn icon to="/servers" exact class="mr-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ $t("ServerPteroLink.Title") }}
        <v-spacer />
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="saving || loading"
          @click="saveAll"
        >
          <v-icon left>mdi-content-save</v-icon>
          {{ $t("ServerPteroLink.SaveAll") }}
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
        <v-alert v-if="successMsg" type="success" dense>{{
          successMsg
        }}</v-alert>

        <v-data-table
          :headers="headers"
          :items="servers"
          :loading="loading"
          dense
          hide-default-footer
          :items-per-page="-1"
        >
          <template v-slot:item.pterodactyl_id="{ item }">
            <v-select
              v-model="item.pterodactyl_id"
              :items="pteroOptions"
              item-text="label"
              item-value="identifier"
              clearable
              dense
              hide-details
              style="min-width: 220px;"
            >
              <template v-slot:item="{ item: opt }">
                <span>{{ opt.name }}</span>
                <v-chip
                  x-small
                  :color="opt.status === 'running' ? 'green' : 'grey'"
                  dark
                  class="ml-2"
                >
                  {{ opt.status }}
                </v-chip>
                <span class="ml-2 caption grey--text">{{
                  opt.identifier
                }}</span>
              </template>
              <template v-slot:selection="{ item: opt }">
                <span>{{ opt.name }}</span>
                <v-chip
                  x-small
                  :color="opt.status === 'running' ? 'green' : 'grey'"
                  dark
                  class="ml-2"
                >
                  {{ opt.status }}
                </v-chip>
              </template>
            </v-select>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "ServerPterodactylLink",
  data() {
    return {
      servers: [],
      pteroServers: [],
      loading: false,
      saving: false,
      error: "",
      successMsg: ""
    };
  },
  computed: {
    headers() {
      return [
        { text: this.$t("ServerPteroLink.ColServer"), value: "display_name" },
        { text: "IP", value: "ip_string" },
        {
          text: this.$t("ServerPteroLink.ColPterodactyl"),
          value: "pterodactyl_id",
          sortable: false
        }
      ];
    },
    pteroOptions() {
      return this.pteroServers.map(s => ({
        ...s,
        label: `${s.name} (${s.identifier})`
      }));
    }
  },
  async created() {
    this.loading = true;
    const [servers, ptero] = await Promise.all([
      this.GetAllServers(),
      this.GetPterodactylServers()
    ]);
    this.servers = Array.isArray(servers) ? servers.map(s => ({ ...s })) : [];
    this.pteroServers = Array.isArray(ptero) ? ptero : [];
    this.loading = false;
  },
  methods: {
    async saveAll() {
      this.saving = true;
      this.error = "";
      this.successMsg = "";
      let updated = 0;
      let failed = 0;

      for (const server of this.servers) {
        try {
          await this.UpdateServer([
            {
              server_id: server.id,
              pterodactyl_id: server.pterodactyl_id || null
            }
          ]);
          updated++;
        } catch {
          failed++;
        }
      }

      this.saving = false;
      if (failed === 0) {
        this.successMsg = this.$t("ServerPteroLink.SaveSuccess", {
          n: updated
        });
      } else {
        this.error = this.$t("ServerPteroLink.SavePartial", {
          updated,
          failed
        });
      }
    }
  }
};
</script>
