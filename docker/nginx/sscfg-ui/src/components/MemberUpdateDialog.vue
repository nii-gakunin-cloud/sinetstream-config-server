<template>
  <FeathersVuexFormWrapper
    v-slot="{ clone, save }"
    :item="item"
    :eager="false"
  >
    <simple-dialog
      v-model="dialog"
      title="データ管理者権限の変更"
      color="primary"
      submit="変更"
      data-manual="2,docs/screen-521"
      @save="onSubmit(save)"
      @cancel="dialog=false"
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
        <v-card-title>権限変更の対象となる利用者の情報</v-card-title>
        <v-container class="mx-3">
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
        </v-container>
        <v-divider />
        <v-container class="mx-3">
          <v-checkbox
            v-model="clone.admin"
            label="データ管理者"
            persistent-hint
            :hint="adminHint(clone.admin)"
            data-cy="input-admin"
          />
        </v-container>
      </template>
    </simple-dialog>
  </FeathersVuexFormWrapper>
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
    const adminHint = (v: boolean): string => (v
      ? 'データ管理者権限を除去するにはチェックを外してください。'
      : 'データ管理者権限を付与するにはチェックしてください。');
    return {
      dialog,
      onSubmit,
      item,
      adminHint,
    };
  },
});

</script>
