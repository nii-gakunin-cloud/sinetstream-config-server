<template>
  <v-card>
    <v-toolbar
      :color="state"
      dark
    >
      <v-toolbar-title>コンフィグ情報</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-row dense>
        <v-col>
          利用対象: <span data-cy="count">{{ count }}</span>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          管理対象: <span data-cy="count-admin">{{ admin }}</span>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        text
        color="primary"
        to="/streams"
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
        登録
      </v-btn>
      <stream-basic-info-dialog
        v-if="dialog"
        v-model="dialog"
        @create-stream="refreshAdmin"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import StreamBasicInfoDialog from '@/components/StreamBasicInfoDialog.vue';

export default defineComponent({
  components: {
    StreamBasicInfoDialog,
  },
  setup(_, context) {
    const { $store } = context.root;
    const user = computed(() => $store.state.auth.user);
    const { Stream, Member } = context.root.$FeathersVuex.api;
    const streams = useFind({ model: Stream, params: { query: {}, paginate: false } });
    const count = computed(() => streams.items.value.length);
    const query = computed(() => ({
      query: {
        user_id: user.value.id,
        admin: true,
      },
    }));
    const members = useFind({ model: Member, params: query });
    const admin = computed(() => (Math.min(count.value, members.items.value.length)));
    const state = computed(() => (count.value > 0 ? 'success' : 'warning'));
    const dialog = ref(false);
    const refreshAdmin = () => {
      useFind({ model: Member, params: query });
    };
    return {
      count,
      admin,
      state,
      dialog,
      refreshAdmin,
    };
  },
});
</script>
