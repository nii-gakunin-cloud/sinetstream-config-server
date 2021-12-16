<template>
  <div class="d-flex align-start">
    <v-file-input
      hide-input
      hide-details
      style="max-width: 32px;"
      @change="updateFile"
    />
    <v-textarea
      v-bind="$attrs"
      :value="value"
      @input="updateValue"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from '@vue/composition-api';
import extractTopics from '@/utils/topic';

export default defineComponent({
  name: 'FileInputTextarea',
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const topics = computed(() => extractTopics(props.value));
    watch(topics, (newValue, oldValue) => {
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        emit('change-topics', newValue);
      }
    });
    const updateFile = async (f: File) => {
      const txt = await f.text();
      emit('input', txt);
    };
    const updateValue = (txt: string) => {
      emit('input', txt);
    };
    return {
      updateFile,
      updateValue,
    };
  },
});
</script>
