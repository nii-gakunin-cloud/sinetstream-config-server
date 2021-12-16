import { extend, localize, setInteractionMode } from 'vee-validate';
import ja from 'vee-validate/dist/locale/ja.json';
import { required, max } from 'vee-validate/dist/rules';

localize('ja', ja);
extend('required', required);
extend('max', max);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
setInteractionMode('delay', (context) => ({
  on: ['input', 'blur'],
  debounce: 350,
}));
