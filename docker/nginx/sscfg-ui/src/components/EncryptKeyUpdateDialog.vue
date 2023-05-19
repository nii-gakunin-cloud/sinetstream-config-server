<template>
  <encrypt-key-dialog
    v-model="dialog"
    :item="item"
    :update="true"
    data-manual="2,docs/screen-231"
    @change-stream="$emit('change-stream', $event)"
    @change-encrypt-keys="$emit('change-encrypt-keys', $event)"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import { useDialog } from '@/utils/encrypt-key';
import EncryptKeyDialog from './EncryptKeyDialog.vue';

export default defineComponent({
  components: {
    EncryptKeyDialog,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { EncryptKey } = context.root.$FeathersVuex.api;
    const { item: item0 } = useGet({ model: EncryptKey, id: props.id });
    const item = ref(new EncryptKey());
    if (item0.value != null) {
      item.value.enabled = item0.value.enabled;
      item.value.size = item0.value.size;
      item.value.target = item0.value.target;
      item.value.comment = item0.value.comment;
      item.value.stream_id = item0.value.stream_id;
      item.value.generate = true;
    }
    const { dialog } = useDialog(props, context.emit);
    return { item, dialog };
  },
});
</script>
