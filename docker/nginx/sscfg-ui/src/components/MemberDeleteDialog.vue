<template>
  <div v-if="item">
    <FeathersVuexFormWrapper
      v-slot="{ clone, remove }"
      :item="item"
    >
      <simple-dialog
        v-model="dialog"
        title="共同利用者の削除"
        color="error"
        submit="削除"
        data-manual="2,docs/screen-531"
        @save="onSubmit(remove)"
        @cancel="dialog = false"
      >
        <template #activator="{ on, attrs }">
          <slot
            name="activator"
            v-bind="{ on, attrs }"
          />
        </template>
        <template
          v-if="clone.user"
          #default
        >
          <v-text-field
            v-model="clone.user.name"
            label="共同利用者名"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-name"
          />
          <v-text-field
            v-model="clone.user.displayName"
            label="表示名"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-display-name"
          />
          <v-text-field
            v-model="clone.user.email"
            label="メール"
            readonly
            filled
            hint="変更することはできません"
            data-cy="input-email"
          />
          <v-checkbox
            v-model="clone.admin"
            label="データ管理者"
            disabled
            data-cy="input-admin"
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
import { useSubmitDialog } from '@/utils/member';

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
    const { dialog, onSubmit } = useSubmitDialog(props, context.emit);
    const { Member } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: Member, id: props.id });
    return {
      dialog,
      onSubmit,
      item,
    };
  },
});

</script>
