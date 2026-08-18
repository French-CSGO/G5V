<template>
  <v-container fluid class="team-sync">
    <h1 class="team-sync__title">Synchroniseur d'équipes Challonge</h1>
    <p class="team-sync__hint">
      Associe chaque équipe G5 d'une saison à son équipe Challonge
      (<code>challonge_team_id</code>), pour que le placement automatique du
      swiss puisse résoudre correctement chaque match.
    </p>

    <div class="team-sync__row">
      <input
        v-model="seasonIdInput"
        type="text"
        placeholder="ID de la saison"
        @keyup.enter="loadSeason"
      />
      <button type="button" @click="loadSeason">Charger</button>
    </div>
    <div class="team-sync__caption">{{ status }}</div>

    <template v-if="currentSeasonId">
      <hr />
      <div
        v-if="challongeTournaments.length > 1"
        class="team-sync__row"
        style="grid-template-columns: 1fr"
      >
        <select v-model="challongeTournamentId">
          <option :value="null">Choisir le bracket Challonge...</option>
          <option v-for="t in challongeTournaments" :key="t.id" :value="t.id">
            {{ t.label || t.challonge_slug }}
          </option>
        </select>
      </div>
      <button
        type="button"
        class="primary"
        :disabled="
          syncing ||
          !challongeTournaments.length ||
          (challongeTournaments.length > 1 && !challongeTournamentId)
        "
        @click="syncWithChallonge"
      >
        {{ syncing ? "Synchronisation..." : "Synchroniser avec Challonge" }}
      </button>
      <div class="team-sync__caption" style="margin-bottom: 10px">
        Propose une association automatique par nom pour chaque équipe. Si
        aucune correspondance n'est trouvée, l'ID Challonge actuel de l'équipe
        est conservé — tu peux changer n'importe quelle association manuellement
        avant d'enregistrer.
      </div>

      <table v-if="teams.length" class="team-sync__table">
        <thead>
          <tr>
            <th>Équipe G5</th>
            <th>ID Challonge actuel</th>
            <th>Association</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="team in teams" :key="team.id">
            <td class="team-sync__team-cell">
              <img v-if="team.logo" :src="logoSrc(team)" />
              <span
                >{{ team.name }}
                <span v-if="team.tag" class="team-sync__tag"
                  >({{ team.tag }})</span
                ></span
              >
            </td>
            <td>{{ team.challonge_team_id || "—" }}</td>
            <td>
              <select
                v-model="selections[team.id]"
                @change="onManualChange(team)"
              >
                <option value="">— Aucun —</option>
                <option
                  v-for="opt in optionsForTeam(team)"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <span
                v-if="matchStatus(team) === 'auto'"
                class="team-sync__badge team-sync__badge--auto"
                >association automatique</span
              >
              <span
                v-else-if="matchStatus(team) === 'kept'"
                class="team-sync__badge team-sync__badge--kept"
                >aucune correspondance, ID conservé</span
              >
              <span
                v-else-if="matchStatus(team) === 'manual'"
                class="team-sync__badge team-sync__badge--manual"
                >modifié manuellement</span
              >
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="team-sync__empty">
        Aucune équipe dans cette saison.
      </div>

      <button
        v-if="teams.length"
        type="button"
        class="primary"
        :disabled="saving"
        @click="saveAssociations"
      >
        {{ saving ? "Enregistrement..." : "Enregistrer les associations" }}
      </button>
    </template>

    <v-snackbar v-model="snack" :color="snackColor" timeout="3000" bottom>
      {{ snackMsg }}
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "SeasonTeamSync",
  data() {
    return {
      seasonIdInput: "",
      currentSeasonId: null,
      teams: [],
      challongeTournaments: [],
      challongeTournamentId: null,
      challongeParticipants: [],
      // teamId -> { value: string, source: "auto" | "kept" | "manual" }
      selectionMeta: {},
      selections: {},
      status: "Aucune saison chargée.",
      syncing: false,
      saving: false,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
      snack: false,
      snackMsg: "",
      snackColor: "success",
    };
  },
  mounted() {
    const season = this.$route.query.season;
    if (season) {
      this.seasonIdInput = String(season);
      this.loadSeason();
    }
  },
  methods: {
    notify(msg, color = "success") {
      this.snackMsg = msg;
      this.snackColor = color;
      this.snack = true;
    },
    logoSrc(team) {
      return `${this.apiUrl}/static/img/logos/${team.logo}.png`;
    },
    normalizeName(s) {
      return (s || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
    },
    optionsForTeam(team) {
      const opts = this.challongeParticipants.map((p) => ({
        value: String(p.id),
        label: `${p.name} (#${p.id})`,
      }));
      const current = team.challonge_team_id
        ? String(team.challonge_team_id)
        : "";
      if (current && !opts.some((o) => o.value === current)) {
        opts.unshift({
          value: current,
          label: `ID actuel non reconnu dans ce bracket : ${current}`,
        });
      }
      return opts;
    },
    matchStatus(team) {
      return this.selectionMeta[team.id]?.source || null;
    },
    onManualChange(team) {
      this.$set(this.selectionMeta, team.id, { source: "manual" });
    },
    async loadSeason() {
      const seasonId = this.seasonIdInput.trim();
      if (!seasonId) {
        this.status = "Indique un ID de saison.";
        return;
      }
      this.status = "Chargement...";
      try {
        const [teams, tournaments] = await Promise.all([
          this.GetSeasonTeams(seasonId),
          this.GetSeasonChallongeTournaments(seasonId).catch(() => []),
        ]);
        if (!Array.isArray(teams)) {
          throw new Error(
            typeof teams === "string" ? teams : "Saison introuvable.",
          );
        }
        this.currentSeasonId = seasonId;
        this.teams = teams;
        this.challongeTournaments = Array.isArray(tournaments)
          ? tournaments
          : [];
        this.challongeTournamentId =
          this.challongeTournaments.length === 1
            ? this.challongeTournaments[0].id
            : null;
        this.challongeParticipants = [];
        this.selections = {};
        this.selectionMeta = {};
        teams.forEach((t) => {
          this.$set(
            this.selections,
            t.id,
            t.challonge_team_id ? String(t.challonge_team_id) : "",
          );
          this.$set(this.selectionMeta, t.id, { source: null });
        });
        this.status = `${teams.length} équipe(s) chargée(s).`;
      } catch (err) {
        this.status = "Erreur : " + (err.message || err);
      }
    },
    async syncWithChallonge() {
      if (!this.currentSeasonId) return;
      if (this.challongeTournaments.length > 1 && !this.challongeTournamentId) {
        this.notify("Choisis d'abord un bracket Challonge.", "error");
        return;
      }
      const tournamentId =
        this.challongeTournamentId ||
        (this.challongeTournaments.length === 1
          ? this.challongeTournaments[0].id
          : null);
      if (!tournamentId) {
        this.notify(
          "Aucun bracket Challonge disponible pour cette saison.",
          "error",
        );
        return;
      }
      this.syncing = true;
      try {
        const participants = await this.GetChallongeTournamentParticipants(
          this.currentSeasonId,
          tournamentId,
        );
        this.challongeParticipants = Array.isArray(participants)
          ? participants
          : [];

        let autoMatched = 0;
        let kept = 0;
        this.teams.forEach((team) => {
          const teamName = this.normalizeName(team.name);
          const teamTag = this.normalizeName(team.tag);
          const found = this.challongeParticipants.find((p) => {
            const pname = this.normalizeName(p.name);
            return pname === teamName || (teamTag && pname === teamTag);
          });
          if (found) {
            this.$set(this.selections, team.id, String(found.id));
            this.$set(this.selectionMeta, team.id, { source: "auto" });
            autoMatched++;
          } else {
            // Pas de correspondance : on garde l'ID déjà présent côté G5
            // (ou vide s'il n'y en avait pas), sans y toucher.
            this.$set(
              this.selections,
              team.id,
              team.challonge_team_id ? String(team.challonge_team_id) : "",
            );
            this.$set(this.selectionMeta, team.id, { source: "kept" });
            kept++;
          }
        });
        this.status = `Synchronisation : ${autoMatched} association(s) trouvée(s), ${kept} équipe(s) sans correspondance (ID conservé).`;
        this.notify(this.status);
      } catch (err) {
        this.notify(
          "Erreur lors de la synchronisation : " + (err.message || err),
          "error",
        );
      } finally {
        this.syncing = false;
      }
    },
    async saveAssociations() {
      if (!this.currentSeasonId) return;
      this.saving = true;
      try {
        const associations = this.teams.map((t) => ({
          team_id: t.id,
          challonge_team_id: this.selections[t.id] || null,
        }));
        const res = await this.SaveChallongeTeamSync(
          this.currentSeasonId,
          associations,
        );
        this.teams.forEach((t) => {
          t.challonge_team_id = this.selections[t.id] || null;
        });
        this.notify(res?.message || "Associations enregistrées.");
      } catch (err) {
        this.notify(
          "Erreur lors de l'enregistrement : " + (err.message || err),
          "error",
        );
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.team-sync {
  --ts-bg: #0b0d12;
  --ts-panel: #191c23;
  --ts-line: #343946;
  --ts-text: #f4f6fb;
  --ts-muted: #a8afbf;
  --ts-accent: #e8523a;
  color: var(--ts-text);
  max-width: 900px;
}

.team-sync__title {
  font-size: 22px;
  margin: 0 0 6px;
}

.team-sync__hint,
.team-sync__caption {
  color: var(--ts-muted);
  font-size: 13px;
  line-height: 1.4;
}

.team-sync__row {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 8px;
  margin: 10px 0;
}

.team-sync input[type="text"],
.team-sync select,
.team-sync button {
  border: 1px solid var(--ts-line);
  background: #232733;
  color: var(--ts-text);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.team-sync button {
  cursor: pointer;
  margin: 4px 0;
}

.team-sync button.primary {
  background: var(--ts-accent);
  border-color: var(--ts-accent);
  font-weight: 700;
}

.team-sync button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.team-sync hr {
  border: 0;
  border-top: 1px solid var(--ts-line);
  margin: 16px 0;
}

.team-sync__table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.team-sync__table th,
.team-sync__table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--ts-line);
  font-size: 13px;
  vertical-align: middle;
}

.team-sync__team-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-sync__team-cell img {
  width: 32px;
  height: 26px;
  object-fit: contain;
  background: #15171d;
  border-radius: 4px;
}

.team-sync__tag {
  color: var(--ts-muted);
  font-size: 11px;
}

.team-sync__table select {
  width: auto;
  min-width: 220px;
  padding: 6px 8px;
}

.team-sync__badge {
  display: inline-block;
  margin-left: 8px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.team-sync__badge--auto {
  background: #1f4d33;
  color: #6fe0a0;
}

.team-sync__badge--kept {
  background: #4d3a1f;
  color: #e0b06f;
}

.team-sync__badge--manual {
  background: #2b4f85;
  color: #6fa0ff;
}

.team-sync__empty {
  color: var(--ts-muted);
  font-size: 13px;
}
</style>
