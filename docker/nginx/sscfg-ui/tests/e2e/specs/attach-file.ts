/// <reference types='../support' />
import * as dayjs from 'dayjs';
import { skipOn } from '@cypress/skip-test';

describe('添付ファイルに関するテスト', () => {
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

  describe('添付ファイル一覧画面', () => {
    it('一覧表示', () => {
      const today = dayjs().format('YYYY/MM/DD');
      cy.get('table tbody tr:nth-child(4)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(targetA);
        cy.get('td:nth-child(4)').contains(`${comment} 1`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(username);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('table tbody tr:nth-child(3)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(targetB);
        cy.get('td:nth-child(4)').contains(`${comment} 2`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(username);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock');
        cy.get('td:nth-child(3)').contains(targetB);
        cy.get('td:nth-child(4)').contains(`${comment} 3`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(user1);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2) i.mdi-lock');
        cy.get('td:nth-child(3)').contains(targetA);
        cy.get('td:nth-child(4)').contains(`${comment} 4`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(user1);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
    });

    it('一覧画面の検索', () => {
      cy.get('header input[data-cy=search]').as('search');
      cy.get('@search').type(targetA);
      const today = dayjs().format('YYYY/MM/DD');
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(targetA);
        cy.get('td:nth-child(4)').contains(`${comment} 1`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(username);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2) i.mdi-lock');
        cy.get('td:nth-child(3)').contains(targetA);
        cy.get('td:nth-child(4)').contains(`${comment} 4`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(user1);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('@search').clear().type(targetB);
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(targetB);
        cy.get('td:nth-child(4)').contains(`${comment} 2`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(username);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2) i.mdi-lock');
        cy.get('td:nth-child(3)').contains(targetB);
        cy.get('td:nth-child(4)').contains(`${comment} 3`);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(user1);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addAttachFile(token, streamId1, file0, targetA, false, false, `${comment} 1`);
        cy.addAttachFile(token, streamId1, file0, targetB, false, true, `${comment} 2`);
      });
      cy.userToken(user1, password1).then((token) => {
        cy.addAttachFile(token, streamId1, file0, targetB, true, false, `${comment} 3`);
        cy.addAttachFile(token, streamId1, file0, targetA, true, true, `${comment} 4`);
      });
      cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
    });
  });

  describe('添付ファイル登録ダイアログ', () => {
    skipOn('ci', () => {
      [false, true].forEach((secret) => {
        [false, true].forEach((enabled) => {
          it(`登録の実行: secret=${secret} enabled=${enabled}`, () => {
            cy.get('form header div').contains('添付ファイルの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
                cy.get('[data-cy=input-file]').as('file');
                cy.get('[data-cy=input-secret]').as('secret');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');

                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
                cy.get('@target').should('have.value', '');
                cy.get('@comment').should('have.value', '');
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

                cy.fixture(file1, null).as('filename');
                cy.get('@file').selectFile({
                  contents: '@filename',
                  mimeType: 'application/octet-stream',
                }, { force: true });
                if (secret) {
                  cy.get('@secret').check({ force: true });
                } else {
                  cy.get('@secret').uncheck({ force: true });
                }
                cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());

                cy.get('@target').type(target);
                cy.get('@btnSubmit').should('be.enabled');
                cy.get('@comment').type(comment);
                if (enabled) {
                  cy.get('@enabled').check({ force: true });
                } else {
                  cy.get('@enabled').uncheck({ force: true });
                }
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', enabled.toString());
                cy.get('@btnSubmit').click();
              });
            cy.contains('添付ファイルの登録').should('not.exist');
            const today = dayjs().format('YYYY/MM/DD');
            cy.get('table tbody tr').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
              cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
              cy.get('td:nth-child(3)').contains(target);
              cy.get('td:nth-child(4)').contains(comment);
              cy.get('td:nth-child(5)').contains(today);
              cy.get('td:nth-child(6)').contains(username);
              cy.get('button[data-cy=btn-update-attach-file]');
              cy.get('button[data-cy=btn-delete-attach-file]');
            });
          });
        });
      });
    });

    describe('バリデーション', () => {
      it('target', () => {
        cy.get('form header div').contains('添付ファイルの登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-target]').as('target');
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

      describe('必須項目', () => {
        it('target', () => {
          cy.get('form header div').contains('添付ファイルの登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('@btnSubmit').should('be.disabled');

              cy.get('@target').type(target);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');

              cy.get('@target').clear();
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
        });

        it('file', () => {
          cy.get('form header div').contains('添付ファイルの登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-file]').as('file');
              cy.get('@target').type(target);
              cy.get('@btnSubmit').should('be.enabled');

              cy.get('@file').parents('div.v-text-field').first().within(() => {
                cy.get('button.mdi-close').click();
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
        });
      });

      beforeEach(() => {
        cy.get('form header div').contains('添付ファイルの登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.fixture(file1, null).as('filename');
            cy.get('[data-cy=input-file]').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
          });
      });
    });

    it('キャンセルボタン', () => {
      cy.get('form header div').contains('添付ファイルの登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
          cy.get('[data-cy=input-file]').as('file');
          cy.get('[data-cy=input-secret]').as('secret');
          cy.get('[data-cy=input-target]').as('target');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('[data-cy=input-enabled]').as('enabled');

          cy.fixture(file1, null).as('filename');
          cy.get('@file').selectFile({
            contents: '@filename',
            mimeType: 'application/octet-stream',
          }, { force: true });
          cy.get('@secret').check({ force: true });
          cy.get('@target').type(target);
          cy.get('@comment').type(comment);
          cy.get('@enabled').uncheck({ force: true });
          cy.get('@btnCancel').click();
        });
      cy.contains('添付ファイルの登録').should('not.exist');
      cy.get('table td').contains('データはありません。');
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('添付ファイルの登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@target').should('have.value', '');
          cy.get('@comment').should('have.value', '');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
        });
    });

    beforeEach(() => {
      cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('添付ファイルの登録');
    });
  });

  describe('添付ファイル更新ダイアログ', () => {
    [true, false].forEach((secret) => {
      describe(`secret=${secret}`, () => {
        it('更新の実行', () => {
          cy.get('form header div').contains('添付ファイルの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-file]').as('file');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', (!secret).toString());
              cy.get('@target').should('have.value', targetA);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@secret').parent().click();
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', secret.toString());
              cy.get('@btnSubmit').click();
            });
          cy.contains('添付ファイルの更新').should('not.exist');
          const today = dayjs().format('YYYY/MM/DD');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('exist');
            cy.get('td:nth-child(2) i.mdi-lock').should(secret ? 'exist' : 'not.exist');
            cy.get('td:nth-child(3)').contains(targetA);
            cy.get('td:nth-child(4)').contains(comment);
            cy.get('td:nth-child(5)').contains(today);
            cy.get('td:nth-child(6)').contains(username);
            cy.get('button[data-cy=btn-update-attach-file]');
            cy.get('button[data-cy=btn-delete-attach-file]');
          });
        });

        beforeEach(() => {
          cy.userToken(user1, password1).then((token) => {
            cy.addAttachFile(token, streamId1, file0, targetA, !secret, true, comment);
          });
          cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
          cy.get('button[data-cy=btn-update-attach-file]').click();
          cy.get('form header div').contains('添付ファイルの更新');
        });
      });
    });

    [true, false].forEach((enabled) => {
      describe(`enabled=${enabled}`, () => {
        it('更新の実行', () => {
          cy.get('form header div').contains('添付ファイルの更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-file]').as('file');
              cy.get('[data-cy=input-secret]').as('secret');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').should('have.value', targetA);
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', (!enabled).toString());
              cy.get('@enabled').parent().click();
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', enabled.toString());
              cy.get('@btnSubmit').click();
            });
          cy.contains('添付ファイルの更新').should('not.exist');
          const today = dayjs().format('YYYY/MM/DD');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should(enabled ? 'exist' : 'not.exist');
            cy.get('td:nth-child(2) i.mdi-lock').should('exist');
            cy.get('td:nth-child(3)').contains(targetA);
            cy.get('td:nth-child(4)').contains(comment);
            cy.get('td:nth-child(5)').contains(today);
            cy.get('td:nth-child(6)').contains(username);
            cy.get('button[data-cy=btn-update-attach-file]');
            cy.get('button[data-cy=btn-delete-attach-file]');
          });
        });

        beforeEach(() => {
          cy.userToken(user1, password1).then((token) => {
            cy.addAttachFile(token, streamId1, file0, targetA, true, !enabled, comment);
          });
          cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
          cy.get('button[data-cy=btn-update-attach-file]').click();
          cy.get('form header div').contains('添付ファイルの更新');
        });
      });
    });

    describe('項目の更新', () => {
      it('file', () => {
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-secret]').as('secret');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');

            cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@target').should('have.value', targetA);
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

            cy.fixture(file1, null).as('filename');
            cy.get('@file').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
            cy.get('@btnSubmit').click();
          });
        cy.contains('添付ファイルの更新').should('not.exist');
        const today = dayjs().format('YYYY/MM/DD');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(targetA);
          cy.get('td:nth-child(4)').contains(comment);
          cy.get('td:nth-child(5)').contains(today);
          cy.get('td:nth-child(6)').contains(username);
          cy.get('button[data-cy=btn-update-attach-file]');
          cy.get('button[data-cy=btn-delete-attach-file]');
        });
      });

      it('target', () => {
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-secret]').as('secret');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');

            cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@target').should('have.value', targetA);
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

            cy.get('@target').clear().type(targetB);
            cy.get('@btnSubmit').click();
          });
        cy.contains('添付ファイルの更新').should('not.exist');
        const today = dayjs().format('YYYY/MM/DD');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(targetB);
          cy.get('td:nth-child(4)').contains(comment);
          cy.get('td:nth-child(5)').contains(today);
          cy.get('td:nth-child(6)').contains(username);
          cy.get('button[data-cy=btn-update-attach-file]');
          cy.get('button[data-cy=btn-delete-attach-file]');
        });
      });

      it('comment', () => {
        const newComment = `new ${comment}`;
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-secret]').as('secret');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');

            cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@target').should('have.value', targetA);
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

            cy.get('@comment').clear().type(newComment);
            cy.get('@btnSubmit').click();
          });
        cy.contains('添付ファイルの更新').should('not.exist');
        const today = dayjs().format('YYYY/MM/DD');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(targetA);
          cy.get('td:nth-child(4)').contains(newComment);
          cy.get('td:nth-child(5)').contains(today);
          cy.get('td:nth-child(6)').contains(username);
          cy.get('button[data-cy=btn-update-attach-file]');
          cy.get('button[data-cy=btn-delete-attach-file]');
        });
      });

      beforeEach(() => {
        cy.userToken(user1, password1).then((token) => {
          cy.addAttachFile(token, streamId1, file0, targetA, false, true, comment);
        });
        cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
        cy.get('button[data-cy=btn-update-attach-file]').click();
        cy.get('form header div').contains('添付ファイルの更新');
      });
    });

    describe('バリデーション', () => {
      it('target', () => {
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-target]').as('target');
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
          cy.addAttachFile(token, streamId1, file0, targetA, false, true, comment);
        });
        cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
        cy.get('button[data-cy=btn-update-attach-file]').click();
        cy.get('form header div').contains('添付ファイルの更新');
      });
    });

    describe('キャンセルボタン', () => {
      it('変更が反映されないこと', () => {
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-secret]').as('secret');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');
            cy.fixture(file1, null).as('filename');
            cy.get('@file').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
            cy.get('@target').type(target);
            cy.get('@comment').type(comment);
            cy.get('@secret').parent().click();
            cy.get('@enabled').parent().click();
            cy.get('@btnCancel').click();
          });
        cy.contains('添付ファイルの更新').should('not.exist');
        const today = dayjs().format('YYYY/MM/DD');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('exist');
          cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
          cy.get('td:nth-child(3)').contains(targetA);
          cy.get('td:nth-child(4)').contains(comment);
          cy.get('td:nth-child(5)').contains(today);
          cy.get('td:nth-child(6)').contains(user1);
          cy.get('button[data-cy=btn-update-attach-file]');
          cy.get('button[data-cy=btn-delete-attach-file]');
        });
        cy.get('button[data-cy=btn-update-attach-file]').click();
        cy.get('form header div').contains('添付ファイルの更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@target').should('have.value', targetA);
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          });
      });

      beforeEach(() => {
        cy.userToken(user1, password1).then((token) => {
          cy.addAttachFile(token, streamId1, file0, targetA, false, true, comment);
        });
        cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
        cy.get('button[data-cy=btn-update-attach-file]').click();
        cy.get('form header div').contains('添付ファイルの更新');
      });
    });
  });

  describe('添付ファイル削除ダイアログ', () => {
    it('削除の実行', () => {
      cy.get('form header div').contains('添付ファイルの削除')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
          cy.get('[data-cy=input-secret]').as('secret');
          cy.get('[data-cy=input-target]').as('target');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('[data-cy=input-enabled]').as('enabled');
          cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
          cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('@btnSubmit').click();
        });
      cy.get('form header div').contains('添付ファイルの削除').should('not.exist');
      cy.get('table td').contains('データはありません。');
    });

    it('キャンセルボタン', () => {
      cy.get('form header div').contains('添付ファイルの削除')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
          cy.get('[data-cy=input-secret]').as('secret');
          cy.get('[data-cy=input-target]').as('target');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('[data-cy=input-enabled]').as('enabled');
          cy.get('@secret').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@secret').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
          cy.get('@comment').invoke('attr', 'readonly').should('eq', 'readonly');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@enabled').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('@btnCancel').click();
        });
      cy.contains('添付ファイルの削除').should('not.exist');
      const today = dayjs().format('YYYY/MM/DD');
      cy.get('table tbody tr').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
        cy.get('td:nth-child(3)').contains(targetA);
        cy.get('td:nth-child(4)').contains(comment);
        cy.get('td:nth-child(5)').contains(today);
        cy.get('td:nth-child(6)').contains(username);
        cy.get('button[data-cy=btn-update-attach-file]');
        cy.get('button[data-cy=btn-delete-attach-file]');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addAttachFile(token, streamId1, file0, targetA, false, true, comment);
      });
      cy.visit(`/streams/${streamId1}/attach-files`).contains(`添付ファイル一覧: ${stream1}`);
      cy.get('button[data-cy=btn-delete-attach-file]').click();
      cy.get('form header div').contains('添付ファイルの削除');
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
