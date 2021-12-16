/* eslint-disable @typescript-eslint/no-explicit-any */
import * as NodeRSA from 'node-rsa';

const {
  rest_url: restUrl,
  admin,
  admin_password: adminPassword,
} = Cypress.env();

Cypress.Commands.add('userToken', (name, password) => cy.request(
  'POST',
  `${restUrl}/authentication`,
  { strategy: 'local', name, password },
).then((resp) => (resp.body.accessToken)));

Cypress.Commands.add('login', (name, password) => (
  cy.userToken(name, password).then((token) => {
    window.localStorage.setItem('feathers-jwt', token);
  })
));

Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage('feathers-jwt');
});

Cypress.Commands.add('adminToken', () => (cy.userToken(admin, adminPassword)));

Cypress.Commands.add('findUserId',
  (username) => cy.adminToken().then((token) => cy.request({
    url: `${restUrl}/users?name=${username}`,
    auth: { bearer: token },
  }).then((resp) => {
    if (resp.body.length === 0) {
      return null;
    }
    return Number(resp.body[0].id);
  })));

Cypress.Commands.add('addUser', (user) => (
  cy.adminToken().then((token) => cy.request({
    method: 'POST',
    url: `${restUrl}/users`,
    body: user,
    auth: { bearer: token },
  }))
));

Cypress.Commands.add('removeUser', (uid) => {
  cy.adminToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${restUrl}/users/${uid}`,
      auth: { bearer: token },
    });
  });
});

Cypress.Commands.add('updateUser', (uid, user) => {
  cy.adminToken().then((token) => {
    cy.request({
      method: 'PATCH',
      url: `${restUrl}/users/${uid}`,
      auth: { bearer: token },
      body: user,
    });
  });
});

Cypress.Commands.add('addPublicKey', (token, pubKey, defaultKey = true, comment = '') => {
  let publicKey = pubKey;
  if (publicKey == null) {
    const rsa = new NodeRSA();
    rsa.generateKeyPair();
    publicKey = rsa.exportKey('public');
  }
  return cy.request({
    method: 'POST',
    url: `${restUrl}/public-keys`,
    body: { publicKey, defaultKey, comment },
    auth: { bearer: token },
  });
});

Cypress.Commands.add('clearPublicKeys', (token) => {
  cy.request({
    method: 'DELETE',
    url: `${restUrl}/public-keys`,
    auth: { bearer: token },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('addAccessKey', (token, allPermitted = true, streamIds = [], comment = '') => {
  const streams = streamIds != null ? streamIds.map((x: number) => ({ id: x })) : [];
  return cy.request({
    method: 'POST',
    url: `${restUrl}/access-keys`,
    body: { allPermitted, streams, comment },
    auth: { bearer: token },
  });
});

Cypress.Commands.add('clearAccessKeys', (token) => {
  cy.request({
    method: 'GET',
    url: `${restUrl}/access-keys`,
    auth: { bearer: token },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }).then((resp) => (resp.body)).each((it: {[key: string]: any}, idx, list) => {
    cy.request({
      method: 'DELETE',
      url: `${restUrl}/access-keys/${it.id}`,
      auth: { bearer: token },
    });
  });
});

Cypress.Commands.add('addStream', (token, name, comment = '', configFile = '') => cy.request({
  method: 'POST',
  url: `${restUrl}/streams`,
  body: { name, configFile, comment },
  auth: { bearer: token },
}));

Cypress.Commands.add('clearStreams', (token) => {
  cy.request({
    method: 'GET',
    url: `${restUrl}/streams`,
    auth: { bearer: token },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }).then((resp) => (resp.body)).each((it: {[key: string]: any}, idx, list) => {
    cy.request({
      method: 'DELETE',
      url: `${restUrl}/streams/${it.id}`,
      auth: { bearer: token },
    });
  });
});

Cypress.Commands.add(
  'addMember', (token, adminFlag, streamId, username) => cy.findUserId(username).then(
    (uid) => cy.request({
      method: 'POST',
      url: `${restUrl}/members`,
      body: { admin: adminFlag, stream_id: streamId, user_id: uid },
      auth: { bearer: token },
    }),
  ),
);

Cypress.Commands.add(
  'downloadBlob', { prevSubject: true }, (subject) => {
    cy.wrap(subject).get('a.v-btn,a.v-list-item')
      .should('not.have.class', 'v-btn--disabled')
      .and('not.have.class', 'v-list-item--disabled');
    cy.wrap(subject).should('have.attr', 'href');
    return cy.wrap(subject).invoke('attr', 'href').then((url) => new Cypress.Promise((resolve) => {
      fetch(url).then(async (resp) => (resolve(await resp.text())));
    }));
  },
);

Cypress.Commands.add(
  'addEncryptKey', (token, streamId, size, target, enabled = true, comment = '') => (
    cy.request({
      method: 'POST',
      url: `${restUrl}/encrypt-keys`,
      auth: { bearer: token },
      body: {
        size, target, comment, enabled, stream_id: streamId,
      },
    })
  ),
);

Cypress.Commands.add(
  'addAttachFile',
  (token, streamId, filename, target, secret = false, enabled = true, comment = '') => {
    cy.fixture(filename, 'base64').then((content) => cy.request({
      method: 'POST',
      url: `${restUrl}/attach-files`,
      auth: { bearer: token },
      body: {
        content, target, comment, stream_id: streamId, enabled, secret,
      },
    }));
  },
);

Cypress.Commands.add(
  'addUserParameter',
  (token, streamId, username, target, textContent = null, filename = null, secret = false, enabled = true, comment = '') => {
    cy.findUserId(username).then((uid) => {
      const params = {
        stream_id: streamId,
        user_id: uid,
        target,
        secret,
        enabled,
        comment,
      };
      if (textContent != null) {
        cy.request({
          method: 'POST',
          url: `${restUrl}/user-parameters`,
          auth: { bearer: token },
          body: { textContent, ...params },
        });
      } else {
        cy.fixture(filename, 'base64').then((content) => cy.request({
          method: 'POST',
          url: `${restUrl}/user-parameters`,
          auth: { bearer: token },
          body: { content, ...params },
        }));
      }
    });
  },
);
