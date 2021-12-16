<template>
  <div
    class="members-view"
    data-manual="docs/screen-501"
  >
    <members-table
      :id="id"
      :search="search"
    />
    <v-btn
      v-if="!$vuetify.breakpoint.mobile"
      class="ms-4"
      data-cy="btn-back"
      @click="$router.go(-1)"
    >
      戻る
    </v-btn>
    <member-create-dialog
      v-if="dialog"
      :id="id"
      v-model="dialog"
    />
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, watch,
} from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import MemberCreateDialog from '@/components/MemberCreateDialog.vue';
import MembersTable from '@/components/MembersTable.vue';

export default defineComponent({
  name: 'MembersView',
  components: {
    MembersTable,
    MemberCreateDialog,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
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
    const { Stream } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: Stream, id: props.id });
    const updateTitle = () => {
      context.emit('change-title', `共同利用者一覧: ${item.value?.name}`);
    };
    watch(item, () => updateTitle());
    onMounted(() => updateTitle());
    const dialog = computed({
      get: () => props.createDialog,
      set: (value: boolean) => { context.emit('change-dialog', value); },
    });
    return { dialog };
  },
});
</script>
