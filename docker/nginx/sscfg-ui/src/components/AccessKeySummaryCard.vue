<template>
  <v-card>
    <v-toolbar
      :color="state"
      dark
    >
      <v-toolbar-title>APIアクセスキー</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-row dense>
        <v-col>
          発行数: <span data-cy="count">{{ count }}</span>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        text
        color="primary"
        to="/access-keys"
        data-cy="btn-list"
      >
        一覧
      </v-btn>
      <v-btn
        text
        color="primary"
        data-cy="btn-create"
        @click.stop="dialog=true"
      >
        作成
      </v-btn>
      <access-key-create-dialog
        v-if="dialog"
        v-model="dialog"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import AccessKeyCreateDialog from '@/components/AccessKeyCreateDialog.vue';

export default defineComponent({
  components: {
    AccessKeyCreateDialog,
  },
  setup(_, context) {
    const { AccessKey } = context.root.$FeathersVuex.api;
    const result = useFind({ model: AccessKey, params: { query: {}, paginate: false } });
    const count = computed(() => result.items.value.length);
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
