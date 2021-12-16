<template>
  <v-card>
    <v-toolbar
      :color="state"
      dark
    >
      <v-toolbar-title>ユーザ公開鍵</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-row dense>
        <v-col>
          登録数: <span data-cy="count">{{ count }}</span>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        text
        color="primary"
        to="/public-keys"
        data-cy="btn-list"
      >
        一覧
      </v-btn>
      <v-btn
        text
        color="primary"
        data-cy="btn-create"
        @click="dialog=true"
      >
        登録
      </v-btn>
      <public-key-register-dialog
        v-if="dialog"
        v-model="dialog"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import PublicKeyRegisterDialog from '@/components/PublicKeyRegisterDialog.vue';

export default defineComponent({
  components: {
    PublicKeyRegisterDialog,
  },
  setup(_, context) {
    const { PublicKey } = context.root.$FeathersVuex.api;
    const keys = useFind({ model: PublicKey, params: { query: {}, paginate: false } });
    const count = computed(() => keys.items.value.length);
    const state = computed(() => (count.value > 0 ? 'success' : 'warning'));
    const dialog = ref(false);
    return {
      count,
      state,
      dialog,
    };
  },
});
</script>
