<template>
  <FeathersVuexFormWrapper
    v-slot="{clone, save}"
    :item="item"
  >
    <validation-observer
      ref="observer"
      v-slot="{ invalid }"
    >
      <simple-dialog
        v-model="dialog"
        title="APIアクセスキーの作成"
        color="primary"
        :invalid="invalid"
        data-manual="2,docs/screen-711"
        @save="onSubmit(save)"
        @cancel="dialog=false"
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
                <span class="font-weight-bold">対象となるコンフィグ情報:</span>
              </v-col>
            </v-row>

            <v-radio-group v-model="clone.allPermitted">
              <v-row>
                <v-col offset="1">
                  <v-radio
                    label="利用可能な全てのコンフィグ情報"
                    :value="true"
                    data-cy="radio-all-permitted"
                    :disabled="noStreams"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col offset="1">
                  <v-radio
                    label="個別のコンフィグ情報を選択する"
                    :value="false"
                    data-cy="radio-select-individual"
                    :disabled="noStreams"
                  />
                </v-col>
              </v-row>
            </v-radio-group>

            <v-row
              dense
            >
              <v-col offset="2">
                <validation-provider
                  v-slot="{ errors }"
                  :rules="clone.allPermitted ? '' : 'required'"
                  name="コンフィグ情報"
                  vid="streams"
                >
                  <v-checkbox
                    v-for="stream in streams"
                    :key="stream.id"
                    v-model="clone.streams"
                    :value="stream"
                    :label="stream.name"
                    :disabled="clone.allPermitted"
                    :error-messages="errors"
                    data-cy="check-streams"
                  />
                </validation-provider>
              </v-col>
            </v-row>

            <v-row dense>
              <v-col>
                <v-textarea
                  v-model="clone.comment"
                  label="コメント"
                  rows="2"
                  data-cy="input-comment"
                />
              </v-col>
            </v-row>
          </v-container>
        </template>
      </simple-dialog>
    </validation-observer>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useFind } from 'feathers-vuex/dist';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useSubmitDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { dialog, observer, onSubmit } = useSubmitDialog(props, context.emit);
    const { AccessKey, Stream } = context.root.$FeathersVuex.api;
    const item = ref(new AccessKey());
    const { items: streams } = useFind({ model: Stream, params: { query: {} } });
    const noStreams = computed(() => streams.value.length === 0);
    return {
      item,
      dialog,
      observer,
      onSubmit,
      streams,
      noStreams,
    };
  },
});
</script>
