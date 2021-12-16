<template>
  <div>
    <FeathersVuexFind
      service="attach-files"
      :params="{ query: { stream_id: id } }"
    >
      <template #default="{ items }">
        <v-data-table
          :headers="headers"
          :items="items"
          :search="search"
          item-key="id"
          :options="{ sortBy: ['createdAt'], sortDesc: [true] }"
        >
          <template
            v-if="!readonly"
            #item.actions="{ item }"
          >
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-update-attach-file"
                  v-on="on"
                  @click.stop="updateDialogTarget=item.id"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>添付ファイルの更新</span>
            </v-tooltip>
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-delete-attach-file"
                  v-on="on"
                  @click.stop="deleteDialogTarget=item.id"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>添付ファイルの削除</span>
            </v-tooltip>
          </template>
          <template #item.secret="{ item }">
            <v-icon v-if="item.secret">
              mdi-lock
            </v-icon>
          </template>
          <template #item.enabled="{ item }">
            <v-icon v-if="item.enabled">
              mdi-check
            </v-icon>
          </template>
          <template #item.user.name="{ item }">
            <user-label
              v-if="item.user"
              :user="item.user"
              small
            />
          </template>
          <template #item.updatedAt="{ item }">
            <date-time-label
              compact
              :value="item.updatedAt"
            />
          </template>
        </v-data-table>
      </template>
    </FeathersVuexFind>
    <attach-file-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
      @change-stream="$emit('change-stream', $event)"
    />
    <attach-file-delete-dialog
      v-if="deleteDialog"
      :id="deleteDialogTarget"
      v-model="deleteDialog"
      @change-stream="$emit('change-stream', $event)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import AttachFileDeleteDialog from '@/components/AttachFileDeleteDialog.vue';
import AttachFileDialog from '@/components/AttachFileDialog.vue';
import DateTimeLabel from '@/components/DateTimeLabel.vue';
import UserLabel from '@/components/UserLabel.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    AttachFileDialog,
    AttachFileDeleteDialog,
    DateTimeLabel,
    UserLabel,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
    search: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const headers = computed(() => [
      {
        text: '有効',
        value: 'enabled',
        filterable: false,
      },
      {
        text: '秘匿情報',
        value: 'secret',
        filterable: false,
      },
      {
        text: '埋め込み先',
        value: 'target',
      },
      {
        text: 'コメント',
        value: 'comment',
      },
      {
        text: '更新日時',
        value: 'updatedAt',
        filterable: false,
      },
      {
        text: '更新ユーザ',
        value: 'user.name',
      },
      {
        text: '',
        value: 'actions',
        sortable: false,
        filterable: false,
      },
    ]);
    return { headers, ...useModifyDialog() };
  },
});
</script>
