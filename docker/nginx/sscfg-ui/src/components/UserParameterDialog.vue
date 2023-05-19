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
          <v-container :fluid="true">
            <v-row dense>
              <v-col cols="12">
                <validation-provider
                  v-slot="{ errors }"
                  rules="required"
                  name="ユーザ名"
                  vid="uid"
                >
                  <v-select
                    v-model="clone.user_id"
                    :items="members"
                    item-text="user.name"
                    item-value="user_id"
                    label="ユーザ名"
                    :readonly="update"
                    :filled="update"
                    :error-messages="errors"
                    :hint="userHint"
                    :persistent-hint="update"
                    data-cy="input-user"
                  />
                </validation-provider>
              </v-col>
            </v-row>
            <v-row
              v-if="!update"
              dense
            >
              <v-col
                cols="12"
                sm="6"
              >
                <validation-provider
                  v-slot="{ errors }"
                  :rules="update || clone.isBinary ? '' : 'required'"
                  name="設定値"
                  vid="textContent"
                >
                  <v-text-field
                    v-model="clone.textContent"
                    label="設定値"
                    hint="ブローカ接続のためのユーザ名やパスワードは、この欄に直接入力してください。"
                    :disabled="clone.isBinary"
                    :error-messages="errors"
                    v-bind="contentAttrs(clone.secret)"
                    data-cy="input-value"
                    @click:append="showContent = !showContent"
                  />
                </validation-provider>
              </v-col>
              <v-spacer />
              <v-col
                cols="12"
                sm="5"
              >
                <validation-provider
                  v-slot="{ errors }"
                  :rules="update || !clone.isBinary ? '' : 'required'"
                  name="設定値のファイル"
                  immediate
                  vid="content"
                >
                  <v-file-input
                    v-model="clone.content"
                    label="設定値のファイル"
                    hint="クライアント証明書などのファイルを指定してください。"
                    :disabled="!clone.isBinary"
                    :error-messages="errors"
                    data-cy="input-file"
                  />
                </validation-provider>
              </v-col>
            </v-row>
            <v-row
              v-else
              dense
            >
              <v-col
                v-if="!clone.isBinary"
                cols="12"
              >
                <v-text-field
                  v-model="clone.textContent"
                  label="設定値"
                  :hint="updateTextContentHint"
                  :persistent-hint="item.textContent == null"
                  v-bind="contentAttrs(clone.secret)"
                  data-cy="input-value"
                  @click:append="showContent = !showContent"
                />
              </v-col>
              <v-col
                v-else
                cols="12"
              >
                <v-file-input
                  v-model="clone.content"
                  label="設定値のファイル"
                  hint="ファイルの内容を変更する場合に限りこの欄にファイルを指定してください。変更しない場合は空欄のままにしてください。"
                  persistent-hint
                  data-cy="input-file"
                />
              </v-col>
            </v-row>
            <v-row
              v-if="!update"
              dense
            >
              <v-col cols="12">
                <validation-provider vid="isBinary">
                  <v-switch
                    v-model="clone.isBinary"
                    label="設定値をファイルとしてアップロードする"
                    hint="クライアント証明書などのファイルをアップロードする場合はこのスイッチをオンにしてください。"
                    persistent-hint
                    data-cy="input-binary"
                  />
                </validation-provider>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12">
                <v-checkbox
                  v-model="clone.secret"
                  label="秘匿情報"
                  data-cy="input-secret"
                  @change="showContent = !clone.secret"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12">
                <validation-provider
                  v-slot="{ errors }"
                  rules="required|target-pattern"
                  name="埋め込み先"
                  vid="target"
                >
                  <v-text-field
                    v-model="clone.target"
                    label="埋め込み先"
                    hint="設定ファイルに埋め込む場所を指定してください"
                    placeholder="設定例「*.sasl_plain_password」"
                    :error-messages="errors"
                    data-cy="input-target"
                  />
                </validation-provider>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12">
                <v-textarea
                  v-model="clone.comment"
                  rows="2"
                  label="コメント"
                  data-cy="input-comment"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12">
                <v-checkbox
                  v-model="clone.enabled"
                  label="設定ファイルの適用対象"
                  data-cy="input-enabled"
                />
              </v-col>
            </v-row>
          </v-container>
        </template>
      </simple-dialog>
    </validation-observer>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useFind, useGet } from 'feathers-vuex';
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
    const { UserParameter, Member } = context.root.$FeathersVuex.api;
    const newUserParameter = (sid: number) => {
      const item = new UserParameter();
      item.stream_id = sid;
      return item;
    };
    const { item } = props.id != null
      ? useGet({ model: UserParameter, id: props.id })
      : { item: ref(newUserParameter(props.sid)) };
    const { items: members } = useFind({
      model: Member,
      params: { query: { stream_id: item.value.stream_id } },
    });
    const { dialog, observer, onSubmit } = useSubmitDialog(props, context.emit);
    const update = computed(() => props.id != null);
    const submit = computed(() => (update.value ? '更新' : '登録'));
    const title = computed(() => `ユーザパラメータの${submit.value}`);
    const userHint = computed(() => (update.value ? '変更することはできません' : '対象となるユーザを選択してください。'));
    const showContent = ref(false);
    const contentAttrs = (secret: boolean) => {
      if (!secret) {
        return {};
      }
      return showContent.value
        ? { type: 'text', 'append-icon': 'mdi-eye' }
        : { type: 'password', 'append-icon': 'mdi-eye-off' };
    };
    const updateTextContentHint = computed(() => (
      item.textContent == null
        ? '設定値を変更する場合に限りこの欄に値を入力してください。変更しない場合は空欄のままにしてください。'
        : ''));
    extend('target-pattern', targetPattern('*.sasl_plain_password', 'service-kafka-001.sasl_plain_password'));
    const manual = computed(() => JSON.stringify({
      path: update.value ? 'docs/screen-421' : 'docs/screen-411',
      priority: 2,
    }));
    return {
      item,
      dialog,
      observer,
      onSubmit,
      showContent,
      update,
      submit,
      title,
      members,
      userHint,
      contentAttrs,
      updateTextContentHint,
      manual,
    };
  },
});
</script>
