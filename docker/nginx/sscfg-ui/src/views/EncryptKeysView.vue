<template>
  <div
    class="encrypt-keys-view"
    data-manual="docs/screen-201"
  >
    <encrypt-key-table
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
    <encrypt-key-create-dialog
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
import EncryptKeyCreateDialog from '@/components/EncryptKeyCreateDialog.vue';
import EncryptKeyTable from '@/components/EncryptKeyTable.vue';

export default defineComponent({
  name: 'EncryptKeysView',
  components: {
    EncryptKeyCreateDialog,
    EncryptKeyTable,
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
      context.emit('change-title', `データ暗号鍵一覧: ${item.value?.name}`);
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
