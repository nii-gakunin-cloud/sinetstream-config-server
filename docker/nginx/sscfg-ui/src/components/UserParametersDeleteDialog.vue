<template>
  <simple-dialog
    v-model="dialog"
    title="ユーザパラメータの一括削除"
    color="error"
    submit="削除"
    @save="onRemove"
  >
    <template #activator="{ on, attrs }">
      <slot
        name="activator"
        v-bind="{ on, attrs }"
      />
    </template>
    <template #default>
      <user-parameter-table
        :id="id"
        readonly
      />

      <v-sheet
        elevation="2"
        class="pa-4 mt-4"
        rounded="lg"
      >
        <v-text-field
          v-model="confirm"
          hint="ユーザパラメータの一括削除を行うには、このテキストフィールドに「全て削除」と入力してください。"
          persistent-hint
          clearable
        />
      </v-sheet>
    </template>
  </simple-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import SimpleDialog from '@/components/SimpleDialog.vue';
import UserParameterTable from '@/components/UserParameterTable.vue';

export default defineComponent({
  components: {
    SimpleDialog,
    UserParameterTable,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const dialog = ref(false);
    const confirm = ref('');
    const onRemove = () => {
      console.log('remove');
    };
    return {
      dialog,
      confirm,
      onRemove,
    };
  },
});
</script>
