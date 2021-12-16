import { BadRequest } from '@feathersjs/errors';

export function verifyTargetFormat(target: string): void {
  const path = target.split('.');
  if (path.length < 2) {
    throw new BadRequest('Target format is incorrect.');
  }
  if (path.map((x) => x.trim()).filter((x) => x.length === 0).length > 0) {
    throw new BadRequest('Target format is incorrect.');
  }
  if (path.slice(1).filter((x) => x.includes('*')).length > 0) {
    throw new BadRequest('Target format is incorrect.');
  }
}
