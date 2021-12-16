<template>
  <v-app-bar
    v-shortkey.once="['f1']"
    app
    @shortkey="$root.$emit('show-manual')"
  >
    <v-app-bar-nav-icon
      data-cy="nav-icon"
      @click.stop="$emit('nav-icon', $event)"
    />
    <v-toolbar-title data-cy="title">
      {{ title }}
    </v-toolbar-title>
    <v-spacer />
    <user-label
      v-if="!$vuetify.breakpoint.mobile"
      data-cy="label-user"
    />
    <template
      v-if="hasExtensionSlot()"
      #extension
    >
      <slot name="extension" />
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import UserLabel from '@/components/UserLabel.vue';

export default defineComponent({
  components: {
    UserLabel,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
  },
  setup(_, { slots }) {
    const hasExtensionSlot = () => !!slots.extension;
    return { hasExtensionSlot };
  },
});
</script>
