<template>
  <v-card
    min-width="300"
    height="90%"
    :color="cardColor"
  >
    <v-card-text>
      <v-row dense>
        <v-col>
          <span class="font-weight-bold">対象のコンフィグ情報:</span>
        </v-col>
      </v-row>
      <div v-if="item.allPermitted">
        <v-row dense>
          <v-col
            offset="1"
            data-cy="target-configs"
          >
            利用可能な全てのコンフィグ情報
          </v-col>
        </v-row>
      </div>
      <div v-else-if="notExist">
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
          v-for="(stream,idx) in item.streams"
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
          {{ item.comment }}
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
          <date-time-label :value="item.expirationTime" />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        icon
        :download="filename"
        :href="url"
        :disabled="notExist"
        data-cy="btn-download"
      >
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-btn
        icon
        data-cy="btn-delete"
        @click.stop="deleteDialogTarget=item.id"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      <access-key-delete-dialog
        v-if="deleteDialog"
        :id="deleteDialogTarget"
        v-model="deleteDialog"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import {
  computed, defineComponent, Ref, ref, onUnmounted,
} from '@vue/composition-api';
import AccessKeyDeleteDialog from '@/components/AccessKeyDeleteDialog.vue';
import DateTimeLabel from '@/components/DateTimeLabel.vue';

export default defineComponent({
  components: {
    AccessKeyDeleteDialog,
    DateTimeLabel,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    filename: {
      type: String,
      default: 'auth.json',
    },
  },
  setup(props, context) {
    const { $store } = context.root;
    const url = computed(() => {
      const info = {
        'config-server': {
          address: window.location.origin,
          user: $store.state.auth.user.name,
          'secret-key': props.item.secretId,
          'expiration-date': props.item.expirationTime,
        },
      };
      const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
      return URL.createObjectURL(blob);
    });
    onUnmounted(() => {
      URL.revokeObjectURL(url.value);
    });
    const deleteDialogTarget: Ref<number | null> = ref(null);
    const deleteDialog = computed({
      get: () => deleteDialogTarget.value != null,
      set: (value: boolean) => {
        if (value) {
          throw new Error('unexpected usage');
        }
        deleteDialogTarget.value = null;
      },
    });
    const notExist = computed(
      () => (props.item.allPermitted ? false : props.item.streams.length === 0),
    );
    const cardColor = computed(
      () => (notExist.value ? 'red lighten-4' : undefined),
    );
    return {
      deleteDialogTarget,
      deleteDialog,
      url,
      notExist,
      cardColor,
    };
  },
});
</script>
