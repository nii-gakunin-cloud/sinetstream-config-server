import { BadRequest } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { data } = context;
  const { content, textContent, ...otherData } = data;
  if (content != null && textContent != null) {
    throw new BadRequest('"content" and "textContent" are both specified.');
  }
  if (textContent != null) {
    const newData = {
      content: Buffer.from(textContent).toString('base64'),
      isBinary: false,
    };
    replaceItems(context, { ...otherData, ...newData });
  } else if (content != null) {
    replaceItems(context, { ...data, isBinary: true });
  }
  return context;
};

export const filterBinaryContent = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
    const procContent = (item: any) => {
      const {
        isBinary, content, secret, ...other
      } = item;
      if (isBinary || secret) {
        return { isBinary, secret, ...other };
      }
      const textContent = Buffer.from(content, 'base64').toString();
      return {
        isBinary, textContent, secret, ...other,
      };
    };
    const data = getItems(context);
    replaceItems(
      context,
      data instanceof Array
        ? data.map(procContent)
        : procContent(data),
    );
    return context;
  });
