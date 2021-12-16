<template>
  <validation-observer
    ref="observer"
    v-slot="{ invalid, reset }"
  >
    <v-form @submit.prevent="onSubmit()">
      <validation-provider
        v-slot="{ errors }"
        rules="required"
        name="ユーザ名"
        vid="name"
      >
        <v-text-field
          v-model="name"
          label="ユーザ名"
          :error-messages="errors"
          data-cy="input-user"
          @input="reset"
        />
      </validation-provider>
      <validation-provider
        v-slot="{ errors }"
        rules="required"
        name="パスワード"
        vid="password"
      >
        <v-text-field
          v-model="password"
          label="パスワード"
          type="password"
          :error-messages="errors"
          data-cy="input-password"
          @input="reset"
        />
      </validation-provider>

      <v-alert
        v-if="alert.length > 0"
        outlined
        dense
        type="error"
      >
        {{ alert }}
      </v-alert>

      <v-btn
        type="submit"
        :disabled="invalid"
        data-cy="btn-submit"
      >
        Login
      </v-btn>
    </v-form>
  </validation-observer>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from '@vue/composition-api';
import { ValidationObserver, ValidationProvider } from 'vee-validate';

export default defineComponent({
  components: {
    ValidationProvider,
    ValidationObserver,
  },
  setup(_, context) {
    const { $store, $router, $route } = context.root;
    const name = ref('');
    const password = ref('');
    const alert = ref('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const observer: Ref<any> = ref(null);
    const login = async () => $store.dispatch(
      'auth/authenticate', {
        strategy: 'local',
        name: name.value,
        password: password.value,
      },
    );
    const nextRoute = () => {
      const { redirect } = $route.query;
      if (typeof redirect === 'string') {
        $router.push({ path: redirect });
      } else {
        $router.back();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (error: any) => {
      if (error.code === 401) {
        const msg = 'ユーザまたはパスワードが正しくありません。';
        observer.value.setErrors({ name: [msg], password: [msg] });
      } else {
        console.log(error);
        alert.value = `サーバでエラーが発生しました。(${error.toString()})`;
      }
    };
    const onSubmit = async () => {
      try {
        await observer.value.validate();
        await login();
        nextRoute();
      } catch (e) {
        onError(e);
      }
    };
    return {
      name,
      password,
      observer,
      onSubmit,
      alert,
    };
  },
});
</script>
