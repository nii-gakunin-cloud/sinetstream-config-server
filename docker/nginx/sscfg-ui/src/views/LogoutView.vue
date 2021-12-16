<template>
  <v-container data-manual="docs/screen-021">
    <v-card
      class="ma-4 pa-4"
      flat
    >
      <v-card-text v-if="existStoreData">
        ログアウト処理中です
      </v-card-text>
      <v-card-text v-else>
        ログアウトしました
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="!existStoreData"
          text
          to="/"
          data-cy="link-home"
        >
          HOME
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from '@vue/composition-api';
import Cookies from 'js-cookie';

export default defineComponent({
  setup(_, context) {
    const { $store } = context.root;
    const { ids: streamIds } = $store.state.streams;
    const { ids: publicKeyIds } = $store.state['public-keys'];
    const { ids: accessKeyIds } = $store.state['access-keys'];
    const existStoreData = computed(() => (streamIds instanceof Array && streamIds.length > 0)
       || (publicKeyIds instanceof Array && publicKeyIds.length > 0)
       || (accessKeyIds instanceof Array && accessKeyIds.length > 0));

    const auth = computed(() => $store.state.auth);

    onMounted(async () => {
      const strategy = auth.value?.payload?.authentication?.payload?.strategy;
      await $store.dispatch('auth/logout');
      Cookies.remove('sscfg_shibboleth');
      if (strategy === 'shibboleth') {
        window.location.assign(`/Shibboleth.sso/Logout?return=${window.location.href}`);
      } else if (existStoreData.value) {
        // eslint-disable-next-line no-restricted-globals
        location.reload();
      }
    });
    return {
      existStoreData,
    };
  },
});
</script>
