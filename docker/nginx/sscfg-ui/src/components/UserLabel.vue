<template>
  <div v-if="target">
    <template v-if="!small || $vuetify.breakpoint.mdAndUp">
      <v-tooltip
        v-if="target.displayName"
        left
      >
        <template #activator="{ on }">
          <v-avatar
            v-if="target.avatar"
            :size="small ? 24 : 36"
            class="mr-2"
            v-on="on"
          >
            <v-img :src="target.avatar" />
          </v-avatar>
        </template>
        <span>{{ target.displayName }}</span>
      </v-tooltip>
      <template v-else>
        <v-avatar
          v-if="target.avatar"
          :size="small ? 24 : 36"
          class="mr-2"
        >
          <v-img :src="target.avatar" />
        </v-avatar>
      </template>
    </template>
    <span>{{ target.name }}</span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    user: {
      type: Object,
      default: null,
    },
    small: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { $store } = context.root;
    const target = computed(() => (props.user != null ? props.user : $store.state.auth.user));
    return {
      target,
    };
  },
});
</script>
