<template>
  <v-container fluid class="rr-gen">
    <div class="rr-gen__app">
      <aside class="rr-gen__aside">
        <h1 class="rr-gen__title">Générateur Round Robin</h1>
        <p class="rr-gen__hint">
          Charge les équipes d'une saison, répartis-les en poules, et suis
          l'avancement des matchs (joués / à jouer) ainsi que le classement de
          chaque poule.
        </p>

        <hr />
        <strong>Saison</strong>
        <p class="rr-gen__hint" style="margin: 4px 0 8px">
          Charge les équipes et les matchs déjà enregistrés d'une saison. Toutes
          les modifications (poules, résultats) se sauvegardent sur le serveur,
          pour cette saison.
        </p>
        <div class="rr-gen__row">
          <input
            v-model="seasonIdInput"
            type="text"
            placeholder="ID de la saison"
          />
          <button type="button" @click="loadSeason">Charger</button>
        </div>
        <button
          type="button"
          class="primary"
          :disabled="!currentSeasonId || saving"
          @click="saveBoard"
        >
          {{ saving ? "Enregistrement..." : "Enregistrer sur le serveur" }}
        </button>
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="copyOverlayLink"
        >
          Copier le lien overlay OBS
        </button>
        <div class="rr-gen__caption" style="margin-bottom: 6px">
          Lien en fond transparent pour une source navigateur OBS : reflète
          automatiquement le dernier tableau enregistré (clique sur "Enregistrer
          sur le serveur" après chaque changement) et se rafraîchit tout seul
          toutes les 30s.
        </div>
        <label class="rr-gen__small">
          <input v-model="autoRefreshEnabled" type="checkbox" />
          Actualisation automatique (toutes les 30s)
        </label>
        <div class="rr-gen__caption">{{ status }}</div>

        <hr />
        <strong>Générer les poules</strong>
        <div class="rr-gen__row">
          <input
            v-model.number="numPoolsInput"
            type="number"
            min="1"
            placeholder="Nb de poules"
          />
          <input
            v-model.number="poolSizeInput"
            type="number"
            min="2"
            placeholder="Taille"
          />
        </div>
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="generatePools"
        >
          Générer {{ numPoolsInput }} poule(s) de {{ poolSizeInput }}
        </button>
        <div class="rr-gen__caption" style="margin-bottom: 6px">
          Crée les poules et y répartit automatiquement les équipes chargées. Le
          calendrier round robin (tous les matchs possibles) de chaque poule est
          généré automatiquement — il ne reste qu'à ajuster les équipes à la
          main si besoin.
        </div>

        <hr />
        <strong>Challonge</strong>
        <div
          v-if="challongeTournaments.length > 1"
          class="rr-gen__row"
          style="grid-template-columns: 1fr"
        >
          <select v-model="challongeTournamentId">
            <option :value="null">Bracket Challonge : auto</option>
            <option v-for="t in challongeTournaments" :key="t.id" :value="t.id">
              {{ t.label || t.challonge_slug }}
            </option>
          </select>
        </div>
        <button
          type="button"
          :disabled="!currentSeasonId"
          @click="autoPlaceFromChallonge"
        >
          Charger les poules depuis Challonge
        </button>
        <div class="rr-gen__caption">
          Reconstruit les poules à partir des groupes (group stage) du bracket
          Challonge lié à la saison, et importe les résultats déjà joués. Seules
          les équipes liées (challonge_team_id synchronisé) sont placées. Si la
          saison n'est pas liée à Challonge, un message d'erreur s'affiche.
        </div>

        <template v-if="teams.length">
          <hr />
          <strong>
            Équipes ({{ unassignedTeams.length }} non placée(s) /
            {{ teams.length }})
          </strong>
          <div class="rr-gen__team-list">
            <div
              v-for="team in teams"
              :key="team.id"
              class="rr-gen__team"
              :class="{
                'rr-gen__team--active': team.id === selectedTeamId,
                'rr-gen__team--placed': isTeamPlaced(team),
              }"
              @click="selectTeam(team)"
            >
              <img v-if="team.src" :src="team.src" />
              <span>{{ team.name }}</span>
            </div>
          </div>
          <div class="rr-gen__caption">
            Sélectionne une équipe puis clique sur "+ emplacement" dans une
            poule pour la placer (elle est retirée de son ancienne poule
            automatiquement).
          </div>
        </template>
      </aside>

      <main class="rr-gen__stage">
        <div v-if="!currentSeasonId" class="rr-gen__empty">
          Charge une saison pour commencer.
        </div>
        <div v-else class="rr-gen__pools">
          <div v-for="pool in pools" :key="pool.id" class="rr-gen__pool">
            <div class="rr-gen__pool-head">
              <input class="rr-gen__pool-name" v-model="pool.name" />
              <button
                type="button"
                class="rr-gen__pool-remove"
                title="Supprimer la poule"
                @click="removePool(pool.id)"
              >
                ✕
              </button>
            </div>

            <div class="rr-gen__pool-slots">
              <div v-for="key in pool.teamKeys" :key="key" class="rr-gen__slot">
                <span>{{ teamNameByKey(key) }}</span>
                <button type="button" @click="removeTeamFromPool(pool.id, key)">
                  ✕
                </button>
              </div>
              <div
                class="rr-gen__slot rr-gen__slot--empty"
                @click="assignSelectedTeamToPool(pool.id)"
              >
                + emplacement
              </div>
            </div>

            <table class="rr-gen__matches" v-if="poolMatches(pool).length">
              <thead>
                <tr>
                  <th colspan="3">
                    Matchs ({{ playedCount(pool) }} /
                    {{ poolMatches(pool).length }} joués)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="m in poolMatches(pool)"
                  :key="m.key"
                  :class="{ 'rr-gen__match--locked': m.locked }"
                >
                  <td
                    class="rr-gen__team-cell"
                    :class="{
                      'rr-gen__winner': m.result === 'A',
                      'rr-gen__loser': m.result === 'B',
                    }"
                    @click="toggleResult(pool, m, 'A')"
                  >
                    {{ teamNameByKey(m.teamAKey) }}
                  </td>
                  <td
                    class="rr-gen__vs"
                    :class="{ 'rr-gen__draw': m.result === 'draw' }"
                    @click="toggleDraw(pool, m)"
                  >
                    vs
                  </td>
                  <td
                    class="rr-gen__team-cell"
                    :class="{
                      'rr-gen__winner': m.result === 'B',
                      'rr-gen__loser': m.result === 'A',
                    }"
                    @click="toggleResult(pool, m, 'B')"
                  >
                    {{ teamNameByKey(m.teamBKey) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <table class="rr-gen__standings" v-if="pool.teamKeys.length">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Équipe</th>
                  <th>J</th>
                  <th>G</th>
                  <th>N</th>
                  <th>P</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in poolStandings(pool)" :key="s.key">
                  <td>{{ i + 1 }}</td>
                  <td>{{ teamNameByKey(s.key) }}</td>
                  <td>{{ s.played }}</td>
                  <td>{{ s.wins }}</td>
                  <td>{{ s.draws }}</td>
                  <td>{{ s.losses }}</td>
                  <td>{{ s.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button type="button" class="rr-gen__add-pool" @click="addPool">
            + Ajouter une poule
          </button>
        </div>
      </main>
    </div>
    <v-snackbar v-model="snack" :color="snackColor">{{ snackMsg }}</v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: "RoundRobinGenerator",
  data() {
    return {
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",
      seasonIdInput: "",
      currentSeasonId: null,
      teams: [],
      importedMatches: [],
      challongeTournaments: [],
      challongeTournamentId: null,
      challongeMatches: [],
      pools: [],
      matchResults: {},
      lockedResults: {},
      numPoolsInput: 8,
      poolSizeInput: 4,
      selectedTeamId: null,
      status: "Charge une saison pour commencer.",
      saving: false,
      autoRefreshEnabled: true,
      snack: false,
      snackMsg: "",
      snackColor: "success",
    };
  },
  computed: {
    unassignedTeams() {
      return this.teams.filter((t) => !this.isTeamPlaced(t));
    },
  },
  mounted() {
    const season = this.$route.query.season;
    if (season != null) {
      this.seasonIdInput = String(season);
      this.loadSeason();
    }
  },
  beforeDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  },
  methods: {
    notify(msg, color = "success") {
      this.snackMsg = msg;
      this.snackColor = color;
      this.snack = true;
    },
    uid() {
      return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random();
    },
    teamKey(team) {
      return team.g5Id != null ? `g${team.g5Id}` : `c${team.id}`;
    },
    teamByKey(key) {
      if (!key) return null;
      if (key.startsWith("g")) {
        const gid = Number(key.slice(1));
        return this.teams.find((t) => t.g5Id === gid) || null;
      }
      const cid = key.slice(1);
      return this.teams.find((t) => t.g5Id == null && t.id === cid) || null;
    },
    teamNameByKey(key) {
      const t = this.teamByKey(key);
      return t ? t.name : "?";
    },
    isTeamPlaced(team) {
      const key = this.teamKey(team);
      return this.pools.some((p) => p.teamKeys.includes(key));
    },
    selectTeam(team) {
      this.selectedTeamId = this.selectedTeamId === team.id ? null : team.id;
    },
    assignSelectedTeamToPool(poolId) {
      if (!this.selectedTeamId) {
        this.status = "Sélectionne d'abord une équipe.";
        return;
      }
      const team = this.teams.find((t) => t.id === this.selectedTeamId);
      if (!team) return;
      const key = this.teamKey(team);
      this.pools.forEach((p) => {
        p.teamKeys = p.teamKeys.filter((k) => k !== key);
      });
      const pool = this.pools.find((p) => p.id === poolId);
      if (pool && !pool.teamKeys.includes(key)) pool.teamKeys.push(key);
      this.selectedTeamId = null;
      this.recomputeResults();
    },
    removeTeamFromPool(poolId, key) {
      const pool = this.pools.find((p) => p.id === poolId);
      if (!pool) return;
      pool.teamKeys = pool.teamKeys.filter((k) => k !== key);
    },
    addPool() {
      this.pools.push({
        id: this.uid(),
        name: `Poule ${this.pools.length + 1}`,
        teamKeys: [],
      });
    },
    removePool(poolId) {
      this.pools = this.pools.filter((p) => p.id !== poolId);
    },
    generatePools() {
      const n = Math.max(1, this.numPoolsInput || 1);
      const size = Math.max(2, this.poolSizeInput || 2);
      this.pools = Array.from({ length: n }, (_, i) => ({
        id: this.uid(),
        name: `Poule ${i + 1}`,
        teamKeys: [],
      }));
      let poolIdx = 0;
      for (const team of this.teams) {
        let attempts = 0;
        while (this.pools[poolIdx].teamKeys.length >= size && attempts < n) {
          poolIdx = (poolIdx + 1) % n;
          attempts++;
        }
        if (this.pools[poolIdx].teamKeys.length < size) {
          this.pools[poolIdx].teamKeys.push(this.teamKey(team));
        }
        poolIdx = (poolIdx + 1) % n;
      }
      this.recomputeResults();
      const placed = this.pools.reduce((s, p) => s + p.teamKeys.length, 0);
      this.status = `${n} poule(s) générée(s), ${placed}/${this.teams.length} équipe(s) réparties.`;
    },
    pairKey(keyA, keyB) {
      return [keyA, keyB].sort().join(":");
    },
    poolMatches(pool) {
      const keys = [...pool.teamKeys].sort();
      const out = [];
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const teamAKey = keys[i];
          const teamBKey = keys[j];
          const key = `${pool.id}:${teamAKey}:${teamBKey}`;
          out.push({
            key,
            teamAKey,
            teamBKey,
            result: this.matchResults[key] || null,
            locked: !!this.lockedResults[key],
          });
        }
      }
      return out;
    },
    playedCount(pool) {
      return this.poolMatches(pool).filter((m) => m.result).length;
    },
    poolStandings(pool) {
      const rows = pool.teamKeys.map((key) => ({
        key,
        wins: 0,
        draws: 0,
        losses: 0,
        played: 0,
        points: 0,
      }));
      const byKey = new Map(rows.map((r) => [r.key, r]));
      const matches = this.poolMatches(pool);
      for (const m of matches) {
        if (!m.result) continue;
        const a = byKey.get(m.teamAKey);
        const b = byKey.get(m.teamBKey);
        if (!a || !b) continue;
        a.played++;
        b.played++;
        if (m.result === "draw") {
          a.draws++;
          b.draws++;
          a.points += 1;
          b.points += 1;
        } else if (m.result === "A") {
          a.wins++;
          b.losses++;
          a.points += 3;
        } else {
          b.wins++;
          a.losses++;
          b.points += 3;
        }
      }
      // Départage à points égaux : le résultat du face-à-face direct entre
      // les deux équipes concernées (pas de calcul multi-équipes).
      const headToHead = (x, y) => {
        const m = matches.find(
          (m) =>
            (m.teamAKey === x.key && m.teamBKey === y.key) ||
            (m.teamAKey === y.key && m.teamBKey === x.key),
        );
        if (!m || !m.result || m.result === "draw") return 0;
        const xIsA = m.teamAKey === x.key;
        const xWon = (m.result === "A") === xIsA;
        return xWon ? -1 : 1;
      };
      return rows.sort(
        (x, y) =>
          y.points - x.points ||
          headToHead(x, y) ||
          this.teamNameByKey(x.key).localeCompare(this.teamNameByKey(y.key)),
      );
    },
    toggleResult(pool, m, side) {
      if (this.matchResults[m.key] === side) {
        this.$delete(this.matchResults, m.key);
        this.$delete(this.lockedResults, m.key);
        this.recomputeResults();
      } else {
        this.$set(this.matchResults, m.key, side);
        this.$set(this.lockedResults, m.key, true);
      }
    },
    toggleDraw(pool, m) {
      if (this.matchResults[m.key] === "draw") {
        this.$delete(this.matchResults, m.key);
        this.$delete(this.lockedResults, m.key);
        this.recomputeResults();
      } else {
        this.$set(this.matchResults, m.key, "draw");
        this.$set(this.lockedResults, m.key, true);
      }
    },
    resultFromImportedMatches(g5A, g5B) {
      const match = this.importedMatches.find(
        (m) =>
          !m.cancelled &&
          m.end_time &&
          ((m.team1_id === g5A && m.team2_id === g5B) ||
            (m.team1_id === g5B && m.team2_id === g5A)),
      );
      if (!match || match.winner == null) return null;
      if (match.winner === g5A) return "A";
      if (match.winner === g5B) return "B";
      return null;
    },
    resultFromChallonge(g5A, g5B) {
      const cm = this.challongeMatches.find((m) => {
        const a = m.player1?.local_team?.id;
        const b = m.player2?.local_team?.id;
        return (a === g5A && b === g5B) || (a === g5B && b === g5A);
      });
      if (!cm || cm.winner_id == null) return null;
      let winnerTeamId = null;
      if (cm.winner_id === cm.player1?.id)
        winnerTeamId = cm.player1?.local_team?.id;
      else if (cm.winner_id === cm.player2?.id)
        winnerTeamId = cm.player2?.local_team?.id;
      if (winnerTeamId === g5A) return "A";
      if (winnerTeamId === g5B) return "B";
      return null;
    },
    recomputeResults() {
      for (const pool of this.pools) {
        for (const m of this.poolMatches(pool)) {
          if (this.lockedResults[m.key]) continue;
          const teamA = this.teamByKey(m.teamAKey);
          const teamB = this.teamByKey(m.teamBKey);
          if (!teamA || !teamB || teamA.g5Id == null || teamB.g5Id == null)
            continue;
          const resultSide =
            this.resultFromChallonge(teamA.g5Id, teamB.g5Id) ||
            this.resultFromImportedMatches(teamA.g5Id, teamB.g5Id);
          if (resultSide) this.$set(this.matchResults, m.key, resultSide);
          else this.$delete(this.matchResults, m.key);
        }
      }
    },
    async loadSeason() {
      const seasonId = this.seasonIdInput.trim();
      if (!seasonId) {
        this.status = "Indique un ID de saison.";
        return;
      }
      this.status = "Chargement...";
      try {
        const [seasonTeams, seasonMatches, board, challongeTournaments] =
          await Promise.all([
            this.GetSeasonTeams(seasonId),
            this.GetSeasonRecentMatches(seasonId),
            this.GetRoundRobinBoard(seasonId),
            this.GetSeasonChallongeTournaments(seasonId).catch(() => []),
          ]);
        this.challongeTournaments = Array.isArray(challongeTournaments)
          ? challongeTournaments
          : [];
        if (!Array.isArray(seasonTeams)) {
          throw new Error(
            typeof seasonTeams === "string"
              ? seasonTeams
              : "Saison introuvable.",
          );
        }
        this.currentSeasonId = seasonId;

        const g5Teams = seasonTeams.map((t) => ({
          id: this.uid(),
          g5Id: t.id,
          name: t.name,
          tag: t.tag || null,
          src: t.logo ? `${this.apiUrl}/static/img/logos/${t.logo}.png` : "",
        }));
        const customTeams = ((board && board.customTeams) || []).map((t) => ({
          id: t.id,
          g5Id: null,
          name: t.name,
          tag: t.tag || null,
          src: t.src || "",
        }));
        this.teams = [...g5Teams, ...customTeams];

        this.importedMatches = (
          Array.isArray(seasonMatches) ? seasonMatches : []
        ).map((m) => ({
          id: m.id,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          team1_string: m.team1_string,
          team2_string: m.team2_string,
          winner: m.winner,
          cancelled: !!m.cancelled,
          end_time: m.end_time,
        }));

        if (board && Array.isArray(board.pools)) {
          this.pools = board.pools.map((p) => ({
            id: p.id || this.uid(),
            name: p.name || "Poule",
            teamKeys: (p.teamKeys || []).filter((k) => this.teamByKey(k)),
          }));
          this.matchResults = { ...(board.matchResults || {}) };
          this.lockedResults = { ...(board.lockedResults || {}) };
          this.challongeTournamentId = board.challongeTournamentId ?? null;
          this.status = `${g5Teams.length} équipe(s), ${this.pools.length} poule(s) — tableau sauvegardé chargé.`;
        } else {
          this.pools = [];
          this.matchResults = {};
          this.lockedResults = {};
          this.challongeTournamentId = null;
          this.status = `${g5Teams.length} équipe(s) chargée(s). Aucun tableau sauvegardé — génère ou charge des poules.`;
        }
        if (
          this.challongeTournamentId == null &&
          this.challongeTournaments.length === 1
        ) {
          this.challongeTournamentId = this.challongeTournaments[0].id;
        }
        this.selectedTeamId = null;
        this.recomputeResults();
        this.startAutoRefresh();
      } catch (err) {
        this.status = "Erreur : " + (err.message || err);
      }
    },
    async autoPlaceFromChallonge() {
      if (!this.currentSeasonId) return;
      try {
        const matches = await this.GetSeasonChallongeMatches(
          this.currentSeasonId,
          this.challongeTournamentId,
        );
        if (!Array.isArray(matches)) {
          this.notify("Erreur lors du chargement Challonge.", "error");
          return;
        }
        this.challongeMatches = matches;

        const groups = new Map();
        let skippedUnlinked = 0;
        for (const cm of matches) {
          const gid = cm.group_id != null ? String(cm.group_id) : "default";
          if (!groups.has(gid)) groups.set(gid, new Set());
          for (const p of [cm.player1, cm.player2]) {
            if (!p) continue;
            if (p.local_team) groups.get(gid).add(`g${p.local_team.id}`);
            else skippedUnlinked++;
          }
        }
        const sortedGroupIds = [...groups.keys()].sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return a.localeCompare(b);
        });
        this.pools = sortedGroupIds.map((gid, i) => ({
          id: this.uid(),
          name: `Poule ${i + 1}`,
          teamKeys: [...groups.get(gid)],
        }));
        this.recomputeResults();
        const placed = this.pools.reduce((s, p) => s + p.teamKeys.length, 0);
        this.status = `${this.pools.length} poule(s) chargée(s) depuis Challonge, ${placed} équipe(s)${
          skippedUnlinked
            ? `, ${skippedUnlinked} participant(s) non lié(s) ignoré(s)`
            : ""
        }.`;
        this.notify(this.status);
      } catch (err) {
        this.notify(
          "Erreur lors du chargement Challonge : " + (err.message || err),
          "error",
        );
      }
    },
    async refreshMatches() {
      if (!this.currentSeasonId) return;
      try {
        const seasonMatches = await this.GetSeasonRecentMatches(
          this.currentSeasonId,
        );
        this.importedMatches = (
          Array.isArray(seasonMatches) ? seasonMatches : []
        ).map((m) => ({
          id: m.id,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          team1_string: m.team1_string,
          team2_string: m.team2_string,
          winner: m.winner,
          cancelled: !!m.cancelled,
          end_time: m.end_time,
        }));
        if (
          this.challongeTournamentId != null ||
          this.challongeTournaments.length
        ) {
          const cm = await this.GetSeasonChallongeMatches(
            this.currentSeasonId,
            this.challongeTournamentId,
          ).catch(() => null);
          if (Array.isArray(cm)) this.challongeMatches = cm;
        }
        this.recomputeResults();
      } catch {
        // Rafraîchissement silencieux périodique : on ignore les erreurs.
      }
    },
    startAutoRefresh() {
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.refreshTimer = setInterval(() => {
        if (this.autoRefreshEnabled && this.currentSeasonId)
          this.refreshMatches();
      }, 30000);
    },
    async saveBoard() {
      if (!this.currentSeasonId) return;
      this.saving = true;
      try {
        const customTeams = this.teams
          .filter((t) => t.g5Id == null)
          .map((t) => ({ id: t.id, name: t.name, src: t.src }));
        // Denormalized team display data per key, so the public read-only
        // OBS overlay can render the board from this one saved payload
        // without needing an authenticated call to fetch team info.
        const resolvedTeams = {};
        const seenKeys = new Set();
        this.pools.forEach((p) => {
          p.teamKeys.forEach((key) => {
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            const team = this.teamByKey(key);
            if (!team) return;
            resolvedTeams[key] = {
              name: team.name,
              tag: team.tag || null,
              src: team.src || null,
              g5Id: team.g5Id ?? null,
            };
          });
        });
        const board = {
          version: 1,
          challongeTournamentId: this.challongeTournamentId,
          pools: this.pools.map((p) => ({
            id: p.id,
            name: p.name,
            teamKeys: p.teamKeys,
          })),
          matchResults: this.matchResults,
          lockedResults: this.lockedResults,
          customTeams,
          resolvedTeams,
        };
        await this.SaveRoundRobinBoard(this.currentSeasonId, board);
        this.notify("Enregistré sur le serveur.");
      } catch (err) {
        this.notify(
          "Erreur lors de l'enregistrement : " + (err.message || err),
          "error",
        );
      } finally {
        this.saving = false;
      }
    },
    async copyOverlayLink() {
      if (!this.currentSeasonId) return;
      const url = new URL(
        `/overlay/round-robin/${this.currentSeasonId}`,
        window.location.origin,
      ).href;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          this.legacyCopy(url);
        }
        this.notify("Lien overlay copié : " + url);
      } catch (err) {
        this.notify("Impossible de copier le lien.", "error");
      }
    },
    legacyCopy(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    },
  },
};
</script>

