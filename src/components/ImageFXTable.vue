<template>
  <v-simple-table dense class="mb-2">
    <thead>
      <tr>
        <th style="width: 200px">Champ</th>
        <th style="width: 52px">Actif</th>
        <th style="width: 80px">Police</th>
        <th style="width: 42px">Coul.</th>
        <th style="width: 64px">Taille</th>
        <th style="width: 48px">Gras</th>
        <th style="width: 120px">Position par ligne</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="f in fields">
        <tr :key="f.key">
          <td class="caption font-weight-medium">{{ f.label }}</td>
          <td>
            <v-switch
              v-model="section[f.key].enabled"
              color="primary"
              inset
              dense
              hide-details
              class="mt-0 pt-0"
            />
          </td>
          <td>
            <v-combobox
              v-model="section[f.key].font"
              :items="fontList"
              outlined
              dense
              hide-details
            />
          </td>
          <td>
            <input
              type="color"
              v-model="section[f.key].color"
              class="color-input"
            />
          </td>
          <td>
            <v-text-field
              v-model.number="section[f.key].size"
              type="number"
              outlined
              dense
              hide-details
            />
          </td>
          <td>
            <v-checkbox
              v-model="section[f.key].bold"
              hide-details
              class="mt-0 pt-0"
            />
          </td>
          <td>
            <v-btn small text color="primary" @click="toggle(f.key)">
              <v-icon small left>{{
                expanded[f.key] ? "mdi-chevron-up" : "mdi-chevron-down"
              }}</v-icon>
              5 joueurs
            </v-btn>
          </td>
        </tr>
        <tr v-if="expanded[f.key]" :key="`${f.key}-expand`">
          <td colspan="7" class="pb-3 pt-1">
            <div class="d-flex flex-wrap" style="gap: 16px">
              <div
                v-for="i in 5"
                :key="i"
                class="d-flex flex-column align-center"
              >
                <span class="caption grey--text mb-1">Joueur {{ i }}</span>
                <div class="d-flex" style="gap: 6px">
                  <v-text-field
                    :value="section[f.key].x[i - 1]"
                    label="X"
                    type="number"
                    outlined
                    dense
                    hide-details
                    style="width: 84px"
                    @input="setPos(f.key, 'x', i - 1, $event)"
                  />
                  <v-text-field
                    :value="section[f.key].y[i - 1]"
                    label="Y"
                    type="number"
                    outlined
                    dense
                    hide-details
                    style="width: 84px"
                    @input="setPos(f.key, 'y', i - 1, $event)"
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </v-simple-table>
</template>

<script>
export default {
  name: "ImageFXTable",
  props: {
    fields: { type: Array, required: true }, // [{ key, label }]
    section: { type: Object, required: true },
    fontList: { type: Array, default: () => [] },
  },
  data() {
    return {
      expanded: {},
    };
  },
  methods: {
    toggle(key) {
      this.$set(this.expanded, key, !this.expanded[key]);
    },
    setPos(key, axis, index, value) {
      const n = Number(value);
      this.$set(this.section[key][axis], index, Number.isNaN(n) ? 0 : n);
    },
  },
};
</script>
