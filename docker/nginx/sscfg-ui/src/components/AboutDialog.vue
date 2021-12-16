<template>
  <simple-dialog
    v-model="dialog"
    title="コンフィグサーバについて"
    submit="閉じる"
    :hide-help-icon="true"
    :hide-cancel="true"
    width="400"
    @save="dialog=false"
  >
    <ul>
      <li
        v-for="(info, key) in version"
        :key="key"
      >
        {{ key }} : {{ info }}
      </li>
    </ul>
  </simple-dialog>
</template>

<script lang="ts">
import { defineComponent, watch } from '@vue/composition-api';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useDialog } from '@/utils/dialog';
import { useVersion } from '@/utils/info';

export default defineComponent({
  components: {
    SimpleDialog,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { dialog } = useDialog(props, emit);
    watch(dialog, () => {
      if (dialog.value) {
        emit('hide-navigation');
      }
    });
    return { dialog, ...useVersion() };
  },
});
</script>
