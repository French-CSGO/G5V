<template>
  <v-container fluid>
    <v-card class="mx-auto" max-width="1200">
      <v-card-title class="headline">
        <v-icon left>mdi-image-edit</v-icon>
        Paramètres des images de stats
      </v-card-title>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <div v-show="!loading && settings">
        <v-tabs v-model="tab" background-color="primary" dark>
          <v-tab>Image Match</v-tab>
          <v-tab>Image Joueur</v-tab>
          <v-tab>Image MVP</v-tab>
          <v-tab>Image Équipe Saison</v-tab>
          <v-tab>Aperçu</v-tab>
        </v-tabs>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 0 : Image Match                                           -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 0" flat class="pa-4">
          <v-subheader class="font-weight-bold">Canvas</v-subheader>
          <v-row>
            <v-col cols="6"
              ><v-text-field
                v-model.number="settings.canvas.width"
                label="Largeur (px)"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="6"
              ><v-text-field
                v-model.number="settings.canvas.height"
                label="Hauteur (px)"
                type="number"
                outlined
                dense
            /></v-col>
          </v-row>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">Éléments fixes (X + Y)</v-subheader>
          <image-f-c-table :fields="matchFCFields" :section="settings.match" :font-list="fontList" />

          <v-subheader class="font-weight-bold mt-2"
            >Lignes joueurs — Y
            <span class="caption grey--text ml-2"
              >(Y = 0 → désactivé)</span
            ></v-subheader
          >
          <v-row>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.match.rows_y[0]"
                label="Ligne 1"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.match.rows_y[1]"
                label="Ligne 2"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.match.rows_y[2]"
                label="Ligne 3"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.match.rows_y[3]"
                label="Ligne 4"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.match.rows_y[4]"
                label="Ligne 5"
                type="number"
                outlined
                dense
            /></v-col>
          </v-row>

          <v-subheader class="font-weight-bold">Colonnes joueurs (X seul, Y = ligne)</v-subheader>
          <image-f-x-table :fields="matchFXFields" :section="settings.match" :font-list="fontList" />

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            En-têtes de colonnes
            <v-switch
              v-model="settings.match.column_headers.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.match.column_headers.enabled">
            <v-row dense>
              <v-col cols="2">
                <v-text-field
                  v-model.number="settings.match.column_headers.y"
                  label="Y"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="2">
                <v-combobox
                  v-model="settings.match.column_headers.font"
                  :items="fontList"
                  label="Police"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.match.column_headers.color"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1">
                <v-text-field
                  v-model.number="settings.match.column_headers.size"
                  label="Taille"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <v-checkbox
                  v-model="settings.match.column_headers.bold"
                  label="Gras"
                  hide-details
                  class="mt-0 pt-0"
                />
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="3">
                <v-text-field
                  v-model="settings.match.column_headers.kills_label"
                  label="Label Kills"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.match.column_headers.assists_label"
                  label="Label Assists"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.match.column_headers.deaths_label"
                  label="Label Deaths"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.match.column_headers.rating_label"
                  label="Label Rating"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Éléments graphiques (fond uni)
            <v-switch
              v-model="settings.match.shapes.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.match.shapes.enabled">
            <!-- Team pills -->
            <v-subheader class="caption font-weight-bold pl-0"
              >Pilule nom d'équipe</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.match.shapes.team_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.match.shapes.team_pill.fill"
                  class="color-input"
                  title="Fond"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.match.shapes.team_pill.border"
                  class="color-input"
                  title="Bordure"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.border_alpha"
                  label="Op. bord."
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.team_pill.border_width"
                  label="Ép. bord."
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Player pills -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Pilule nom du joueur</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.match.shapes.player_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.match.shapes.player_pill.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.l_x"
                  label="X gauche"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.player_pill.r_x"
                  label="X droite"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Stats table -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Tableau stats</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.match.shapes.stats_table.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.match.shapes.stats_table.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.l_x"
                  label="X gauche"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.r_x"
                  label="X droite"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.row_height"
                  label="H ligne"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="1" class="d-flex align-center"
                ><input
                  type="color"
                  v-model="settings.match.shapes.stats_table.odd_fill"
                  class="color-input"
                  title="Couleur ligne impaire"
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.odd_alpha"
                  label="Op. impair"
                  type="number"
                  step="0.02"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center"
                ><input
                  type="color"
                  v-model="settings.match.shapes.stats_table.even_fill"
                  class="color-input"
                  title="Couleur ligne paire"
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.match.shapes.stats_table.even_alpha"
                  label="Op. pair"
                  type="number"
                  step="0.02"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <!-- ── Box derrière les noms de map ──────────────────────────────── -->
          <v-subheader class="font-weight-bold">
            Box derrière les noms de map
            <v-switch
              v-model="settings.match.shapes.map_pill.enabled"
              color="primary" inset dense hide-details class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.match.shapes.map_pill.enabled">
            <v-row dense class="mt-1">
              <v-col cols="1" class="d-flex align-center">
                <input type="color" v-model="settings.match.shapes.map_pill.fill" class="color-input" />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.alpha" label="Opacité (autres)" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.current_alpha" label="Opacité (map en cours)" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.radius" label="Rayon" type="number" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.width" label="Largeur" type="number" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.height" label="Hauteur" type="number" outlined dense hide-details />
              </v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="1" class="d-flex align-center">
                <input type="color" v-model="settings.match.shapes.map_pill.border" class="color-input" />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.border_alpha" label="Opacité bordure" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.match.shapes.map_pill.border_width" label="Épaisseur bordure" type="number" outlined dense hide-details />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Logos d'équipes (position &amp; taille)
          </v-subheader>
          <v-row dense>
            <v-col cols="1" class="d-flex align-center">
              <v-switch v-model="settings.match.team1_logo.enabled" label="Logo 1" color="primary" inset dense hide-details class="mt-0 pt-0" />
            </v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team1_logo.x" label="Logo 1 X" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team1_logo.y" label="Logo 1 Y" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team1_logo.size" label="Logo 1 Taille" type="number" outlined dense hide-details /></v-col>
          </v-row>
          <v-row dense class="mt-1">
            <v-col cols="1" class="d-flex align-center">
              <v-switch v-model="settings.match.team2_logo.enabled" label="Logo 2" color="primary" inset dense hide-details class="mt-0 pt-0" />
            </v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team2_logo.x" label="Logo 2 X" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team2_logo.y" label="Logo 2 Y" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.match.team2_logo.size" label="Logo 2 Taille" type="number" outlined dense hide-details /></v-col>
          </v-row>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Fond &amp; Police personnalisée</v-subheader
          >
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.match.background"
                label="Fichier de fond (public/img/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4">
              <v-file-input
                v-model="bgFile[0]"
                label="Uploader un fond"
                accept="image/png,image/jpeg"
                outlined
                dense
                hide-details
                prepend-icon="mdi-image"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!bgFile[0]"
                color="secondary"
                small
                @click="uploadBg(0)"
                :loading="uploadingBg[0]"
              >
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.match.fontFile"
                label="Fichier police (public/fonts/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4">
              <v-file-input
                v-model="fontFileInput[0]"
                label="Uploader une police"
                accept=".ttf,.otf"
                outlined
                dense
                hide-details
                prepend-icon="mdi-format-font"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!fontFileInput[0]"
                color="secondary"
                small
                @click="uploadFont(0)"
                :loading="uploadingFont[0]"
              >
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-alert
            v-if="uploadMsg[0]"
            :type="uploadMsgType[0]"
            dense
            class="mt-2"
            >{{ uploadMsg[0] }}</v-alert
          >
        </v-card>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 1 : Image Joueur                                          -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 1" flat class="pa-4">
          <image-f-c-table :fields="playerFields" :section="settings.player" :font-list="fontList" />

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            En-têtes de colonnes
            <v-switch
              v-model="settings.player.column_headers.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.player.column_headers.enabled">
            <v-row dense>
              <v-col cols="2">
                <v-combobox
                  v-model="settings.player.column_headers.font"
                  :items="fontList"
                  label="Police"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.column_headers.color"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1">
                <v-text-field
                  v-model.number="settings.player.column_headers.size"
                  label="Taille"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <v-checkbox
                  v-model="settings.player.column_headers.bold"
                  label="Gras"
                  hide-details
                  class="mt-0 pt-0"
                />
              </v-col>
            </v-row>
            <v-subheader class="caption pl-0 mt-1"
              >Kills / Assists / Deaths</v-subheader
            >
            <v-row dense>
              <v-col cols="2">
                <v-text-field
                  v-model.number="settings.player.column_headers.y"
                  label="Y (ligne 1)"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.kills_label"
                  label="Label Kills"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.assists_label"
                  label="Label Assists"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.deaths_label"
                  label="Label Deaths"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
            <v-subheader class="caption pl-0 mt-1"
              >Rating / HS% / Clutches</v-subheader
            >
            <v-row dense>
              <v-col cols="2">
                <v-text-field
                  v-model.number="settings.player.column_headers.y2"
                  label="Y (ligne 2)"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.rating_label"
                  label="Label Rating"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.hs_label"
                  label="Label HS%"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.player.column_headers.clutches_label"
                  label="Label Clutches"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Éléments graphiques (fond uni)
            <v-switch
              v-model="settings.player.shapes.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.player.shapes.enabled">
            <!-- Team pills -->
            <v-subheader class="caption font-weight-bold pl-0"
              >Pilule nom d'équipe</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.player.shapes.team_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.shapes.team_pill.fill"
                  class="color-input"
                  title="Fond"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.shapes.team_pill.border"
                  class="color-input"
                  title="Bordure"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.border_alpha"
                  label="Op. bord."
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.team_pill.border_width"
                  label="Ép. bord."
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Player pill -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Pilule nom du joueur</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.player.shapes.player_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.shapes.player_pill.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.player_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.player_pill.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.player_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.player_pill.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.shapes.player_pill.border"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.player.shapes.player_pill.border_alpha
                  "
                  label="Op. bord."
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.player.shapes.player_pill.border_width
                  "
                  label="Ép. bord."
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Stats bar -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Barre stats</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.player.shapes.stats_bar.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.player.shapes.stats_bar.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.x"
                  label="X"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.y"
                  label="Y (0=auto)"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.player.shapes.stats_bar.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Fond &amp; Police personnalisée</v-subheader
          >
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.player.background"
                label="Fichier de fond (public/img/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4">
              <v-file-input
                v-model="bgFile[1]"
                label="Uploader un fond"
                accept="image/png,image/jpeg"
                outlined
                dense
                hide-details
                prepend-icon="mdi-image"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!bgFile[1]"
                color="secondary"
                small
                @click="uploadBg(1)"
                :loading="uploadingBg[1]"
              >
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.player.fontFile"
                label="Fichier police (public/fonts/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4">
              <v-file-input
                v-model="fontFileInput[1]"
                label="Uploader une police"
                accept=".ttf,.otf"
                outlined
                dense
                hide-details
                prepend-icon="mdi-format-font"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!fontFileInput[1]"
                color="secondary"
                small
                @click="uploadFont(1)"
                :loading="uploadingFont[1]"
              >
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-alert
            v-if="uploadMsg[1]"
            :type="uploadMsgType[1]"
            dense
            class="mt-2"
            >{{ uploadMsg[1] }}</v-alert
          >
        </v-card>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 2 : Image MVP                                             -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 2" flat class="pa-4">

          <!-- ── Photos joueurs ─────────────────────────────────────────── -->
          <v-subheader class="font-weight-bold">
            <v-icon left small>mdi-account-circle</v-icon>
            Photos joueurs (liées au SteamID)
          </v-subheader>
          <v-row align="center">
            <v-col cols="4">
              <v-text-field
                v-model="playerPhotoSteamId"
                label="SteamID (17 chiffres)"
                outlined dense hide-details
                prepend-icon="mdi-steam"
              />
            </v-col>
            <v-col cols="4">
              <v-file-input
                v-model="playerPhotoFile"
                label="Photo joueur (PNG/JPG)"
                accept="image/png,image/jpeg,image/webp"
                outlined dense hide-details
                prepend-icon="mdi-account-box"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!playerPhotoFile || !playerPhotoSteamId"
                color="secondary" small
                @click="uploadPlayerPhoto"
                :loading="uploadingPhoto"
              >
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-row v-if="playerPhotos.length > 0" class="mt-1">
            <v-col>
              <span class="caption grey--text mr-2">Déjà uploadé :</span>
              <v-chip v-for="f in playerPhotos" :key="f" small class="mr-1 mb-1">{{ f }}</v-chip>
            </v-col>
          </v-row>
          <v-alert v-if="uploadPhotoMsg" :type="uploadPhotoMsgType" dense class="mt-2">
            {{ uploadPhotoMsg }}
          </v-alert>

          <v-divider class="my-3" />
          <!-- ── Position photo joueur dans l'image MVP ─────────────────── -->
          <v-subheader class="font-weight-bold">
            Position de la photo dans l'image MVP
            <v-switch
              v-model="settings.mvp.player_image.enabled"
              color="primary" inset dense hide-details class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <v-row dense v-if="settings.mvp.player_image.enabled">
            <v-col cols="2">
              <v-text-field v-model.number="settings.mvp.player_image.x" label="X (centre)" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="2">
              <v-text-field v-model.number="settings.mvp.player_image.y" label="Y (centre)" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="2">
              <v-text-field v-model.number="settings.mvp.player_image.width" label="Largeur (px)" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="2">
              <v-text-field v-model.number="settings.mvp.player_image.height" label="Hauteur (px)" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="2" class="d-flex align-center">
              <v-switch v-model="settings.mvp.player_image.circle" label="Découpe circulaire" color="primary" inset dense hide-details />
            </v-col>
          </v-row>

          <v-divider class="my-3" />
          <!-- ── Image de map en fond ───────────────────────────────────── -->
          <v-subheader class="font-weight-bold">
            Image de map en fond
            <v-switch
              v-model="settings.mvp.map_image.enabled"
              color="primary" inset dense hide-details class="ml-4 mt-0 pt-0"
              label="Afficher l'image de map"
            />
          </v-subheader>

          <v-divider class="my-3" />
          <!-- ── Éléments graphiques MVP ────────────────────────────────────── -->
          <v-subheader class="font-weight-bold">
            Éléments graphiques
            <v-switch v-model="settings.mvp.shapes.enabled" color="primary" inset dense hide-details class="ml-4 mt-0 pt-0" />
          </v-subheader>
          <div v-if="settings.mvp.shapes.enabled">
            <!-- Team pill -->
            <v-subheader class="caption font-weight-bold pl-0">Pilule nom d'équipe</v-subheader>
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch v-model="settings.mvp.shapes.team_pill.enabled" label="Actif" color="primary" inset dense hide-details class="mt-0 pt-0" />
              </v-col>
              <v-col cols="1" class="d-flex align-center"><input type="color" v-model="settings.mvp.shapes.team_pill.fill" class="color-input" /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.alpha" label="Opacité" type="number" step="0.05" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.radius" label="Rayon" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.width" label="Largeur" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.height" label="Hauteur" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1" class="d-flex align-center"><input type="color" v-model="settings.mvp.shapes.team_pill.border" class="color-input" /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.border_alpha" label="Op. bord." type="number" step="0.05" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.team_pill.border_width" label="Ép. bord." type="number" outlined dense hide-details /></v-col>
            </v-row>
            <!-- Player pill -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2">Pilule nom du joueur</v-subheader>
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch v-model="settings.mvp.shapes.player_pill.enabled" label="Actif" color="primary" inset dense hide-details class="mt-0 pt-0" />
              </v-col>
              <v-col cols="1" class="d-flex align-center"><input type="color" v-model="settings.mvp.shapes.player_pill.fill" class="color-input" /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.alpha" label="Opacité" type="number" step="0.05" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.radius" label="Rayon" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.width" label="Largeur" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.height" label="Hauteur" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1" class="d-flex align-center"><input type="color" v-model="settings.mvp.shapes.player_pill.border" class="color-input" /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.border_alpha" label="Op. bord." type="number" step="0.05" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.player_pill.border_width" label="Ép. bord." type="number" outlined dense hide-details /></v-col>
            </v-row>
            <!-- Stats bar -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2">Barre stats</v-subheader>
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch v-model="settings.mvp.shapes.stats_bar.enabled" label="Actif" color="primary" inset dense hide-details class="mt-0 pt-0" />
              </v-col>
              <v-col cols="1" class="d-flex align-center"><input type="color" v-model="settings.mvp.shapes.stats_bar.fill" class="color-input" /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.alpha" label="Opacité" type="number" step="0.05" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.radius" label="Rayon" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.x" label="X" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.y" label="Y (0=auto)" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.width" label="Largeur" type="number" outlined dense hide-details /></v-col>
              <v-col cols="1"><v-text-field v-model.number="settings.mvp.shapes.stats_bar.height" label="Hauteur" type="number" outlined dense hide-details /></v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <!-- ── Box derrière les noms de map ──────────────────────────────── -->
          <v-subheader class="font-weight-bold">
            Box derrière les noms de map
            <v-switch
              v-model="settings.mvp.shapes.map_pill.enabled"
              color="primary" inset dense hide-details class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.mvp.shapes.map_pill.enabled">
            <v-row dense class="mt-1">
              <v-col cols="1" class="d-flex align-center">
                <input type="color" v-model="settings.mvp.shapes.map_pill.fill" class="color-input" />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.alpha" label="Opacité (autres)" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.current_alpha" label="Opacité (map en cours)" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.radius" label="Rayon" type="number" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.width" label="Largeur" type="number" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.height" label="Hauteur" type="number" outlined dense hide-details />
              </v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="1" class="d-flex align-center">
                <input type="color" v-model="settings.mvp.shapes.map_pill.border" class="color-input" />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.border_alpha" label="Opacité bordure" type="number" step="0.05" outlined dense hide-details />
              </v-col>
              <v-col cols="2">
                <v-text-field v-model.number="settings.mvp.shapes.map_pill.border_width" label="Épaisseur bordure" type="number" outlined dense hide-details />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <!-- ── Éléments textuels MVP ───────────────────────────────────── -->
          <v-subheader class="font-weight-bold">Éléments textuels</v-subheader>
          <image-f-c-table :fields="mvpFields" :section="settings.mvp" :font-list="fontList" />

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Logos d'équipes dans l'image MVP (position &amp; taille)
          </v-subheader>
          <v-row dense>
            <v-col cols="1" class="d-flex align-center">
              <v-switch v-model="settings.mvp.team1_logo.enabled" label="Logo 1" color="primary" inset dense hide-details class="mt-0 pt-0" />
            </v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team1_logo.x" label="Logo 1 X" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team1_logo.y" label="Logo 1 Y" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team1_logo.size" label="Logo 1 Taille" type="number" outlined dense hide-details /></v-col>
          </v-row>
          <v-row dense class="mt-1">
            <v-col cols="1" class="d-flex align-center">
              <v-switch v-model="settings.mvp.team2_logo.enabled" label="Logo 2" color="primary" inset dense hide-details class="mt-0 pt-0" />
            </v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team2_logo.x" label="Logo 2 X" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team2_logo.y" label="Logo 2 Y" type="number" outlined dense hide-details /></v-col>
            <v-col cols="2"><v-text-field v-model.number="settings.mvp.team2_logo.size" label="Logo 2 Taille" type="number" outlined dense hide-details /></v-col>
          </v-row>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">Fond &amp; Police personnalisée</v-subheader>
          <v-row align="center">
            <v-col cols="4">
              <v-text-field v-model="settings.mvp.background" label="Fichier de fond (public/img/)" outlined dense />
            </v-col>
            <v-col cols="4">
              <v-file-input v-model="bgFile[2]" label="Uploader un fond" accept="image/png,image/jpeg" outlined dense hide-details prepend-icon="mdi-image" />
            </v-col>
            <v-col cols="2">
              <v-btn :disabled="!bgFile[2]" color="secondary" small @click="uploadBg(2)" :loading="uploadingBg[2]">
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="4">
              <v-text-field v-model="settings.mvp.fontFile" label="Fichier police (public/fonts/)" outlined dense />
            </v-col>
            <v-col cols="4">
              <v-file-input v-model="fontFileInput[2]" label="Uploader une police" accept=".ttf,.otf" outlined dense hide-details prepend-icon="mdi-format-font" />
            </v-col>
            <v-col cols="2">
              <v-btn :disabled="!fontFileInput[2]" color="secondary" small @click="uploadFont(2)" :loading="uploadingFont[2]">
                <v-icon left>mdi-upload</v-icon>Uploader
              </v-btn>
            </v-col>
          </v-row>
          <v-alert v-if="uploadMsg[2]" :type="uploadMsgType[2]" dense class="mt-2">{{ uploadMsg[2] }}</v-alert>
        </v-card>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 3 : Image Équipe Saison                                   -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 3" flat class="pa-4">
          <image-f-c-table :fields="teamSeasonFields" :section="settings.team_season" :font-list="fontList" />
          <v-row dense class="mt-2">
            <v-col cols="4">
              <v-text-field
                v-model="settings.team_season.best_map_label.text"
                label="Texte 'Meilleure Map'"
                outlined
                dense
                hide-details
              />
            </v-col>
          </v-row>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Joueurs (jusqu'à 5)</v-subheader
          >
          <v-row align="center">
            <v-col cols="1"
              ><v-switch
                v-model="settings.team_season.players.enabled"
                label="Actif"
                color="primary"
                inset
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.x[0]"
                label="Joueur 1 X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.x[1]"
                label="Joueur 2 X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.x[2]"
                label="Joueur 3 X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.x[3]"
                label="Joueur 4 X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.x[4]"
                label="Joueur 5 X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.name_y"
                label="Noms Y"
                type="number"
                outlined
                dense
            /></v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="2"
              ><v-text-field
                v-model="settings.team_season.players.font"
                label="Police noms"
                outlined
                dense
            /></v-col>
            <v-col cols="3">
              <v-text-field
                v-model="settings.team_season.players.color"
                label="Couleur noms"
                outlined
                dense
              >
                <template v-slot:append
                  ><v-icon :color="settings.team_season.players.color"
                    >mdi-square</v-icon
                  ></template
                >
              </v-text-field>
            </v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.size"
                label="Taille noms"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="1"
              ><v-checkbox
                v-model="settings.team_season.players.bold"
                label="Gras"
                hide-details
            /></v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="1"
              ><v-switch
                v-model="settings.team_season.players.show_rating"
                label="Rating"
                color="primary"
                inset
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.rating_y"
                label="Rating Y"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model="settings.team_season.players.rating_font"
                label="Police rating"
                outlined
                dense
            /></v-col>
            <v-col cols="3">
              <v-text-field
                v-model="settings.team_season.players.rating_color"
                label="Couleur rating"
                outlined
                dense
              >
                <template v-slot:append
                  ><v-icon :color="settings.team_season.players.rating_color"
                    >mdi-square</v-icon
                  ></template
                >
              </v-text-field>
            </v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.players.rating_size"
                label="Taille rating"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="1"
              ><v-checkbox
                v-model="settings.team_season.players.rating_bold"
                label="Gras"
                hide-details
            /></v-col>
          </v-row>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Labels des statistiques
            <v-switch
              v-model="settings.team_season.stat_labels.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.team_season.stat_labels.enabled">
            <v-row dense>
              <v-col cols="2">
                <v-combobox
                  v-model="settings.team_season.stat_labels.font"
                  :items="fontList"
                  label="Police"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.stat_labels.color"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1">
                <v-text-field
                  v-model.number="settings.team_season.stat_labels.size"
                  label="Taille"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <v-checkbox
                  v-model="settings.team_season.stat_labels.bold"
                  label="Gras"
                  hide-details
                  class="mt-0 pt-0"
                />
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model.number="settings.team_season.stat_labels.y_offset"
                  label="Décalage Y (au-dessus)"
                  type="number"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.team_rating_label"
                  label="Label Rating équipe"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.kills_label"
                  label="Label Kills"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.deaths_label"
                  label="Label Morts"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.plants_label"
                  label="Label Plants"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.defuses_label"
                  label="Label Défuses"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.rounds_won_label"
                  label="Label Rounds gagnés"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.rounds_lost_label"
                  label="Label Rounds perdus"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.wins_label"
                  label="Label Victoires"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="settings.team_season.stat_labels.losses_label"
                  label="Label Défaites"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Image de map (map avec le + de victoires)</v-subheader
          >
          <v-row align="center">
            <v-col cols="1"
              ><v-switch
                v-model="settings.team_season.map_image.enabled"
                label="Actif"
                color="primary"
                inset
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.map_image.x"
                label="X"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.map_image.y"
                label="Y"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.map_image.width"
                label="Largeur"
                type="number"
                outlined
                dense
            /></v-col>
            <v-col cols="2"
              ><v-text-field
                v-model.number="settings.team_season.map_image.height"
                label="Hauteur"
                type="number"
                outlined
                dense
            /></v-col>
          </v-row>
          <v-subheader class="font-weight-bold"
            >Images de map
            <span class="caption grey--text ml-2"
              >(nommez les fichiers de_mirage.png, de_dust2.jpg…)</span
            ></v-subheader
          >
          <v-row align="center">
            <v-col cols="4"
              ><v-file-input
                v-model="mapImageFile"
                label="Uploader une image de map"
                accept="image/*"
                outlined
                dense
                hide-details
                prepend-icon="mdi-map"
            /></v-col>
            <v-col cols="2"
              ><v-btn
                :disabled="!mapImageFile"
                color="secondary"
                small
                @click="uploadMapImage"
                :loading="uploadingMap"
                ><v-icon left>mdi-upload</v-icon>Uploader</v-btn
              ></v-col
            >
            <v-col cols="6">
              <v-chip v-for="f in mapImages" :key="f" small class="mr-1 mb-1">{{
                f
              }}</v-chip>
            </v-col>
          </v-row>
          <v-alert
            v-if="uploadMapMsg"
            :type="uploadMapMsgType"
            dense
            class="mt-2"
            >{{ uploadMapMsg }}</v-alert
          >

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold">
            Éléments graphiques (fond uni)
            <v-switch
              v-model="settings.team_season.shapes.enabled"
              color="primary"
              inset
              dense
              hide-details
              class="ml-4 mt-0 pt-0"
            />
          </v-subheader>
          <div v-if="settings.team_season.shapes.enabled">
            <!-- Team pill -->
            <v-subheader class="caption font-weight-bold pl-0"
              >Pilule nom d'équipe</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.team_season.shapes.team_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.shapes.team_pill.fill"
                  class="color-input"
                  title="Fond"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.team_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.team_pill.radius"
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.team_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.team_pill.height"
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.shapes.team_pill.border"
                  class="color-input"
                  title="Bordure"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.team_pill.border_alpha
                  "
                  label="Op. bord."
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.team_pill.border_width
                  "
                  label="Ép. bord."
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Player pills -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Pilules joueurs</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.team_season.shapes.player_pill.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.shapes.player_pill.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.player_pill.alpha"
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.player_pill.radius
                  "
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="settings.team_season.shapes.player_pill.width"
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.player_pill.height
                  "
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.shapes.player_pill.border"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.player_pill.border_alpha
                  "
                  label="Op. bord."
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.player_pill.border_width
                  "
                  label="Ép. bord."
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
            <!-- Stats background -->
            <v-subheader class="caption font-weight-bold pl-0 mt-2"
              >Fond tableau stats</v-subheader
            >
            <v-row dense>
              <v-col cols="1" class="d-flex align-center">
                <v-switch
                  v-model="settings.team_season.shapes.stats_background.enabled"
                  color="primary"
                  inset
                  dense
                  hide-details
                  class="mt-0 pt-0"
                  label="Actif"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center">
                <input
                  type="color"
                  v-model="settings.team_season.shapes.stats_background.fill"
                  class="color-input"
                />
              </v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.alpha
                  "
                  label="Opacité"
                  type="number"
                  step="0.05"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.radius
                  "
                  label="Rayon"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.x
                  "
                  label="X"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.y
                  "
                  label="Y"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.width
                  "
                  label="Largeur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
              <v-col cols="1"
                ><v-text-field
                  v-model.number="
                    settings.team_season.shapes.stats_background.height
                  "
                  label="Hauteur"
                  type="number"
                  outlined
                  dense
                  hide-details
              /></v-col>
            </v-row>
          </div>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Fond &amp; Police personnalisée</v-subheader
          >
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.team_season.background"
                label="Fichier de fond (public/img/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4"
              ><v-file-input
                v-model="bgFile[3]"
                label="Uploader un fond"
                accept="image/png,image/jpeg"
                outlined
                dense
                hide-details
                prepend-icon="mdi-image"
            /></v-col>
            <v-col cols="2"
              ><v-btn
                :disabled="!bgFile[3]"
                color="secondary"
                small
                @click="uploadBg(3)"
                :loading="uploadingBg[3]"
                ><v-icon left>mdi-upload</v-icon>Uploader</v-btn
              ></v-col
            >
          </v-row>
          <v-row align="center">
            <v-col cols="4"
              ><v-text-field
                v-model="settings.team_season.fontFile"
                label="Fichier police (public/fonts/)"
                outlined
                dense
            /></v-col>
            <v-col cols="4"
              ><v-file-input
                v-model="fontFileInput[3]"
                label="Uploader une police"
                accept=".ttf,.otf"
                outlined
                dense
                hide-details
                prepend-icon="mdi-format-font"
            /></v-col>
            <v-col cols="2"
              ><v-btn
                :disabled="!fontFileInput[3]"
                color="secondary"
                small
                @click="uploadFont(3)"
                :loading="uploadingFont[3]"
                ><v-icon left>mdi-upload</v-icon>Uploader</v-btn
              ></v-col
            >
          </v-row>
          <v-alert
            v-if="uploadMsg[3]"
            :type="uploadMsgType[3]"
            dense
            class="mt-2"
            >{{ uploadMsg[2] }}</v-alert
          >
        </v-card>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 4 : Aperçu                                                -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 4" flat class="pa-4">
          <v-subheader class="font-weight-bold">Image Match</v-subheader>
          <v-row align="center">
            <v-col cols="4">
              <v-text-field
                v-model="previewMatchId"
                label="ID du match"
                type="number"
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                :href="`${apiUrl}/image/match/${previewMatchId}`"
                target="_blank"
                :disabled="!previewMatchId"
                small
              >
                <v-icon left small>mdi-open-in-new</v-icon>Ouvrir
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="previewMatchId" class="mt-3">
            <img
              :src="`${apiUrl}/image/match/${previewMatchId}?t=${previewTs}`"
              style="max-width:100%;border:1px solid #ccc;"
              @error="previewMatchError = true"
              @load="previewMatchError = false"
            />
            <v-alert v-if="previewMatchError" type="error" dense
              >Impossible de charger l'image.</v-alert
            >
          </div>

          <v-divider class="my-4" />
          <v-subheader class="font-weight-bold">Image Joueur</v-subheader>
          <v-row align="center">
            <v-col cols="3">
              <v-text-field
                v-model="previewMatchId"
                label="ID du match"
                type="number"
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="previewSteamId"
                label="Steam ID du joueur"
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                :href="
                  `${apiUrl}/image/match/${previewMatchId}/player/${previewSteamId}`
                "
                target="_blank"
                :disabled="!previewMatchId || !previewSteamId"
                small
              >
                <v-icon left small>mdi-open-in-new</v-icon>Ouvrir
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="previewMatchId && previewSteamId" class="mt-3">
            <img
              :src="
                `${apiUrl}/image/match/${previewMatchId}/player/${previewSteamId}?t=${previewTs}`
              "
              style="max-width:100%;border:1px solid #ccc;"
              @error="previewPlayerError = true"
              @load="previewPlayerError = false"
            />
            <v-alert v-if="previewPlayerError" type="error" dense
              >Impossible de charger l'image.</v-alert
            >
          </div>

          <v-divider class="my-4" />
          <v-subheader class="font-weight-bold">Image MVP (par map)</v-subheader>
          <v-row align="center">
            <v-col cols="3">
              <v-text-field v-model="previewMatchId" label="ID du match" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="2">
              <v-text-field v-model="previewMvpMap" label="N° de la map" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="auto">
              <v-btn color="warning"
                :href="`${apiUrl}/image/match/${previewMatchId}/map/${previewMvpMap}/mvp`"
                target="_blank"
                :disabled="!previewMatchId || !previewMvpMap"
                small>
                <v-icon left small>mdi-star</v-icon>Ouvrir map
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="previewMatchId && previewMvpMap" class="mt-3">
            <img
              :src="`${apiUrl}/image/match/${previewMatchId}/map/${previewMvpMap}/mvp?t=${previewTs}`"
              style="max-width:100%;border:1px solid #ccc;"
              @error="previewMvpError = true"
              @load="previewMvpError = false"
            />
            <v-alert v-if="previewMvpError" type="error" dense>Impossible de charger l'image MVP.</v-alert>
          </div>

          <v-subheader class="font-weight-bold mt-2">Image MVP (match complet)</v-subheader>
          <v-row align="center">
            <v-col cols="3">
              <v-text-field v-model="previewMatchId" label="ID du match" type="number" outlined dense hide-details />
            </v-col>
            <v-col cols="auto">
              <v-btn color="warning"
                :href="`${apiUrl}/image/match/${previewMatchId}/mvp`"
                target="_blank"
                :disabled="!previewMatchId"
                small>
                <v-icon left small>mdi-star-circle</v-icon>Ouvrir match
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="previewMatchId" class="mt-3">
            <img
              :src="`${apiUrl}/image/match/${previewMatchId}/mvp?t=${previewTs}`"
              style="max-width:100%;border:1px solid #ccc;"
              @error="previewMvpMatchError = true"
              @load="previewMvpMatchError = false"
            />
            <v-alert v-if="previewMvpMatchError" type="error" dense>Impossible de charger l'image MVP match.</v-alert>
          </div>

          <v-divider class="my-4" />
          <v-subheader class="font-weight-bold"
            >Image Équipe Saison</v-subheader
          >
          <v-row align="center">
            <v-col cols="3">
              <v-text-field
                v-model="previewSeasonId"
                label="ID de la saison"
                type="number"
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                v-model="previewTeamId"
                label="ID de l'équipe"
                type="number"
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                :href="
                  `${apiUrl}/image/season/${previewSeasonId}/team/${previewTeamId}`
                "
                target="_blank"
                :disabled="!previewSeasonId || !previewTeamId"
                small
              >
                <v-icon left small>mdi-open-in-new</v-icon>Ouvrir
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="previewSeasonId && previewTeamId" class="mt-3">
            <img
              :src="
                `${apiUrl}/image/season/${previewSeasonId}/team/${previewTeamId}?t=${previewTs}`
              "
              style="max-width:100%;border:1px solid #ccc;"
              @error="previewTeamError = true"
              @load="previewTeamError = false"
            />
            <v-alert v-if="previewTeamError" type="error" dense
              >Impossible de charger l'image.</v-alert
            >
          </div>
        </v-card>

        <!-- ── Actions ───────────────────────────────────────────────── -->
        <v-card-actions class="pa-4">
          <v-btn outlined @click="exportConfig" v-if="tab < 4">
            <v-icon left>mdi-download</v-icon>
            Exporter
          </v-btn>
          <v-btn outlined @click="$refs.importFile.click()" v-if="tab < 4">
            <v-icon left>mdi-upload</v-icon>
            Importer
          </v-btn>
          <input
            ref="importFile"
            type="file"
            accept=".json"
            style="display:none"
            @change="importConfig"
          />
          <v-spacer />
          <v-btn color="primary" @click="save" :loading="saving">
            <v-icon left>mdi-content-save</v-icon>
            Sauvegarder
          </v-btn>
        </v-card-actions>

        <v-snackbar v-model="snack" :color="snackColor" timeout="3000" bottom>
          {{ snackMsg }}
        </v-snackbar>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import ImageFCTable from "@/components/ImageFCTable.vue";
import ImageFXTable from "@/components/ImageFXTable.vue";

const defFC = (enabled, font, color, size, bold, x, y) => ({
  enabled,
  font,
  color,
  size,
  bold,
  x,
  y
});
const defFX = (enabled, font, color, size, bold, x) => ({
  enabled,
  font,
  color,
  size,
  bold,
  x
});

export default {
  name: "ImageSettings",
  components: { ImageFCTable, ImageFXTable },
  data() {
    return {
      loading: true,
      saving: false,
      tab: 0,

      settings: {
        canvas: { width: 1920, height: 1080 },

        match: {
          background: "marble.png",
          fontFile: "",
          rows_y: [485, 625, 770, 0, 0],
          team1_name: defFC(true, "Arial", "#1a1a2e", 30, true, 415, 302),
          team1_score: defFC(true, "Arial", "#1a1a2e", 30, true, 806, 302),
          team2_score: defFC(true, "Arial", "#1a1a2e", 30, true, 1114, 302),
          team2_name: defFC(true, "Arial", "#1a1a2e", 30, true, 1595, 302),
          map1: defFC(true, "Arial", "#1a1a2e", 24, true, 480, 980),
          map2: defFC(true, "Arial", "#1a1a2e", 24, true, 960, 980),
          map3: defFC(true, "Arial", "#1a1a2e", 24, true, 1440, 980),
          player_name_l: defFX(true, "Arial", "#1a1a2e", 20, true, 180),
          player_name_r: defFX(true, "Arial", "#1a1a2e", 20, true, 1450),
          kills_l: defFX(true, "Arial", "#1a1a2e", 20, false, 630),
          assists_l: defFX(true, "Arial", "#1a1a2e", 20, false, 710),
          deaths_l: defFX(true, "Arial", "#1a1a2e", 20, false, 800),
          rating_l: defFX(true, "Arial", "#1a1a2e", 20, false, 890),
          kills_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1025),
          assists_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1105),
          deaths_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1195),
          rating_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1280),
          column_headers: {
            enabled: false,
            y: 400,
            font: "Arial",
            color: "#1a1a2e",
            size: 20,
            bold: true,
            kills_label: "K",
            assists_label: "A",
            deaths_label: "D",
            rating_label: "RTG"
          },
          team1_logo: { enabled: true, x: 310, y: 302, size: 60 },
          team2_logo: { enabled: true, x: 1610, y: 302, size: 60 },
          shapes: {
            enabled: false,
            team_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.35,
              radius: 50,
              width: 480,
              height: 70,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 2
            },
            player_pill: {
              enabled: true,
              fill: "#ffffff",
              alpha: 0.18,
              radius: 50,
              width: 420,
              height: 58,
              border: "#ffffff",
              border_alpha: 0.3,
              border_width: 1.5,
              l_x: 60,
              r_x: 1440
            },
            stats_table: {
              enabled: true,
              fill: "#000000",
              alpha: 0.2,
              radius: 22,
              l_x: 510,
              r_x: 920,
              width: 430,
              pad_y: 30,
              row_height: 58,
              odd_fill: "#000000",
              odd_alpha: 0.08,
              even_fill: "#ffffff",
              even_alpha: 0.05
            },
            map_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.3,
              current_alpha: 0.7,
              radius: 8,
              width: 280,
              height: 40,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 1
            }
          }
        },

        player: {
          background: "marble.png",
          fontFile: "",
          team1_name: defFC(true, "Arial", "#1a1a2e", 36, true, 480, 220),
          vs: defFC(true, "Arial", "#1a1a2e", 36, true, 960, 220),
          team2_name: defFC(true, "Arial", "#1a1a2e", 36, true, 1440, 220),
          player_name: defFC(true, "Arial", "#1a1a2e", 52, true, 960, 380),
          kills: defFC(true, "Arial", "#1a1a2e", 28, false, 500, 600),
          assists: defFC(true, "Arial", "#1a1a2e", 28, false, 700, 600),
          deaths: defFC(true, "Arial", "#1a1a2e", 28, false, 900, 600),
          rating: defFC(true, "Arial", "#1a1a2e", 28, false, 1100, 600),
          hs: defFC(true, "Arial", "#1a1a2e", 28, false, 1310, 600),
          clutches: defFC(true, "Arial", "#1a1a2e", 28, false, 1500, 600),
          column_headers: {
            enabled: false,
            y: 530,
            y2: 530,
            font: "Arial",
            color: "#1a1a2e",
            size: 20,
            bold: true,
            kills_label: "Kills",
            assists_label: "Assists",
            deaths_label: "Deaths",
            rating_label: "Rating",
            hs_label: "HS%",
            clutches_label: "Clutches"
          },
          shapes: {
            enabled: false,
            team_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.35,
              radius: 50,
              width: 400,
              height: 65,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 2
            },
            player_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.3,
              radius: 50,
              width: 600,
              height: 75,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 2
            },
            stats_bar: {
              enabled: true,
              fill: "#000000",
              alpha: 0.2,
              radius: 22,
              x: 420,
              y: 0,
              width: 1140,
              height: 70,
              border: "#ffffff",
              border_alpha: 0.1,
              border_width: 1
            }
          }
        },

        mvp: {
          background: "marble.png",
          fontFile: "",
          map1:        defFC(true, "Arial", "#ffffff", 20, false,  480, 130),
          map2:        defFC(true, "Arial", "#ffffff", 20, false,  960, 130),
          map3:        defFC(true, "Arial", "#ffffff", 20, false, 1440, 130),
          team1_name:  defFC(true, "Arial", "#ffffff", 32, true, 450, 200),
          team1_score: defFC(true, "Arial", "#ffffff", 32, true, 800, 200),
          team2_score: defFC(true, "Arial", "#ffffff", 32, true, 1120, 200),
          team2_name:  defFC(true, "Arial", "#ffffff", 32, true, 1470, 200),
          mvp_label:   defFC(true, "Arial", "#f4d03f", 28, true, 960, 310),
          player_name: defFC(true, "Arial", "#ffffff", 52, true, 960, 390),
          player_team: defFC(true, "Arial", "#cccccc", 22, false, 960, 450),
          kills:       defFC(true, "Arial", "#ffffff", 28, false, 500, 620),
          assists:     defFC(true, "Arial", "#ffffff", 28, false, 700, 620),
          deaths:      defFC(true, "Arial", "#ffffff", 28, false, 900, 620),
          rating:      defFC(true, "Arial", "#ffffff", 28, false, 1100, 620),
          hs:          defFC(true, "Arial", "#ffffff", 28, false, 1310, 620),
          clutches:    defFC(true, "Arial", "#ffffff", 28, false, 1500, 620),
          player_image: { enabled: true, x: 960, y: 480, size: 120, width: 120, height: 200, circle: false },
          map_image: { enabled: false }
        },

        team_season: {
          background: "marble.png",
          fontFile: "",
          team_name: defFC(true, "Arial", "#1a1a2e", 42, true, 960, 150),
          team_rating: defFC(true, "Arial", "#1a1a2e", 24, true, 960, 460),
          best_map_label: {
            ...defFC(true, "Arial", "#1a1a2e", 22, false, 960, 510),
            text: "Meilleure Map"
          },
          players: {
            enabled: true,
            font: "Arial",
            color: "#1a1a2e",
            size: 26,
            bold: true,
            x: [320, 640, 960, 1280, 1600],
            name_y: 320,
            show_rating: true,
            rating_font: "Arial",
            rating_color: "#1a1a2e",
            rating_size: 20,
            rating_bold: false,
            rating_y: 380
          },
          kills: defFC(true, "Arial", "#1a1a2e", 24, false, 400, 620),
          deaths: defFC(true, "Arial", "#1a1a2e", 24, false, 640, 620),
          plants: defFC(true, "Arial", "#1a1a2e", 24, false, 880, 620),
          defuses: defFC(true, "Arial", "#1a1a2e", 24, false, 1120, 620),
          rounds_won: defFC(true, "Arial", "#2e7d32", 24, false, 320, 760),
          rounds_lost: defFC(true, "Arial", "#c62828", 24, false, 600, 760),
          wins: defFC(true, "Arial", "#2e7d32", 24, false, 900, 760),
          losses: defFC(true, "Arial", "#c62828", 24, false, 1140, 760),
          stat_labels: {
            enabled: true,
            font: "Arial",
            color: "#888888",
            size: 16,
            bold: false,
            y_offset: 30,
            team_rating_label: "Rating",
            kills_label: "Kills",
            deaths_label: "Décès",
            plants_label: "Plants",
            defuses_label: "Défuses",
            rounds_won_label: "Rounds gagnés",
            rounds_lost_label: "Rounds perdus",
            wins_label: "Victoires",
            losses_label: "Défaites"
          },
          map_image: { enabled: true, x: 760, y: 390, width: 400, height: 225 },
          shapes: {
            enabled: false,
            team_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.35,
              radius: 50,
              width: 600,
              height: 75,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 2
            },
            player_pill: {
              enabled: true,
              fill: "#000000",
              alpha: 0.25,
              radius: 50,
              width: 280,
              height: 55,
              border: "#ffffff",
              border_alpha: 0.2,
              border_width: 1.5
            },
            stats_background: {
              enabled: true,
              fill: "#000000",
              alpha: 0.15,
              radius: 22,
              x: 220,
              y: 580,
              width: 1480,
              height: 240
            }
          }
        }
      },

      // Upload map images
      mapImageFile: null,
      uploadingMap: false,
      mapImages: [],
      uploadMapMsg: "",
      uploadMapMsgType: "success",

      // Photos joueurs (MVP)
      playerPhotoFile: null,
      playerPhotoSteamId: "",
      uploadingPhoto: false,
      uploadPhotoMsg: "",
      uploadPhotoMsgType: "success",
      playerPhotos: [],

      // Upload state — index 0=match, 1=joueur, 2=mvp, 3=équipe
      bgFile: [null, null, null, null],
      fontFileInput: [null, null, null, null],
      uploadingBg: [false, false, false, false],
      uploadingFont: [false, false, false, false],
      uploadMsg: ["", "", "", ""],
      uploadMsgType: ["success", "success", "success", "success"],

      // Aperçu
      previewTs: Date.now(),
      previewMatchId: "",
      previewSteamId: "",
      previewMvpMap: "",
      previewSeasonId: "",
      previewTeamId: "",
      previewMatchError: false,
      previewPlayerError: false,
      previewMvpError: false,
      previewMvpMatchError: false,
      previewTeamError: false,

      snack: false,
      snackMsg: "",
      snackColor: "success",
      DEFAULT_API_URL: "/api",
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api",

      fontList: [
        "Arial",
        "Helvetica",
        "Verdana",
        "Tahoma",
        "Trebuchet MS",
        "Georgia",
        "Times New Roman",
        "Courier New",
        "Impact",
        "Comic Sans MS"
      ],

      matchFCFields: [
        { key: "team1_name", label: "Nom équipe 1" },
        { key: "team1_score", label: "Score équipe 1" },
        { key: "team2_score", label: "Score équipe 2" },
        { key: "team2_name", label: "Nom équipe 2" },
        { key: "map1", label: "Map 1 (gauche)" },
        { key: "map2", label: "Map 2 (centre)" },
        { key: "map3", label: "Map 3 (droite)" }
      ],
      matchFXFields: [
        { key: "player_name_l", label: "Nom joueur gauche" },
        { key: "player_name_r", label: "Nom joueur droite" },
        { key: "kills_l", label: "Kills gauche" },
        { key: "assists_l", label: "Assists gauche" },
        { key: "deaths_l", label: "Morts gauche" },
        { key: "rating_l", label: "Rating gauche" },
        { key: "kills_r", label: "Kills droite" },
        { key: "assists_r", label: "Assists droite" },
        { key: "deaths_r", label: "Morts droite" },
        { key: "rating_r", label: "Rating droite" }
      ],
      playerFields: [
        { key: "team1_name", label: "Nom équipe 1" },
        { key: "vs", label: "VS" },
        { key: "team2_name", label: "Nom équipe 2" },
        { key: "player_name", label: "Nom joueur" },
        { key: "kills", label: "Kills" },
        { key: "assists", label: "Assists" },
        { key: "deaths", label: "Morts" },
        { key: "rating", label: "Rating" },
        { key: "hs", label: "Headshot %" },
        { key: "clutches", label: "Clutches" }
      ],
      mvpFields: [
        { key: "map1",        label: "Map 1 (gauche)" },
        { key: "map2",        label: "Map 2 (centre)" },
        { key: "map3",        label: "Map 3 (droite)" },
        { key: "team1_name",  label: "Nom équipe 1" },
        { key: "team1_score", label: "Score équipe 1" },
        { key: "team2_score", label: "Score équipe 2" },
        { key: "team2_name",  label: "Nom équipe 2" },
        { key: "mvp_label",   label: "★ MVP" },
        { key: "player_name", label: "Nom joueur" },
        { key: "player_team", label: "Équipe joueur" },
        { key: "kills",       label: "Kills" },
        { key: "assists",     label: "Assists" },
        { key: "deaths",      label: "Morts" },
        { key: "rating",      label: "Rating" },
        { key: "hs",          label: "Headshot %" },
        { key: "clutches",    label: "Clutches" }
      ],
      teamSeasonFields: [
        { key: "team_name", label: "Nom équipe" },
        { key: "team_rating", label: "Rating équipe" },
        { key: "best_map_label", label: "Meilleure map (texte)" },
        { key: "kills", label: "Kills" },
        { key: "deaths", label: "Morts" },
        { key: "plants", label: "Plants" },
        { key: "defuses", label: "Defuses" },
        { key: "rounds_won", label: "Rounds +" },
        { key: "rounds_lost", label: "Rounds -" },
        { key: "wins", label: "Victoires" },
        { key: "losses", label: "Défaites" }
      ]
    };
  },

  async created() {
    const user = await this.IsLoggedIn();
    if (!user || (!user.admin && !user.super_admin)) {
      this.$router.push("/");
      return;
    }
    await this.load();
  },

  methods: {
    async load() {
      this.loading = true;
      try {
        const [settings, uploadedFonts, mapImages, playerPhotos] = await Promise.all([
          this.GetImageSettings(),
          this.GetImageFonts().catch(() => []),
          this.axiosCall.get(`${this.apiUrl}/image/maps`).then(r => r.data).catch(() => []),
          this.axiosCall.get(`${this.apiUrl}/image/players`).then(r => r.data).catch(() => [])
        ]);
        this.mapImages = mapImages;
        this.playerPhotos = playerPhotos;
        // Merge API response with local defaults so new fields never crash
        const def = this.settings;
        const s = settings || {};
        const sm = s.match || {};
        const sp = s.player || {};
        const sv = s.mvp   || {};
        const st = s.team_season || {};
        // Number of player slots for the X positions
        const MAX_PLAYERS = 5;
        this.settings = {
          canvas: { ...def.canvas, ...(s.canvas || {}) },
          match: {
            ...def.match,
            ...sm,
            team1_logo: { ...def.match.team1_logo, ...(sm.team1_logo || {}) },
            team2_logo: { ...def.match.team2_logo, ...(sm.team2_logo || {}) },
            column_headers: {
              ...def.match.column_headers,
              ...(sm.column_headers || {})
            },
            shapes: {
              ...def.match.shapes,
              ...(sm.shapes || {}),
              team_pill: {
                ...def.match.shapes.team_pill,
                ...(sm.shapes?.team_pill || {})
              },
              player_pill: {
                ...def.match.shapes.player_pill,
                ...(sm.shapes?.player_pill || {})
              },
              stats_table: {
                ...def.match.shapes.stats_table,
                ...(sm.shapes?.stats_table || {})
              },
              map_pill: {
                ...def.match.shapes.map_pill,
                ...(sm.shapes?.map_pill || {})
              }
            }
          },
          player: {
            ...def.player,
            ...sp,
            column_headers: {
              ...def.player.column_headers,
              ...(sp.column_headers || {})
            },
            shapes: {
              ...def.player.shapes,
              ...(sp.shapes || {}),
              team_pill: {
                ...def.player.shapes.team_pill,
                ...(sp.shapes?.team_pill || {})
              },
              player_pill: {
                ...def.player.shapes.player_pill,
                ...(sp.shapes?.player_pill || {})
              },
              stats_bar: {
                ...def.player.shapes.stats_bar,
                ...(sp.shapes?.stats_bar || {})
              }
            }
          },
          mvp: {
            ...def.mvp,
            ...sv,
            map1:         { ...def.mvp.map1,         ...(sv.map1         || {}) },
            map2:         { ...def.mvp.map2,         ...(sv.map2         || {}) },
            map3:         { ...def.mvp.map3,         ...(sv.map3         || {}) },
            map_image:    { ...def.mvp.map_image,    ...(sv.map_image    || {}) },
            player_image: { ...def.mvp.player_image, ...(sv.player_image || {}) }
          },
          team_season: {
            ...def.team_season,
            ...st,
            players: {
              ...def.team_season.players,
              ...(st.players || {}),
              x: Array.from(
                { length: MAX_PLAYERS },
                (_, i) => st.players?.x?.[i] ?? def.team_season.players.x[i]
              )
            },
            best_map_label: {
              ...def.team_season.best_map_label,
              ...(st.best_map_label || {}),
              text:
                st.best_map_label?.text ?? def.team_season.best_map_label.text
            },
            stat_labels: {
              ...def.team_season.stat_labels,
              ...(st.stat_labels || {})
            },
            map_image: {
              ...def.team_season.map_image,
              ...(st.map_image || {})
            },
            shapes: {
              ...def.team_season.shapes,
              ...(st.shapes || {}),
              team_pill: {
                ...def.team_season.shapes.team_pill,
                ...(st.shapes?.team_pill || {})
              },
              player_pill: {
                ...def.team_season.shapes.player_pill,
                ...(st.shapes?.player_pill || {})
              },
              stats_background: {
                ...def.team_season.shapes.stats_background,
                ...(st.shapes?.stats_background || {})
              }
            }
          }
        };
        const systemFonts = [
          "Arial",
          "Helvetica",
          "Verdana",
          "Tahoma",
          "Trebuchet MS",
          "Georgia",
          "Times New Roman",
          "Courier New",
          "Impact",
          "Comic Sans MS"
        ];
        this.fontList = [...new Set([...systemFonts, ...uploadedFonts])];
      } catch {
        this.notify("Erreur lors du chargement des paramètres", "error");
      } finally {
        this.loading = false;
      }
    },

    async save() {
      this.saving = true;
      try {
        await this.SaveImageSettings(this.settings);
        this.notify("Paramètres sauvegardés !", "success");
        this.previewTs = Date.now();
      } catch {
        this.notify("Erreur lors de la sauvegarde", "error");
      } finally {
        this.saving = false;
      }
    },

    exportConfig() {
      const sectionKey = ["match", "player", "mvp", "team_season"][this.tab];
      const data = JSON.stringify(this.settings[sectionKey], null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-settings-${sectionKey}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    resetFileInput(inputEl) {
      if (inputEl && typeof inputEl.value !== "undefined") {
        inputEl.value = "";
      }
    },

    importConfig(event) {
      const inputEl = event.target;
      const file = inputEl.files[0];
      if (!file) return;
      const sectionKey = ["match", "player", "mvp", "team_season"][this.tab];
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result);
          this.$set(this.settings, sectionKey, parsed);
          this.notify(
            `Configuration "${sectionKey}" importée — pensez à sauvegarder.`,
            "info"
          );
        } catch {
          this.notify("Fichier JSON invalide", "error");
        }
        // reset input so the same file can be re-imported
        this.resetFileInput(inputEl);
      };
      reader.readAsText(file);
    },

    async uploadBg(idx) {
      const file = this.bgFile[idx];
      if (!file) return;
      this.$set(this.uploadingBg, idx, true);
      this.$set(this.uploadMsg, idx, "");
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await this.axiosCall.post(
          `${this.apiUrl}/image/upload/img`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const filename = res.data.filename;
        if (idx === 0) this.settings.match.background = filename;
        else if (idx === 1) this.settings.player.background = filename;
        else if (idx === 2) this.settings.mvp.background = filename;
        else this.settings.team_season.background = filename;
        this.$set(this.uploadMsg, idx, `Fond uploadé : ${filename}`);
        this.$set(this.uploadMsgType, idx, "success");
        this.$set(this.bgFile, idx, null);
      } catch {
        this.$set(this.uploadMsg, idx, "Erreur lors de l'upload");
        this.$set(this.uploadMsgType, idx, "error");
      } finally {
        this.$set(this.uploadingBg, idx, false);
      }
    },

    async uploadFont(idx) {
      const file = this.fontFileInput[idx];
      if (!file) return;
      this.$set(this.uploadingFont, idx, true);
      this.$set(this.uploadMsg, idx, "");
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await this.axiosCall.post(
          `${this.apiUrl}/image/upload/font`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const filename = res.data.filename;
        const family = filename.replace(/\.[^.]+$/, "");
        if (idx === 0) {
          this.settings.match.fontFile = filename;
          this.applyFontFamily("match", family);
        } else if (idx === 1) {
          this.settings.player.fontFile = filename;
          this.applyFontFamily("player", family);
        } else if (idx === 2) {
          this.settings.mvp.fontFile = filename;
          this.applyFontFamily("mvp", family);
        } else {
          this.settings.team_season.fontFile = filename;
          this.applyFontFamily("team_season", family);
        }
        await this.SaveImageSettings(this.settings);
        this.$set(
          this.uploadMsg,
          idx,
          `Police uploadée et sauvegardée : ${filename}`
        );
        this.$set(this.uploadMsgType, idx, "success");
        this.$set(this.fontFileInput, idx, null);
      } catch {
        this.$set(this.uploadMsg, idx, "Erreur lors de l'upload");
        this.$set(this.uploadMsgType, idx, "error");
      } finally {
        this.$set(this.uploadingFont, idx, false);
      }
    },

    async uploadPlayerPhoto() {
      if (!this.playerPhotoFile || !this.playerPhotoSteamId) return;
      this.uploadingPhoto = true;
      this.uploadPhotoMsg = "";
      try {
        const form = new FormData();
        form.append("file", this.playerPhotoFile);
        form.append("steam_id", this.playerPhotoSteamId);
        await this.axiosCall.post(`${this.apiUrl}/image/upload/player`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        this.uploadPhotoMsg = `Photo uploadée pour ${this.playerPhotoSteamId}`;
        this.uploadPhotoMsgType = "success";
        this.playerPhotoFile = null;
        this.playerPhotoSteamId = "";
        this.playerPhotos = await this.axiosCall
          .get(`${this.apiUrl}/image/players`)
          .then(r => r.data)
          .catch(() => []);
      } catch {
        this.uploadPhotoMsg = "Erreur lors de l'upload";
        this.uploadPhotoMsgType = "error";
      } finally {
        this.uploadingPhoto = false;
      }
    },

    async uploadMapImage() {
      if (!this.mapImageFile) return;
      this.uploadingMap = true;
      this.uploadMapMsg = "";
      try {
        const form = new FormData();
        form.append("file", this.mapImageFile);
        await this.axiosCall.post(`${this.apiUrl}/image/upload/map`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        this.uploadMapMsg = `Image uploadée : ${this.mapImageFile.name}`;
        this.uploadMapMsgType = "success";
        this.mapImageFile = null;
        this.mapImages = await this.axiosCall
          .get(`${this.apiUrl}/image/maps`)
          .then(r => r.data)
          .catch(() => []);
      } catch {
        this.uploadMapMsg = "Erreur lors de l'upload";
        this.uploadMapMsgType = "error";
      } finally {
        this.uploadingMap = false;
      }
    },

    applyFontFamily(type, family) {
      const s = this.settings[type];
      const fcKeys = Object.keys(s).filter(
        k =>
          s[k] &&
          typeof s[k] === "object" &&
          "font" in s[k] &&
          "enabled" in s[k]
      );
      fcKeys.forEach(k => {
        s[k].font = family;
      });
      if (type === "team_season" && s.players) {
        s.players.font = family;
        s.players.rating_font = family;
      }
      if (s.column_headers) s.column_headers.font = family;
      if (!this.fontList.includes(family)) this.fontList.push(family);
    },

    notify(msg, color = "success") {
      this.snackMsg = msg;
      this.snackColor = color;
      this.snack = true;
    }
  }
};
</script>

<style scoped>
.color-input {
  width: 36px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
  cursor: pointer;
}
</style>
