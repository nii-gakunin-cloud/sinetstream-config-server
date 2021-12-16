<template>
  <div>
    <FeathersVuexFind
      v-slot="{ items }"
      service="public-keys"
      :params="{ query: {} }"
    >
      <v-data-table
        :headers="headers"
        :items="items"
        :search="search"
        :options="{ sortBy: ['createdAt'], sortDesc: [true] }"
      >
        <template #item.actions="{ item }">
          <v-tooltip left>
            <template #activator="{attrs, on}">
              <v-btn
                icon
                v-bind="attrs"
                data-cy="btn-update-public-key"
                v-on="on"
                @click.stop="updateDialogTarget=item.id"
              >
                <v-icon>
                  mdi-pencil
                </v-icon>
              </v-btn>
            </template>
            <span>ユーザ公開鍵情報の更新</span>
          </v-tooltip>
          <v-tooltip left>
            <template #activator="{attrs, on}">
              <v-btn
                icon
                v-bind="attrs"
                data-cy="btn-remove-public-key"
                v-on="on"
                @click.stop="deleteDialogTarget=item.id"
              >
                <v-icon>
                  mdi-delete
                </v-icon>
              </v-btn>
            </template>
            <span>ユーザ公開鍵の削除</span>
          </v-tooltip>
        </template>
        <template #item.defaultKey="{ item }">
          <v-icon v-if="item.defaultKey">
            mdi-check
          </v-icon>
        </template>
        <template #item.createdAt="{ item }">
          <date-time-label
            compact
            :value="item.createdAt"
          />
        </template>
        <template #item.fingerprint="{ item }">
          <span v-if="$vuetify.breakpoint.mdAndUp">
            {{ item.fingerprint }}
          </span>
          <span v-else>
            {{ item.fingerprint.substring(0, 20) }}...
          </span>
        </template>
      </v-data-table>
    </FeathersVuexFind>
    <public-key-update-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
      :only="onlyOne"
      @change-public-key="$emit('change-public-key', $event)"
    />
    <public-key-delete-dialog
      v-if="deleteDialog"
      :id="deleteDialogTarget"
      v-model="deleteDialog"
      @change-public-key="$emit('change-public-key', $event)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import DateTimeLabel from '@/components/DateTimeLabel.vue';
import PublicKeyDeleteDialog from '@/components/PublicKeyDeleteDialog.vue';
import PublicKeyUpdateDialog from '@/components/PublicKeyUpdateDialog.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  name: 'PublicKeysTable',
  components: {
    DateTimeLabel,
    PublicKeyDeleteDialog,
    PublicKeyUpdateDialog,
  },
  props: {
    search: {
      type: String,
      default: '',
    },
  },
  setup(_, context) {
    const headers = computed(() => [
      {
        text: 'フィンガープリント',
        value: 'fingerprint',
      },
      {
        text: 'コメント',
        value: 'comment',
      },
      {
        text: 'デフォルト',
        value: 'defaultKey',
        filterable: false,
      },
      {
        text: '登録日時',
        value: 'createdAt',
        filterable: false,
      },
      {
        text: '',
        value: 'actions',
        sortable: false,
        width: 120,
        filterable: false,
      },
    ]);
    const { PublicKey } = context.root.$FeathersVuex.api;
    const keys = useFind({ model: PublicKey, params: { query: {} } });
    const onlyOne = computed(() => keys.items.value.length === 1);
    return {
      headers,
      onlyOne,
      ...useModifyDialog(),
    };
  },
});
</script>
