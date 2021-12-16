<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      :search="search"
      :options="{ sortBy: ['createdAt'], sortDesc: [true] }"
    >
      <template #item.admin="{ item }">
        <v-icon
          v-if="item.admin"
          data-cy="icon-admin"
        >
          mdi-check
        </v-icon>
      </template>
      <template #item.name="{ item }">
        <v-btn
          text
          :to="{ name: 'ShowStream', params: { id: item.id } }"
          style="text-transform: none"
          link
          color="primary"
          data-cy="lnk-config-detail"
        >
          {{ item.name }}
        </v-btn>
      </template>
      <template #item.icons="{ item }">
        <v-tooltip left>
          <template #activator="{attrs, on}">
            <config-file-blob
              :id="item.id"
              v-slot="{ url, download, isEmpty }"
            >
              <v-btn
                icon
                :href="url"
                :download="download"
                :disabled="isEmpty"
                data-cy="btn-download"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>
            </config-file-blob>
          </template>
          <span>設定ファイルのダウンロード</span>
        </v-tooltip>
      </template>
      <template #item.menu="{ item }">
        <stream-item-menu
          :item="item"
          @show-update-dialog="updateDialogTarget = $event"
          @show-delete-dialog="deleteDialogTarget = $event"
        />
      </template>
    </v-data-table>
    <stream-basic-info-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
      @change-stream="refreshConfigFile"
    />
    <stream-delete-dialog
      v-if="deleteDialog"
      :id="deleteDialogTarget"
      v-model="deleteDialog"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import ConfigFileBlob from '@/components/ConfigFileBlob.vue';
import StreamBasicInfoDialog from '@/components/StreamBasicInfoDialog.vue';
import StreamDeleteDialog from '@/components/StreamDeleteDialog.vue';
import StreamItemMenu from '@/components/StreamItemMenu.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  name: 'StreamsTable',
  components: {
    ConfigFileBlob,
    StreamBasicInfoDialog,
    StreamDeleteDialog,
    StreamItemMenu,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    search: {
      type: String,
      default: '',
    },
  },
  setup(_, context) {
    const headers = computed(() => [
      {
        text: '名前',
        value: 'name',
      },
      {
        text: 'コメント',
        value: 'comment',
      },
      {
        text: '管理者',
        value: 'admin',
        filterable: false,
      },
      {
        text: '',
        value: 'icons',
        sortable: false,
        filterable: false,
      },
      {
        text: '',
        value: 'menu',
        sortable: false,
        filterable: false,
      },
    ]);

    const { ConfigFile } = context.root.$FeathersVuex.api;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshConfigFile = (id: any) => useGet({ model: ConfigFile, id });

    return {
      headers,
      refreshConfigFile,
      ...useModifyDialog(),
    };
  },
});
</script>
