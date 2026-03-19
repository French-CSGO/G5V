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
          <v-subheader class="font-weight-bold"
            >Éléments fixes (X + Y)</v-subheader
          >
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
              <tr v-for="f in matchFCFields" :key="f.key">
                <td class="caption font-weight-medium">{{ f.label }}</td>
                <td>
                  <v-switch
                    v-model="settings.match[f.key].enabled"
                    color="primary"
                    inset
                    dense
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="settings.match[f.key].font"
                    :items="fontList"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <input
                    type="color"
                    v-model="settings.match[f.key].color"
                    class="color-input"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.match[f.key].size"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-checkbox
                    v-model="settings.match[f.key].bold"
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.match[f.key].x"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.match[f.key].y"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-simple-table>

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

          <v-subheader class="font-weight-bold"
            >Colonnes joueurs (X seul, Y = ligne)</v-subheader
          >
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in matchFXFields" :key="f.key">
                <td class="caption font-weight-medium">{{ f.label }}</td>
                <td>
                  <v-switch
                    v-model="settings.match[f.key].enabled"
                    color="primary"
                    inset
                    dense
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="settings.match[f.key].font"
                    :items="fontList"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <input
                    type="color"
                    v-model="settings.match[f.key].color"
                    class="color-input"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.match[f.key].size"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-checkbox
                    v-model="settings.match[f.key].bold"
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.match[f.key].x"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-simple-table>

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
              <tr v-for="f in playerFields" :key="f.key">
                <td class="caption font-weight-medium">{{ f.label }}</td>
                <td>
                  <v-switch
                    v-model="settings.player[f.key].enabled"
                    color="primary"
                    inset
                    dense
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="settings.player[f.key].font"
                    :items="fontList"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <input
                    type="color"
                    v-model="settings.player[f.key].color"
                    class="color-input"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.player[f.key].size"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-checkbox
                    v-model="settings.player[f.key].bold"
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.player[f.key].x"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.player[f.key].y"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-simple-table>

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
        <!-- Tab 2 : Image Équipe Saison                                   -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 2" flat class="pa-4">
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
              <tr v-for="f in teamSeasonFields" :key="f.key">
                <td class="caption font-weight-medium">{{ f.label }}</td>
                <td>
                  <v-switch
                    v-model="settings.team_season[f.key].enabled"
                    color="primary"
                    inset
                    dense
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="settings.team_season[f.key].font"
                    :items="fontList"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <input
                    type="color"
                    v-model="settings.team_season[f.key].color"
                    class="color-input"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.team_season[f.key].size"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-checkbox
                    v-model="settings.team_season[f.key].bold"
                    hide-details
                    class="mt-0 pt-0"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.team_season[f.key].x"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="settings.team_season[f.key].y"
                    type="number"
                    outlined
                    dense
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-simple-table>

          <v-divider class="my-3" />
          <v-subheader class="font-weight-bold"
            >Joueurs (3 colonnes)</v-subheader
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
                v-model="bgFile[2]"
                label="Uploader un fond"
                accept="image/png,image/jpeg"
                outlined
                dense
                hide-details
                prepend-icon="mdi-image"
            /></v-col>
            <v-col cols="2"
              ><v-btn
                :disabled="!bgFile[2]"
                color="secondary"
                small
                @click="uploadBg(2)"
                :loading="uploadingBg[2]"
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
                v-model="fontFileInput[2]"
                label="Uploader une police"
                accept=".ttf,.otf"
                outlined
                dense
                hide-details
                prepend-icon="mdi-format-font"
            /></v-col>
            <v-col cols="2"
              ><v-btn
                :disabled="!fontFileInput[2]"
                color="secondary"
                small
                @click="uploadFont(2)"
                :loading="uploadingFont[2]"
                ><v-icon left>mdi-upload</v-icon>Uploader</v-btn
              ></v-col
            >
          </v-row>
          <v-alert
            v-if="uploadMsg[2]"
            :type="uploadMsgType[2]"
            dense
            class="mt-2"
            >{{ uploadMsg[2] }}</v-alert
          >
        </v-card>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- Tab 3 : Aperçu                                                -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <v-card v-if="tab === 3" flat class="pa-4">
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

        <!-- ── Bouton Sauvegarder ─────────────────────────────────────── -->
        <v-card-actions class="pa-4">
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
          map_name: defFC(true, "Arial", "#1a1a2e", 28, true, 960, 980),
          player_name_l: defFX(true, "Arial", "#1a1a2e", 20, true, 180),
          player_name_r: defFX(true, "Arial", "#1a1a2e", 20, true, 1450),
          kills_l: defFX(true, "Arial", "#1a1a2e", 20, false, 630),
          assists_l: defFX(true, "Arial", "#1a1a2e", 20, false, 710),
          deaths_l: defFX(true, "Arial", "#1a1a2e", 20, false, 800),
          rating_l: defFX(true, "Arial", "#1a1a2e", 20, false, 890),
          kills_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1025),
          assists_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1105),
          deaths_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1195),
          rating_r: defFX(true, "Arial", "#1a1a2e", 20, false, 1280)
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
          clutches: defFC(true, "Arial", "#1a1a2e", 28, false, 1500, 600)
        },

        team_season: {
          background: "marble.png",
          fontFile: "",
          team_name: defFC(true, "Arial", "#1a1a2e", 42, true, 960, 150),
          team_rating: defFC(true, "Arial", "#1a1a2e", 24, true, 960, 460),
          players: {
            enabled: true,
            font: "Arial",
            color: "#1a1a2e",
            size: 26,
            bold: true,
            x: [480, 960, 1440],
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
          map_image: { enabled: true, x: 760, y: 390, width: 400, height: 225 }
        }
      },

      // Upload map images
      mapImageFile: null,
      uploadingMap: false,
      mapImages: [],
      uploadMapMsg: "",
      uploadMapMsgType: "success",

      // Upload state — index 0=match, 1=joueur, 2=équipe
      bgFile: [null, null, null],
      fontFileInput: [null, null, null],
      uploadingBg: [false, false, false],
      uploadingFont: [false, false, false],
      uploadMsg: ["", "", ""],
      uploadMsgType: ["success", "success", "success"],

      // Aperçu
      previewTs: Date.now(),
      previewMatchId: "",
      previewSteamId: "",
      previewSeasonId: "",
      previewTeamId: "",
      previewMatchError: false,
      previewPlayerError: false,
      previewTeamError: false,

      snack: false,
      snackMsg: "",
      snackColor: "success",
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
        { key: "map_name", label: "Nom de la map" }
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
      teamSeasonFields: [
        { key: "team_name", label: "Nom équipe" },
        { key: "team_rating", label: "Rating équipe" },
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
        const [settings, uploadedFonts, mapImages] = await Promise.all([
          this.GetImageSettings(),
          this.GetImageFonts().catch(() => []),
          this.axioCall
            .get(`${this.apiUrl}/image/maps`)
            .then(r => r.data)
            .catch(() => [])
        ]);
        this.mapImages = mapImages;
        this.settings = settings;
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

    async uploadBg(idx) {
      const file = this.bgFile[idx];
      if (!file) return;
      this.$set(this.uploadingBg, idx, true);
      this.$set(this.uploadMsg, idx, "");
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await this.axioCall.post(
          `${this.apiUrl}/image/upload/img`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const filename = res.data.filename;
        if (idx === 0) this.settings.match.background = filename;
        else if (idx === 1) this.settings.player.background = filename;
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
        const res = await this.axioCall.post(
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

    async uploadMapImage() {
      if (!this.mapImageFile) return;
      this.uploadingMap = true;
      this.uploadMapMsg = "";
      try {
        const form = new FormData();
        form.append("file", this.mapImageFile);
        await this.axioCall.post(`${this.apiUrl}/image/upload/map`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        this.uploadMapMsg = `Image uploadée : ${this.mapImageFile.name}`;
        this.uploadMapMsgType = "success";
        this.mapImageFile = null;
        this.mapImages = await this.axioCall
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
