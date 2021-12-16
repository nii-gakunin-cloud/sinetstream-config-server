<template>
  <div class="members-table">
    <FeathersVuexFind
      v-slot="{ items }"
      service="members"
      :params="{ query: { stream_id: id } }"
    >
      <v-data-table
        :headers="headers"
        :items="items"
        :search="search"
        item-key="id"
        :options="{ sortBy: ['createdAt'], sortDesc: [true] }"
      >
        <template #item.user.name="{ item }">
          <user-label
            v-if="item.user"
            :user="item.user"
            small
            data-cy="members-col-name"
          />
        </template>
        <template #item.admin="{ item }">
          <v-icon
            v-if="item.admin"
            data-cy="members-col-admin"
          >
            mdi-check
          </v-icon>
        </template>
        <template
          v-if="!readonly"
          #item.actions="{ item }"
        >
          <div v-if="!isMyself(item)">
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-member-edit"
                  v-on="on"
                  @click.stop="updateDialogTarget=item.id"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>データ管理者権限の変更</span>
            </v-tooltip>
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                  icon
                  v-bind="attrs"
                  data-cy="btn-member-delete"
                  v-on="on"
                  @click.stop="deleteDialogTarget=item.id"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>共同利用者の削除</span>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </FeathersVuexFind>
    <member-update-dialog
      v-if="updateDialog"
      :id="updateDialogTarget"
      v-model="updateDialog"
    />
    <member-delete-dialog
      v-if="deleteDialog"
      :id="deleteDialogTarget"
      v-model="deleteDialog"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import MemberDeleteDialog from '@/components/MemberDeleteDialog.vue';
import MemberUpdateDialog from '@/components/MemberUpdateDialog.vue';
import UserLabel from '@/components/UserLabel.vue';
import { useModifyDialog } from '@/utils/dialog';

export default defineComponent({
  name: 'MembersTable',
  components: {
    MemberDeleteDialog,
    MemberUpdateDialog,
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
  setup(_, context) {
    const { $store } = context.root;
    const headers = computed(() => [
      {
        text: '名前',
        value: 'user.name',
      },
      {
        text: '表示名',
        value: 'user.displayName',
      },
      {
        text: 'メール',
        value: 'user.email',
      },
      {
        text: '管理者',
        value: 'admin',
        filterable: false,
      },
      {
        text: '',
        value: 'actions',
        sortable: false,
        filterable: false,
      },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isMyself = (item: any) => {
      const { user_id: uid } = item;
      return uid === $store.state.auth.user.id;
    };
    return {
      headers,
      isMyself,
      ...useModifyDialog(),
    };
  },
});
</script>
