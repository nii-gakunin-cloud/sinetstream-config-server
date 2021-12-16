<template>
  <FeathersVuexFormWrapper
    v-slot="{ clone, save }"
    :item="item"
  >
    <validation-observer
      ref="observer"
      v-slot="{ invalid }"
    >
      <simple-dialog
        v-model="dialog"
        :title="title"
        color="primary"
        :submit="submit"
        :invalid="invalid"
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
            <validation-provider
              v-slot="{ errors }"
              rules="required|key-size"
              name="鍵サイズ"
              vid="size"
            >
              <v-text-field
                v-model="clone.size"
                label="鍵サイズ(bit)"
                type="number"
                min="128"
                max="256"
                step="64"
                :error-messages="errors"
                data-cy="input-size"
              />
            </validation-provider>
            <validation-provider
              v-slot="{ errors }"
              rules="required"
              name="自動生成"
              vid="generate"
            >
              <v-switch
                v-model="clone.generate"
                label="自動生成"
                hint="登録時にコンフィグサーバがデータ暗号鍵を生成します"
                :error-messages="errors"
                data-cy="input-auto"
              />
            </validation-provider>
            <validation-provider
              v-slot="{ errors }"
              :rules="clone.generate ? '' : 'required|keyfile-size:@size'"
              immediate
              name="鍵ファイル"
              vid="keyFile"
            >
              <v-file-input
                v-model="clone.keyFile"
                label="鍵ファイル"
                hint="自動生成を有効にしない場合は、鍵ファイルをアップロードしてください"
                :disabled="clone.generate"
                :error-messages="errors"
                data-cy="input-file"
              />
            </validation-provider>
            <validation-provider
              v-slot="{ errors }"
              :rules="targetRules"
              name="埋め込み先"
              immediate
            >
              <v-text-field
                v-model="clone.target"
                label="埋め込み先"
                :error-messages="errors"
                data-cy="input-target"
                :hint="targetHint"
                :readonly="update"
                :filled="update"
                :persistent-hint="update"
              />
            </validation-provider>
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
    </validation-observer>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { extend, ValidationObserver, ValidationProvider } from 'vee-validate';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useEncryptKey } from '@/utils/encrypt-key';
import { keyfileSize, keySize } from '@/utils/validate';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Boolean,
    },
    targetRules: {
      type: String,
      default: '',
    },
  },
  setup(props, context) {
    const { dialog, observer, onSubmit } = useEncryptKey(props, context.emit, props.update);
    const submit = computed(() => (props.update ? '更新' : '登録'));
    const title = computed(() => `データ暗号鍵の${submit.value}`);
    const targetHint = computed(() => (props.update
      ? '変更することはできません'
      : '設定ファイルに埋め込む場所を指定してください'));
    extend('key-size', keySize);
    extend('keyfile-size', keyfileSize);
    return {
      dialog,
      observer,
      onSubmit,
      submit,
      title,
      targetHint,
    };
  },
});
</script>
