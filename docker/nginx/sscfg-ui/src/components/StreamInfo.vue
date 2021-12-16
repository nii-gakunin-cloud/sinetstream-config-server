<template>
  <div>
    <v-expansion-panels
      v-model="panel"
      multiple
      popout
    >
      <v-expansion-panel data-cy="panel-basic-info">
        <v-expansion-panel-header :hide-actions="true">
          基本情報
          <v-spacer />
          <v-tooltip
            v-if="item.admin"
            left
          >
            <template #activator="{attrs, on}">
              <v-btn
                v-show="panel.includes(0)"
                color="info"
                fab
                small
                bottom
                right
                absolute
                v-bind="attrs"
                data-cy="btn-update-stream"
                v-on="on"
                @click.stop="basicInfoDialog=true"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>コンフィグ情報の更新</span>
          </v-tooltip>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <stream-basic-info-panel
            :item="item"
            :hint="item.admin ? '変更するには右上の更新ボタンをクリックしてください。' : ''"
            :rows="item.admin ? 8 : 15"
            :show-switch="item.admin"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>

      <v-expansion-panel
        v-if="item.admin"
        data-cy="panel-encrypt-key"
      >
        <v-expansion-panel-header :hide-actions="true">
          データ暗号鍵
          <v-spacer />
          <v-tooltip left>
            <template #activator="{ attrs, on }">
              <v-btn
                v-show="panel.includes(1)"
                color="primary"
                fab
                small
                absolute
                bottom
                right
                v-bind="attrs"
                data-cy="btn-create-encrypt-key"
                v-on="on"
                @click.stop="encryptKeyDialog=true"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>データ暗号鍵の登録</span>
          </v-tooltip>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <encrypt-key-table
            :id="item.id"
            @change-stream="refreshConfigFile"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="item.admin"
        data-cy="panel-attach-file"
      >
        <v-expansion-panel-header :hide-actions="true">
          添付ファイル
          <v-spacer />
          <v-tooltip left>
            <template #activator="{attrs, on}">
              <v-btn
                v-show="panel.includes(2)"
                color="primary"
                fab
                small
                absolute
                bottom
                right
                v-bind="attrs"
                data-cy="btn-create-attach-file"
                v-on="on"
                @click.stop="attachFileDialog=true"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>添付ファイルの登録</span>
          </v-tooltip>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <attach-file-table
            :id="item.id"
            @change-stream="refreshConfigFile"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="item.admin"
        data-cy="panel-user-parameter"
      >
        <v-expansion-panel-header :hide-actions="true">
          ユーザパラメータ
          <v-spacer />
          <v-tooltip left>
            <template #activator="{attrs, on}">
              <v-btn
                v-show="panel.includes(3)"
                color="primary"
                fab
                small
                absolute
                bottom
                right
                v-bind="attrs"
                data-cy="btn-create-user-parameter"
                v-on="on"
                @click.stop="userParameterDialog=true"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>ユーザパラメータの登録</span>
          </v-tooltip>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <user-parameter-table
            :id="item.id"
            @change-stream="refreshConfigFile"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="item.admin"
        data-cy="panel-member"
      >
        <v-expansion-panel-header :hide-actions="true">
          共同利用者
          <v-spacer />
          <v-tooltip left>
            <template #activator="{attrs, on}">
              <v-btn
                v-show="panel.includes(4)"
                color="primary"
                fab
                small
                absolute
                bottom
                right
                v-bind="attrs"
                data-cy="btn-create-member"
                v-on="on"
                @click.stop="memberDialog=true"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>共同利用者の登録</span>
          </v-tooltip>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <members-table
            :id="item.id"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <stream-basic-info-dialog
      v-if="basicInfoDialog"
      :id="item.id"
      v-model="basicInfoDialog"
      @change-stream="refreshConfigFile"
    />
    <attach-file-dialog
      v-if="attachFileDialog"
      v-model="attachFileDialog"
      :sid="item.id"
      @change-stream="refreshConfigFile"
    />
    <encrypt-key-create-dialog
      v-if="encryptKeyDialog"
      v-model="encryptKeyDialog"
      :sid="item.id"
      @change-stream="refreshConfigFile"
    />
    <user-parameter-dialog
      v-if="userParameterDialog"
      v-model="userParameterDialog"
      :sid="item.id"
      @change-stream="refreshConfigFile"
    />
    <member-create-dialog
      v-if="memberDialog"
      :id="item.id"
      v-model="memberDialog"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import AttachFileDialog from '@/components/AttachFileDialog.vue';
import AttachFileTable from '@/components/AttachFileTable.vue';
import EncryptKeyCreateDialog from '@/components/EncryptKeyCreateDialog.vue';
import EncryptKeyTable from '@/components/EncryptKeyTable.vue';
import MemberCreateDialog from '@/components/MemberCreateDialog.vue';
import MembersTable from '@/components/MembersTable.vue';
import StreamBasicInfoDialog from '@/components/StreamBasicInfoDialog.vue';
import StreamBasicInfoPanel from '@/components/StreamBasicInfoPanel.vue';
import UserParameterDialog from '@/components/UserParameterDialog.vue';
import UserParameterTable from '@/components/UserParameterTable.vue';

export default defineComponent({
  name: 'StreamInfo',
  components: {
    EncryptKeyCreateDialog,
    EncryptKeyTable,
    AttachFileDialog,
    AttachFileTable,
    UserParameterDialog,
    UserParameterTable,
    MemberCreateDialog,
    MembersTable,
    StreamBasicInfoDialog,
    StreamBasicInfoPanel,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  setup(_, context) {
    const panel = ref([0]);
    const { ConfigFile } = context.root.$FeathersVuex.api;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshConfigFile = (id: any) => {
      useGet({ model: ConfigFile, id });
    };
    const basicInfoDialog = ref(false);
    const attachFileDialog = ref(false);
    const encryptKeyDialog = ref(false);
    const userParameterDialog = ref(false);
    const memberDialog = ref(false);
    return {
      panel,
      refreshConfigFile,
      basicInfoDialog,
      attachFileDialog,
      encryptKeyDialog,
      userParameterDialog,
      memberDialog,
    };
  },
});
</script>
