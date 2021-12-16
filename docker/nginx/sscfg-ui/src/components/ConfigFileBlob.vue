<template>
  <div>
    <slot
      :url="url"
      :download="filename"
      :isEmpty="isEmpty"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';

export default defineComponent({
  props: {
    id: {
      type: Number,
      required: true,
    },
    filename: {
      type: String,
      default: 'sinetstream_config.yml',
    },
  },
  setup(props, context) {
    const { ConfigFile } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: ConfigFile, id: props.id });
    const cfg = computed(() => {
      const yml = item?.value?.yaml;
      if (yml == null) {
        return '';
      }
      return yml.trim();
    });
    const isEmpty = computed(() => cfg.value.length === 0);
    const url = computed(() => {
      if (isEmpty.value) {
        return null;
      }
      const blob = new Blob([cfg.value], { type: 'text/x-yaml' });
      const ret = URL.createObjectURL(blob);
      return ret;
    });
    onUnmounted(() => {
      if (url.value != null) {
        URL.revokeObjectURL(url.value);
      }
    });
    return { url, isEmpty };
  },
});
</script>