<style scoped>
.rr-gen {
  --rr-bg: #0b0d12;
  --rr-panel: #191c23;
  --rr-line: #343946;
  --rr-text: #f4f6fb;
  --rr-muted: #a8afbf;
  --rr-accent: #e8523a;
  --rr-win: #2fbf71;
  --rr-loss: #c13d4f;
  color: var(--rr-text);
}

.rr-gen__app {
  display: grid;
  grid-template-columns: 330px 1fr;
  min-height: calc(100vh - 120px);
}

.rr-gen__aside {
  background: var(--rr-panel);
  border-right: 1px solid var(--rr-line);
  padding: 16px;
  overflow: auto;
}

.rr-gen__title {
  font-size: 20px;
  margin: 0 0 6px;
}

.rr-gen__hint,
.rr-gen__caption {
  color: var(--rr-muted);
  font-size: 12px;
  line-height: 1.4;
}

.rr-gen__row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  margin: 6px 0;
}

.rr-gen__aside input,
.rr-gen__aside select,
.rr-gen__aside button {
  width: 100%;
  border: 1px solid var(--rr-line);
  background: #232733;
  color: var(--rr-text);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 4px 0;
  font-size: 13px;
}

.rr-gen__aside button {
  cursor: pointer;
  text-align: center;
}

