<template>
  <validation-observer
    ref="observer"
    v-slot="{ invalid, validate }"
  >
    <simple-dialog
      v-model="dialog"
      title="共同利用者の登録"
      color="primary"
      :invalid="invalid"
      data-manual="2,docs/screen-511"
      @save="validate(); onSubmit()"
      @cancel="dialog=false"
    >
      <template #activator="{ on, attrs }">
        <slot
          name="activator"
          v-bind="{ on, attrs }"
        />
      </template>
      <template #default>
        <validation-provider
          v-slot="{ errors }"
          rules="required|exists"
          mode="delay"
          name="共同利用者名"
          vid="members"
        >
          <v-textarea
            v-model="members"
            label="共同利用者名"
            hint="共同利用者として追加する利用者名を入力してください。複数の利用者を指定する場合はカンマ(,)で区切ってください。"
            data-cy="input-members"
            :error-messages="errors"
          />
        </validation-provider>
      </template>
    </simple-dialog>
  </validation-observer>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from '@vue/composition-api';
import { extend, ValidationObserver, ValidationProvider } from 'vee-validate';
import SimpleDialog from '@/components/SimpleDialog.vue';
import { useDialog } from '@/utils/member';

export default defineComponent({
  components: {
    SimpleDialog,
    ValidationProvider,
    ValidationObserver,
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
    const { dialog } = useDialog(props, context.emit);

    const { Member, User } = context.root.$FeathersVuex.api;
    const members = ref('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const observer: Ref<any> = ref(null);

    const parseUsers = (txt: string): string[] => (
      txt.split(',').map((x) => x.trim()).filter((x) => (x.length > 0))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findUsers = async (names: string[]): Promise<any[]> => (
      User.find({ query: { name: { $in: names } } })
    );

    const onSubmit = async () => {
      const names = parseUsers(members.value);
      const users = await findUsers(names);
      const res = await Promise.all(users.map(async (user) => {
        try {
          const member = new Member({
            stream_id: props.id,
            user_id: user.id,
            admin: false,
          });
          return await member.save();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          if (e.code === 409) {
            return e.code;
          }
          observer.value.setErrors({ members: ['登録処理でエラーが発生しました。'] });
          return null;
        }
      }));
      if (res.filter((x) => x == null).length === 0) {
        dialog.value = false;
      }
    };

    extend('exists', async (v: string) => {
      const names = parseUsers(v);
      const existUsers = (await findUsers(names)).map((u) => (u.name));
      const diff = names.filter((x) => !existUsers.includes(x));
      if (diff.length === 0) {
        return true;
      }
      return `登録されていない利用者が指定されています(${diff.join(', ')})。`;
    });

    return {
      dialog,
      members,
      onSubmit,
      observer,
    };
  },
});
</script>
