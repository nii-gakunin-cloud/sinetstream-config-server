/// <reference types='../support' />
import { skipOn } from '@cypress/skip-test';

describe('ユーザパラメータに関するテスト', () => {
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();
  const user1 = 'test-001';
  const userEmail1 = 'test-001@example.org';
  const userDisplay1 = 'テストユーザ 001';
  const password1 = 'pass-001';
  const stream1 = 'test-stream-001';
  let streamId1: number;
  const target = '*.tls.ca_certs';
  const targetA = '*.certs1';
  const targetB = '*.certs2';
  const comment = 'comment';
  const file0 = 'id_rsa_pub.pem';
  const file1 = 'key-128';
  const value0 = 'abcdefg';
  const value1 = 'xyz012';
  const binaryLabel = '(ファイル)';
  const secretLabel = '•••••';

  describe('ユーザパラメータ一覧画面', () => {
    it('一覧表示', () => {
      cy.get('table tbody tr:nth-child(8)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(secretLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 1`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(7)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(secretLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 2`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(6)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 3`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(5)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetB);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 4`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(4)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetB);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 5`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(3)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 6`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 7`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 8`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
    });

    it('一覧画面の検索', () => {
      // ユーザ名
      cy.get('header input[data-cy=search]').as('search');
      cy.get('@search').type(user1);
      cy.get('table tbody tr:nth-child(4)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(secretLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 2`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(3)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 3`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 6`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 7`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });

      // パラメータ名
      cy.get('@search').clear().type(targetB);
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetB);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 4`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetB);
        cy.get('td:nth-child(5)').contains(binaryLabel);
        cy.get('td:nth-child(6)').contains(`${comment} 5`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });

      // 設定値
      cy.get('@search').clear().type(value0);
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 3`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(username);
        cy.get('td:nth-child(4)').contains(targetB);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 4`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });

      // コメント
      cy.get('@search').clear().type(`${comment} 3`);
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(user1);
        cy.get('td:nth-child(4)').contains(targetA);
        cy.get('td:nth-child(5)').contains(value0);
        cy.get('td:nth-child(6)').contains(`${comment} 3`);
        cy.get('button[data-cy=btn-update-user-parameter]');
        cy.get('button[data-cy=btn-delete-user-parameter]');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addUserParameter(token, streamId1, username, targetA, value0, null, true, true, `${comment} 1`);
        cy.addUserParameter(token, streamId1, user1, targetA, value0, null, true, false, `${comment} 2`);
        cy.addUserParameter(token, streamId1, user1, targetA, value0, null, false, true, `${comment} 3`);
        cy.addUserParameter(token, streamId1, username, targetB, value0, null, false, false, `${comment} 4`);
        cy.addUserParameter(token, streamId1, username, targetB, null, file0, true, true, `${comment} 5`);
        cy.addUserParameter(token, streamId1, user1, targetA, null, file0, true, false, `${comment} 6`);
        cy.addUserParameter(token, streamId1, user1, targetA, null, file0, false, true, `${comment} 7`);
        cy.addUserParameter(token, streamId1, username, targetA, null, file0, false, false, `${comment} 8`);
      });
      cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
    });
  });

  describe('ユーザパラメータ登録ダイアログ', () => {
    describe('テキストの設定値', () => {
      [true, false].forEach((secret) => {
        [true, false].forEach((enabled) => {
          it(`secret=${secret} enabled=${enabled}`, () => {
            cy.get('form header div').contains('ユーザパラメータの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-value]').as('value');
                cy.get('[data-cy=input-binary]').as('binary');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');

                cy.get('@value').should('have.value', '');
                cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', '');
                cy.get('@comment').should('have.value', '');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');

                cy.get('@user').type(`${user1}{enter}`, { force: true });
                cy.get('@value').type(value0);
                cy.get('@target').type(target);
                cy.get('@comment').type(comment);
                if (!secret) {
                  cy.get('@secret').uncheck({ force: true });
                }
                if (!enabled) {
                  cy.get('@enabled').uncheck({ force: true });
                }
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの登録').should('not.exist');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
              cy.get('td:nth-child(3)').contains(user1);
              cy.get('td:nth-child(4)').contains(target);
              cy.get('td:nth-child(5)').contains(secret ? secretLabel : value0);
              cy.get('td:nth-child(6)').contains(comment);
              cy.get('button[data-cy=btn-update-user-parameter]');
              cy.get('button[data-cy=btn-delete-user-parameter]');
            });
          });

          it(`secret=${secret} enabled=${enabled}: ファイル選択後にテキスト入力`, () => {
            cy.get('form header div').contains('ユーザパラメータの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-value]').as('value');
                cy.get('[data-cy=input-file]').as('file');
                cy.get('[data-cy=input-binary]').as('binary');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');

                cy.get('@value').should('have.value', '');
                cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', '');
                cy.get('@comment').should('have.value', '');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');

                cy.get('@user').type(`${user1}{enter}`, { force: true });
                cy.get('@binary').check({ force: true });
                cy.fixture(file1, 'base64').then((data) => {
                  cy.get('@file').attachFile({
                    fileContent: data,
                    filePath: file1,
                    fileName: file1,
                    encoding: 'base64',
                    mimeType: 'application/octet-stream',
                  });
                });
                cy.get('@binary').uncheck({ force: true });
                cy.get('@value').type(value0);
                cy.get('@target').type(target);
                cy.get('@comment').type(comment);
                if (!secret) {
                  cy.get('@secret').uncheck({ force: true });
                }
                if (!enabled) {
                  cy.get('@enabled').uncheck({ force: true });
                }
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの登録').should('not.exist');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
              cy.get('td:nth-child(3)').contains(user1);
              cy.get('td:nth-child(4)').contains(target);
              cy.get('td:nth-child(5)').contains(secret ? secretLabel : value0);
              cy.get('td:nth-child(6)').contains(comment);
              cy.get('button[data-cy=btn-update-user-parameter]');
              cy.get('button[data-cy=btn-delete-user-parameter]');
            });
          });
        });
      });
    });

    describe('ファイル指定の設定値', () => {
      [true, false].forEach((secret) => {
        [true, false].forEach((enabled) => {
          it(`secret=${secret} enabled=${enabled}`, () => {
            cy.get('form header div').contains('ユーザパラメータの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-value]').as('value');
                cy.get('[data-cy=input-file]').as('file');
                cy.get('[data-cy=input-binary]').as('binary');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');

                cy.get('@value').should('have.value', '');
                cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', '');
                cy.get('@comment').should('have.value', '');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');

                cy.get('@user').type(`${username}{enter}`, { force: true });
                cy.get('@binary').check({ force: true });
                cy.fixture(file1, 'base64').then((data) => {
                  cy.get('@file').attachFile({
                    fileContent: data,
                    filePath: file1,
                    fileName: file1,
                    encoding: 'base64',
                    mimeType: 'application/octet-stream',
                  });
                });
                cy.get('@target').type(target);
                cy.get('@comment').type(comment);
                if (!secret) {
                  cy.get('@secret').uncheck({ force: true });
                }
                if (!enabled) {
                  cy.get('@enabled').uncheck({ force: true });
                }
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの登録').should('not.exist');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
              cy.get('td:nth-child(3)').contains(username);
              cy.get('td:nth-child(4)').contains(target);
              cy.get('td:nth-child(5)').contains(binaryLabel);
              cy.get('td:nth-child(6)').contains(comment);
              cy.get('button[data-cy=btn-update-user-parameter]');
              cy.get('button[data-cy=btn-delete-user-parameter]');
            });
          });

          it(`secret=${secret} enabled=${enabled}: テキスト入力後にファイル選択する`, () => {
            cy.get('form header div').contains('ユーザパラメータの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-value]').as('value');
                cy.get('[data-cy=input-file]').as('file');
                cy.get('[data-cy=input-binary]').as('binary');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');

                cy.get('@value').should('have.value', '');
                cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', '');
                cy.get('@comment').should('have.value', '');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');

                cy.get('@user').type(`${username}{enter}`, { force: true });
                cy.get('@value').type(value0);
                cy.get('@binary').check({ force: true });
                cy.fixture(file1, 'base64').then((data) => {
                  cy.get('@file').attachFile({
                    fileContent: data,
                    filePath: file1,
                    fileName: file1,
                    encoding: 'base64',
                    mimeType: 'application/octet-stream',
                  });
                });
                cy.get('@target').type(target);
                cy.get('@comment').type(comment);
                if (!secret) {
                  cy.get('@secret').uncheck({ force: true });
                }
                if (!enabled) {
                  cy.get('@enabled').uncheck({ force: true });
                }
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの登録').should('not.exist');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
              cy.get('td:nth-child(3)').contains(username);
              cy.get('td:nth-child(4)').contains(target);
              cy.get('td:nth-child(5)').contains(binaryLabel);
              cy.get('td:nth-child(6)').contains(comment);
              cy.get('button[data-cy=btn-update-user-parameter]');
              cy.get('button[data-cy=btn-delete-user-parameter]');
            });
          });
        });
      });
    });

    describe('バリデーション', () => {
      it('target', () => {
        cy.get('form header div').contains('ユーザパラメータの登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-user]').as('user');
            cy.get('[data-cy=input-value]').as('value');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('@user').type(`${username}{enter}`, { force: true });
            cy.get('@value').type(value0);
            cy.get('@btnSubmit').should('be.disabled');
            ['*', 'xxx', '*..abc', 'xxx.*.abc'].forEach((tgt) => {
              cy.get('@target').clear().type(target);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@target').clear().type(tgt);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      it('必須項目', () => {
        cy.get('form header div').contains('ユーザパラメータの登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-user]').as('user');
            cy.get('[data-cy=input-value]').as('value');
            cy.get('[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-binary]').as('binary');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-secret]').as('secret');

            // user
            cy.get('@user').parent().click();
            cy.get('@user').blur();
            cy.get('@user').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@user').type(`${username}{enter}`, { force: true });
            cy.get('@user').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });

            cy.get('@value').type(value0);
            cy.get('@target').type(target);
            cy.get('@btnSubmit').should('be.enabled');

            // target
            cy.get('@target').clear();
            cy.get('@target').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@target').type(target);
            cy.get('@target').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');

            // value(secret)
            cy.get('@value').clear();
            cy.get('@value').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@value').type(value0);
            cy.get('@value').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');

            // value(non-secret)
            cy.get('@secret').uncheck({ force: true });
            cy.get('@value').clear();
            cy.get('@value').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@value').type(value0);
            cy.get('@value').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@value').clear();

            // file
            cy.get('@binary').check({ force: true });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');
            cy.fixture(file1, 'base64').then((data) => {
              cy.get('@file').attachFile({
                fileContent: data,
                filePath: file1,
                fileName: file1,
                encoding: 'base64',
                mimeType: 'application/octet-stream',
              });
            });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');

            // binary switch
            cy.get('@binary').uncheck({ force: true });
            cy.get('@value').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');
          });
      });
    });

    it('キャンセルボタン', () => {
      cy.get('form header div').contains('ユーザパラメータの登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('[data-cy=input-user]').as('user');
          cy.get('[data-cy=input-value]').as('value');
          cy.get('[data-cy=input-file]').as('file');
          cy.get('[data-cy=input-binary]').as('binary');
          cy.get('[data-cy=input-secret]').as('secret');
          cy.get('[data-cy=input-target]').as('target');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('[data-cy=input-enabled]').as('enabled');

          cy.get('@value').should('have.value', '');
          cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@target').should('have.value', '');
          cy.get('@comment').should('have.value', '');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');

          cy.get('@user').type(`${user1}{enter}`, { force: true });
          cy.get('@value').type(value0);
          cy.get('@binary').check({ force: true });
          cy.fixture(file1, 'base64').then((data) => {
            cy.get('@file').attachFile({
              fileContent: data,
              filePath: file1,
              fileName: file1,
              encoding: 'base64',
              mimeType: 'application/octet-stream',
            });
          });
          cy.get('@target').type(target);
          cy.get('@comment').type(comment);
          cy.get('@secret').uncheck({ force: true });
          cy.get('@enabled').uncheck({ force: true });
          cy.get('@btnCancel').click();
        });
      cy.contains('ユーザパラメータの登録').should('not.exist');
      cy.get('table td').contains('データはありません。');
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('ユーザパラメータの登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('@user').should('have.value', '');
          cy.get('@value').should('have.value', '');
          cy.get('@binary').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@target').should('have.value', '');
          cy.get('@comment').should('have.value', '');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
        });
    });

    beforeEach(() => {
      cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('ユーザパラメータの登録');
    });
  });

  describe('ユーザパラメータ更新ダイアログ', () => {
    describe('設定値の変更', () => {
      describe('テキスト', () => {
        [true, false].forEach((oldSecret) => {
          [true, false].forEach((secret) => {
            describe(`secret: ${oldSecret} -> ${secret}`, () => {
              it('更新の実行', () => {
                cy.get('form header div').contains('ユーザパラメータの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                    cy.get('[data-cy=input-user]').as('user');
                    cy.get('[data-cy=input-value]').as('value');
                    cy.get('[data-cy=input-secret]').as('secret');
                    cy.get('[data-cy=input-target]').as('target');
                    cy.get('[data-cy=input-comment]').as('comment');
                    cy.get('[data-cy=input-enabled]').as('enabled');
                    cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                    cy.get('@user').parent().get('div.v-select__selection').contains(user1);
                    cy.get('@value').should('have.value', oldSecret ? '' : value0);
                    cy.get('@secret').invoke('attr', 'aria-checked').should('eq', oldSecret.toString());
                    cy.get('@target').should('have.value', target);
                    cy.get('@comment').should('have.value', comment);
                    cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                    cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                    cy.get('[data-cy=input-file]').should('not.exist');
                    cy.get('[data-cy=input-binary]').should('not.exist');

                    cy.get('@value').clear().type(value1);
                    if (oldSecret !== secret) {
                      cy.get('@secret').parent().click();
                      cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                    }
                    cy.get('@btnSubmit').click();
                  });
                cy.contains('ユーザパラメータの更新').should('not.exist');
                cy.get('table tbody tr').within(() => {
                  cy.get('td:nth-child(1) i.mdi-check').should('exist');
                  cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
                  cy.get('td:nth-child(3)').contains(user1);
                  cy.get('td:nth-child(4)').contains(target);
                  cy.get('td:nth-child(5)').contains(secret ? secretLabel : value1);
                  cy.get('td:nth-child(6)').contains(comment);
                  cy.get('button[data-cy=btn-update-user-parameter]');
                  cy.get('button[data-cy=btn-delete-user-parameter]');
                });
              });

              beforeEach(() => {
                cy.userToken(username, password).then((token) => {
                  cy.addUserParameter(
                    token, streamId1, user1, target, value0, null, oldSecret, true, comment,
                  );
                });
                cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
                cy.get('button[data-cy=btn-update-user-parameter]').click();
                cy.get('form header div').contains('ユーザパラメータの更新');
              });
            });
          });
        });
      });

      describe('バイナリ', () => {
        [false, true].forEach((oldSecret) => {
          [false, true].forEach((secret) => {
            describe(`secret: ${oldSecret} -> ${secret}`, () => {
              it('更新の実行', () => {
                cy.get('form header div').contains('ユーザパラメータの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                    cy.get('[data-cy=input-user]').as('user');
                    cy.get('[data-cy=input-file]').as('file');
                    cy.get('[data-cy=input-secret]').as('secret');
                    cy.get('[data-cy=input-target]').as('target');
                    cy.get('[data-cy=input-comment]').as('comment');
                    cy.get('[data-cy=input-enabled]').as('enabled');
                    cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                    cy.get('@user').parent().get('div.v-select__selection').contains(user1);
                    cy.get('@secret').invoke('attr', 'aria-checked').should('eq', oldSecret.toString());
                    cy.get('@target').should('have.value', target);
                    cy.get('@comment').should('have.value', comment);
                    cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                    cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                    cy.get('[data-cy=input-value]').should('not.exist');
                    cy.get('[data-cy=input-binary]').should('not.exist');

                    cy.fixture(file1, 'base64').then((data) => {
                      cy.get('@file').attachFile({
                        fileContent: data,
                        filePath: file1,
                        fileName: file1,
                        encoding: 'base64',
                        mimeType: 'application/octet-stream',
                      });
                    });

                    if (secret !== oldSecret) {
                      cy.get('@secret').parent().click();
                      cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                    }
                    cy.get('@btnSubmit').click();
                  });
                cy.contains('ユーザパラメータの更新').should('not.exist');
                cy.get('table tbody tr').within(() => {
                  cy.get('td:nth-child(1) i.mdi-check').should('exist');
                  cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
                  cy.get('td:nth-child(3)').contains(user1);
                  cy.get('td:nth-child(4)').contains(target);
                  cy.get('td:nth-child(5)').contains(binaryLabel);
                  cy.get('td:nth-child(6)').contains(comment);
                  cy.get('button[data-cy=btn-update-user-parameter]');
                  cy.get('button[data-cy=btn-delete-user-parameter]');
                });
              });

              beforeEach(() => {
                cy.userToken(username, password).then((token) => {
                  cy.addUserParameter(
                    token, streamId1, user1, target, null, file0, oldSecret, true, comment,
                  );
                });
                cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
                cy.get('button[data-cy=btn-update-user-parameter]').click();
                cy.get('form header div').contains('ユーザパラメータの更新');
              });
            });
          });
        });
      });
    });

    describe('秘匿情報フラグの変更', () => {
      describe('テキスト', () => {
        [false, true].forEach((secret) => {
          describe(`secret: ${secret}`, () => {
            it('更新の実行', () => {
              cy.get('form header div').contains('ユーザパラメータの更新')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                  cy.get('[data-cy=input-user]').as('user');
                  cy.get('[data-cy=input-value]').as('value');
                  cy.get('[data-cy=input-secret]').as('secret');
                  cy.get('[data-cy=input-target]').as('target');
                  cy.get('[data-cy=input-comment]').as('comment');
                  cy.get('[data-cy=input-enabled]').as('enabled');
                  cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                  cy.get('@user').parent().get('div.v-select__selection').contains(user1);
                  cy.get('@value').should('have.value', secret ? value0 : '');
                  cy.get('@secret').invoke('attr', 'aria-checked').should('eq', (!secret).toString());
                  cy.get('@target').should('have.value', target);
                  cy.get('@comment').should('have.value', comment);
                  cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                  cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                  cy.get('[data-cy=input-file]').should('not.exist');
                  cy.get('[data-cy=input-binary]').should('not.exist');
                  cy.get('@secret').parent().click();
                  cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                  cy.get('@btnSubmit').click();
                });
              cy.contains('ユーザパラメータの更新').should('not.exist');
              cy.get('table tbody tr').within(() => {
                cy.get('td:nth-child(1) i.mdi-check').should('exist');
                cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
                cy.get('td:nth-child(3)').contains(user1);
                cy.get('td:nth-child(4)').contains(target);
                cy.get('td:nth-child(5)').contains(secret ? secretLabel : value0);
                cy.get('td:nth-child(6)').contains(comment);
                cy.get('button[data-cy=btn-update-user-parameter]');
                cy.get('button[data-cy=btn-delete-user-parameter]');
              });
            });

            beforeEach(() => {
              cy.userToken(username, password).then((token) => {
                cy.addUserParameter(
                  token, streamId1, user1, target, value0, null, !secret, true, comment,
                );
              });
              cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
              cy.get('button[data-cy=btn-update-user-parameter]').click();
              cy.get('form header div').contains('ユーザパラメータの更新');
            });
          });
        });
      });

      describe('バイナリ', () => {
        [false, true].forEach((secret) => {
          describe(`secret: ${secret}`, () => {
            it('更新の実行', () => {
              cy.get('form header div').contains('ユーザパラメータの更新')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                  cy.get('[data-cy=input-user]').as('user');
                  cy.get('[data-cy=input-file]').as('file');
                  cy.get('[data-cy=input-secret]').as('secret');
                  cy.get('[data-cy=input-target]').as('target');
                  cy.get('[data-cy=input-comment]').as('comment');
                  cy.get('[data-cy=input-enabled]').as('enabled');
                  cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                  cy.get('@user').parent().get('div.v-select__selection').contains(user1);
                  cy.get('@secret').invoke('attr', 'aria-checked').should('eq', (!secret).toString());
                  cy.get('@target').should('have.value', target);
                  cy.get('@comment').should('have.value', comment);
                  cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                  cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                  cy.get('[data-cy=input-value]').should('not.exist');
                  cy.get('[data-cy=input-binary]').should('not.exist');
                  cy.get('@secret').parent().click();
                  cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                  cy.get('@btnSubmit').click();
                });
              cy.contains('ユーザパラメータの更新').should('not.exist');
              cy.get('table tbody tr').within(() => {
                cy.get('td:nth-child(1) i.mdi-check').should('exist');
                cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
                cy.get('td:nth-child(3)').contains(user1);
                cy.get('td:nth-child(4)').contains(target);
                cy.get('td:nth-child(5)').contains(binaryLabel);
                cy.get('td:nth-child(6)').contains(comment);
                cy.get('button[data-cy=btn-update-user-parameter]');
                cy.get('button[data-cy=btn-delete-user-parameter]');
              });
            });

            beforeEach(() => {
              cy.userToken(username, password).then((token) => {
                cy.addUserParameter(
                  token, streamId1, user1, target, null, file0, !secret, true, comment,
                );
              });
              cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
              cy.get('button[data-cy=btn-update-user-parameter]').click();
              cy.get('form header div').contains('ユーザパラメータの更新');
            });
          });
        });
      });
    });

    skipOn('ci', () => {
      [false, true].forEach((enabled) => {
        describe(`有効フラグ: ${enabled}`, () => {
          it('変更の実行', () => {
            cy.get('form header div').contains('ユーザパラメータの更新')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-enabled]').as('enabled');
                cy.get('@enabled').parent().click();
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', enabled.toString());
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの更新').should('not.exist');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
              cy.get('td:nth-child(3)').contains(user1);
              cy.get('td:nth-child(4)').contains(target);
              cy.get('td:nth-child(5)').contains(value0);
              cy.get('td:nth-child(6)').contains(comment);
              cy.get('button[data-cy=btn-update-user-parameter]');
              cy.get('button[data-cy=btn-delete-user-parameter]');
            });
          });

          beforeEach(() => {
            cy.userToken(username, password).then((token) => {
              cy.addUserParameter(
                token, streamId1, user1, target, value0, null, false, !enabled, comment,
              );
            });
            cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
            cy.get('button[data-cy=btn-update-user-parameter]').click();
            cy.get('form header div').contains('ユーザパラメータの更新');
          });
        });
      });
    });

    describe('その他', () => {
      it('targetの変更', () => {
        cy.get('form header div').contains('ユーザパラメータの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('@target').clear().type(targetA);
            cy.get('@btnSubmit').click();
          });
        cy.contains('ユーザパラメータの更新').should('not.exist');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(user1);
          cy.get('td:nth-child(4)').contains(targetA);
          cy.get('td:nth-child(5)').contains(value0);
          cy.get('td:nth-child(6)').contains(comment);
          cy.get('button[data-cy=btn-update-user-parameter]');
          cy.get('button[data-cy=btn-delete-user-parameter]');
        });
      });

      it('commentの変更', () => {
        const newComment = `new ${comment}`;
        cy.get('form header div').contains('ユーザパラメータの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('@comment').clear().type(newComment);
            cy.get('@btnSubmit').click();
          });
        cy.contains('ユーザパラメータの更新').should('not.exist');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(user1);
          cy.get('td:nth-child(4)').contains(target);
          cy.get('td:nth-child(5)').contains(value0);
          cy.get('td:nth-child(6)').contains(newComment);
          cy.get('button[data-cy=btn-update-user-parameter]');
          cy.get('button[data-cy=btn-delete-user-parameter]');
        });
      });

      it('バリデーション: target', () => {
        cy.get('form header div').contains('ユーザパラメータの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('@btnSubmit').should('be.enabled');
            ['*', 'xxx', '*..abc', 'xxx.*.abc'].forEach((tgt) => {
              cy.get('@target').clear().type(target);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@target').clear().type(tgt);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addUserParameter(token, streamId1, user1, target, value0, null, false, true, comment);
        });
        cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
        cy.get('button[data-cy=btn-update-user-parameter]').click();
        cy.get('form header div').contains('ユーザパラメータの更新');
      });
    });

    describe('キャンセルボタン', () => {
      describe('テキスト', () => {
        it('値が更新されないこと', () => {
          cy.get('form header div').contains('ユーザパラメータの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-user]').as('user');
              cy.get('[data-cy=input-value]').as('value');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@user').parent().get('div.v-select__selection').contains(user1);
              cy.get('@value').should('have.value', value0);
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@target').should('have.value', target);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-file]').should('not.exist');
              cy.get('[data-cy=input-binary]').should('not.exist');
              cy.get('@value').clear().type(value1);
              cy.get('@secret').parent().click();
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').clear().type(targetA);
              cy.get('@comment').clear().type(`new ${comment}`);
              cy.get('@enabled').parent().click();
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@btnCancel').click();
            });
          cy.contains('ユーザパラメータの更新').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('exist');
            cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
            cy.get('td:nth-child(3)').contains(user1);
            cy.get('td:nth-child(4)').contains(target);
            cy.get('td:nth-child(5)').contains(value0);
            cy.get('td:nth-child(6)').contains(comment);
            cy.get('button[data-cy=btn-update-user-parameter]');
            cy.get('button[data-cy=btn-delete-user-parameter]');
          });
          cy.get('button[data-cy=btn-update-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@user').parent().get('div.v-select__selection').contains(user1);
              cy.get('@value').should('have.value', value0);
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@target').should('have.value', target);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addUserParameter(
              token, streamId1, user1, target, value0, null, false, true, comment,
            );
          });
          cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
          cy.get('button[data-cy=btn-update-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの更新');
        });
      });

      describe('バイナリ', () => {
        it('値が更新されないこと', () => {
          cy.get('form header div').contains('ユーザパラメータの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-user]').as('user');
              cy.get('[data-cy=input-file]').as('file');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@user').parent().get('div.v-select__selection').contains(user1);
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@target').should('have.value', target);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-value]').should('not.exist');
              cy.get('[data-cy=input-binary]').should('not.exist');
              cy.fixture(file1, 'base64').then((data) => {
                cy.get('@file').attachFile({
                  fileContent: data,
                  filePath: file1,
                  fileName: file1,
                  encoding: 'base64',
                  mimeType: 'application/octet-stream',
                });
              });
              cy.get('@secret').parent().click();
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').clear().type(targetA);
              cy.get('@comment').clear().type(`new ${comment}`);
              cy.get('@enabled').parent().click();
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@btnCancel').click();
            });
          cy.contains('ユーザパラメータの更新').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('exist');
            cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
            cy.get('td:nth-child(3)').contains(user1);
            cy.get('td:nth-child(4)').contains(target);
            cy.get('td:nth-child(5)').contains(binaryLabel);
            cy.get('td:nth-child(6)').contains(comment);
            cy.get('button[data-cy=btn-update-user-parameter]');
            cy.get('button[data-cy=btn-delete-user-parameter]');
          });
          cy.get('button[data-cy=btn-update-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@user').parent().get('div.v-select__selection').contains(user1);
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
              cy.get('@target').should('have.value', target);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addUserParameter(token, streamId1, user1, target, null, file0, false, true, comment);
          });
          cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
          cy.get('button[data-cy=btn-update-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの更新');
        });
      });
    });
  });

  describe('ユーザパラメータ削除ダイアログ', () => {
    [true, false].forEach((secret) => {
      [true, false].forEach((enabled) => {
        describe(`テキスト: secret=${secret} enabled=${enabled}`, () => {
          it('削除の実行', () => {
            cy.get('form header div').contains('ユーザパラメータの削除')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');
                cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
                cy.get('@user').should('have.value', user1);
                cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                if (!secret) {
                  cy.get('[data-cy=input-value]').as('value');
                  cy.get('@value').should('have.value', value0);
                  cy.get('@value').invoke('attr', 'readonly').should('eq', 'readonly');
                }
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
                cy.get('@target').should('have.value', target);
                cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@comment').should('have.value', comment);
                cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', enabled.toString());
                cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの削除').should('not.exist');
            cy.get('table td').contains('データはありません。');
          });

          beforeEach(() => {
            cy.userToken(username, password).then((token) => {
              cy.addUserParameter(
                token, streamId1, user1, target, value0, null, secret, enabled, comment,
              );
            });
            cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
            cy.get('button[data-cy=btn-delete-user-parameter]').click();
            cy.get('form header div').contains('ユーザパラメータの削除');
          });
        });

        describe(`バイナリ: secret=${secret} enabled=${enabled}`, () => {
          it('削除の実行', () => {
            cy.get('form header div').contains('ユーザパラメータの削除')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('[data-cy=input-user]').as('user');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');
                cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
                cy.get('@user').should('have.value', user1);
                cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
                cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
                cy.get('@target').should('have.value', target);
                cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@comment').should('have.value', comment);
                cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', enabled.toString());
                cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
                cy.get('@btnSubmit').click();
              });
            cy.contains('ユーザパラメータの削除').should('not.exist');
            cy.get('table td').contains('データはありません。');
          });

          beforeEach(() => {
            cy.userToken(username, password).then((token) => {
              cy.addUserParameter(
                token, streamId1, user1, target, null, file0, secret, enabled, comment,
              );
            });
            cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
            cy.get('button[data-cy=btn-delete-user-parameter]').click();
            cy.get('form header div').contains('ユーザパラメータの削除');
          });
        });
      });
    });

    describe('キャンセルボタン', () => {
      describe('テキスト', () => {
        it('値が更新されないこと', () => {
          cy.get('form header div').contains('ユーザパラメータの削除')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-user]').as('user');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
              cy.get('@user').should('have.value', user1);
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
              cy.get('@target').should('have.value', target);
              cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@comment').should('have.value', comment);
              cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
              cy.get('@btnCancel').click();
            });
          cy.contains('ユーザパラメータの削除').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('exist');
            cy.get('td:nth-child(2) i.mdi-lock').should('exist');
            cy.get('td:nth-child(3)').contains(user1);
            cy.get('td:nth-child(4)').contains(target);
            cy.get('td:nth-child(5)').contains(secretLabel);
            cy.get('td:nth-child(6)').contains(comment);
            cy.get('button[data-cy=btn-update-user-parameter]');
            cy.get('button[data-cy=btn-delete-user-parameter]');
          });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addUserParameter(token, streamId1, user1, target, value0, null, true, true, comment);
          });
          cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
          cy.get('button[data-cy=btn-delete-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの削除');
        });
      });

      describe('バイナリ', () => {
        it('値が更新されないこと', () => {
          cy.get('form header div').contains('ユーザパラメータの削除')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-user]').as('user');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
              cy.get('@user').should('have.value', user1);
              cy.get('@user').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
              cy.get('@target').should('have.value', target);
              cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@comment').should('have.value', comment);
              cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
              cy.get('@btnCancel').click();
            });
          cy.contains('ユーザパラメータの削除').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('exist');
            cy.get('td:nth-child(2) i.mdi-lock').should('exist');
            cy.get('td:nth-child(3)').contains(user1);
            cy.get('td:nth-child(4)').contains(target);
            cy.get('td:nth-child(5)').contains(binaryLabel);
            cy.get('td:nth-child(6)').contains(comment);
            cy.get('button[data-cy=btn-update-user-parameter]');
            cy.get('button[data-cy=btn-delete-user-parameter]');
          });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addUserParameter(token, streamId1, user1, target, null, file0, true, true, comment);
          });
          cy.visit(`/streams/${streamId1}/user-parameters`).contains(`ユーザパラメータ一覧: ${stream1}`);
          cy.get('button[data-cy=btn-delete-user-parameter]').click();
          cy.get('form header div').contains('ユーザパラメータの削除');
        });
      });
    });
  });

  beforeEach(() => {
    cy.login(username, password);
    cy.userToken(username, password).then((token) => {
      cy.clearStreams(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.addStream(token, stream1).then((resp: any) => {
        streamId1 = resp.body.id;
        cy.addMember(token, true, streamId1, user1);
      });
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
  });
});
