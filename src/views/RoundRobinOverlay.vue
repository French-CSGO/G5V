<template>
  <div class="rr-overlay">
    <div v-if="loadError" class="rr-overlay__error">{{ loadError }}</div>
    <div v-else-if="!pools.length" class="rr-overlay__error">
      Tableau enregistré mais sans poule pour l'instant.
    </div>
    <div v-else class="rr-overlay__pools">
      <div v-for="pool in pools" :key="pool.id" class="rr-overlay__pool">
        <div class="rr-overlay__pool-name">{{ pool.name }}</div>
        <table class="rr-overlay__matches" v-if="poolMatches(pool).length">
          <tbody>
            <tr v-for="m in poolMatches(pool)" :key="m.key">
              <td
                class="rr-overlay__match-team"
                :class="{
                  'rr-overlay__winner': m.result === 'A',
                  'rr-overlay__loser': m.result === 'B',
                }"
              >
                {{ teamName(m.teamAKey) }}
              </td>
              <td class="rr-overlay__vs">vs</td>
              <td
                class="rr-overlay__match-team"
                :class="{
                  'rr-overlay__winner': m.result === 'B',
                  'rr-overlay__loser': m.result === 'A',
                }"
              >
                {{ teamName(m.teamBKey) }}
              </td>
            </tr>
          </tbody>
        </table>
        <table class="rr-overlay__standings">
          <thead>
            <tr>
              <th>#</th>
              <th>Équipe</th>
              <th>J</th>
              <th>G</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in poolStandings(pool)" :key="s.key">
              <td>{{ i + 1 }}</td>
              <td class="rr-overlay__team">
                <img v-if="teamSrc(s.key)" :src="teamSrc(s.key)" />
                <span>{{ teamName(s.key) }}</span>
              </td>
              <td>{{ s.played }}</td>
              <td>{{ s.wins }}</td>
              <td>{{ s.losses }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RoundRobinOverlay",
  data() {
    return {
      seasonId: this.$route.params.seasonId,
      pools: [],
      matchResults: {},
      lockedResults: {},
      resolvedTeams: {},
      importedMatches: [],
      loadError: null,
    };
  },
  created() {
    this.refreshTimer = null;
  },
  mounted() {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 30000);
  },
  beforeDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  },
  methods: {
    teamName(key) {
      return this.resolvedTeams[key]?.name || "?";
    },
    teamSrc(key) {
      return this.resolvedTeams[key]?.src || null;
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
    poolStandings(pool) {
      const rows = pool.teamKeys.map((key) => ({
        key,
        wins: 0,
        losses: 0,
        played: 0,
      }));
      const byKey = new Map(rows.map((r) => [r.key, r]));
      for (const m of this.poolMatches(pool)) {
        if (!m.result) continue;
        const a = byKey.get(m.teamAKey);
        const b = byKey.get(m.teamBKey);
        if (!a || !b) continue;
        a.played++;
        b.played++;
        if (m.result === "A") {
          a.wins++;
          b.losses++;
        } else {
          b.wins++;
          a.losses++;
        }
      }
      return rows.sort(
        (x, y) =>
          y.wins - x.wins ||
          x.losses - y.losses ||
          this.teamName(x.key).localeCompare(this.teamName(y.key)),
      );
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
    recomputeResults() {
      for (const pool of this.pools) {
        for (const m of this.poolMatches(pool)) {
          if (this.lockedResults[m.key]) continue;
          const teamA = this.resolvedTeams[m.teamAKey];
          const teamB = this.resolvedTeams[m.teamBKey];
          if (!teamA || !teamB || teamA.g5Id == null || teamB.g5Id == null)
            continue;
          const resultSide = this.resultFromImportedMatches(
            teamA.g5Id,
            teamB.g5Id,
          );
          if (resultSide) this.$set(this.matchResults, m.key, resultSide);
        }
      }
    },
    async load() {
      try {
        const [board, liveMatches] = await Promise.all([
          this.GetRoundRobinBoard(this.seasonId),
          this.GetSeasonRecentMatches(this.seasonId),
        ]);
        if (!board) {
          this.loadError =
            "Aucun tableau Round Robin enregistré pour cette saison.";
          return;
        }
        this.loadError = null;
        this.pools = Array.isArray(board.pools) ? board.pools : [];
        this.matchResults = { ...(board.matchResults || {}) };
        this.lockedResults = { ...(board.lockedResults || {}) };
        this.resolvedTeams = board.resolvedTeams || {};
        this.importedMatches = Array.isArray(liveMatches) ? liveMatches : [];
        this.recomputeResults();
      } catch (err) {
        this.loadError = "Impossible de charger la saison.";
      }
    },
  },
};
</script>

<style scoped>
.rr-overlay {
  background: transparent;
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  color: #f4f6fb;
}

.rr-overlay__error {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
}

.rr-overlay__pools {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.rr-overlay__pool {
  background: rgba(17, 19, 24, 0.82);
  border: 1px solid #343946;
  border-radius: 8px;
  padding: 8px;
}

.rr-overlay__pool-name {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
  color: #90ee90;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.rr-overlay__standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.rr-overlay__standings th {
  text-align: left;
  color: #a8afbf;
  font-weight: 600;
  padding: 2px 4px;
  border-bottom: 1px solid #343946;
}

.rr-overlay__standings td {
  padding: 2px 4px;
  border-bottom: 1px solid rgba(52, 57, 70, 0.5);
}

.rr-overlay__matches {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-bottom: 6px;
}

.rr-overlay__match-team {
  padding: 2px 4px;
  border-bottom: 1px solid rgba(52, 57, 70, 0.5);
}

.rr-overlay__vs {
  color: #a8afbf;
  text-align: center;
  width: 18px;
  border-bottom: 1px solid rgba(52, 57, 70, 0.5);
}

.rr-overlay__winner {
  color: #2fbf71;
  font-weight: 700;
}

.rr-overlay__loser {
  color: #c13d4f;
}

.rr-overlay__team {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rr-overlay__team img {
  width: 18px;
  height: 14px;
  object-fit: contain;
}
</style>
