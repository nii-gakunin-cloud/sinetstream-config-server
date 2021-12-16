<template>
  <v-container data-manual="docs/screen-001">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <streams-summary-card />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <public-key-summary-card />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <access-key-summary-card />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import AccessKeySummaryCard from '@/components/AccessKeySummaryCard.vue';
import PublicKeySummaryCard from '@/components/PublicKeySummaryCard.vue';
import StreamsSummaryCard from '@/components/StreamsSummaryCard.vue';

export default defineComponent({
  components: {
    StreamsSummaryCard,
    PublicKeySummaryCard,
    AccessKeySummaryCard,
  },
  setup() {
    return {};
  },
});
</script>
