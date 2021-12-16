<template>
  <FeathersVuexFormWrapper
    v-slot="{ clone, save }"
    :item="item"
  >
    <simple-dialog
      v-model="dialog"
      title="データ暗号鍵情報の更新"
      color="primary"
      submit="更新"
      data-manual="2,docs/screen-221"
      @save="onSubmit(save)"
      @cancel="dialog=false"
    >
      <template #activator="{ on, attrs }">
        <slot
          name="activator"
          v-bind="{ on, attrs }"
        />
      </template>

      <template #default>
        <div>
          <v-text-field
            v-model="clone.target"
            label="埋め込み先"
            hint="変更することはできません"
            persistent-hint
            readonly
            filled
            data-cy="input-target"
          />
          <v-textarea
            v-model="clone.comment"
            rows="1"
            label="コメント"
            data-cy="input-comment"
          />
          <v-checkbox
            v-model="clone.enabled"
            label="設定ファイルの適用対象"
            data-cy="input-enabled"
          />
        </div>
      </template>
    </simple-dialog>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useEncryptKey } from '@/utils/encrypt-key';

export default defineComponent({
  components: {
    SimpleDialog,
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
    const { item } = useGet({ model: EncryptKey, id: props.id });
    const { dialog, onSubmit } = useEncryptKey(props, context.emit);
    return {
      item,
      dialog,
      onSubmit,
    };
  },
});
</script>
