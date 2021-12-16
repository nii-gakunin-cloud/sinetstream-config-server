<template>
  <div>
    <FeathersVuexFind
      service="user-parameters"
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
          <template #item.secret="{ item }">
            <v-icon v-if="item.secret">
              mdi-lock
            </v-icon>
          </template>
          <template #item.textContent="{ item }">
            <div v-if="!item.isBinary">
              <span v-if="item.secret">&bull;&bull;&bull;&bull;&bull;</span>
              <span v-else>{{ item.textContent }}</span>
            </div>
            <div v-else>
              (ファイル)
            </div>
          </template>
          <template #item.user.name="{ item }">
            <user-label
              v-if="item.user"
              :user="item.user"
              small
            />
          </template>
          <template
            v-if="!readonly"
            #item.actions="{ item }"
          >
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-update-user-parameter"
                  v-on="on"
                  @click.stop="updateDialogTarget=item.id"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>ユーザパラメータの更新</span>
            </v-tooltip>
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-delete-user-parameter"
                  v-on="on"
                  @click.stop="deleteDialogTarget=item.id"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>ユーザパラメータの削除</span>
            </v-tooltip>
          </template>
          <template #item.enabled="{ item }">
            <v-icon v-if="item.enabled">
              mdi-check
            </v-icon>
          </template>
        </v-data-table>
      </template>
    </FeathersVuexFind>
    <user-parameter-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
      @change-stream="$emit('change-stream', $event)"
    />
    <user-parameter-delete-dialog
      v-if="deleteDialog"
      :id="deleteDialogTarget"
      v-model="deleteDialog"
      @change-stream="$emit('change-stream', $event)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import UserLabel from '@/components/UserLabel.vue';
import UserParameterDeleteDialog from '@/components/UserParameterDeleteDialog.vue';
import UserParameterDialog from '@/components/UserParameterDialog.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    UserParameterDialog,
    UserParameterDeleteDialog,
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
        text: 'ユーザ名',
        value: 'user.name',
      },
      {
        text: '埋め込み先',
        value: 'target',
      },
      {
        text: '設定値',
        value: 'textContent',
      },
      {
        text: 'コメント',
        value: 'comment',
      },
      {
        text: '',
        value: 'actions',
        sortable: false,
        filterable: false,
        width: 120,
      },
    ]);
    return { headers, ...useModifyDialog() };
  },
});
</script>
