<template>
  <encrypt-key-dialog
    v-model="dialog"
    :item="item"
    :update="false"
    target-rules="required|target-pattern|unique-target"
    data-manual="2,docs/screen-211"
    @change-stream="$emit('change-stream', $event)"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { extend } from 'vee-validate';
import { useDialog } from '@/utils/encrypt-key';
import { targetPattern } from '@/utils/validate';
import EncryptKeyDialog from './EncryptKeyDialog.vue';

export default defineComponent({
  components: {
    EncryptKeyDialog,
  },
  props: {
    sid: {
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
    const item = ref(new EncryptKey());
    item.value.stream_id = props.sid;
    extend('target-pattern', targetPattern('*.crypto.key', 'service-kafka-001.crypto.key'));
    extend('unique-target', {
      validate: async (v): Promise<boolean> => {
        const result = await EncryptKey.find({
          query: {
            target: v,
            stream_id: props.sid,
            $limit: 0,
          },
        });
        return result.total === 0;
      },
      message: '既に登録されている他の{_field_}と重複しています。',
    });
    const { dialog } = useDialog(props, context.emit);
    return { item, dialog };
  },
});
</script>
