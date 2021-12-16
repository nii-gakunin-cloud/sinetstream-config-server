<template>
  <div
    class="user-parameters-view"
    data-manual="docs/screen-401"
  >
    <user-parameter-table
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
    <user-parameter-dialog
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
import UserParameterDialog from '@/components/UserParameterDialog.vue';
import UserParameterTable from '@/components/UserParameterTable.vue';

export default defineComponent({
  name: 'UserParametersView',
  components: {
    UserParameterDialog,
    UserParameterTable,
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
      context.emit('change-title', `ユーザパラメータ一覧: ${item.value?.name}`);
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
