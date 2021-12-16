<template>
  <FeathersVuexFormWrapper
    v-slot="{clone, save }"
    :item="item"
  >
    <validation-observer
      ref="observer"
      v-slot="{ invalid }"
    >
      <simple-dialog
        v-model="dialog"
        title="パスワードの変更"
        color="primary"
        submit="更新"
        :invalid="invalid"
        data-manual="2,docs/screen-811"
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
            name="現在のパスワード"
            vid="currentPassword"
          >
            <v-text-field
              v-model="clone.currentPassword"
              autocomplete="off"
              label="現在のパスワード"
              :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showCurrentPassword ? 'text' : 'password'"
              :error-messages="errors"
              @click:append="showCurrentPassword = !showCurrentPassword"
            />
          </validation-provider>
          <validation-provider
            v-slot="{ errors }"
            rules="required"
            name="パスワード"
            vid="password"
          >
            <v-text-field
              v-model="clone.password"
              autocomplete="off"
              label="新しいパスワード"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              :error-messages="errors"
              @click:append="showPassword = !showPassword"
            />
          </validation-provider>
          <validation-provider
            v-slot="{ errors }"
            rules="required|confirm-password:@password"
            name="パスワード確認"
            vid="confirmPassword"
          >
            <v-text-field
              v-model="confirmPassword"
              autocomplete="off"
              label="新しいパスワード:確認"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              :error-messages="errors"
              @click:append="showPassword = !showPassword"
            />
          </validation-provider>
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
import { useSubmitDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const showPassword = ref(false);
    const showCurrentPassword = ref(false);
    const confirmPassword = ref('');
    const { $store } = context.root;
    const uid = computed(() => $store.state.auth.user.id);
    const { User } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: User, id: uid.value, local: true });
    const { dialog, observer, onSubmit } = useSubmitDialog(
      props, context.emit, undefined,
      (e) => {
        console.log(e);
        const message = e.code === 400
          ? 'パスワードが正しくありません。' : 'パスワード変更処理でエラーが発生しました。';
        return { currentPassword: [message] };
      },
    );
    extend('confirm-password', {
      params: ['password'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validate: (v, params: any) => v === params.password,
      message: '確認欄のパスワードが一致しません',
    });

    return {
      item,
      dialog,
      observer,
      onSubmit,
      showPassword,
      showCurrentPassword,
      confirmPassword,
    };
  },
});
</script>
