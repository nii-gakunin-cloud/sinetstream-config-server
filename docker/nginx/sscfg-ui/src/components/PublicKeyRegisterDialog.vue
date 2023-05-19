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
        title="ユーザ公開鍵の登録"
        color="primary"
        :invalid="invalid"
        data-manual="2,docs/screen-611"
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
          <validation-provider
            v-slot="{ errors }"
            rules="required"
            name="ユーザ公開鍵"
            vid="publicKey"
          >
            <file-input-textarea
              v-model="clone.publicKey"
              label="ユーザ公開鍵"
              hint="クリップのアイコンをクリックしてファイルを選択するか、入力枠に直接入力してください。"
              :error-messages="errors"
              required
              data-cy="input-public-key"
            />
          </validation-provider>
          <v-btn
            rounded
            outlined
            color="primary"
            class="ma-2"
            :disabled="!!clone.publicKey"
            data-cy="btn-keypair-dialog"
            @click="keypairDialog=true"
          >
            <v-icon class="mr-2">
              mdi-key-change
            </v-icon>
            キーペアの生成
          </v-btn>
          <v-textarea
            v-model="clone.comment"
            label="コメント"
            rows="2"
            data-cy="input-comment"
          />
          <v-checkbox
            v-model="clone.defaultKey"
            label="デフォルトのユーザ公開鍵"
            data-cy="input-default-key"
            :disabled="only"
          />
        </template>
      </simple-dialog>
      <key-pair-dialog
        v-if="keypairDialog"
        v-model="keypairDialog"
        @generate-keypair="clone.publicKey=$event"
      />
    </validation-observer>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import FileInputTextarea from '@/components/FileInputTextarea.vue';
import KeyPairDialog from '@/components/KeyPairDialog.vue';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useSubmitDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    FileInputTextarea,
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
    KeyPairDialog,
  },
  props: {
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
    const item = ref(new PublicKey());
    const keypairDialog = ref(false);
    const { dialog, observer, onSubmit } = useSubmitDialog(
      props,
      context.emit,
      () => {
        context.emit('change-public-key');
      },
      (error) => {
        let errorMessage: string;
        if (error?.name === 'BadRequest') {
          const { message } = error;
          if (message != null && message.includes('RSA')) {
            errorMessage = 'RSA暗号の公開鍵ではありません';
          } else {
            errorMessage = '公開鍵の形式が正しくありません';
          }
        } else if (error.name != null) {
          errorMessage = error.name;
        } else {
          errorMessage = error.toString();
        }
        return { publicKey: [errorMessage] };
      },
    );
    return {
      item,
      dialog,
      observer,
      onSubmit,
      keypairDialog,
    };
  },
});
</script>
