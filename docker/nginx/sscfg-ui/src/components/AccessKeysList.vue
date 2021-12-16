<template>
  <v-container>
    <FeathersVuexFind
      v-slot="{ items }"
      service="access-keys"
      :params="{ query: {} }"
    >
      <v-row v-if="items.length > 0">
        <v-col
          v-for="item in items"
          :key="item.id"
        >
          <access-key-card
            :item="item"
            class="ma-4 pa-4"
          />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col class="ma-4 pa-4">
          データはありません。
        </v-col>
      </v-row>
    </FeathersVuexFind>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import AccessKeyCard from '@/components/AccessKeyCard.vue';

export default defineComponent({
  name: 'AccessKeysList',
  components: {
    AccessKeyCard,
  },
  setup() {
    return {};
  },
});
</script>
