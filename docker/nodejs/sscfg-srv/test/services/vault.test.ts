import app from '../../src/app';

describe('\'vault\' service', () => {
  it('registered the service', () => {
    const service = app.service('vault');
    expect(service).toBeTruthy();
  });
});
