<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      temporary
      app
    >
      <main-menu @hide-navigation="drawer=false" />
    </v-navigation-drawer>
    <router-view
      name="bar"
      :title="title"
      @nav-icon="drawer = !drawer"
      @change-search-text="search = $event"
      @show-dialog="dialog = true"
    />
    <v-main>
      <router-view
        :search="search"
        :create-dialog="dialog"
        @change-title="title = $event"
        @change-dialog="dialog = $event"
      />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import MainMenu from '@/components/MainMenu.vue';
import useManual from '@/utils/manual';

export default defineComponent({
  components: {
    MainMenu,
  },
  setup(_, context) {
    const drawer = ref(false);
    const title = ref('SINETStream コンフィグサーバ');
    const search = ref('');
    const dialog = ref(false);
    const { showManual } = useManual();
    context.root.$on('show-manual', showManual);
    return {
      drawer,
      title,
      search,
      dialog,
    };
  },
});
</script>
