<template>
  <div v-if="!readonly">
    <validation-provider
      v-slot="{ errors }"
      rules="required|max:255|valid-char|prefix-check|unique-name"
      name="名前"
      vid="name"
    >
      <v-text-field
        v-model="name"
        hint="英数字, '-', '_', '.' からなる文字を入力してください。"
        :counter="255"
        :error-messages="errors"
        v-bind="$attrs"
      />
    </validation-provider>
  </div>
  <div v-else>
    <v-text-field
      v-model="name"
      readonly
      filled
      hint="名前を変更することはできません。"
      persistent-hint
      v-bind="$attrs"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { extend, ValidationProvider } from 'vee-validate';

export default defineComponent({
  components: {
    ValidationProvider,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { StreamName } = context.root.$FeathersVuex.api;
    const name = computed({
      get: () => props.value ?? '',
      set: (value: string) => {
        context.emit('input', value);
      },
    });

    extend('valid-char', (v) => {
      if (/^[-.\w]+$/.test(v)) {
        return true;
      }
      return '{_field_}には英数字または"_", "-", "."からなる文字列を指定してください。';
    });
    extend('prefix-check', (v) => {
      if (/^[A-Za-z]/.test(v)) {
        return true;
      }
      return '{_field_}の先頭文字は英字にする必要があります。';
    });
    extend('unique-name', async (v) => {
      const result = await StreamName.find({ query: { name: v } });
      if (result.total === 0) {
        return true;
      }
      return '既に登録されている他の{_field_}と重複しています。';
    });

    return { name };
  },
});
</script>
