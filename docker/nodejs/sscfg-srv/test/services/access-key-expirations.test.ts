import app from '../../src/app';

describe('\'access-key-expirations\' service', () => {
  it('registered the service', () => {
    const service = app.service('access-key-expirations');
    expect(service).toBeTruthy();
  });
});