.rr-gen__aside button:hover {
  filter: brightness(1.1);
}

.rr-gen__aside button.primary {
  background: var(--rr-accent);
  border-color: var(--rr-accent);
  font-weight: 700;
}

.rr-gen__aside hr {
  border: 0;
  border-top: 1px solid var(--rr-line);
  margin: 14px 0;
}

.rr-gen__small {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--rr-muted);
}

.rr-gen__small input {
  width: auto;
  margin: 0;
}

.rr-gen__team-list {
  display: grid;
  gap: 6px;
  margin-top: 8px;
  max-height: 260px;
  overflow: auto;
}

.rr-gen__team {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--rr-line);
  border-radius: 8px;
  background: #20242e;
  cursor: pointer;
  font-size: 13px;
}

.rr-gen__team img {
  width: 28px;
  height: 22px;
  object-fit: contain;
  background: #15171d;
  border-radius: 4px;
}

.rr-gen__team--active {
  outline: 2px solid var(--rr-accent);
}

.rr-gen__team--placed {
  opacity: 0.5;
}

.rr-gen__stage {
  overflow: auto;
  background: #090a0d;
  padding: 20px;
}

.rr-gen__empty {
  color: var(--rr-muted);
  text-align: center;
  margin-top: 60px;
}

.rr-gen__pools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-items: start;
}

