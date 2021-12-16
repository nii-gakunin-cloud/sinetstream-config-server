<template>
  <div v-if="item">
    <FeathersVuexFormWrapper
      v-slot="{ clone, remove }"
      :item="item"
    >
      <simple-dialog
        v-model="dialog"
        title="APIアクセスキーの削除"
        color="error"
        submit="削除"
        data-manual="2,docs/screen-721"
        @save="remove().then(dialog = false)"
        @cancel="dialog = false"
      >
        <template #activator="{ on, attrs }">
          <slot
            name="activator"
            v-bind="{ on, attrs }"
          />
        </template>
        <template #default>
          <v-container>
            <v-row dense>
              <v-col>
                <span class="font-weight-bold">対象のコンフィグ情報:</span>
              </v-col>
            </v-row>
            <div v-if="clone.allPermitted">
              <v-row dense>
                <v-col
                  offset="1"
                  data-cy="target-configs"
                >
                  利用可能な全てのコンフィグ情報
                </v-col>
              </v-row>
            </div>
            <div v-else-if="clone.streams.length === 0">
              <v-row dense>
                <v-col
                  offset="1"
                  data-cy="target-configs"
                >
                  対象となるコンフィグ情報が存在しない
                </v-col>
              </v-row>
            </div>
            <div v-else>
              <v-row
                v-for="(stream,idx) in clone.streams"
                :key="idx"
                dense
              >
                <v-col
                  offset="1"
                  data-cy="target-configs"
                >
                  {{ stream.name }}
                </v-col>
              </v-row>
            </div>
            <v-row dense>
              <v-col>
                <span class="font-weight-bold">コメント:</span>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col
                offset="1"
                data-cy="comment"
              >
                {{ clone.comment }}
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <span class="font-weight-bold">有効期限:</span>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col
                offset="1"
                data-cy="expiration-time"
              >
                {{ clone.expirationTime }}
              </v-col>
            </v-row>
          </v-container>
        </template>
      </simple-dialog>
    </FeathersVuexFormWrapper>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGet } from 'feathers-vuex/dist';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    SimpleDialog,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { AccessKey } = context.root.$FeathersVuex.api;
    const { item } = useGet({ model: AccessKey, id: props.id });
    const { dialog } = useDialog(props, context.emit);
    return {
      item,
      dialog,
    };
  },
});
</script>
