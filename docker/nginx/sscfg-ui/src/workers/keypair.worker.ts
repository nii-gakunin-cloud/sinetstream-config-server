import NodeRSA from 'node-rsa';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener('message', async (event) => {
  const key = new NodeRSA();
  key.generateKeyPair(event.data);
  const priv = key.exportKey('private');
  const pub = key.exportKey('public');
  const ret = { private: priv, public: pub };
  ctx.postMessage(ret);
});

export default ctx;
