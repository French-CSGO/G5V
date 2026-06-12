<template>
  <v-simple-table dense class="mb-2">
    <thead>
      <tr>
        <th style="width:232px">Champ</th>
        <th style="width:52px">Actif</th>
        <th style="width:80px">Police</th>
        <th style="width:42px">Coul.</th>
        <th style="width:64px">Taille</th>
        <th style="width:48px">Gras</th>
        <th style="width:90px">X</th>
        <th style="width:90px">Y</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="f in fields" :key="f.key">
        <td class="caption font-weight-medium">{{ f.label }}</td>
        <td>
          <v-switch
            v-model="section[f.key].enabled"
            color="primary" inset dense hide-details class="mt-0 pt-0"
          />
        </td>
        <td>
          <v-combobox
            v-model="section[f.key].font"
            :items="fontList"
            outlined dense hide-details
          />
        </td>
        <td>
          <input type="color" v-model="section[f.key].color" class="color-input" />
        </td>
        <td>
          <v-text-field
            v-model.number="section[f.key].size"
            type="number" outlined dense hide-details
          />
        </td>
        <td>
          <v-checkbox v-model="section[f.key].bold" hide-details class="mt-0 pt-0" />
        </td>
        <td>
          <v-text-field
            v-model.number="section[f.key].x"
            type="number" outlined dense hide-details
          />
        </td>
        <td>
          <v-text-field
            v-model.number="section[f.key].y"
            type="number" outlined dense hide-details
          />
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script>
export default {
  name: "ImageFCTable",
  props: {
    fields:   { type: Array,  required: true },   // [{ key, label }]
    section:  { type: Object, required: true },   // reactive settings sub-object
    fontList: { type: Array,  default: () => [] },
  },
};
</script>
