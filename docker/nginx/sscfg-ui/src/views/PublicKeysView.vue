<template>
  <div
    class="public-keys-view"
    data-manual="docs/screen-601"
  >
    <public-keys-table
      :search="search"
      @change-public-key="refreshPublicKeys"
    />
    <public-key-register-dialog
      v-if="dialog"
      v-model="dialog"
      :only="isEmpty"
      @change-public-key="refreshPublicKeys"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import PublicKeysTable from '@/components/PublicKeysTable.vue';

export default defineComponent({
  name: 'PublicKeysView',
  components: {
    PublicKeysTable,
    PublicKeyRegisterDialog: defineAsyncComponent(() => import(/* webpackChunkName: "publicKeyDialog" */'@/components/PublicKeyRegisterDialog.vue')),
  },
  props: {
    search: {
      type: String,
      default: '',
    },
    createDialog: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const dialog = computed({
      get: () => props.createDialog,
      set: (value: boolean) => { context.emit('change-dialog', value); },
    });
    const { PublicKey } = context.root.$FeathersVuex.api;
    const refreshPublicKeys = () => {
      useFind({ model: PublicKey, params: { query: {}, paginate: false } });
    };
    const keys = useFind({ model: PublicKey, params: { query: {} } });
    const isEmpty = computed(() => keys.items.value.length === 0);
    return {
      dialog,
      refreshPublicKeys,
      isEmpty,
    };
  },
});
</script>
