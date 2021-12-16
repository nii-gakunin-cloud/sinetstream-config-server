<template>
  <div v-if="item">
    <FeathersVuexFormWrapper
      v-slot="{ clone, remove }"
      :item="item"
    >
      <simple-dialog
        v-model="dialog"
        title="ユーザ公開鍵の削除"
        color="error"
        submit="削除"
        data-manual="2,docs/screen-631"
        @save="onSubmit(remove)"
        @cancel="dialog=false"
      >
        <template #activator="{ on, attrs }">
          <slot
            name="activator"
            v-bind="{ on, attrs }"
          />
        </template>
        <template #default>
          <v-text-field
            v-model="clone.fingerprint"
            label="フィンガープリント"
            readonly
            filled
            hint="変更することは出来ません。"
            data-cy="input-fingerprint"
          />
          <v-textarea
            v-model="clone.comment"
            label="コメント"
            rows="2"
            readonly
            filled
            hint="変更することは出来ません。"
            data-cy="input-comment"
          />
          <v-text-field
            v-model="clone.createdAt"
            label="登録日時"
            readonly
            filled
            hint="変更することは出来ません。"
            data-cy="input-created-at"
          />
          <v-checkbox
            v-model="clone.defaultKey"
            label="デフォルトのユーザ公開鍵"
            disabled
            data-cy="input-default-key"
          />
        </template>
      </simple-dialog>
    </FeathersVuexFormWrapper>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useSubmitDialog } from '@/utils/dialog';

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
    const { PublicKey } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: PublicKey, id: props.id });
    const { dialog, onSubmit } = useSubmitDialog(
      props, context.emit,
      () => {
        context.emit('change-public-key', props.id);
      },
    );
    return {
      item,
      dialog,
      onSubmit,
    };
  },
});

</script>
