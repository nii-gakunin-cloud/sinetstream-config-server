/// <reference types='../support' />

describe('データ暗号鍵に関するテスト', () => {
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();
  const user1 = 'test-001';
  const userEmail1 = 'test-001@example.org';
  const userDisplay1 = 'テストユーザ 001';
  const password1 = 'pass-001';

  const stream1 = 'test-stream-001';
  let streamId1: number;
  const target = '*.crypto.key';
  const target1 = 'service1.crypto.key';
  const target2 = 'service2.crypto.key';
  const comment = 'comment';

  describe('データ暗号鍵一覧画面', () => {
    it('一覧表示', () => {
      cy.get('table tbody tr:nth-child(6)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2)').contains(target1);
        cy.get('td:nth-child(3)').contains('1');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 3`);
        cy.get('td:nth-child(7)').contains(username);
        cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
        cy.get('button[data-cy=btn-key-update]').should('not.exist');
      });
      cy.get('table tbody tr:nth-child(5)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2)').contains(target1);
        cy.get('td:nth-child(3)').contains('2');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 4`);
        cy.get('td:nth-child(7)').contains(user1);
        cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
        cy.get('button[data-cy=btn-key-update]').should('not.exist');
      });
      cy.get('table tbody tr:nth-child(4)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2)').contains(target);
        cy.get('td:nth-child(3)').contains('1');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 1`);
        cy.get('td:nth-child(7)').contains(username);
        cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
        cy.get('button[data-cy=btn-key-update]').should('not.exist');
      });

      cy.get('table tbody tr:nth-child(3)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
        cy.get('td:nth-child(2)').contains(target2);
        cy.get('td:nth-child(3)').contains('1');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 6`);
        cy.get('td:nth-child(7)').contains(user1);
        cy.get('button[data-cy=btn-key-info-edit]').should('exist');
        cy.get('button[data-cy=btn-key-update]').should('exist');
      });
      cy.get('table tbody tr:nth-child(2)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2)').contains(target1);
        cy.get('td:nth-child(3)').contains('3');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 5`);
        cy.get('td:nth-child(7)').contains(user1);
        cy.get('button[data-cy=btn-key-info-edit]').should('exist');
        cy.get('button[data-cy=btn-key-update]').should('exist');
      });
      cy.get('table tbody tr:nth-child(1)').within(() => {
        cy.get('td:nth-child(1) i.mdi-check');
        cy.get('td:nth-child(2)').contains(target);
        cy.get('td:nth-child(3)').contains('2');
        cy.get('td:nth-child(4)').contains('256');
        cy.get('td:nth-child(5)').contains(`${comment} 2`);
        cy.get('td:nth-child(7)').contains(username);
        cy.get('button[data-cy=btn-key-info-edit]').should('exist');
        cy.get('button[data-cy=btn-key-update]').should('exist');
      });
    });

    it('一覧画面の検索', () => {
      cy.get('header input[data-cy=search]').as('search');
      cy.get('@search').type(target);
      cy.get('table tbody').within(() => {
        cy.contains('td', target).should('exist');
        cy.contains('td', target1).should('not.exist');
        cy.contains('td', target2).should('not.exist');
      });
      cy.get('@search').clear().type(target1);
      cy.get('table tbody').within(() => {
        cy.contains('td', target).should('not.exist');
        cy.contains('td', target1).should('exist');
        cy.contains('td', target2).should('not.exist');
      });
      cy.get('@search').clear().type(target2);
      cy.get('table tbody').within(() => {
        cy.contains('td', target).should('not.exist');
        cy.contains('td', target1).should('not.exist');
        cy.contains('td', target2).should('exist');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addEncryptKey(token, streamId1, 256, target, true, `${comment} 1`);
        cy.addEncryptKey(token, streamId1, 256, target, true, `${comment} 2`);
        cy.addEncryptKey(token, streamId1, 256, target1, true, `${comment} 3`);
      });
      cy.userToken(user1, password1).then((token) => {
        cy.addEncryptKey(token, streamId1, 256, target1, true, `${comment} 4`);
        cy.addEncryptKey(token, streamId1, 256, target1, true, `${comment} 5`);
        cy.addEncryptKey(token, streamId1, 256, target2, false, `${comment} 6`);
      });
      cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
    });
  });

  describe('データ暗号鍵登録ダイアログ', () => {
    describe('サーバでの鍵生成', () => {
      [128, 192, 256].forEach((size) => {
        it(`鍵サイズ: ${size}`, () => {
          cy.get('form header div').contains('データ暗号鍵の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '登録');

              cy.get('[data-cy=input-size]').as('size');
              cy.get('[data-cy=input-auto]').as('auto');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@size').should('have.value', '256');
              cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').should('have.value', '*.crypto.key');
              cy.get('@comment').should('have.value', '');
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

              cy.get('@size').clear().type(size.toString());
              cy.get('@comment').type(comment);
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ暗号鍵の登録').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check');
            cy.get('td:nth-child(2)').contains('*.crypto.key');
            cy.get('td:nth-child(3)').contains('1');
            cy.get('td:nth-child(4)').contains(size.toString());
            cy.get('td:nth-child(5)').contains(comment);
            cy.get('td:nth-child(7)').contains(username);
            cy.get('button[data-cy=btn-key-info-edit]');
            cy.get('button[data-cy=btn-key-update]');
          });
        });
      });

      it('有効フラグ off', () => {
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '登録');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('input[data-cy=input-enabled]').as('enabled');
            cy.get('@target').clear().type(target1);
            cy.get('@enabled').uncheck({ force: true });
            cy.get('@btnSubmit').click();
          });
        cy.contains('データ暗号鍵の登録').should('not.exist');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
          cy.get('td:nth-child(2)').contains(target1);
          cy.get('td:nth-child(3)').contains('1');
          cy.get('td:nth-child(4)').contains('256');
          cy.get('td:nth-child(5)').should('have.text', '');
          cy.get('td:nth-child(7)').contains(username);
          cy.get('button[data-cy=btn-key-info-edit]');
          cy.get('button[data-cy=btn-key-update]');
        });
      });
    });

    describe('鍵ファイルをアップロード', () => {
      [128, 192, 256].forEach((size) => {
        it(`鍵サイズ: ${size}`, () => {
          cy.get('form header div').contains('データ暗号鍵の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '登録');
              cy.get('[data-cy=input-size]').as('size');
              cy.get('[data-cy=input-auto]').as('auto');
              cy.get('input[data-cy=input-file]').as('file');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@size').should('have.value', '256');
              cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').should('have.value', '*.crypto.key');
              cy.get('@comment').should('have.value', '');
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');

              cy.get('@size').clear().type(size.toString());
              cy.get('@auto').uncheck({ force: true });
              const filePath = `key-${size}`;
              cy.fixture(filePath, null).as('filename');
              cy.get('@file').selectFile({
                contents: '@filename',
                mimeType: 'application/octet-stream',
              }, { force: true });
              cy.get('@comment').type(comment);
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ暗号鍵の登録').should('not.exist');
          cy.get('table tbody tr').within(() => {
            cy.get('td:nth-child(1) i.mdi-check');
            cy.get('td:nth-child(2)').contains('*.crypto.key');
            cy.get('td:nth-child(3)').contains('1');
            cy.get('td:nth-child(4)').contains(size.toString());
            cy.get('td:nth-child(5)').contains(comment);
            cy.get('td:nth-child(7)').contains(username);
            cy.get('button[data-cy=btn-key-info-edit]');
            cy.get('button[data-cy=btn-key-update]');
          });
        });
      });

      it('有効フラグ off', () => {
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '登録');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('input[data-cy=input-file]').as('file');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('input[data-cy=input-enabled]').as('enabled');
            cy.get('@auto').uncheck({ force: true });
            const filePath = 'key-256';
            cy.fixture(filePath, null).as('filename');
            cy.get('@file').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
            cy.get('@target').clear().type(target1);
            cy.get('@enabled').uncheck({ force: true });
            cy.get('@btnSubmit').click();
          });
        cy.contains('データ暗号鍵の登録').should('not.exist');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
          cy.get('td:nth-child(2)').contains(target1);
          cy.get('td:nth-child(3)').contains('1');
          cy.get('td:nth-child(4)').contains('256');
          cy.get('td:nth-child(5)').should('have.text', '');
          cy.get('td:nth-child(7)').contains(username);
          cy.get('button[data-cy=btn-key-info-edit]');
          cy.get('button[data-cy=btn-key-update]');
        });
      });
    });

    it('キャンセルボタン', () => {
      cy.get('form header div').contains('データ暗号鍵の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('[data-cy=input-size]').as('size');
          cy.get('[data-cy=input-auto]').as('auto');
          cy.get('input[data-cy=input-file]').as('file');
          cy.get('[data-cy=input-target]').as('target');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('[data-cy=input-enabled]').as('enabled');

          cy.get('@size').clear().type('128');
          cy.get('@auto').uncheck({ force: true });
          const filePath = 'key-128';
          cy.fixture(filePath, null).as('filename');
          cy.get('@file').selectFile({
            contents: '@filename',
            mimeType: 'application/octet-stream',
          }, { force: true });
          cy.get('@target').clear().type(target1);
          cy.get('@comment').type(comment);
          cy.get('@enabled').uncheck({ force: true });
          cy.get('@btnCancel').click();
        });
      cy.contains('データ暗号鍵の登録').should('not.exist');
      cy.get('table td').contains('データはありません。');
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('データ暗号鍵の登録');

      cy.get('form header div').contains('データ暗号鍵の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('@size').should('have.value', '256');
          cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@target').should('have.value', '*.crypto.key');
          cy.get('@comment').should('have.value', '');
          cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
        });
    });

    describe('バリデーション', () => {
      it('size', () => {
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('@btnSubmit').should('be.enabled');
            [128 + 1, 128 - 64, 256 + 128, -1].forEach((size) => {
              cy.get('@size').clear().type('256');
              cy.get('@size').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');

              cy.get('@size').clear().type(size.toString());
              cy.get('@size').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message')
                  .should('have.text', '鍵サイズには128, 192, 256のいずれかを指定してください。');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      it('file size', () => {
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('input[data-cy=input-file]').as('file');
            cy.get('@btnSubmit').should('be.enabled');

            [[128, 256], [256, 192], [192, 128]].forEach((params) => {
              const [size, fsize] = params;
              const fileName = `key-${fsize}`;
              cy.get('@size').clear().type(size.toString());
              cy.get('@file').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@auto').uncheck({ force: true });

              cy.fixture(fileName, null).as('filename');
              cy.get('@file').selectFile({
                contents: '@filename',
                mimeType: 'application/octet-stream',
              }, { force: true });
              cy.get('@file').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      it('target', () => {
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('@btnSubmit').should('be.enabled');
            ['*', 'xxx', '*..abc', 'xxx.*.abc'].forEach((tgt) => {
              cy.get('@target').clear().type('*.crypto.key');
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
        cy.get('form header div').contains('データ暗号鍵の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('input[data-cy=input-file]').as('file');
            cy.get('@btnSubmit').should('be.enabled');

            // size
            cy.get('@size').clear();
            cy.get('@size').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');

            cy.get('@size').type('256');
            cy.get('@size').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
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

            // file
            cy.get('@auto').uncheck({ force: true });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');

            const fileName = 'key-256';
            cy.fixture(fileName, null).as('filename');
            cy.get('@file').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');
          });
      });

      describe('既存のパラメータ名との重複', () => {
        it('重複値の指定', () => {
          cy.get('form header div').contains('データ暗号鍵の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');

              cy.get('@target').clear().type(target2);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');

              cy.get('@target').clear().type(target1);
              cy.get('@target').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addEncryptKey(token, streamId1, 256, target);
            cy.addEncryptKey(token, streamId1, 256, target1);
          });
          cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
          cy.get('button[data-cy=btn-create]').click();
          cy.get('form header div').contains('データ暗号鍵の登録');
        });
      });
    });

    beforeEach(() => {
      cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('データ暗号鍵の登録');
    });
  });

  describe('データ暗号鍵更新ダイアログ', () => {
    [true, false].forEach((enabled) => {
      describe(`有効フラグ ${enabled}`, () => {
        it('更新の実行', () => {
          const newComment = `new ${comment}`;
          cy.get('form header div').contains('データ暗号鍵の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');

              cy.get('@target').should('have.value', target);
              cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked')
                .should('eq', (!enabled).toString());
              cy.get('@comment').clear().type(newComment);
              if (enabled) {
                cy.get('@enabled').check({ force: true });
                cy.get('@enabled').check({ force: true });
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              } else {
                cy.get('@enabled').uncheck({ force: true });
                cy.get('@enabled').uncheck({ force: true });
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'false');
              }
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ暗号鍵の更新').should('not.exist');
          cy.get('table tbody tr:nth-child(1)').within(() => {
            if (enabled) {
              cy.get('td:nth-child(1) i.mdi-check');
            } else {
              cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
            }
            cy.get('td:nth-child(2)').contains(target);
            cy.get('td:nth-child(3)').contains('2');
            cy.get('td:nth-child(4)').contains('256');
            cy.get('td:nth-child(5)').contains(newComment);
          });
          cy.get('table tbody tr:nth-child(2)').within(() => {
            cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
            cy.get('td:nth-child(2)').contains(target);
            cy.get('td:nth-child(3)').contains('1');
            cy.get('td:nth-child(4)').contains('256');
            cy.get('td:nth-child(5)').contains(comment);
          });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addEncryptKey(token, streamId1, 256, target, !enabled, comment);
          });
          cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
          cy.get('button[data-cy=btn-key-update]').click();
          cy.get('form header div').contains('データ暗号鍵の更新');
        });
      });
    });

    [128, 192, 256].forEach((oldSize) => {
      [128, 192, 256].forEach((size) => {
        describe(`鍵サイズ: ${oldSize} -> ${size}`, () => {
          it('サーバ側での鍵生成', () => {
            cy.get('form header div').contains('データ暗号鍵の更新')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                cy.get('[data-cy=input-size]').as('size');
                cy.get('[data-cy=input-auto]').as('auto');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');
                cy.get('@size').should('have.value', oldSize.toString());
                cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', target1);
                cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@comment').should('have.value', comment);
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@size').clear().type(size.toString());
                cy.get('@btnSubmit').click();
              });
            cy.contains('データ暗号鍵の更新').should('not.exist');
            cy.get('table tbody tr:nth-child(1)').within(() => {
              cy.get('td:nth-child(1) i.mdi-check');
              cy.get('td:nth-child(2)').contains(target1);
              cy.get('td:nth-child(3)').contains('2');
              cy.get('td:nth-child(4)').contains(size.toString());
              cy.get('td:nth-child(5)').contains(comment);
              cy.get('button[data-cy=btn-key-info-edit]');
              cy.get('button[data-cy=btn-key-update]');
            });
            cy.get('table tbody tr:nth-child(2)').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
              cy.get('td:nth-child(2)').contains(target1);
              cy.get('td:nth-child(3)').contains('1');
              cy.get('td:nth-child(4)').contains(oldSize.toString());
              cy.get('td:nth-child(5)').contains(comment);
              cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
              cy.get('button[data-cy=btn-key-update]').should('not.exist');
            });
          });

          it('鍵ファイルのアップロード', () => {
            cy.get('form header div').contains('データ暗号鍵の更新')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
                cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
                cy.get('[data-cy=input-size]').as('size');
                cy.get('[data-cy=input-auto]').as('auto');
                cy.get('input[data-cy=input-file]').as('file');
                cy.get('[data-cy=input-target]').as('target');
                cy.get('[data-cy=input-comment]').as('comment');
                cy.get('[data-cy=input-enabled]').as('enabled');
                cy.get('@size').should('have.value', oldSize.toString());
                cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@target').should('have.value', target1);
                cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
                cy.get('@comment').should('have.value', comment);
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
                cy.get('@size').clear().type(size.toString());
                cy.get('@auto').uncheck({ force: true });
                cy.get('@auto').uncheck({ force: true });
                cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'false');
                const filePath = `key-${size}`;
                cy.fixture(filePath, null).as('filename');
                cy.get('@file').selectFile({
                  contents: '@filename',
                  mimeType: 'application/octet-stream',
                }, { force: true });
                cy.get('@btnSubmit').click();
              });
            cy.contains('データ暗号鍵の更新').should('not.exist');
            cy.get('table tbody tr:nth-child(1)').within(() => {
              cy.get('td:nth-child(1) i.mdi-check');
              cy.get('td:nth-child(2)').contains(target1);
              cy.get('td:nth-child(3)').contains('2');
              cy.get('td:nth-child(4)').contains(size.toString());
              cy.get('td:nth-child(5)').contains(comment);
              cy.get('button[data-cy=btn-key-info-edit]');
              cy.get('button[data-cy=btn-key-update]');
            });
            cy.get('table tbody tr:nth-child(2)').within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
              cy.get('td:nth-child(2)').contains(target1);
              cy.get('td:nth-child(3)').contains('1');
              cy.get('td:nth-child(4)').contains(oldSize.toString());
              cy.get('td:nth-child(5)').contains(comment);
              cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
              cy.get('button[data-cy=btn-key-update]').should('not.exist');
            });
          });

          beforeEach(() => {
            cy.userToken(username, password).then((token) => {
              cy.addEncryptKey(token, streamId1, oldSize, target1, true, comment);
            });
            cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
            cy.get('button[data-cy=btn-key-update]').click();
            cy.get('form header div').contains('データ暗号鍵の更新');
          });
        });
      });
    });

    [3, 5].forEach((version) => {
      describe(`version: ${version}`, () => {
        it('更新の実行', () => {
          const newComment = `${comment} ${version - 1}`;
          cy.get('form header div').contains('データ暗号鍵の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-size]').as('size');
              cy.get('[data-cy=input-auto]').as('auto');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');
              cy.get('@size').should('have.value', '192');
              cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@target').should('have.value', target1);
              cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@comment').should('have.value', newComment);
              cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ暗号鍵の更新').should('not.exist');
          cy.get('table tbody tr:nth-child(1)').within(() => {
            cy.get('td:nth-child(1) i.mdi-check');
            cy.get('td:nth-child(2)').contains(target1);
            cy.get('td:nth-child(3)').contains(version.toString());
            cy.get('td:nth-child(4)').contains('192');
            cy.get('td:nth-child(5)').contains(newComment);
            cy.get('button[data-cy=btn-key-info-edit]');
            cy.get('button[data-cy=btn-key-update]');
          });
          const nums = Array.from({ length: version - 1 }, (_, i) => (version - i - 1));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cy.wrap(nums).each((val, index, $list) => {
            cy.get(`table tbody tr:nth-child(${index + 2})`).within(() => {
              cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
              cy.get('td:nth-child(2)').contains(target1);
              cy.get('td:nth-child(3)').contains(val.toString());
              cy.get('td:nth-child(4)').contains('192');
              cy.get('td:nth-child(5)').contains(`${comment} ${val}`);
              cy.get('button[data-cy=btn-key-info-edit]').should('not.exist');
              cy.get('button[data-cy=btn-key-update]').should('not.exist');
            });
          });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            const nums = Array.from({ length: version - 1 }, (_, i) => (i + 1));
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            cy.wrap(nums).each((val, index, $list) => {
              cy.addEncryptKey(token, streamId1, 192, target1, true, `${comment} ${val}`);
            });
          });
          cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
          cy.get('button[data-cy=btn-key-update]').click();
          cy.get('form header div').contains('データ暗号鍵の更新');
        });
      });
    });

    describe('キャンセルボタン', () => {
      it('更新されないこと', () => {
        cy.get('form header div').contains('データ暗号鍵の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');
            cy.get('@size').should('have.value', '192');
            cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
            cy.get('@target').should('have.value', target1);
            cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
            cy.get('@size').clear().type('128');
            cy.get('@comment').clear().type(`new ${comment}`);
            cy.get('@enabled').uncheck({ force: true });
            cy.get('@enabled').uncheck({ force: true });
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@auto').uncheck({ force: true });
            cy.get('@auto').uncheck({ force: true });
            cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'false');
            cy.get('@btnCancel').click();
          });
        cy.contains('データ暗号鍵の更新').should('not.exist');
        cy.get('table tbody tr:nth-child(1)').within(() => {
          cy.get('td:nth-child(1) i.mdi-check');
          cy.get('td:nth-child(2)').contains(target1);
          cy.get('td:nth-child(3)').contains('1');
          cy.get('td:nth-child(4)').contains('192');
          cy.get('td:nth-child(5)').contains(comment);
          cy.get('button[data-cy=btn-key-info-edit]');
          cy.get('button[data-cy=btn-key-update]');
        });
        cy.get('button[data-cy=btn-key-update]').click();
        cy.get('form header div').contains('データ暗号鍵の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('@size').should('have.value', '192');
            cy.get('@auto').invoke('attr', 'aria-checked').should('eq', 'true');
            cy.get('@target').should('have.value', target1);
            cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addEncryptKey(token, streamId1, 192, target1, true, comment);
        });
        cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
        cy.get('button[data-cy=btn-key-update]').click();
        cy.get('form header div').contains('データ暗号鍵の更新');
      });
    });

    describe('バリデーション', () => {
      it('size', () => {
        cy.get('form header div').contains('データ暗号鍵の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('@btnSubmit').should('be.enabled');
            [128 + 1, 128 - 64, 256 + 128, -1].forEach((size) => {
              cy.get('@size').clear().type('256');
              cy.get('@size').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');

              cy.get('@size').clear().type(size.toString());
              cy.get('@size').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message')
                  .should('have.text', '鍵サイズには128, 192, 256のいずれかを指定してください。');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      it('file size', () => {
        cy.get('form header div').contains('データ暗号鍵の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('input[data-cy=input-file]').as('file');
            cy.get('@btnSubmit').should('be.enabled');

            [[128, 256], [256, 192], [192, 128]].forEach((params) => {
              const [size, fsize] = params;
              const fileName = `key-${fsize}`;
              cy.get('@size').clear().type(size.toString());
              cy.get('@file').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message').should('not.exist');
              });
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@auto').uncheck({ force: true });

              cy.fixture(fileName, null).as('filename');
              cy.get('@file').selectFile({
                contents: '@filename',
                mimeType: 'application/octet-stream',
              }, { force: true });
              cy.get('@file').parents('div.v-text-field').first().within(() => {
                cy.get('div.error--text .v-messages__message');
              });
              cy.get('@btnSubmit').should('be.disabled');
            });
          });
      });

      it('必須項目', () => {
        cy.get('form header div').contains('データ暗号鍵の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('[data-cy=input-size]').as('size');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-auto]').as('auto');
            cy.get('input[data-cy=input-file]').as('file');
            cy.get('@btnSubmit').should('be.enabled');

            // size
            cy.get('@size').clear();
            cy.get('@size').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');

            cy.get('@size').type('256');
            cy.get('@size').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');

            // file
            cy.get('@auto').uncheck({ force: true });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message');
            });
            cy.get('@btnSubmit').should('be.disabled');

            const fileName = 'key-256';
            cy.fixture(fileName, null).as('filename');
            cy.get('@file').selectFile({
              contents: '@filename',
              mimeType: 'application/octet-stream',
            }, { force: true });
            cy.get('@file').parents('div.v-text-field').first().within(() => {
              cy.get('div.error--text .v-messages__message').should('not.exist');
            });
            cy.get('@btnSubmit').should('be.enabled');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addEncryptKey(token, streamId1, 256, target);
        });
        cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
        cy.get('button[data-cy=btn-key-update]').click();
        cy.get('form header div').contains('データ暗号鍵の更新');
      });
    });
  });

  describe('データ暗号鍵情報更新ダイアログ', () => {
    [true, false].forEach((enabled) => {
      describe(`有効フラグ ${enabled}`, () => {
        it('更新の実行', () => {
          const newComment = `new ${comment}`;
          cy.get('form header div').contains('データ暗号鍵情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('[data-cy=input-target]').as('target');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('[data-cy=input-enabled]').as('enabled');

              cy.get('@target').should('have.value', target);
              cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
              cy.get('@comment').should('have.value', comment);
              cy.get('@enabled').invoke('attr', 'aria-checked')
                .should('eq', (!enabled).toString());
              cy.get('@comment').clear().type(newComment);
              if (enabled) {
                cy.get('@enabled').check({ force: true });
                cy.get('@enabled').check({ force: true });
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
              } else {
                cy.get('@enabled').uncheck({ force: true });
                cy.get('@enabled').uncheck({ force: true });
                cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'false');
              }
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ暗号鍵情報の更新').should('not.exist');
          cy.get('table tbody tr').within(() => {
            if (enabled) {
              cy.get('td:nth-child(1) i.mdi-check');
            } else {
              cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
            }
            cy.get('td:nth-child(2)').contains(target);
            cy.get('td:nth-child(3)').contains('1');
            cy.get('td:nth-child(4)').contains('256');
            cy.get('td:nth-child(5)').contains(newComment);
          });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addEncryptKey(token, streamId1, 256, target, !enabled, comment);
          });
          cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
          cy.get('button[data-cy=btn-key-info-edit]').click();
          cy.get('form header div').contains('データ暗号鍵情報の更新');
        });
      });
    });

    describe('キャンセルボタン', () => {
      it('更新されないこと', () => {
        cy.get('form header div').contains('データ暗号鍵情報の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('[data-cy=input-target]').as('target');
            cy.get('[data-cy=input-comment]').as('comment');
            cy.get('[data-cy=input-enabled]').as('enabled');
            cy.get('@target').should('have.value', target);
            cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
            cy.get('@enabled').check({ force: true });
            cy.get('@enabled').check({ force: true });
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
            cy.get('@comment').clear().type(`new ${comment}`);
            cy.get('@btnCancel').click();
          });
        cy.contains('データ暗号鍵情報の更新').should('not.exist');
        cy.get('table tbody tr').within(() => {
          cy.get('td:nth-child(1) i.mdi-check');
          cy.get('td:nth-child(2)').contains(target);
          cy.get('td:nth-child(3)').contains('1');
          cy.get('td:nth-child(4)').contains('256');
          cy.get('td:nth-child(5)').contains(comment);
        });
        cy.get('button[data-cy=btn-key-info-edit]').click();
        cy.get('form header div').contains('データ暗号鍵情報の更新');
        cy.get('form header div').contains('データ暗号鍵情報の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('@target').should('have.value', target);
            cy.get('@target').invoke('attr', 'readonly').should('eq', 'readonly');
            cy.get('@comment').should('have.value', comment);
            cy.get('@enabled').invoke('attr', 'aria-checked').should('eq', 'true');
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addEncryptKey(token, streamId1, 256, target, true, comment);
        });
        cy.visit(`/streams/${streamId1}/encrypt-keys`).contains(`データ暗号鍵一覧: ${stream1}`);
        cy.get('button[data-cy=btn-key-info-edit]').click();
        cy.get('form header div').contains('データ暗号鍵情報の更新');
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
