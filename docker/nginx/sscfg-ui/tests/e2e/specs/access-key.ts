/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types='../support' />

describe('アクセスキーに関するテスト', () => {
  const { username, password, email } = Cypress.env();
  const comment = 'comment';
  const stream1 = 'test-stream-001';
  const stream2 = 'test-stream-002';

  describe('アクセスキー一覧画面', () => {
    describe('アクセスキーが登録されていない場合', () => {
      it('一覧画面の表示', () => {
        cy.contains('データはありません。');
      });
    });

    describe('全てのコンフィグ情報に対するアクセスキーが登録されている場合', () => {
      it('一覧画面の表示', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', '利用可能な全てのコンフィグ情報');
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      it('アクセスキーのダウンロード', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first().within(() => {
          cy.get('[data-cy=btn-download]').downloadBlob().then((dl) => {
            cy.wrap(JSON.parse(dl)).its('config-server').as('cfgsrv');
            cy.get('@cfgsrv').its('user').should('equal', username);
            cy.get('@cfgsrv').its('address').should((v) => {
              expect(document.URL).to.contain(v);
            });
            cy.get('@cfgsrv').should('have.property', 'secret-key');
            cy.get('@cfgsrv').should('have.property', 'expiration-date');
          });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addAccessKey(token, true, null, comment);
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
      });
    });

    describe('一つのコンフィグ情報に対するアクセスキーが登録されている場合', () => {
      it('一覧画面の表示', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', stream1);
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      it('アクセスキーのダウンロード', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first().within(() => {
          cy.get('[data-cy=btn-download]').downloadBlob().then((dl) => {
            cy.wrap(JSON.parse(dl)).its('config-server').as('cfgsrv');
            cy.get('@cfgsrv').its('user').should('equal', username);
            cy.get('@cfgsrv').its('address').should((v) => {
              expect(document.URL).to.contain(v);
            });
            cy.get('@cfgsrv').should('have.property', 'secret-key');
            cy.get('@cfgsrv').should('have.property', 'expiration-date');
          });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1).then((resp: any) => {
            const sid = resp.body.id;
            cy.addAccessKey(token, false, [sid], comment);
          });
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
      });
    });

    describe('二つのコンフィグ情報に対するアクセスキーが登録されている場合', () => {
      it('一覧画面の表示', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', stream1)
              .and('include.text', stream2);
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1)
            .then((resp: any) => (resp.body.id))
            .then((sid1: number) => cy.addStream(token, stream2)
              .then((resp: any) => (resp.body.id))
              .then((sid2: number) => ([sid1, sid2]))).then((sids: [number]) => {
              cy.addAccessKey(token, false, sids, comment);
            });
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
      });
    });

    describe('アクセス可能なコンフィグ情報が存在しないアクセスキーが登録されている場合', () => {
      it('一覧画面の表示', () => {
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', '対象となるコンフィグ情報が存在しない');
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
            cy.get('[data-cy=btn-delete]');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1).then((resp: any) => {
            const sid = resp.body.id;
            cy.addAccessKey(token, false, [sid], comment);
          });
          cy.clearStreams(token);
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.clearAccessKeys(token);
        cy.clearStreams(token);
      });
      cy.visit('/access-keys').contains('APIアクセスキーの一覧');
    });
  });

  describe('アクセスキー登録ダイアログ', () => {
    describe('コンフィグ情報が登録されていない場合', () => {
      it('アクセスキーの登録', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('input[data-cy=radio-all-permitted]').as('rdAllPermitted');
          cy.get('input[data-cy=radio-select-individual]').as('rdSelectIndividual');
          cy.get('@rdAllPermitted').should('be.checked').and('be.disabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.disabled');

          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').click();
        });
        cy.contains('form header', 'APIアクセスキーの作成').should('not.exist');

        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', '利用可能な全てのコンフィグ情報');
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('input[data-cy=radio-all-permitted]').as('rdAllPermitted');
          cy.get('input[data-cy=radio-select-individual]').as('rdSelectIndividual');
          cy.get('@rdAllPermitted').should('be.checked').and('be.disabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.disabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnCancel').click();
        });
        cy.contains('form header', 'APIアクセスキーの作成').should('not.exist');

        cy.get('button[data-cy=btn-create]').click();
        cy.contains('APIアクセスキーの作成');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('@rdAllPermitted').should('be.checked').and('be.disabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.disabled');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'APIアクセスキーの作成');
      });
    });

    describe('コンフィグ情報が登録されている場合', () => {
      it('全てのコンフィグ情報をアクセスキーの対象とする場合', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('input[data-cy=radio-all-permitted]').as('rdAllPermitted');
          cy.get('input[data-cy=radio-select-individual]').as('rdSelectIndividual');
          cy.get('@rdAllPermitted').should('be.checked').and('be.enabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.enabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').click();
        });
        cy.contains('form header', 'APIアクセスキーの作成').should('not.exist');

        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', '利用可能な全てのコンフィグ情報');
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      it('特定のコンフィグ情報をアクセスキーの対象とする場合', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=radio-all-permitted]').as('rdAllPermitted');
          cy.get('input[data-cy=radio-select-individual]').as('rdSelectIndividual');
          cy.get('@rdAllPermitted').should('be.checked').and('be.enabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.enabled');

          cy.get('@rdSelectIndividual').check({ force: true });
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('@rdAllPermitted').check({ force: true });
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@rdSelectIndividual').check({ force: true });
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('[data-cy=check-streams]').check({ force: true });
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('[data-cy=check-streams]').uncheck({ force: true });
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('[data-cy=check-streams]').check({ force: true });
          cy.get('@btnSubmit').should('be.enabled');

          cy.get('textarea[data-cy=input-comment]').type(`${comment} ${stream1}`);
          cy.get('@btnSubmit').click();
        });
        cy.contains('form header', 'APIアクセスキーの作成').should('not.exist');

        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', stream1);
            cy.get('[data-cy=comment]')
              .should('include.text', `${comment} ${stream1}`);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('input[data-cy=radio-all-permitted]').as('rdAllPermitted');
          cy.get('input[data-cy=radio-select-individual]').as('rdSelectIndividual');
          cy.get('@rdAllPermitted').should('be.checked').and('be.enabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.enabled');
          cy.get('@rdSelectIndividual').check({ force: true });
          cy.get('[data-cy=check-streams]').check({ force: true });
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnCancel').click();
        });
        cy.contains('form header', 'APIアクセスキーの作成').should('not.exist');

        cy.get('button[data-cy=btn-create]').click();
        cy.contains('APIアクセスキーの作成');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('登録');
          cy.get('@rdAllPermitted').should('be.checked').and('be.enabled');
          cy.get('@rdSelectIndividual').should('not.be.checked').and('be.enabled');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1).then((resp: any) => {
            const sid = resp.body.id;
            cy.addAccessKey(token, false, [sid]);
          });
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'APIアクセスキーの作成');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.clearAccessKeys(token);
        cy.clearStreams(token);
      });
    });
  });

  describe('アクセスキー削除ダイアログ', () => {
    describe('全てのコンフィグ情報に対するアクセスキーが登録されている場合', () => {
      it('削除実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('[data-cy=target-configs]')
            .should('contain.text', '利用可能な全てのコンフィグ情報');
          cy.get('[data-cy=comment]')
            .should('contain.text', comment);
          cy.get('[data-cy=expiration-time]')
            .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
          cy.get('@btnSubmit').click();
        });
        cy.contains('APIアクセスキーの削除').should('not.exist');
        cy.contains('データはありません。');
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('[data-cy=target-configs]')
            .should('contain.text', '利用可能な全てのコンフィグ情報');
          cy.get('[data-cy=comment]')
            .should('contain.text', comment);
          cy.get('[data-cy=expiration-time]')
            .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
          cy.get('@btnCancel').click();
        });
        cy.contains('APIアクセスキーの削除').should('not.exist');
        cy.get('div[data-cy=target-configs]').parents('div.v-card').first()
          .within(() => {
            cy.get('[data-cy=target-configs]')
              .should('include.text', '利用可能な全てのコンフィグ情報');
            cy.get('[data-cy=comment]')
              .should('include.text', comment);
            cy.get('[data-cy=expiration-time]')
              .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
            cy.get('[data-cy=btn-download]');
            cy.get('[data-cy=btn-delete]');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addAccessKey(token, true, null, comment);
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
        cy.get('[data-cy=btn-delete]').click();
        cy.contains('APIアクセスキーの削除');
      });
    });

    describe('コンフィグ情報に対するアクセスキーが登録されている場合', () => {
      it('削除実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('[data-cy=target-configs]')
            .should('contain.text', stream1);
          cy.get('[data-cy=comment]')
            .should('contain.text', comment);
          cy.get('[data-cy=expiration-time]')
            .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
          cy.get('@btnSubmit').click();
        });
        cy.contains('APIアクセスキーの削除').should('not.exist');
        cy.contains('データはありません。');
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1).then((resp: any) => {
            const sid = resp.body.id;
            cy.addAccessKey(token, false, [sid], comment);
          });
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
        cy.get('[data-cy=btn-delete]').click();
        cy.contains('APIアクセスキーの削除');
      });
    });

    describe('アクセス可能なコンフィグ情報が存在しないアクセスキーが登録されている場合', () => {
      it('削除実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('[data-cy=target-configs]')
            .should('include.text', '対象となるコンフィグ情報が存在しない');
          cy.get('[data-cy=comment]')
            .should('contain.text', comment);
          cy.get('[data-cy=expiration-time]')
            .invoke('text').should((txt) => expect(txt.length).to.be.gt(18));
          cy.get('@btnSubmit').click();
        });

        cy.contains('APIアクセスキーの削除').should('not.exist');
        cy.contains('データはありません。');
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1).then((resp: any) => {
            const sid = resp.body.id;
            cy.addAccessKey(token, false, [sid], comment);
          });
          cy.clearStreams(token);
        });
        cy.visit('/');
        cy.visit('/access-keys').contains('APIアクセスキーの一覧');
        cy.get('[data-cy=btn-delete]').click();
        cy.contains('APIアクセスキーの削除');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.clearAccessKeys(token);
        cy.clearStreams(token);
      });
    });
  });

  beforeEach(() => {
    cy.login(username, password);
  });

  before(() => {
    cy.adminToken().then((token) => {
      cy.clearStreams(token);
    });
    cy.findUserId(username).then((uid) => {
      const userInfo = { password, email };
      if (uid == null) {
        cy.addUser({ name: username, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
  });
});
