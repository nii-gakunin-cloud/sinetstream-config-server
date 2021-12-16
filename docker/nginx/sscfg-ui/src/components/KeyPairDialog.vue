<template>
  <v-dialog
    v-model="dialog"
    max-width="400"
    :persistent="!closable"
  >
    <v-card>
      <v-toolbar color="info">
        <v-card-title>キーペアの生成</v-card-title>
      </v-toolbar>
      <v-card-text
        v-if="keysize === 0"
        class="py-2"
      >
        「実行」を選択するとキーペアの生成を開始します。
      </v-card-text>
      <v-card-text
        v-else-if="running"
        class="py-4"
      >
        <v-progress-circular indeterminate />
        生成処理中
      </v-card-text>
      <v-card-text
        v-else
        class="py-2"
      >
        <div class="mb-4">
          キーペアを生成しました。
        </div>
        <div>
          ダウンロードボタンを選択することで、生成した秘密鍵を取得することができます。またペアとなる公開鍵は、ユーザ公開鍵登録ダイアログのフォームに入力されています。
        </div>
        <div class="font-weight-black mt-4">
          注意: このダイアログを閉じると秘密鍵の情報は失われます。
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="keysize === 0"
          color="primary"
          data-cy="btn-keypair-exec"
          @click="generate"
        >
          実行
        </v-btn>
        <v-btn
          v-else-if="!running"
          :href="privkeyUrl"
          download="private_key.pem"
          data-cy="btn-keypair-download"
          @click="downloaded=true"
        >
          <v-icon
            v-if="!downloaded"
            class="mr-2"
          >
            mdi-download
          </v-icon>
          <v-icon
            v-else
            class="mr-2"
          >
            mdi-check
          </v-icon>
          秘密鍵のダウンロード
        </v-btn>
        <v-spacer />
        <v-btn
          text
          right
          :disabled="!closable"
          data-cy="btn-keypair-close"
          @click="dialog = false"
        >
          閉じる
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, onUnmounted, Ref, ref,
} from '@vue/composition-api';
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!../workers/keypair.worker';
import { useDialog } from '@/utils/dialog';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
    },
  },
  setup(props, context) {
    const { emit } = context;
    const { dialog } = useDialog(props, emit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keypair: Ref<Record<string, any>> = ref({});
    let worker: Worker;
    const keysize = ref(0);
    const running = computed(
      () => keysize && !('private' in keypair.value),
    );
    const generate = () => {
      const size = 3072;
      worker.postMessage(size);
      keysize.value = size;
    };
    const downloaded = ref(false);
    const closable = computed(
      () => keysize.value === 0 || running.value || downloaded.value,
    );
    const privkeyUrl = computed(() => {
      if (keysize.value === 0 && running.value) {
        return null;
      }
      const blob = new Blob([keypair.value.private], { type: 'application/x-pem-file' });
      return URL.createObjectURL(blob);
    });

    onMounted(() => {
      worker = new Worker();
      worker.onmessage = (event) => {
        keypair.value = event.data;
        emit('generate-keypair', keypair.value.public);
      };
    });
    onUnmounted(() => {
      worker.terminate();
      if (privkeyUrl.value != null) {
        URL.revokeObjectURL(privkeyUrl.value);
      }
    });

    return {
      dialog,
      keypair,
      running,
      generate,
      keysize,
      closable,
      downloaded,
      privkeyUrl,
    };
  },
});
</script>
