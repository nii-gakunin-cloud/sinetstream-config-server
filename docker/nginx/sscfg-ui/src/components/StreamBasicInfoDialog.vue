<template>
  <FeathersVuexFormWrapper
    :item="item"
    :eager="false"
  >
    <template #default="{ clone, save }">
      <validation-observer
        ref="observer"
        v-slot="{ invalid }"
      >
        <simple-dialog
          v-model="dialog"
          :title="title"
          color="primary"
          :submit="submit"
          :invalid="invalid"
          :data-manual="manual"
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
            <stream-name-text-field
              v-model="clone.name"
              label="名前"
              :readonly="update"
              data-cy="input-name"
            />
            <v-textarea
              v-model="clone.comment"
              rows="2"
              label="コメント"
              data-cy="input-comment"
            />
            <config-file-textarea
              :id="id"
              v-model="clone.configFile"
              @validation-required="observer.validate()"
            />
          </template>
        </simple-dialog>
      </validation-observer>
    </template>
  </FeathersVuexFormWrapper>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useGet } from 'feathers-vuex';
import { ValidationObserver } from 'vee-validate';
import ConfigFileTextarea from '@/components/ConfigFileTextarea.vue';
import SimpleDialog from '@/components/SimpleDialog.vue';
import StreamNameTextField from '@/components/StreamNameTextField.vue';
import { useSubmitDialog } from '@/utils/dialog';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationObserver,
    StreamNameTextField,
    ConfigFileTextarea,
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const { dialog, observer, onSubmit } = useSubmitDialog(
      props, context.emit,
      () => {
        if (props.id != null) {
          context.emit('change-stream', props.id);
        } else {
          context.emit('create-stream');
        }
      },
      (e) => {
        const message = e.name != null ? e.name : e.toString();
        return { name: [message] };
      },
    );
    const update = computed(() => props.id != null);
    const submit = computed(() => (update.value ? '更新' : '登録'));
    const title = computed(() => `コンフィグ情報の${submit.value}`);
    const { Stream } = context.root.$FeathersVuex.api;
    const { item } = props.id
      ? useGet({ model: Stream, id: props.id })
      : { item: ref(new Stream()) };
    const manual = computed(() => JSON.stringify({
      path: update.value ? 'docs/screen-121' : 'docs/screen-111',
      priority: 2,
    }));
    return {
      dialog,
      observer,
      onSubmit,
      item,
      update,
      title,
      submit,
      manual,
    };
  },
});
</script>
