<template>
  <div
    class="attach-files-view"
    data-manual="docs/screen-301"
  >
    <attach-file-table
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
    <attach-file-dialog
      v-if="dialog"
      v-model="dialog"
      :sid="id"
    />
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, watch,
} from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import AttachFileDialog from '@/components/AttachFileDialog.vue';
import AttachFileTable from '@/components/AttachFileTable.vue';

export default defineComponent({
  name: 'AttachFilesView',
  components: {
    AttachFileTable,
    AttachFileDialog,
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
      context.emit('change-title', `添付ファイル一覧: ${item.value?.name}`);
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
