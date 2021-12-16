import { ValidationRuleSchema } from 'vee-validate/dist/types/types.d';

const targetPattern = (...example: string[]): ValidationRuleSchema => {
  const append = 'のような文字列を指定してください。';
  const ex = example.map((x) => `「${x}」`).join('、');
  const defaultMessage = '埋め込み場所の指定が正しくありません。';
  const message = example.length > 0 ? defaultMessage + ex + append : defaultMessage;
  return {
    validate: (v: string): boolean => (/^(?:\*|[-\w]+)(?:\.[-\w+]+)+$/.test(v)),
    message,
  };
};

const keySize = {
  validate: (v: unknown): boolean => [128, 192, 256].includes(Number(v)),
  message: '{_field_}には128, 192, 256のいずれかを指定してください。',
};

const keyfileSize = {
  params: ['size'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate: (v: Record<string, any>, params: Record<string, any>): boolean => {
    const { size } = params;
    if (size == null) {
      return true;
    }
    return Number(size) === v.size * 8;
  },
  message: '指定されているサイズと異なるファイルが{_field_}に指定されています。',
};

export {
  targetPattern,
  keySize,
  keyfileSize,
};
