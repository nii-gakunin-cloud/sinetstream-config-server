<template>
  <div
    class="streams-view"
    data-manual="docs/screen-101"
  >
    <FeathersVuexFind
      v-slot="{ items: streams }"
      service="streams"
      :params="{ query: {} }"
    >
      <streams-table
        :items="streams"
        :search="search"
      />
    </FeathersVuexFind>
    <stream-basic-info-dialog
      v-if="dialog"
      v-model="dialog"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import StreamBasicInfoDialog from '@/components/StreamBasicInfoDialog.vue';
import StreamsTable from '@/components/StreamsTable.vue';

export default defineComponent({
  name: 'StreamsView',
  components: {
    StreamsTable,
    StreamBasicInfoDialog,
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
    return { dialog };
  },
});
</script>
