<template>
  <div
    class="access-keys-view"
    data-manual="docs/screen-701"
  >
    <access-keys-list />
    <access-key-create-dialog
      v-if="dialog"
      v-model="dialog"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import AccessKeysList from '@/components/AccessKeysList.vue';
import AccessKeyCreateDialog from '@/components/AccessKeyCreateDialog.vue';

export default defineComponent({
  name: 'AccessKeysView',
  components: {
    AccessKeysList,
    AccessKeyCreateDialog,
  },
  props: {
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
