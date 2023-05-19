<template>
  <FeathersVuexFormWrapper
    v-slot="{ clone, save }"
    :item="item"
  >
    <simple-dialog
      v-model="dialog"
      title="ユーザ公開鍵情報の更新"
      color="primary"
      submit="更新"
      data-manual="2,docs/screen-621"
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
        <v-text-field
          v-model="clone.fingerprint"
          label="フィンガープリント"
          readonly
          filled
          hint="変更することは出来ません。"
          persistent-hint
          data-cy="input-fingerprint"
        />
        <v-textarea
          v-model="clone.comment"
          label="コメント"
          rows="2"
          data-cy="input-comment"
        />
        <v-text-field
          :value="dateTimeFormat(clone.createdAt)"
          label="登録日時"
          filled
          readonly
          hint="変更することは出来ません。"
          persistent-hint
          data-cy="input-created-at"
        />
        <v-checkbox
          v-model="clone.defaultKey"
          label="デフォルトのユーザ公開鍵"
          data-cy="input-default-key"
          :disabled="only"
        />
      </template>
    </simple-dialog>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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
    only: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { PublicKey } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: PublicKey, id: props.id });
    const { dialog, onSubmit } = useSubmitDialog(
      props,
      context.emit,
      () => {
        context.emit('change-public-key', props.id);
      },
    );
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.tz.guess();
    const dateTimeFormat = (txt: string) => dayjs(txt).format('YYYY/MM/DD HH:mm:ss');
    return {
      item,
      dialog,
      onSubmit,
      dateTimeFormat,
    };
  },
});

</script>
