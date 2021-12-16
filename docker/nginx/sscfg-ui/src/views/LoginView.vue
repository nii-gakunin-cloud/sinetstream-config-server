<template>
  <div>
    <v-container
      v-if="health"
      data-manual="docs/screen-011"
    >
      <v-row>
        <v-col cols="12">
          <v-card class="ma-4 pa-4">
            <div v-if="!$vuetify.breakpoint.mobile">
              <v-card-title>ログイン</v-card-title>
            </div>
            <login-form />
          </v-card>
        </v-col>
      </v-row>
      <v-row
        v-if="shibbolethPath"
        justify="center"
      >
        <v-col
          cols="8"
          sm="4"
        >
          <v-btn
            :href="shibbolethPath"
            text
          >
            学認フェデレーションでのログイン
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
    <v-sheet
      v-else
      class="px-4 pt-4 pb-3"
      tile
    >
      <div class="text-h1 text-center">
        503
      </div>
      <div class="text-h2 text-center">
        Service Unavailable
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import LoginForm from '@/components/LoginForm.vue';
import { useHealth, useShibboleth } from '@/utils/info';

export default defineComponent({
  components: {
    LoginForm,
  },
  setup() {
    return { ...useShibboleth(), ...useHealth() };
  },
});
</script>
