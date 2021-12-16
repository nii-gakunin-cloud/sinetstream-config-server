<template>
  <div>
    <v-text-field
      :value="item.name"
      label="名前"
      readonly
      filled
      class="mr-9"
      data-cy="stream-name"
    />
    <v-textarea
      :value="item.comment"
      label="コメント"
      rows="1"
      readonly
      filled
      :hint="hint"
      class="mr-9"
      data-cy="stream-comment"
    />
    <v-switch
      v-if="showSwitch"
      v-model="embedFlag"
      label="埋め込み結果を表示する"
      data-cy="switch-embedded-flag"
    />
    <config-file-blob
      :id="item.id"
      v-slot="{ url, download, isEmpty }"
    >
      <div class="d-flex align-start">
        <v-textarea
          v-model="configFile"
          label="設定ファイル"
          :rows="rows"
          readonly
          filled
          class="config-file-textarea"
          :hint="hint"
          data-cy="stream-config-file"
        />
        <v-tooltip left>
          <template #activator="{attrs, on}">
            <v-btn
              :href="url"
              :download="download"
              :disabled="isEmpty"
              icon
              style="max-width: 32px;"
              v-bind="attrs"
              data-cy="btn-download"
              v-on="on"
            >
              <v-icon>mdi-download</v-icon>
            </v-btn>
          </template>
          <span>設定ファイルのダウンロード</span>
        </v-tooltip>
      </div>
    </config-file-blob>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import ConfigFileBlob from '@/components/ConfigFileBlob.vue';

export default defineComponent({
  components: {
    ConfigFileBlob,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    hint: {
      type: String,
      default: '',
    },
    rows: {
      type: Number,
      default: 5,
    },
    showSwitch: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, context) {
    const { ConfigFile } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: ConfigFile, id: props.item.id });
    const embedFlag = ref(true);
    const configFile = computed(() => (embedFlag.value ? item.value?.yaml : props.item.configFile));
    return {
      configFile,
      embedFlag,
    };
  },
});
</script>

<style>
.config-file-textarea textarea {
  font-family: monospace;
}
</style>
