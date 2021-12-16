<template>
  <div
    class="stream-view"
    data-manual="docs/screen-141"
  >
    <stream-info
      v-if="item"
      :item="item"
    />
    <v-btn
      v-if="!$vuetify.breakpoint.mobile"
      class="ma-4"
      data-cy="btn-back"
      @click="$router.go(-1)"
    >
      戻る
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import StreamInfo from '@/components/StreamInfo.vue';

export default defineComponent({
  name: 'ShowStreamView',
  components: {
    StreamInfo,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  setup(props, context) {
    const { Stream } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: Stream, id: props.id });
    const updateTitle = () => {
      context.emit('change-title', `コンフィグ情報: ${item.value?.name}`);
    };
    watch(item, () => updateTitle());
    onMounted(() => updateTitle());
    return { item };
  },
});
</script>
