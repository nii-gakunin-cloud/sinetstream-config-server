<template>
  <div v-if="item">
    <FeathersVuexFormWrapper :item="item">
      <template #default="{ clone, remove }">
        <validation-observer
          ref="observer"
          v-slot="{ invalid }"
        >
          <simple-dialog
            v-model="dialog"
            title="コンフィグ情報の削除"
            color="error"
            submit="削除"
            :invalid="invalid"
            data-manual="2,docs/screen-131"
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
                v-model="clone.name"
                label="名前"
                :readonly="true"
                data-cy="input-name"
              />
              <v-textarea
                v-model="clone.comment"
                rows="2"
                label="コメント"
                :readonly="true"
                data-cy="input-comment"
              />
              <v-textarea
                v-model="clone.configFile"
                label="設定ファイル"
                :rows="!$vuetify.breakpoint.mobile ? '6' : '9'"
                :readonly="true"
                data-cy="input-config-file"
              />
              <v-sheet
                elevation="2"
                class="pa-4 mt-4"
                rounded="lg"
              >
                <validation-provider
                  v-slot="{ errors }"
                  rules="required|confirm"
                  name="確認欄"
                  vid="confirm"
                >
                  <v-text-field
                    v-model="confirm"
                    :hint="confirmHint"
                    :placeholder="clone.name"
                    persistent-hint
                    clearable
                    data-cy="input-confirm"
                    :error-messages="errors"
                  />
                </validation-provider>
              </v-sheet>
            </template>
          </simple-dialog>
        </validation-observer>
      </template>
    </FeathersVuexFormWrapper>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import { extend, ValidationObserver, ValidationProvider } from 'vee-validate';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useSubmitDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
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
    const { Stream } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: Stream, id: props.id });
    const { dialog, observer, onSubmit } = useSubmitDialog(
      props,
      context.emit,
      undefined,
      (e) => ({ confirm: [e.toString()] }),
    );

    const confirm = ref('');
    const confirmHint = computed(
      () => `削除するにはこのテキスト入力フィールドに「${item.value?.name}」と入力してください。`,
    );
    extend('confirm', (v) => {
      if (v === item.value?.name) {
        return true;
      }
      return confirmHint.value;
    });

    return {
      item,
      dialog,
      observer,
      onSubmit,
      confirm,
      confirmHint,
    };
  },
});
</script>
