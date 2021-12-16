<template>
  <div>
    <v-list>
      <v-list-item
        to="/"
        data-cy="menu-home"
      >
        <v-list-item-title>ホーム</v-list-item-title>
      </v-list-item>
      <v-list-item
        to="/streams"
        data-cy="menu-configs"
      >
        <v-list-item-title>コンフィグ情報</v-list-item-title>
      </v-list-item>
    </v-list>
    <v-divider />
    <v-list>
      <v-list-item
        to="/user-profile"
        data-cy="menu-user-profile"
      >
        <v-list-item-title>プロフィール</v-list-item-title>
      </v-list-item>
      <v-list-item
        to="/public-keys"
        data-cy="menu-public-keys"
      >
        <v-list-item-title>ユーザ公開鍵</v-list-item-title>
      </v-list-item>
      <v-list-item
        to="/access-keys"
        data-cy="menu-access-keys"
      >
        <v-list-item-title>APIアクセスキー</v-list-item-title>
      </v-list-item>
    </v-list>
    <v-divider />
    <v-list>
      <v-list-item
        :href="manualPath"
        target="_blank"
        rel="noreferrer"
        data-cy="menu-manual"
      >
        <v-list-item-title>マニュアル</v-list-item-title>
      </v-list-item>
      <v-list-item @click="dialog=!dialog">
        <v-list-item-title>
          バージョン情報
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <v-divider />
    <v-list>
      <v-list-item
        to="/logout"
        data-cy="menu-logout"
      >
        <v-list-item-title>ログアウト</v-list-item-title>
      </v-list-item>
    </v-list>
    <about-dialog
      v-model="dialog"
      @hide-navigation="$emit('hide-navigation')"
    />
  </div>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import AboutDialog from '@/components/AboutDialog.vue';

export default defineComponent({
  components: {
    AboutDialog,
  },
  setup() {
    const manualPath = computed(() => (process.env.VUE_APP_MANUAL_URL ? process.env.VUE_APP_MANUAL_URL : '/manual/'));
    const dialog = ref(false);
    return {
      manualPath,
      dialog,
    };
  },
});
</script>
