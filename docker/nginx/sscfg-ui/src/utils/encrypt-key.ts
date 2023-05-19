import {
  EmitFn, SubmitDialog, useDialog, useSubmitDialog, ValueAware,
} from './dialog';

const useEncryptKey = (
  props: ValueAware<boolean>,
  emit: EmitFn,
  changeEncryptKeys = false,
): SubmitDialog => useSubmitDialog(
  props,
  emit,
  (res) => {
    if (changeEncryptKeys) {
      emit('change-encrypt-keys', res.target);
    }
    emit('change-stream', res.stream_id);
  },
  (e) => ({ target: [e.name != null ? e.name : e.toString()] }),
);

export { useDialog, useEncryptKey };
