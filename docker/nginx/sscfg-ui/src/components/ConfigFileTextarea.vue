<template>
  <div>
    <validation-provider
      v-slot="{ errors, validate: topicValidate }"
      rules="unique-topic:@alert"
      name="設定ファイル"
      mode="passive"
      vid="configFile"
    >
      <file-input-textarea
        v-model="text"
        label="SINETStream 設定ファイル"
        hint="クリップのアイコンをクリックして既存の設定ファイルを選択するか、入力枠に直接設定ファイルの記述内容を入力してください。"
        :rows="!$vuetify.breakpoint.mobile ? '6' : '12'"
        class="config-file-textarea"
        data-cy="input-config-file"
        :error-messages="errors"
        @change-topics="changeTopics(topicValidate, $event)"
      />
    </validation-provider>
    <validation-provider
      name="警告表示"
      vid="alert"
    >
      <v-alert
        v-model="showWarnings"
        type="warning"
        dismissible
        outlined
        prominent
        data-cy="warning-topic-duplication"
      >
        <div>トピック名が他のコンフィグ情報と重複しています（{{ topicWarnings }}）。</div>
        <br>
        <div>重複したトピック名を登録するには右の閉じるアイコンをクリックしてこの警告表示を消してください。</div>
      </v-alert>
    </validation-provider>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { extend, ValidationProvider } from 'vee-validate';
import FileInputTextarea from '@/components/FileInputTextarea.vue';
import extractTopics from '@/utils/topic';

export default defineComponent({
  components: {
    FileInputTextarea,
    ValidationProvider,
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
    value: {
      type: String,
      default: '',
    },
  },
  setup(props, context) {
    const text = computed({
      get: () => props.value ?? '',
      set: (value: string) => {
        context.emit('input', value);
      },
    });
    const { Topic } = context.root.$FeathersVuex.api;
    const topicWarnings = ref('');
    const ignoreDupTopics = ref(false);
    const updatedWarnings = ref(Date.now());
    const showWarnings = computed({
      get: () => topicWarnings.value.trim().length > 0 && !ignoreDupTopics.value,
      set: (value: boolean) => {
        ignoreDupTopics.value = !value;
        updatedWarnings.value = Date.now();
        context.emit('validation-required');
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeTopics = (validate: (e: any) => Promise<boolean>, ev: any) => {
      ignoreDupTopics.value = false;
      topicWarnings.value = '';
      updatedWarnings.value = Date.now();
      validate(ev);
    };

    const filterDuplicateTopics = async (topics: string[]) => {
      const topicQuery = props.id != null ? { stream_id: { $ne: props.id } } : {};
      return (await Promise.all(
        topics.map(async (topic: string) => {
          const result = await Topic.find({
            query: {
              ...topicQuery,
              name: topic,
              $limit: 0,
            },
          });
          if (result.total === 0) {
            return null;
          }
          return topic;
        }),
      ) as (string | null)[])
        .filter((x) => x != null);
    };

    extend('unique-topic', {
      params: ['alert'],
      validate: async (arg) => {
        const topics = arg instanceof Array ? arg : extractTopics(arg);
        const now = Date.now();
        if (ignoreDupTopics.value) {
          updatedWarnings.value = now;
          return true;
        }
        const duplicateTopics = await filterDuplicateTopics(topics);
        if (duplicateTopics.length === 0) {
          topicWarnings.value = '';
          return true;
        }
        if (updatedWarnings.value >= now) {
          return true;
        }
        topicWarnings.value = duplicateTopics.join(', ');
        updatedWarnings.value = now;
        ignoreDupTopics.value = false;
        return '';
      },
    });

    return {
      text,
      topicWarnings,
      showWarnings,
      changeTopics,
    };
  },
});
</script>

<style>
.config-file-textarea textarea {
  font-family: monospace;
}
</style>
