import {
  EmitFn, SubmitDialog, useDialog, useSubmitDialog as useSubmitDialog0, ValueAware,
} from './dialog';

const useSubmitDialog = (props: ValueAware<boolean>, emit: EmitFn): SubmitDialog => (
  useSubmitDialog0(
    props, emit,
    (res) => {
      emit('change-stream-member', res.id);
    },
  ));

export { useDialog, useSubmitDialog };
