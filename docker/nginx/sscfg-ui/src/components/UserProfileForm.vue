<template>
  <v-card
    class="ma-4"
    data-manual="docs/screen-801"
  >
    <FeathersVuexFormWrapper
      v-slot="{ clone, save, reset }"
      :item="item"
    >
      <v-form @submit.prevent="save">
        <v-card-text>
          <v-container>
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="clone.name"
                  label="名前"
                  readonly
                  hint="名前を変更することはできません"
                />
              </v-col>
            </v-row>

            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="clone.email"
                  label="メールアドレス"
                />
              </v-col>
            </v-row>

            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="clone.displayName"
                  label="表示名"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            color="primary"
            type="submit"
          >
            保存
          </v-btn>

          <v-btn
            text
            data-cy="btn-reset"
            @click="reset"
          >
            リセット
          </v-btn>
          <v-btn
            text
            data-cy="btn-back"
            @click="$router.go(-1)"
          >
            戻る
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="clone.isLocalUser"
            text
            right
            data-cy="btn-change-password"
            @click.stop="dialog = true"
          >
            パスワード変更
          </v-btn>
        </v-card-actions>
      </v-form>
    </FeathersVuexFormWrapper>
    <change-password-dialog
      v-if="dialog"
      v-model="dialog"
    />
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import ChangePasswordDialog from './ChangePasswordDialog.vue';

export default defineComponent({
  name: 'UserProfileForm',
  components: {
    ChangePasswordDialog,
  },
  setup(_, context) {
    const dialog = ref(false);
    const { $store } = context.root;
    const uid = computed(() => $store.state.auth.user.id);
    const { User } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: User, id: uid.value });
    return {
      item,
      dialog,
    };
  },
});
</script>
