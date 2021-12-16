<template>
  <div v-if="item">
    <FeathersVuexFormWrapper
      v-slot="{clone, remove}"
      :item="item"
    >
      <simple-dialog
        v-model="dialog"
        title="ユーザパラメータの削除"
        color="error"
        submit="削除"
        data-manual="2,docs/screen-431"
        @save="onSubmit(remove)"
        @cancel="dialog = false"
      >
        <template #activator="{ on, attrs }">
          <slot
            name="activator"
            v-bind="{ on, attrs }"
          />
        </template>
        <template #default>
          <v-text-field
            v-if="clone.user"
            v-model="clone.user.name"
            label="ユーザ名"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-user"
          />
          <v-text-field
            v-if="!clone.secret && clone.textContent != null"
            v-model="clone.textContent"
            :type="clone.secret ? 'password' : 'text'"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-value"
            label="設定値"
          />
          <v-checkbox
            v-model="clone.secret"
            label="秘匿情報"
            disabled
            data-cy="input-secret"
            @change="showContent = !clone.secret"
          />
          <v-text-field
            v-model="clone.target"
            label="埋め込み先"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-target"
          />
          <v-textarea
            v-model="clone.comment"
            rows="2"
            label="コメント"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-comment"
          />
          <v-checkbox
            v-model="clone.enabled"
            label="設定ファイルの適用対象"
            disabled
            data-cy="input-enabled"
          />
        </template>
      </simple-dialog>
    </feathersvuexformwrapper>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useSubmitDialog } from '@/utils/stream';

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
    const { UserParameter } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: UserParameter, id: props.id });
    const { dialog, onSubmit } = useSubmitDialog(props, context.emit);
    return {
      item,
      dialog,
      onSubmit,
    };
  },
});
</script>
