import app from '../../src/app';

describe('\'info\' service', () => {
  const service = app.service('info');
  const OK = 'ok';

  it('health', async () => {
    const res = await service.get('health');
    expect(res).toMatchObject({
      status: OK,
      detail: {
        pg: { status: OK },
        vault: { status: OK },
        redis: { status: OK },
      },
    });
  });

  it('config', async () => {
    const res = await service.get('config');
    expect(res).toHaveProperty('shibboleth');
  });

  it('version', async () => {
    const res = await service.get('version');
    expect(res).toHaveProperty('version');
  });
});
