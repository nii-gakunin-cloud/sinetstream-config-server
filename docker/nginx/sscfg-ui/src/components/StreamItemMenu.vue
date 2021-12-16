<template>
  <v-menu>
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        v-bind="attrs"
        data-cy="btn-menu"
        v-on="on"
      >
        <v-icon>
          mdi-dots-vertical
        </v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-subheader data-cy="menu-header">
        {{ item.name }}
      </v-subheader>
      <v-divider />

      <v-list-item
        :to="{ name: 'ShowStream', params: { id: item.id } }"
        data-cy="menu-detail"
      >
        <v-list-item-title>詳細情報</v-list-item-title>
      </v-list-item>

      <config-file-blob
        :id="item.id"
        v-slot="{ url, download, isEmpty }"
      >
        <v-list-item
          :href="url"
          :download="download"
          :disabled="isEmpty"
          data-cy="menu-download"
        >
          <v-list-item-title>設定ファイルのダウンロード</v-list-item-title>
        </v-list-item>
      </config-file-blob>

      <div v-if="item.admin">
        <v-divider />
        <v-list-item
          data-cy="menu-update-config"
          @click.stop="$emit('show-update-dialog', item.id)"
        >
          <v-list-item-title>コンフィグ情報の更新</v-list-item-title>
        </v-list-item>

        <v-list-item
          :to="{ name: 'EncryptKeyTable', params: { id: item.id } }"
          data-cy="menu-encrypt-keys"
        >
          <v-list-item-title>データ暗号鍵一覧</v-list-item-title>
        </v-list-item>

        <v-list-item
          :to="{ name: 'AttachFileTable', params: { id: item.id } }"
          data-cy="menu-attach-files"
        >
          <v-list-item-title>添付ファイル一覧</v-list-item-title>
        </v-list-item>

        <v-list-item
          :to="{ name: 'UserParameterTable', params: { id: item.id } }"
          data-cy="menu-user-parameters"
        >
          <v-list-item-title>ユーザパラメータ一覧</v-list-item-title>
        </v-list-item>

        <v-list-item
          :to="{ name: 'MemberTable', params: { id: item.id } }"
          data-cy="menu-members"
        >
          <v-list-item-title>共同利用者一覧</v-list-item-title>
        </v-list-item>

        <v-divider />
        <v-list-item
          data-cy="menu-delete-config"
          @click.stop="$emit('show-delete-dialog', item.id)"
        >
          <v-list-item-title class="menu-delete">
            コンフィグ情報の削除
          </v-list-item-title>
        </v-list-item>
      </div>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import ConfigFileBlob from '@/components/ConfigFileBlob.vue';

export default defineComponent({
  components: {
    ConfigFileBlob,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>

<style scoped>
.menu-delete {
  color: red !important;
}
</style>
