/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  computed, ref, Ref, WritableComputedRef,
} from '@vue/composition-api';

interface DialogFlag {
  dialog: WritableComputedRef<boolean>;
}
interface ValueAware<T> {
  value: T;
}
type EmitFn = (event: string, ...args: any[]) => void;
type CompleteHandler = (result: any) => void;
type ErrorHandler = (error: any) => Record<string, string[]> | null;
type StoreOperator = () => Promise<any>;
interface SubmitDialog extends DialogFlag {
  observer: any,
  onSubmit: (op: StoreOperator) => Promise<void>,
}

const useDialog = (props: ValueAware<boolean>, emit: EmitFn): DialogFlag => {
  const dialog = computed({
    get: () => props.value,
    set: (value: boolean) => { emit('input', value); },
  });
  return { dialog };
};

const useSubmitDialog = (
  props: ValueAware<boolean>,
  emit: EmitFn,
  onComplete?: CompleteHandler,
  onError?: ErrorHandler,
): SubmitDialog => {
  const { dialog } = useDialog(props, emit);

  const observer: Ref<any> = ref(null);

  const onSubmit = async (op: StoreOperator) => {
    try {
      if (observer.value) {
        await observer.value.validate();
      }
      const ret = await op();
      if (onComplete != null) {
        onComplete(ret);
      }
      dialog.value = false;
    } catch (e: unknown) {
      if (onError != null) {
        const errors = onError(e);
        if (errors != null && observer.value != null) {
          observer.value.setErrors(errors);
        }
      }
    }
  };
  return { dialog, observer, onSubmit };
};

const idAwareDialog = (name: string) => {
  const target: Ref<number | null> = ref(null);
  const flag = computed({
    get: () => target.value != null,
    set: (value: boolean) => {
      if (value) {
        throw new Error('unexpected usage');
      }
      target.value = null;
    },
  });
  return {
    [`${name}DialogTarget`]: target,
    [`${name}Dialog`]: flag,
  };
};

const useModifyDialog = (names = ['update', 'delete']): Record<string, any> => (
  names.map((x) => idAwareDialog(x)).reduce((res, x) => Object.assign(res, x), {})
);

export {
  useDialog,
  useSubmitDialog,
  useModifyDialog,
  ValueAware,
  EmitFn,
  SubmitDialog,
};
