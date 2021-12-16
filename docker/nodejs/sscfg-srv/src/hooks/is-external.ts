import { HookContext } from '@feathersjs/feathers';
import {
  isProvider, PredicateFn, some, SyncContextFunction,
} from 'feathers-hooks-common';
import { JSONPath } from 'jsonpath-plus';

export function exists(target: string): SyncContextFunction<boolean> {
  return (context: HookContext) => {
    const { params } = context;
    const result = JSONPath({
      path: target,
      json: params,
    });
    return result.length > 0 && result.some((x: any) => (x));
  };
}

export default function (): PredicateFn {
  return process.env.NODE_ENV === 'production'
    ? isProvider('external')
    : some(isProvider('external'), exists('$.test.jest'));
}
