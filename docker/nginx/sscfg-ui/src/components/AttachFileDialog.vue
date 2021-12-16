<template>
  <FeathersVuexFormWrapper
    v-slot="{clone, save}"
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
        :data-manual="manual"
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
              :rules="update ? '' : 'required'"
              name="添付ファイル"
            >
              <v-file-input
                v-model="clone.content"
                label="添付ファイル"
                :error-messages="errors"
                data-cy="input-file"
                :hint="contentHint"
                :persistent-hint="update"
              />
            </validation-provider>
            <v-checkbox
              v-model="clone.secret"
              label="秘匿情報"
              data-cy="input-secret"
            />
            <validation-provider
              v-slot="{ errors }"
              rules="required|target-pattern"
              name="埋め込み先"
            >
              <v-text-field
                v-model="clone.target"
                label="埋め込み先"
                hint="設定ファイルに埋め込む場所を指定してください"
                placeholder="CA証明書を埋め込む場合は「*.tls.ca_certs」を指定してください"
                :error-messages="errors"
                data-cy="input-target"
              />
            </validation-provider>
            <v-textarea
              v-model="clone.comment"
              rows="2"
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
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import { extend, ValidationObserver, ValidationProvider } from 'vee-validate';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { targetPattern } from '@/utils/validate';
import { useSubmitDialog } from '@/utils/stream';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
    sid: {
      type: Number,
      default: null,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { AttachFile } = context.root.$FeathersVuex.api;
    const { item } = props.id != null
      ? useGet({ model: AttachFile, id: props.id })
      : { item: ref(new AttachFile()) };
    if (props.id == null && props.sid != null) {
      item.value.stream_id = props.sid;
    }
    const { dialog, observer, onSubmit } = useSubmitDialog(props, context.emit);
    const update = computed(() => props.id != null);
    const submit = computed(() => (update.value ? '更新' : '登録'));
    const title = computed(() => `添付ファイルの${submit.value}`);
    const contentHint = computed(() => (
      update.value
        ? '添付ファイルを変更する場合に限りこの欄にファイルを指定してください。ファイルの内容を変更しない場合は空欄のままにしてください。'
        : ''));
    extend('target-pattern', targetPattern('*.tls.ca_certs', 'service-kafka-001.tls.ca_certs'));
    const manual = computed(() => JSON.stringify({
      path: update.value ? 'docs/screen-321' : 'docs/screen-311',
      priority: 2,
    }));
    return {
      item,
      dialog,
      observer,
      onSubmit,
      update,
      submit,
      title,
      contentHint,
      manual,
    };
  },
});
</script>