.rr-gen__pool {
  background: var(--rr-panel);
  border: 1px solid var(--rr-line);
  border-radius: 10px;
  padding: 10px;
}

.rr-gen__pool-head {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.rr-gen__pool-name {
  flex: 1;
  background: transparent;
  border: 1px solid transparent;
  color: var(--rr-text);
  font-weight: 700;
  font-size: 14px;
  border-radius: 6px;
  padding: 4px 6px;
}

.rr-gen__pool-name:hover,
.rr-gen__pool-name:focus {
  border-color: var(--rr-line);
  outline: none;
}

.rr-gen__pool-remove {
  background: #8f1f2f;
  border: 1px solid #b33045;
  color: #fff;
  border-radius: 6px;
  width: 28px;
  cursor: pointer;
}

.rr-gen__pool-slots {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.rr-gen__slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #20242e;
  border: 1px solid var(--rr-line);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.rr-gen__slot button {
  background: transparent;
  border: none;
  color: var(--rr-muted);
  cursor: pointer;
}

.rr-gen__slot--empty {
  justify-content: center;
  color: var(--rr-muted);
  cursor: pointer;
  border-style: dashed;
}

.rr-gen__slot--empty:hover {
  color: var(--rr-text);
  border-color: var(--rr-accent);
}

.rr-gen__matches,
.rr-gen__standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 10px;
}

.rr-gen__matches th,
.rr-gen__standings th {
  text-align: left;
  color: var(--rr-muted);
  font-weight: 600;
  padding: 4px 6px;
  border-bottom: 1px solid var(--rr-line);
}

.rr-gen__matches td,
.rr-gen__standings td {
  padding: 4px 6px;
  border-bottom: 1px solid #20242e;
}

.rr-gen__team-cell {
  cursor: pointer;
}

.rr-gen__team-cell:hover {
  background: #20242e;
}

.rr-gen__vs {
  color: var(--rr-muted);
  text-align: center;
  width: 24px;
  cursor: pointer;
}

.rr-gen__vs:hover {
  color: var(--rr-text);
}

.rr-gen__draw {
  color: #e8c547;
  font-weight: 700;
}

.rr-gen__winner {
  color: var(--rr-win);
  font-weight: 700;
}

.rr-gen__loser {
  color: var(--rr-loss);
}

.rr-gen__match--locked .rr-gen__team-cell::after {
  content: " 🔒";
  font-size: 9px;
}

.rr-gen__standings td:nth-child(1) {
  color: var(--rr-muted);
  width: 20px;
}

.rr-gen__add-pool {
  border: 1px dashed var(--rr-line);
  background: transparent;
  color: var(--rr-muted);
  border-radius: 10px;
  min-height: 80px;
  cursor: pointer;
}

.rr-gen__add-pool:hover {
  color: var(--rr-text);
  border-color: var(--rr-accent);
}
</style>
