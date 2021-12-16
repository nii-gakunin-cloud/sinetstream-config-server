import app from '../../src/app';

describe('\'sys-vault\' service', () => {
  it('registered the service', () => {
    const service = app.service('sys-vault');
    expect(service).toBeTruthy();
  });
});
