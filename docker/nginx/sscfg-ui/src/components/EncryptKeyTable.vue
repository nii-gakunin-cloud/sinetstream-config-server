<template>
  <div>
    <FeathersVuexFind
      v-slot="{ items }"
      service="encrypt-keys"
      :params="{ query: { stream_id: id } }"
      :value="true"
    >
      <v-data-table
        :headers="headers"
        :items="items"
        :search="search"
        item-key="id"
        :options="{ sortBy: ['latest', 'target', 'version'], sortDesc: [true, false, true] }"
      >
        <template #item.actions="{ item }">
          <div v-if="item.latest && !readonly">
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-key-info-edit"
                  v-on="on"
                  @click.stop="updateParamsDialogTarget=item.id"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>データ暗号鍵情報の更新</span>
            </v-tooltip>

            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-key-update"
                  v-on="on"
                  @click.stop="updateDialogTarget=item.id"
                >
                  <v-icon>
                    mdi-key-plus
                  </v-icon>
                </v-btn>
              </template>
              <span>データ暗号鍵の更新</span>
            </v-tooltip>
          </div>
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
        <template #item.createdAt="{ item }">
          <date-time-label
            compact
            :value="item.createdAt"
          />
        </template>
      </v-data-table>
    </FeathersVuexFind>
    <encrypt-key-update-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
      @change-stream="$emit('change-stream', $event)"
      @change-encrypt-keys="refreshEncryptKeys"
    />
    <encrypt-key-update-params-dialog
      v-if="updateParamsDialog"
      :id="updateParamsDialogTarget"
      v-model="updateParamsDialog"
      @change-stream="$emit('change-stream', $event)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import DateTimeLabel from '@/components/DateTimeLabel.vue';
import EncryptKeyUpdateDialog from '@/components/EncryptKeyUpdateDialog.vue';
import EncryptKeyUpdateParamsDialog from '@/components/EncryptKeyUpdateParamsDialog.vue';
import UserLabel from '@/components/UserLabel.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    DateTimeLabel,
    EncryptKeyUpdateParamsDialog,
    EncryptKeyUpdateDialog,
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
  setup(props, context) {
    const headers = computed(() => [
      {
        text: '有効',
        value: 'enabled',
        filterable: false,
      },
      {
        text: '埋め込み先',
        value: 'target',
      },
      {
        text: 'バージョン',
        value: 'version',
      },
      {
        text: 'サイズ',
        value: 'size',
      },
      {
        text: 'コメント',
        value: 'comment',
      },
      {
        text: '登録日時',
        value: 'createdAt',
        filterable: false,
      },
      {
        text: '登録ユーザ',
        value: 'user.name',
      },
      {
        text: '',
        value: 'actions',
        filterable: false,
      },
    ]);
    const { EncryptKey } = context.root.$FeathersVuex.api;
    const refreshEncryptKeys = (target: string) => useFind({
      model: EncryptKey,
      params: { query: { target, stream_id: props.id } },
    });
    return {
      headers,
      refreshEncryptKeys,
      ...useModifyDialog(['update', 'updateParams']),
    };
  },
});
</script>
