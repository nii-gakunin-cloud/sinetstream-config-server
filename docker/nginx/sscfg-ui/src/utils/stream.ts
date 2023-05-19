import {
  EmitFn, SubmitDialog, useDialog, useSubmitDialog as useSubmitDialog0, ValueAware,
} from './dialog';

const useSubmitDialog = (props: ValueAware<boolean>, emit: EmitFn): SubmitDialog => (
  useSubmitDialog0(
    props,
    emit,
    (res) => {
      emit('change-stream', res.stream_id);
    },
    (e) => ({ target: [e.name != null ? e.name : e.toString()] }),
  ));

export { useDialog, useSubmitDialog };
