<template>
  <simple-app-bar
    :title="title"
    @nav-icon="$emit('nav-icon', $event)"
  >
    <template #extension>
      <v-text-field
        v-if="!hideSearch"
        prepend-inner-icon="mdi-magnify"
        clearable
        data-cy="search"
        @input="$emit('change-search-text', $event)"
      />
      <v-spacer />
      <v-tooltip left>
        <template #activator="{attrs, on}">
          <v-btn
            color="primary"
            fab
            small
            absolute
            bottom
            right
            data-cy="btn-create"
            v-bind="attrs"
            v-on="on"
            @click.stop="$emit('show-dialog')"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
        <span>{{ tooltip }}</span>
      </v-tooltip>
    </template>
  </simple-app-bar>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import SimpleAppBar from '@/components/SimpleAppBar.vue';

export default defineComponent({
  components: {
    SimpleAppBar,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    tooltip: {
      type: String,
      default: '登録',
    },
    hideSearch: {
      type: Boolean,
      default: false,
    },
  },
  setup(_, { slots }) {
    const hasExtensionSlot = () => !!slots.extension;
    return { hasExtensionSlot };
  },
});
</script>
