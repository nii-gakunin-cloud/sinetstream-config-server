<template>
  <v-container>
    <v-card
      class="ma-4 pa-4"
      flat
    >
      <v-card-text>
        ログイン処理中です
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@vue/composition-api';
import Cookies from 'js-cookie';

export default defineComponent({
  setup(_, context) {
    const { $store, $router } = context.root;
    onMounted(async () => {
      const token = Cookies.get('sscfg_shibboleth');
      await $store.dispatch('auth/authenticate', { strategy: 'shibboleth', token });
      $router.push('/');
    });
    return {};
  },
});
</script>
