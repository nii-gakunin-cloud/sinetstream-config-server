/// <reference types='../support' />

import * as NodeRSA from 'node-rsa';

describe('ホーム画面などに関するテスト', () => {
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();
  const user1 = 'test-001';
  const userEmail1 = 'test-001@example.org';
  const userDisplay1 = 'テストユーザ 001';
  const password1 = 'pass-001';
  const stream1 = 'test-stream-001-admin-config';
  const stream2 = 'test-stream-002-member-config';
  const stream3 = 'test-stream-003-admin-noconfig';
  let pubKey: string;

  describe('ホーム画面', () => {
    describe('既に登録されている場合', () => {
      [
        { name: 'コンフィグ情報', count: { count: 2, 'count-admin': 1 } },
        { name: 'ユーザ公開鍵' },
        { name: 'APIアクセスキー', header1: 'APIアクセスキーの作成' },
      ].forEach((params) => {
        const { name, count: cnt, header1: hdr1 } = params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count: Record<string, any> = cnt != null ? cnt : { count: 1 };
        const header1 = hdr1 != null ? hdr1 : `${name}の登録`;

        it(`表示要素の確認: ${name}`, () => {
          cy.contains('header.success', name).parent('div.v-card').within(() => {
            Object.entries(count).forEach((x) => {
              cy.get(`[data-cy=${x[0]}]`).invoke('text').should('equal', x[1].toString());
            });
            cy.get('[data-cy=btn-list]').as('cfg-list');
            cy.get('[data-cy=btn-create]').as('cfg-create');
            cy.get('@cfg-create').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-cancel]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@cfg-list').click();
          cy.contains('header.v-app-bar', name);
        });
      });

      describe('登録でカウンターが更新されること', () => {
        it('コンフィグ情報', () => {
          const name = 'コンフィグ情報';
          const header1 = `${name}の登録`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('[data-cy=count-admin]').as('admin');
            cy.get('@count').invoke('text').should('equal', '2');
            cy.get('@admin').invoke('text').should('equal', '1');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('input[data-cy=input-name]').type(stream1).blur();
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '3');
          cy.get('@admin').invoke('text').should('equal', '2');
        });

        it('ユーザ公開鍵', () => {
          const name = 'ユーザ公開鍵';
          const header1 = `${name}の登録`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('@count').invoke('text').should('equal', '1');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('textarea[data-cy=input-public-key]').type(pubKey);
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '2');
        });

        it('APIアクセスキー', () => {
          const name = 'APIアクセスキー';
          const header1 = `${name}の作成`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('@count').invoke('text').should('equal', '1');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '2');
        });
      });

      beforeEach(() => {
        cy.adminToken().then((token) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cy.addStream(token, stream2).then((resp: any) => {
            const sid = resp.body.id;
            cy.addMember(token, false, sid, username);
          });
        });
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream3);
          cy.addPublicKey(token);
          cy.addAccessKey(token);
        });
        cy.visit('/').contains('SINETStream コンフィグサーバ');
      });
    });

    describe('まだ登録されていない場合', () => {
      [
        { name: 'コンフィグ情報', count: ['count', 'count-admin'] },
        { name: 'ユーザ公開鍵' },
        { name: 'APIアクセスキー', header1: 'APIアクセスキーの作成' },
      ].forEach((params) => {
        const { name, count: cnt, header1: hdr1 } = params;
        const count = cnt != null ? cnt : ['count'];
        const header1 = hdr1 != null ? hdr1 : `${name}の登録`;

        it(`表示要素の確認: ${name}`, () => {
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            count.forEach((x) => {
              cy.get(`[data-cy=${x}]`).invoke('text').should('equal', '0');
            });
            cy.get('[data-cy=btn-list]').as('cfg-list');
            cy.get('[data-cy=btn-create]').as('cfg-create');
            cy.get('@cfg-create').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-cancel]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@cfg-list').click();
          cy.contains('header.v-app-bar', name);
        });
      });

      describe('登録でカウンターが更新されること', () => {
        it('コンフィグ情報', () => {
          const name = 'コンフィグ情報';
          const header1 = `${name}の登録`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('[data-cy=count-admin]').as('admin');
            cy.get('@count').invoke('text').should('equal', '0');
            cy.get('@admin').invoke('text').should('equal', '0');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('input[data-cy=input-name]').type(stream1).blur();
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '1');
          cy.get('@admin').invoke('text').should('equal', '1');
        });

        it('ユーザ公開鍵', () => {
          const name = 'ユーザ公開鍵';
          const header1 = `${name}の登録`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('@count').invoke('text').should('equal', '0');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('textarea[data-cy=input-public-key]').type(pubKey);
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '1');
        });

        it('APIアクセスキー', () => {
          const name = 'APIアクセスキー';
          const header1 = `${name}の作成`;
          cy.contains('header.warning', name).parent('div.v-card').within(() => {
            cy.get('[data-cy=count]').as('count');
            cy.get('@count').invoke('text').should('equal', '0');
            cy.get('[data-cy=btn-create]').click();
          });
          cy.get('form header div').contains(header1)
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').click();
            });
          cy.contains(header1).should('not.exist');
          cy.get('@count').invoke('text').should('equal', '1');
        });
      });

      beforeEach(() => {
        cy.visit('/').contains('SINETStream コンフィグサーバ');
      });
    });
  });

  describe('ログイン画面', () => {
    it('ログイン成功', () => {
      cy.visit('/').contains('main div.v-card__title', 'ログイン');
      cy.get('form').within(() => {
        cy.get('[data-cy=input-user]').type(username);
        cy.get('[data-cy=input-password]').type(password);
        cy.get('[data-cy=btn-submit]').click();
      });
      cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');
    });

    describe('ログイン失敗', () => {
      it('ユーザ名が正しくない', () => {
        cy.visit('/').contains('main div.v-card__title', 'ログイン');
        cy.get('form').within(() => {
          cy.get('[data-cy=input-user]').as('user');
          cy.get('[data-cy=input-password]').as('password');
          cy.get('[data-cy=btn-submit]').as('login');
          cy.get('@user').type(`bad-${username}`);
          cy.get('@password').type(password);
          cy.get('@login').click();
          cy.get('@user').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('have.class', 'error--text');
          });
          cy.get('@password').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('have.class', 'error--text');
          });
          cy.get('@login').should('be.disabled');

          // 正しいユーザ名を入力しなおす
          cy.get('@user').clear().type(username);
          cy.get('@user').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('not.have.class', 'error--text');
          });
          cy.get('@password').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('not.have.class', 'error--text');
          });
          cy.get('@login').should('be.enabled');
          cy.get('[data-cy=btn-submit]').click();
        });
        cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');
      });

      it('パスワードが正しくない', () => {
        cy.visit('/').contains('main div.v-card__title', 'ログイン');
        cy.get('form').within(() => {
          cy.get('[data-cy=input-user]').as('user');
          cy.get('[data-cy=input-password]').as('password');
          cy.get('[data-cy=btn-submit]').as('login');
          cy.get('@user').type(username);
          cy.get('@password').type(`bad-${password}`);
          cy.get('@login').click();
          cy.get('@user').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('have.class', 'error--text');
          });
          cy.get('@password').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('have.class', 'error--text');
          });
          cy.get('@login').should('be.disabled');

          // 正しいパスワードを入力しなおす
          cy.get('@password').clear().type(password);
          cy.get('@user').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('not.have.class', 'error--text');
          });
          cy.get('@password').parents('div.v-text-field').first().within(() => {
            cy.get('div.v-messages').should('not.have.class', 'error--text');
          });
          cy.get('@login').should('be.enabled');
          cy.get('[data-cy=btn-submit]').click();
        });
        cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');
      });
    });

    beforeEach(() => {
      cy.logout();
    });
  });

  describe('ログアウト画面', () => {
    it('ログアウト', () => {
      cy.get('button[data-cy=nav-icon]').click();
      cy.get('nav').get('a[data-cy=menu-logout]').click();
      cy.contains('ログアウトしました');
      cy.get('[data-cy=link-home]').click();
      cy.contains('main div.v-card__title', 'ログイン');
      cy.get('form').within(() => {
        cy.get('[data-cy=input-user]').type(username);
        cy.get('[data-cy=input-password]').type(password);
        cy.get('[data-cy=btn-submit]').click();
      });
      cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');
    });

    beforeEach(() => {
      cy.visit('/').contains('SINETStream コンフィグサーバ');
    });
  });

  describe('AppBar', () => {
    it('表示要素の確認', () => {
      cy.visit('/').get('header').within(() => {
        cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
      });

      cy.visit('/streams').get('header').within(() => {
        cy.contains('[data-cy=title]', 'コンフィグ情報一覧');
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=search]');
        cy.get('[data-cy=btn-create]');
      });

      cy.visit('/streams').get('table tbody')
        .contains('[data-cy=lnk-config-detail]', stream1).click();
      cy.get(`header [data-cy=title]:contains("${stream1}")`);
      cy.get('header').within(() => {
        cy.contains('[data-cy=title]', `コンフィグ情報: ${stream1}`);
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
      });
      cy.get('[data-cy=btn-back]').click();
      cy.contains('[data-cy=title]', 'コンフィグ情報一覧');

      cy.visit('/streams').get('table tbody [data-cy=btn-menu]').click();
      cy.get('[data-cy=menu-encrypt-keys]').click();
      cy.get(`header [data-cy=title]:contains("${stream1}")`);
      cy.get('header').within(() => {
        cy.contains('[data-cy=title]', `データ暗号鍵一覧: ${stream1}`);
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=search]');
        cy.get('[data-cy=btn-create]');
      });
      cy.get('[data-cy=btn-back]').click();
      cy.contains('[data-cy=title]', 'コンフィグ情報一覧');

      cy.visit('/streams').get('table tbody [data-cy=btn-menu]').click();
      cy.get('[data-cy=menu-attach-files]').click();
      cy.get(`header [data-cy=title]:contains("${stream1}")`);
      cy.get('header').within(() => {
        cy.contains('[data-cy=title]', `添付ファイル一覧: ${stream1}`);
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=search]');
        cy.get('[data-cy=btn-create]');
      });
      cy.get('[data-cy=btn-back]').click();
      cy.contains('[data-cy=title]', 'コンフィグ情報一覧');

      cy.visit('/streams').get('table tbody [data-cy=btn-menu]').click();
      cy.get('[data-cy=menu-user-parameters]').click();
      cy.get(`header [data-cy=title]:contains("${stream1}")`);
      cy.get('header').within(() => {
        cy.contains('[data-cy=title]', `ユーザパラメータ一覧: ${stream1}`);
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=search]');
        cy.get('[data-cy=btn-create]');
      });
      cy.get('[data-cy=btn-back]').click();
      cy.contains('[data-cy=title]', 'コンフィグ情報一覧');

      cy.visit('/user-profile').get('header').within(() => {
        cy.contains('[data-cy=title]', 'ユーザプロフィール');
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
      });
      cy.visit('/public-keys').get('header').within(() => {
        cy.contains('[data-cy=title]', 'ユーザ公開鍵一覧');
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=search]');
        cy.get('[data-cy=btn-create]');
      });
      cy.visit('/access-keys').get('header').within(() => {
        cy.contains('[data-cy=title]', 'APIアクセスキーの一覧');
        cy.contains('[data-cy=label-user]', username);
        cy.get('button[data-cy=nav-icon]');
        cy.get('[data-cy=btn-create]');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addStream(token, stream1);
      });
    });
  });

  it('メインメニュー', () => {
    cy.visit('/');
    cy.get('button[data-cy=nav-icon]').click();
    cy.get('[data-cy=menu-configs]').click();
    cy.contains('[data-cy=title]', 'コンフィグ情報一覧');

    cy.get('button[data-cy=nav-icon]').click();
    cy.get('[data-cy=menu-user-profile]').click();
    cy.contains('[data-cy=title]', 'ユーザプロフィール');

    cy.get('button[data-cy=nav-icon]').click();
    cy.get('[data-cy=menu-public-keys]').click();
    cy.contains('[data-cy=title]', 'ユーザ公開鍵一覧');

    cy.get('button[data-cy=nav-icon]').click();
    cy.get('[data-cy=menu-access-keys]').click();
    cy.contains('[data-cy=title]', 'APIアクセスキーの一覧');

    cy.get('button[data-cy=nav-icon]').click();
    cy.get('[data-cy=menu-home]').click();
    cy.contains('[data-cy=title]', 'SINETStream コンフィグサーバ');

    cy.get('button[data-cy=nav-icon]').click();
    cy.get('a[data-cy=menu-manual]').should('have.attr', 'href', '/manual/');

    cy.get('[data-cy=menu-logout]').click();
    cy.contains('ログアウトしました');
  });

  beforeEach(() => {
    cy.login(username, password);
    cy.adminToken().then((token) => {
      cy.clearStreams(token);
    });
    cy.userToken(username, password).then((token) => {
      cy.clearStreams(token);
      cy.clearPublicKeys(token);
      cy.clearAccessKeys(token);
    });
  });

  before(() => {
    cy.findUserId(username).then((uid) => {
      const userInfo = { password, email, displayName };
      if (uid == null) {
        cy.addUser({ name: username, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
    cy.findUserId(user1).then((uid) => {
      const userInfo = { email: userEmail1, displayName: userDisplay1, password: password1 };
      if (uid == null) {
        cy.addUser({ name: user1, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
    const rsa = new NodeRSA();
    rsa.generateKeyPair();
    pubKey = rsa.exportKey('public');
  });
});
