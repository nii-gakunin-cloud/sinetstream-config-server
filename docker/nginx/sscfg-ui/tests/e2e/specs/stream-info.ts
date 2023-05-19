/// <reference types='../support' />

import * as dayjs from 'dayjs';
import { skipOn } from '@cypress/skip-test';

describe('コンフィグ情報詳細画面に関するテスト', () => {
  const waitForRefreshConfigFile = 2000;
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();
  const user1 = 'test-001';
  const userEmail1 = 'test-001@example.org';
  const userDisplay1 = 'テストユーザ 001';
  const password1 = 'pass-001';
  const user2 = 'test-002';
  const password2 = 'pass-002';
  const userEmail2 = 'test-002@example.org';
  const userDisplay2 = 'テストユーザ 002';
  const stream1 = 'test-stream-001';
  let streamId1: number;
  const stream2 = 'test-stream-002';
  let streamId2: number;
  const comment = 'comment';
  const topic1 = 'test-kafka-001';
  const topic2 = 'test-kafka-002';
  const config1 = `
kafka-service-001:
  type: kafka
  brokers: kafka0.example.org
  topic: ${topic1}
  `;
  const config2 = `
kafka-service-002:
  type: kafka
  brokers: kafka0.example.org
  topic: ${topic2}
  `;
  const encryptKeyTarget = '*.crypto.key';
  const attachFileTarget = '*.tls.ca_certs';
  const file0 = 'id_rsa_pub.pem';
  const file1 = 'key-128';
  const userParameterTarget = '*.certs1';
  const value0 = 'abcdefg';
  const value1 = 'xyz012';
  const secretLabel = '•••••';

  describe('データ管理者', () => {
    it('設定ファイルが登録されている場合', () => {
      cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
      cy.get('[data-cy=panel-basic-info]').should('exist');
      cy.get('[data-cy=panel-encrypt-key]').should('exist');
      cy.get('[data-cy=panel-attach-file]').should('exist');
      cy.get('[data-cy=panel-user-parameter]').should('exist');
      cy.get('[data-cy=panel-member]').should('exist');
      cy.get('button[data-cy=btn-update-stream]').should('exist');
      cy.get('input[data-cy=switch-embedded-flag]').should('exist');
      cy.get('button[data-cy=btn-create-encrypt-key]').should('exist');
      cy.get('button[data-cy=btn-create-attach-file]').should('exist');
      cy.get('button[data-cy=btn-create-user-parameter]').should('exist');
      cy.get('button[data-cy=btn-create-member]').should('exist');

      cy.get('[data-cy=stream-name]').should('have.value', stream1);
      cy.get('[data-cy=stream-comment]').should('have.value', comment);
      cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
      cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
        cy.wrap(config1).invoke('trim').should('equal', dl.trim());
      });
    });

    it('設定ファイルが登録されていない場合', () => {
      cy.visit(`/streams/${streamId2}`).contains(`コンフィグ情報: ${stream2}`);
      cy.get('[data-cy=panel-basic-info]').should('exist');
      cy.get('[data-cy=panel-encrypt-key]').should('exist');
      cy.get('[data-cy=panel-attach-file]').should('exist');
      cy.get('[data-cy=panel-user-parameter]').should('exist');
      cy.get('[data-cy=panel-member]').should('exist');
      cy.get('button[data-cy=btn-update-stream]').should('exist');
      cy.get('input[data-cy=switch-embedded-flag]').should('exist');
      cy.get('button[data-cy=btn-create-encrypt-key]').should('exist');
      cy.get('button[data-cy=btn-create-attach-file]').should('exist');
      cy.get('button[data-cy=btn-create-user-parameter]').should('exist');
      cy.get('button[data-cy=btn-create-member]').should('exist');

      cy.get('[data-cy=stream-name]').should('have.value', stream2);
      cy.get('[data-cy=stream-comment]').should('have.value', '');
      cy.get('[data-cy=stream-config-file]').should('include.value', '');
      cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
    });

    describe('基本情報パネル', () => {
      it('更新ボタン', () => {
        cy.visit(`/streams/${streamId2}`).contains(`コンフィグ情報: ${stream2}`);
        cy.get('button[data-cy=btn-update-stream]').click();
        cy.get('form header div').contains('コンフィグ情報の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-comment]').clear().type(`${comment} ${stream2}`);
            cy.get('textarea[data-cy=input-config-file]').as('configFile');
            cy.get('@configFile').clear();
            config2.split(/\r?\n/)
              .filter((line) => (line.trim().length > 0))
              .forEach((line) => {
                cy.get('@configFile').type(line).type('{enter}');
              });
            cy.get('@btnSubmit').click();
          });

        cy.get('[data-cy=stream-comment]').should('have.value', `${comment} ${stream2}`);
        cy.get('[data-cy=stream-config-file]').should('include.value', config2.trim());
        cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
          cy.wrap(config2).invoke('trim').should('equal', dl.trim());
        });
      });
    });

    describe('暗号鍵パネル', () => {
      it('暗号鍵の登録', () => {
        cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
        cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
          .then((configFile) => {
            cy.log(configFile);
            cy.get('[data-cy=panel-encrypt-key]').click();
            cy.get('button[data-cy=btn-create-encrypt-key]').click();
            cy.get('form header div').contains('データ暗号鍵の登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('[data-cy=input-comment]').type(comment);
                cy.get('button[data-cy=btn-dialog-submit]').click();
              });
            cy.contains('データ暗号鍵の登録').should('not.exist');
            cy.get('[data-cy=panel-encrypt-key]').within(() => {
              cy.get('table tbody tr').within(() => {
                cy.get('td:nth-child(1) i.mdi-check');
                cy.get('td:nth-child(2)').contains(encryptKeyTarget);
                cy.get('td:nth-child(3)').contains('1');
                cy.get('td:nth-child(4)').contains('256');
                cy.get('td:nth-child(5)').contains(comment);
                cy.get('td:nth-child(7)').contains(username);
                cy.get('button[data-cy=btn-key-info-edit]');
                cy.get('button[data-cy=btn-key-update]');
              });
            });
            cy.wait(waitForRefreshConfigFile);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
              cy.log(dl);
              cy.wrap(configFile).should('not.equal', dl);
              cy.get('[data-cy=stream-config-file]').should('include.value', dl);
            });
            cy.get('input[data-cy=switch-embedded-flag]').parent().click();
            cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
          });
      });

      describe('暗号鍵の更新', () => {
        skipOn('ci', () => {
          it('有効フラグ', () => {
            cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
              .then((configFile) => {
                cy.log(configFile);
                cy.get('[data-cy=panel-encrypt-key]').click();
                cy.get('[data-cy=panel-encrypt-key]').within(() => {
                  cy.get('button[data-cy=btn-key-info-edit]').click();
                });
                cy.get('form header div').contains('データ暗号鍵情報の更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('[data-cy=input-enabled]').uncheck({ force: true })
                      .invoke('attr', 'aria-checked').should('eq', 'false');
                    cy.get('button[data-cy=btn-dialog-submit]').click();
                  });
                cy.contains('データ暗号鍵情報の更新').should('not.exist');
                cy.get('[data-cy=panel-encrypt-key]').within(() => {
                  cy.get('table tbody tr').within(() => {
                    cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
                  });
                });
                cy.wait(waitForRefreshConfigFile);
                cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                  cy.log(dl);
                  cy.wrap(configFile).should('not.equal', dl);
                  cy.get('[data-cy=stream-config-file]').should('include.value', dl);
                });
                cy.get('input[data-cy=switch-embedded-flag]').parent().click();
                cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
              });
          });
        });

        it('鍵の更新', () => {
          cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
          cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
            .then((configFile) => {
              cy.log(configFile);
              cy.get('[data-cy=panel-encrypt-key]').click();
              cy.get('[data-cy=panel-encrypt-key]').within(() => {
                cy.get('button[data-cy=btn-key-update]').click();
              });
              cy.get('form header div').contains('データ暗号鍵の更新')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('button[data-cy=btn-dialog-submit]').click();
                });
              cy.contains('データ暗号鍵の更新').should('not.exist');
              cy.get('[data-cy=panel-encrypt-key]').within(() => {
                cy.get('table tbody tr:nth-child(1)').within(() => {
                  cy.get('td:nth-child(1) i.mdi-check');
                  cy.get('td:nth-child(2)').contains(encryptKeyTarget);
                  cy.get('td:nth-child(3)').contains('2');
                  cy.get('td:nth-child(4)').contains('256');
                });
              });
              cy.wait(waitForRefreshConfigFile);
              cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                cy.log(dl);
                cy.wrap(configFile).should('not.equal', dl);
              });
              cy.get('input[data-cy=switch-embedded-flag]').parent().click();
              cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addEncryptKey(token, streamId1, 256, encryptKeyTarget);
          });
        });
      });
    });

    describe('添付ファイルパネル', () => {
      it('添付ファイルの登録', () => {
        cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
        cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
          .then((configFile) => {
            cy.log(configFile);
            cy.get('[data-cy=panel-attach-file]').click();
            cy.get('button[data-cy=btn-create-attach-file]').click();
            cy.get('form header div').contains('添付ファイルの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.fixture(file1, null).as('filename');
                cy.get('[data-cy=input-file]').selectFile({
                  contents: '@filename',
                  mimeType: 'application/octet-stream',
                }, { force: true });
                cy.get('[data-cy=input-target]').type(attachFileTarget);
                cy.get('[data-cy=input-comment]').type(comment);
                cy.get('button[data-cy=btn-dialog-submit]').click();
              });
            cy.contains('添付ファイルの登録').should('not.exist');
            const today = dayjs().format('YYYY/MM/DD');
            cy.get('[data-cy=panel-attach-file]').within(() => {
              cy.get('table tbody tr').within(() => {
                cy.get('td:nth-child(1) i.mdi-check').should('exist');
                cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
                cy.get('td:nth-child(3)').contains(attachFileTarget);
                cy.get('td:nth-child(4)').contains(comment);
                cy.get('td:nth-child(5)').contains(today);
                cy.get('td:nth-child(6)').contains(username);
                cy.get('button[data-cy=btn-update-attach-file]');
                cy.get('button[data-cy=btn-delete-attach-file]');
              });
            });
            cy.wait(waitForRefreshConfigFile);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
              cy.log(dl);
              cy.wrap(configFile).should('not.equal', dl);
              cy.get('[data-cy=stream-config-file]').should('include.value', dl);
            });
            cy.get('input[data-cy=switch-embedded-flag]').parent().click();
            cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
          });
      });

      describe('添付ファイルの更新、削除', () => {
        it('添付ファイルの更新', () => {
          cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
          cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
            .then((configFile) => {
              cy.log(configFile);
              cy.get('[data-cy=panel-attach-file]').click();
              cy.get('button[data-cy=btn-update-attach-file]').click();
              cy.get('form header div').contains('添付ファイルの更新')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('[data-cy=input-comment]').clear().type(`new ${comment}`);
                  cy.fixture(file1, null).as('filename');
                  cy.get('[data-cy=input-file]').selectFile({
                    contents: '@filename',
                    mimeType: 'application/octet-stream',
                  }, { force: true });
                  cy.get('button[data-cy=btn-dialog-submit]').click();
                });
              cy.contains('添付ファイルの更新').should('not.exist');
              cy.get('[data-cy=panel-attach-file]').within(() => {
                const today = dayjs().format('YYYY/MM/DD');
                cy.get('table tbody tr').within(() => {
                  cy.get('td:nth-child(1) i.mdi-check').should('exist');
                  cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
                  cy.get('td:nth-child(3)').contains(attachFileTarget);
                  cy.get('td:nth-child(4)').contains(`new ${comment}`);
                  cy.get('td:nth-child(5)').contains(today);
                  cy.get('td:nth-child(6)').contains(username);
                  cy.get('button[data-cy=btn-update-attach-file]');
                  cy.get('button[data-cy=btn-delete-attach-file]');
                });
              });
              cy.wait(waitForRefreshConfigFile);
              cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                cy.log(dl);
                cy.wrap(configFile).should('not.equal', dl);
                cy.get('[data-cy=stream-config-file]').should('include.value', dl);
              });
              cy.get('input[data-cy=switch-embedded-flag]').parent().click();
              cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
            });
        });

        skipOn('ci', () => {
          it('有効フラグ', () => {
            cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
              .then((configFile) => {
                cy.log(configFile);
                cy.get('[data-cy=panel-attach-file]').click();
                cy.get('button[data-cy=btn-update-attach-file]').click();
                cy.get('form header div').contains('添付ファイルの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('[data-cy=input-enabled]').uncheck({ force: true })
                      .invoke('attr', 'aria-checked').should('eq', 'false');
                    cy.get('button[data-cy=btn-dialog-submit]').click();
                  });
                cy.contains('添付ファイルの更新').should('not.exist');
                cy.get('[data-cy=panel-attach-file]').within(() => {
                  const today = dayjs().format('YYYY/MM/DD');
                  cy.get('table tbody tr').within(() => {
                    cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
                    cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
                    cy.get('td:nth-child(3)').contains(attachFileTarget);
                    cy.get('td:nth-child(4)').contains(comment);
                    cy.get('td:nth-child(5)').contains(today);
                    cy.get('td:nth-child(6)').contains(username);
                    cy.get('button[data-cy=btn-update-attach-file]');
                    cy.get('button[data-cy=btn-delete-attach-file]');
                  });
                });
                cy.wait(waitForRefreshConfigFile);
                cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                  cy.log(dl);
                  cy.wrap(configFile).should('not.equal', dl);
                  cy.get('[data-cy=stream-config-file]').should('include.value', dl);
                });
                cy.get('input[data-cy=switch-embedded-flag]').parent().click();
                cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
              });
          });

          it('秘匿フラグ', () => {
            cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
              .then((configFile) => {
                cy.log(configFile);
                cy.get('[data-cy=panel-attach-file]').click();
                cy.get('button[data-cy=btn-update-attach-file]').click();
                cy.get('form header div').contains('添付ファイルの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('[data-cy=input-secret]').check({ force: true })
                      .invoke('attr', 'aria-checked').should('eq', 'true');
                    cy.get('button[data-cy=btn-dialog-submit]').click();
                  });
                cy.contains('添付ファイルの更新').should('not.exist');
                cy.get('[data-cy=panel-attach-file]').within(() => {
                  const today = dayjs().format('YYYY/MM/DD');
                  cy.get('table tbody tr').within(() => {
                    cy.get('td:nth-child(1) i.mdi-check').should('exist');
                    cy.get('td:nth-child(2) i.mdi-lock').should('exist');
                    cy.get('td:nth-child(3)').contains(attachFileTarget);
                    cy.get('td:nth-child(4)').contains(comment);
                    cy.get('td:nth-child(5)').contains(today);
                    cy.get('td:nth-child(6)').contains(username);
                    cy.get('button[data-cy=btn-update-attach-file]');
                    cy.get('button[data-cy=btn-delete-attach-file]');
                  });
                });
                cy.wait(waitForRefreshConfigFile);
                cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                  cy.log(dl);
                  cy.wrap(configFile).should('not.equal', dl);
                  cy.get('[data-cy=stream-config-file]').should('include.value', dl);
                });
                cy.get('input[data-cy=switch-embedded-flag]').parent().click();
                cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
              });
          });
        });

        it('添付ファイルの削除', () => {
          cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
          cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
            .then((configFile) => {
              cy.log(configFile);
              cy.get('[data-cy=panel-attach-file]').click();
              cy.get('button[data-cy=btn-delete-attach-file]').click();
              cy.get('form header div').contains('添付ファイルの削除')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('button[data-cy=btn-dialog-submit]').click();
                });
              cy.contains('添付ファイルの削除').should('not.exist');
              cy.get('[data-cy=panel-attach-file]').within(() => {
                cy.get('table td').contains('データはありません。');
              });
              cy.wait(waitForRefreshConfigFile);
              cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                cy.log(dl);
                cy.wrap(configFile).should('not.equal', dl);
                cy.get('[data-cy=stream-config-file]').should('include.value', dl);
              });
              cy.get('input[data-cy=switch-embedded-flag]').parent().click();
              cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addAttachFile(token, streamId1, file0, attachFileTarget, false, true, comment);
          });
        });
      });
    });

    describe('ユーザパラメータパネル', () => {
      it('ユーザパラメータの登録', () => {
        cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
        cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
          .then((configFile) => {
            cy.log(configFile);
            cy.get('[data-cy=panel-user-parameter]').click();
            cy.get('button[data-cy=btn-create-user-parameter]').click();
            cy.get('form header div').contains('ユーザパラメータの登録')
              .parents('div.v-dialog').first()
              .within(() => {
                cy.get('[data-cy=input-user]').type(`${username}{enter}`, { force: true });
                cy.get('[data-cy=input-value]').type(value0);
                cy.get('[data-cy=input-target]').type(userParameterTarget);
                cy.get('[data-cy=input-comment]').type(comment);
                cy.get('button[data-cy=btn-dialog-submit]').click();
              });
            cy.contains('ユーザパラメータの登録').should('not.exist');
            cy.get('[data-cy=panel-user-parameter]').within(() => {
              cy.get('table tbody tr').within(() => {
                cy.get('td:nth-child(1) i.mdi-check').should('exist');
                cy.get('td:nth-child(2) i.mdi-lock').should('exist');
                cy.get('td:nth-child(3)').contains(username);
                cy.get('td:nth-child(4)').contains(userParameterTarget);
                cy.get('td:nth-child(5)').contains(secretLabel);
                cy.get('td:nth-child(6)').contains(comment);
                cy.get('button[data-cy=btn-update-user-parameter]');
                cy.get('button[data-cy=btn-delete-user-parameter]');
              });
            });
            cy.wait(waitForRefreshConfigFile);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
              cy.log(dl);
              cy.wrap(configFile).should('not.equal', dl);
              cy.get('[data-cy=stream-config-file]').should('include.value', dl);
            });
            cy.get('input[data-cy=switch-embedded-flag]').parent().click();
            cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
          });
      });

      describe('ユーザパラメータの更新、削除', () => {
        it('ユーザパラメータの更新', () => {
          cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
          cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
            .then((configFile) => {
              cy.log(configFile);
              cy.get('[data-cy=panel-user-parameter]').click();
              cy.get('button[data-cy=btn-update-user-parameter]').click();
              cy.get('form header div').contains('ユーザパラメータの更新')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('[data-cy=input-value]').clear().type(value1);
                  cy.get('button[data-cy=btn-dialog-submit]').click();
                });
              cy.contains('ユーザパラメータの更新').should('not.exist');
              cy.get('[data-cy=panel-user-parameter]').within(() => {
                cy.get('table tbody tr').within(() => {
                  cy.get('td:nth-child(1) i.mdi-check').should('exist');
                  cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
                  cy.get('td:nth-child(3)').contains(username);
                  cy.get('td:nth-child(4)').contains(userParameterTarget);
                  cy.get('td:nth-child(5)').contains(value1);
                  cy.get('td:nth-child(6)').contains(comment);
                  cy.get('button[data-cy=btn-update-user-parameter]');
                  cy.get('button[data-cy=btn-delete-user-parameter]');
                });
              });
              cy.wait(waitForRefreshConfigFile);
              cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                cy.log(dl);
                cy.wrap(configFile).should('not.equal', dl);
                cy.get('[data-cy=stream-config-file]').should('include.value', dl);
              });
              cy.get('input[data-cy=switch-embedded-flag]').parent().click();
              cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
            });
        });

        skipOn('ci', () => {
          it('有効フラグの更新', () => {
            cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
              .then((configFile) => {
                cy.log(configFile);
                cy.get('[data-cy=panel-user-parameter]').click();
                cy.get('button[data-cy=btn-update-user-parameter]').click();
                cy.get('form header div').contains('ユーザパラメータの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('[data-cy=input-enabled]').uncheck({ force: true })
                      .invoke('attr', 'aria-checked').should('eq', 'false');
                    cy.get('button[data-cy=btn-dialog-submit]').click();
                  });
                cy.contains('ユーザパラメータの更新').should('not.exist');
                cy.get('[data-cy=panel-user-parameter]').within(() => {
                  cy.get('table tbody tr').within(() => {
                    cy.get('td:nth-child(1) i.mdi-check').should('not.exist');
                    cy.get('td:nth-child(2) i.mdi-lock').should('not.exist');
                    cy.get('td:nth-child(3)').contains(username);
                    cy.get('td:nth-child(4)').contains(userParameterTarget);
                    cy.get('td:nth-child(5)').contains(value0);
                    cy.get('td:nth-child(6)').contains(comment);
                    cy.get('button[data-cy=btn-update-user-parameter]');
                    cy.get('button[data-cy=btn-delete-user-parameter]');
                  });
                });
                cy.wait(waitForRefreshConfigFile);
                cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                  cy.log(dl);
                  cy.wrap(configFile).should('not.equal', dl);
                  cy.get('[data-cy=stream-config-file]').should('include.value', dl);
                });
                cy.get('input[data-cy=switch-embedded-flag]').parent().click();
                cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
              });
          });

          it('秘匿フラグの更新', () => {
            cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
            cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
              .then((configFile) => {
                cy.log(configFile);
                cy.get('[data-cy=panel-user-parameter]').click();
                cy.get('button[data-cy=btn-update-user-parameter]').click();
                cy.get('form header div').contains('ユーザパラメータの更新')
                  .parents('div.v-dialog').first()
                  .within(() => {
                    cy.get('[data-cy=input-secret]').check({ force: true })
                      .invoke('attr', 'aria-checked').should('eq', 'true');
                    cy.get('button[data-cy=btn-dialog-submit]').click();
                  });
                cy.contains('ユーザパラメータの更新').should('not.exist');
                cy.get('[data-cy=panel-user-parameter]').within(() => {
                  cy.get('table tbody tr').within(() => {
                    cy.get('td:nth-child(1) i.mdi-check').should('exist');
                    cy.get('td:nth-child(2) i.mdi-lock').should('exist');
                    cy.get('td:nth-child(3)').contains(username);
                    cy.get('td:nth-child(4)').contains(userParameterTarget);
                    cy.get('td:nth-child(5)').contains(secretLabel);
                    cy.get('td:nth-child(6)').contains(comment);
                    cy.get('button[data-cy=btn-update-user-parameter]');
                    cy.get('button[data-cy=btn-delete-user-parameter]');
                  });
                });
                cy.wait(waitForRefreshConfigFile);
                cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                  cy.log(dl);
                  cy.wrap(configFile).should('not.equal', dl);
                  cy.get('[data-cy=stream-config-file]').should('include.value', dl);
                });
                cy.get('input[data-cy=switch-embedded-flag]').parent().click();
                cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
              });
          });
        });

        it('ユーザパラメータの削除', () => {
          cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
          cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim')
            .then((configFile) => {
              cy.log(configFile);
              cy.get('[data-cy=panel-user-parameter]').click();
              cy.get('button[data-cy=btn-delete-user-parameter]').click();
              cy.get('form header div').contains('ユーザパラメータの削除')
                .parents('div.v-dialog').first()
                .within(() => {
                  cy.get('button[data-cy=btn-dialog-submit]').click();
                });
              cy.contains('ユーザパラメータの削除').should('not.exist');
              cy.get('[data-cy=panel-user-parameter]').within(() => {
                cy.get('table td').contains('データはありません。');
              });
              cy.wait(waitForRefreshConfigFile);
              cy.get('a[data-cy=btn-download]').downloadBlob().invoke('trim').then((dl) => {
                cy.log(dl);
                cy.wrap(configFile).should('not.equal', dl);
                cy.get('[data-cy=stream-config-file]').should('include.value', dl);
              });
              cy.get('input[data-cy=switch-embedded-flag]').parent().click();
              cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
            });
        });

        beforeEach(() => {
          cy.userToken(username, password).then((token) => {
            cy.addUserParameter(
              token,
              streamId1,
              username,
              userParameterTarget,
              value0,
              null,
              false,
              true,
              comment,
            );
          });
        });
      });
    });

    describe('共同利用者パネル', () => {
      it('共同利用者の登録', () => {
        cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
        cy.get('[data-cy=panel-member]').click();
        cy.get('button[data-cy=btn-create-member]').click();
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user2);
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnSubmit').click();
          });
        cy.get('[data-cy=panel-member]').within(() => {
          cy.get('table tbody').contains(user2).parents('tr').first()
            .within(() => {
              cy.get('[data-cy=members-col-name]').contains(user2);
              cy.get('td').contains(userEmail2);
              cy.get('td').contains(userDisplay2);
              cy.get('[data-cy=members-col-admin]').should('not.exist');
              cy.get('button[data-cy=btn-member-edit]').should('exist');
              cy.get('button[data-cy=btn-member-delete]').should('exist');
            });
        });
      });
    });

    beforeEach(() => {
      cy.login(username, password);
    });
  });

  describe('共同利用者', () => {
    it('設定ファイルが登録されている場合', () => {
      cy.visit(`/streams/${streamId1}`).contains(`コンフィグ情報: ${stream1}`);
      cy.get('[data-cy=panel-basic-info]').should('exist');
      cy.get('[data-cy=panel-encrypt-key]').should('not.exist');
      cy.get('[data-cy=panel-attach-file]').should('not.exist');
      cy.get('[data-cy=panel-user-parameter]').should('not.exist');
      cy.get('[data-cy=panel-member]').should('not.exist');
      cy.get('button[data-cy=btn-update-stream]').should('not.exist');
      cy.get('input[data-cy=switch-embedded-flag]').should('not.exist');

      cy.get('[data-cy=stream-name]').should('have.value', stream1);
      cy.get('[data-cy=stream-comment]').should('have.value', comment);
      cy.get('[data-cy=stream-config-file]').should('include.value', config1.trim());
      cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
        cy.wrap(config1).invoke('trim').should('equal', dl.trim());
      });
    });

    it('設定ファイルが登録されていない場合', () => {
      cy.visit(`/streams/${streamId2}`).contains(`コンフィグ情報: ${stream2}`);
      cy.get('[data-cy=panel-basic-info]').should('exist');
      cy.get('[data-cy=panel-encrypt-key]').should('not.exist');
      cy.get('[data-cy=panel-attach-file]').should('not.exist');
      cy.get('[data-cy=panel-user-parameter]').should('not.exist');
      cy.get('[data-cy=panel-member]').should('not.exist');
      cy.get('button[data-cy=btn-update-stream]').should('not.exist');
      cy.get('input[data-cy=switch-embedded-flag]').should('not.exist');

      cy.get('[data-cy=stream-name]').should('have.value', stream2);
      cy.get('[data-cy=stream-comment]').should('have.value', '');
      cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
    });

    beforeEach(() => {
      cy.login(user1, password1);
    });
  });

  beforeEach(() => {
    cy.userToken(username, password).then((token) => {
      cy.clearStreams(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.addStream(token, stream1, comment, config1).then((resp: any) => {
        streamId1 = resp.body.id;
        cy.addMember(token, false, streamId1, user1);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.addStream(token, stream2).then((resp: any) => {
        streamId2 = resp.body.id;
        cy.addMember(token, false, streamId2, user1);
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
    cy.findUserId(user2).then((uid) => {
      const userInfo = { email: userEmail2, displayName: userDisplay2, password: password2 };
      if (uid == null) {
        cy.addUser({ name: user2, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });

    cy.userToken(username, password).then((token) => {
      cy.clearPublicKeys(token);
      cy.addPublicKey(token);
    });
  });
});
