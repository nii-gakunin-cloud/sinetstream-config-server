/// <reference types='../support' />

describe('コンフィグ情報に関するテスト', () => {
  const waitForAttachFile = 1000;
  const waitForDownload = 2000;
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();
  const comment = 'comment';
  const stream1 = 'test-stream-001-admin-config';
  const stream2 = 'test-stream-002-member-config';
  const stream3 = 'test-stream-003-admin-noconfig';
  const stream4 = 'test-stream-004-member-noconfig';
  const topic1 = 'test-kafka-001';
  const topic2 = 'test-kafka-002';
  const topic3 = 'test-kafka-003';
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
  const config3 = `
kafka-service-003:
  type: kafka
  brokers: kafka0.example.org
  topic: ${topic3}
  `;
  const configA = `
kafka-service-001:
  type: kafka
  brokers: kafka0.example.org
  `;
  const defaultConfig = `
# これは設定ファイルの例です。実際の環境に応じた記述内容に修正してください。
service-kafka-001:
  type: kafka
  brokers:
    - kafka0.example.org:9092
    - kafka1.example.org:9092
    - kafka2.example.org:9092
  topic: topic-kafka-001
  consitency: AT_LEAST_ONCE
  value_type: text

service-mqtt-001:
  type: mqtt
  brokers: mqtt.example.org:1883
  topic: topic-mqtt-001
  consitency: AT_LEAST_ONCE
  value_type: text
`;

  describe('コンフィグ情報一覧画面', () => {
    describe('コンフィグ情報が登録されている場合', () => {
      it('コンフィグ情報一覧', () => {
        cy.get('table th').parent().within(() => {
          cy.contains('名前');
          cy.contains('コメント');
          cy.contains('管理者');
        });
        cy.get('table tbody').contains(stream1).parents('tr').first()
          .within(() => {
            cy.contains('a', stream1);
            cy.contains(`${comment} ${stream1}`);
            cy.get('[data-cy=icon-admin]').should('exist');
            cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
            cy.get('[data-cy=btn-menu]').should('be.enabled');
          });
        cy.get('table tbody').contains(stream2).parents('tr').first()
          .within(() => {
            cy.contains('a', stream2);
            cy.contains(`${comment} ${stream2}`);
            cy.get('[data-cy=icon-admin]').should('not.exist');
            cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
            cy.get('[data-cy=btn-menu]').should('be.enabled');
          });
        cy.get('table tbody').contains(stream3).parents('tr').first()
          .within(() => {
            cy.contains('a', stream3);
            cy.contains(`${comment} ${stream3}`);
            cy.get('[data-cy=icon-admin]').should('exist');
            cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
            cy.get('[data-cy=btn-menu]').should('be.enabled');
          });
        cy.get('table tbody').contains(stream4).parents('tr').first()
          .within(() => {
            cy.contains('a', stream4);
            cy.contains(`${comment} ${stream4}`);
            cy.get('[data-cy=icon-admin]').should('not.exist');
            cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
            cy.get('[data-cy=btn-menu]').should('be.enabled');
          });
      });

      it('一覧画面の検索', () => {
        cy.get('table tbody').within(() => {
          cy.contains(stream1);
          cy.contains(stream2);
          cy.contains(stream3);
          cy.contains(stream4);
        });
        cy.get('header input[data-cy=search]').as('search');
        cy.get('@search').type('admin');
        cy.get('table tbody').within(() => {
          cy.contains(stream1);
          cy.contains(stream3);
        });
        cy.get('@search').clear().type('-config');
        cy.get('table tbody').within(() => {
          cy.contains(stream1);
          cy.contains(stream2);
        });
      });

      it('設定ファイルダウンロード', () => {
        cy.get('table tbody').contains(stream1).parents('tr').first()
          .within(() => {
            cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
              cy.wrap(config1).invoke('trim').should('equal', dl.trim());
            });
          });
        cy.get('table tbody').contains(stream2).parents('tr').first()
          .within(() => {
            cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
              cy.wrap(config2).invoke('trim').should('equal', dl.trim());
            });
          });
      });

      describe('データ管理者のメニュー', () => {
        it('詳細情報', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-detail]').click();
          });
          cy.get('header div').should('include.text', `コンフィグ情報: ${stream1}`);
          cy.get('button[data-cy=btn-back]').click();
        });

        it('設定ファイルのダウンロード', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.wait(waitForDownload);
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('a[data-cy=menu-download]').downloadBlob().then((dl) => {
              cy.wrap(config1).invoke('trim').should('equal', dl.trim());
            });
            cy.get('[data-cy=menu-download]').click();
          });
        });

        it('設定ファイルが登録されていない場合', () => {
          cy.get('table tbody').contains(stream3)
            .parents('tr').first()
            .as('rowStream3');
          cy.get('@rowStream3').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream3);
            cy.get('[data-cy=menu-download]').should('have.class', 'v-list-item--disabled');
          });
        });

        it('基本情報の更新', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-update-config]').click();
          });
          cy.get('form header div').contains('コンフィグ情報の更新');
          cy.get('button[data-cy=btn-dialog-cancel]').click();
        });

        it('データ暗号鍵一覧', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-encrypt-keys]').click();
          });
          cy.get('header div').should('include.text', `データ暗号鍵一覧: ${stream1}`);
          cy.get('button[data-cy=btn-back]').click();
          cy.get('header div').should('include.text', 'コンフィグ情報一覧');
        });

        it('添付ファイル一覧', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-attach-files]').click();
          });
          cy.get('header div').should('include.text', `添付ファイル一覧: ${stream1}`);
          cy.get('button[data-cy=btn-back]').click();
          cy.get('header div').should('include.text', 'コンフィグ情報一覧');
        });

        it('ユーザパラメータ一覧', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-user-parameters]').click();
          });
          cy.get('header div').should('include.text', `ユーザパラメータ一覧: ${stream1}`);
          cy.get('button[data-cy=btn-back]').click();
          cy.get('header div').should('include.text', 'コンフィグ情報一覧');
        });

        it('共同利用者一覧', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-members]').click();
          });
          cy.get('header div').should('include.text', `共同利用者一覧: ${stream1}`);
          cy.get('button[data-cy=btn-back]').click();
          cy.get('header div').should('include.text', 'コンフィグ情報一覧');
        });

        it('コンフィグ情報の削除', () => {
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1');
          cy.get('@rowStream1').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream1);
            cy.get('[data-cy=menu-delete-config]').click();
          });
          cy.get('form header div').contains('コンフィグ情報の削除');
          cy.get('button[data-cy=btn-dialog-cancel]').click();
        });
      });

      describe('共同利用者のメニュー', () => {
        it('詳細情報', () => {
          cy.get('table tbody').contains(stream2)
            .parents('tr').first()
            .as('rowStream2');
          cy.get('@rowStream2').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream2);
            cy.get('[data-cy=menu-detail]').click();
          });
          cy.get('header div').should('include.text', `コンフィグ情報: ${stream2}`);
          cy.get('button[data-cy=btn-back]').click();
        });

        it('設定ファイルのダウンロード', () => {
          cy.get('table tbody').contains(stream2)
            .parents('tr').first()
            .as('rowStream2');
          cy.get('@rowStream2').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream2);
            cy.get('a[data-cy=menu-download]').downloadBlob().then((dl) => {
              cy.wrap(config2).invoke('trim').should('equal', dl.trim());
            });
            cy.get('[data-cy=menu-download]').click();
          });
        });

        it('設定ファイルが登録されていない場合', () => {
          cy.get('table tbody').contains(stream4)
            .parents('tr').first()
            .as('rowStream4');
          cy.get('@rowStream4').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream4);
            cy.get('[data-cy=menu-download]').should('have.class', 'v-list-item--disabled');
          });
        });

        it('データ管理者のメニューが表示されていないこと', () => {
          cy.get('table tbody').contains(stream2)
            .parents('tr').first()
            .as('rowStream2');
          cy.get('@rowStream2').within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().as('sheetMenu');
          cy.get('@sheetMenu').within(() => {
            cy.get('[data-cy=menu-header]').contains(stream2);
            cy.get('[data-cy=menu-update-config]').should('not.exist');
            cy.get('[data-cy=menu-encrypt-keys]').should('not.exist');
            cy.get('[data-cy=menu-attach-files]').should('not.exist');
            cy.get('[data-cy=menu-user-parameters]').should('not.exist');
            cy.get('[data-cy=menu-members]').should('not.exist');
            cy.get('[data-cy=menu-delete-config]').should('not.exist');
          });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          // データ管理者、設定ファイルが登録されている
          cy.addStream(token, stream1, `${comment} ${stream1}`, config1);
          // データ管理者、設定ファイルが空
          cy.addStream(token, stream3, `${comment} ${stream3}`);
        });
        cy.adminToken().then((token) => {
          // 共同利用者、設定ファイルが登録されている
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cy.addStream(token, stream2, `${comment} ${stream2}`, config2).then((resp: any) => {
            const sid = resp.body.id;
            cy.addMember(token, false, sid, username);
          });
          // 共同利用者、設定ファイルが空
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cy.addStream(token, stream4, `${comment} ${stream4}`).then((resp: any) => {
            const sid = resp.body.id;
            cy.addMember(token, false, sid, username);
          });
        });
        cy.visit('/streams').contains('コンフィグ情報一覧');
      });
    });

    it('コンフィグ情報が登録されていない場合', () => {
      cy.visit('/streams').contains('コンフィグ情報一覧');
      cy.get('table th').parent().within(() => {
        cy.contains('名前');
        cy.contains('コメント');
        cy.contains('管理者');
      });
      cy.get('table tbody td').contains('データはありません。');
    });

    beforeEach(() => {
      cy.adminToken().then((token) => {
        cy.clearStreams(token);
      });
      cy.userToken(username, password).then((token) => {
        cy.clearStreams(token);
      });
    });
  });

  describe('コンフィグ情報登録ダイアログ', () => {
    it('コンフィグ情報の登録を実行する', () => {
      cy.get('form header div').contains('コンフィグ情報の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
          cy.get('textarea[data-cy=input-config-file]').as('configFile');
          cy.get('@configFile').should('include.value', defaultConfig);

          cy.get('input[data-cy=input-name]').type(stream1).blur();
          cy.get('@btnSubmit').should('be.enabled');

          cy.get('[data-cy=input-comment]').type(`${comment} ${stream1}`);
          cy.get('@configFile').clear();

          config1.split(/\r?\n/)
            .filter((line) => (line.trim().length > 0))
            .forEach((line) => {
              cy.get('@configFile').type(line).type('{enter}');
            });

          cy.get('@btnSubmit').click();
        });
      cy.contains('コンフィグ情報の登録').should('not.exist');

      // データ管理者として登録されていることを確認する
      cy.get('table tbody').contains(stream1).parents('tr').first()
        .within(() => {
          cy.contains('a', stream1);
          cy.contains(`${comment} ${stream1}`);
          cy.get('[data-cy=icon-admin]').should('exist');
          cy.get('[data-cy=btn-menu]').should('be.enabled');
          cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
          cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
            cy.wrap(config1).invoke('trim').should('equal', dl.trim());
          });
        });
    });

    it('設定ファイルを指定してコンフィグ情報の登録を実行する', () => {
      cy.get('form header div').contains('コンフィグ情報の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
          cy.get('textarea[data-cy=input-config-file]').as('configFile');
          cy.get('@configFile').should('include.value', defaultConfig);
          cy.get('input[data-cy=input-name]').type(stream1).blur();
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('[data-cy=input-comment]').type(`${comment} ${stream1}`);
          cy.wait(waitForAttachFile);
          cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
            cy.get('input[type=file]').attachFile('config1.yml');
          });
          cy.get('@btnSubmit').click();
        });
      cy.contains('コンフィグ情報の登録').should('not.exist');

      // データ管理者として登録されていることを確認する
      cy.get('table tbody').contains(stream1).parents('tr').first()
        .within(() => {
          cy.contains('a', stream1);
          cy.contains(`${comment} ${stream1}`);
          cy.get('[data-cy=icon-admin]').should('exist');
          cy.get('[data-cy=btn-menu]').should('be.enabled');
          cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
          cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
            cy.fixture('config1.yml').invoke('trim').should('equal', dl.trim());
          });
        });
    });

    it('キャンセルボタン', () => {
      cy.get('form header div').contains('コンフィグ情報の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('input[data-cy=input-name]').as('name');
          cy.get('[data-cy=input-comment]').as('comment');
          cy.get('textarea[data-cy=input-config-file]').as('configFile');

          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
          cy.get('@name').should('have.value', '');
          cy.get('@comment').should('have.value', '');
          cy.get('@configFile').should('include.value', defaultConfig);

          cy.get('@name').type(stream1).blur();
          cy.get('@comment').type(`${comment} ${stream1}`);
          cy.get('@configFile').clear();
          config1.split(/\r?\n/)
            .filter((line) => (line.trim().length > 0))
            .forEach((line) => {
              cy.get('@configFile').type(line).type('{enter}');
            });

          cy.get('@btnCancel').click();
        });
      cy.contains('コンフィグ情報の登録').should('not.exist');

      // 再表示で前の入力が残っていないことを確認する
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('コンフィグ情報の登録')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
          cy.get('@name').should('have.value', '');
          cy.get('@comment').should('have.value', '');
          cy.get('@configFile').should('include.value', defaultConfig);
        });
    });

    describe('登録内容の重複', () => {
      describe('名前の重複', () => {
        it('自身で登録したコンフィグ情報との重複', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              cy.get('@name').type(stream1).blur();
              cy.get('@name').parents('div.v-text-field').first().within(() => {
                cy.get('div.v-messages').should('have.class', 'error--text')
                  .get('div.v-messages__message')
                  .should('have.text', '既に登録されている他の名前と重複しています。');
              });
              cy.get('@btnSubmit').should('be.disabled');

              cy.get('@name').clear().type(stream3);
              cy.get('@name').parents('div.v-text-field').first().within(() => {
                cy.get('div.v-messages').should('not.have.class', 'error--text');
              });
              cy.get('@btnSubmit').should('be.enabled');
            });
        });

        it('他ユーザが登録したコンフィグ情報との重複', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              cy.get('@name').type(stream2).blur();
              cy.get('@name').parents('div.v-text-field').first().within(() => {
                cy.get('div.v-messages').should('have.class', 'error--text')
                  .get('div.v-messages__message')
                  .should('have.text', '既に登録されている他の名前と重複しています。');
              });
              cy.get('@btnSubmit').should('be.disabled');

              cy.get('@name').clear().type(stream4);
              cy.get('@name').parents('div.v-text-field').first().within(() => {
                cy.get('div.v-messages').should('not.have.class', 'error--text');
              });
              cy.get('@btnSubmit').should('be.enabled');
            });
        });
      });

      describe('トピック名の重複', () => {
        it('自身で登録したコンフィグ情報との重複', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              // トピック名重複の警告表示されること
              cy.get('@name').type(stream3).blur();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@configFile').clear();
              config1.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic1);
              });

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('div.v-alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('div.v-alert').within(() => {
                cy.get('div.v-alert__content').contains(topic1);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('div.v-alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
            });
        });

        it('重複警告での強制登録', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              // トピック名重複の警告表示されること
              cy.get('@name').type(stream3).blur();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@configFile').clear();
              config1.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic1);
              });

              // トピック名重複の警告表示を閉じる
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');

              // 設定ファイルの入力を変更することでトピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}a{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.contains('コンフィグ情報の登録').should('not.exist');
          cy.get('table tbody').contains(stream3).parents('tr').first()
            .within(() => {
              cy.contains('a', stream3);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
            });
        });

        it('他ユーザが登録したトピックと重複するものを登録する', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              // トピック名重複の警告が表示されること
              cy.get('@name').type(stream3).blur();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.contains('コンフィグ情報の登録').should('not.exist');
          cy.get('table tbody').contains(stream3).parents('tr').first()
            .within(() => {
              cy.contains('a', stream3);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
            });
        });

        it('ファイルの登録でのトピックの重複', () => {
          cy.get('form header div').contains('コンフィグ情報の登録')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
              cy.get('@name').should('have.value', '');

              // トピック名重複の警告表示されること
              cy.get('@name').type(stream3).blur();
              cy.get('@btnSubmit').should('be.enabled');
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').as('inputFile');
                cy.get('@inputFile').attachFile('config2.yml');
              });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('div.v-alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.wait(waitForAttachFile);
              cy.get('@inputFile').attachFile('config1.yml');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('div.v-alert').within(() => {
                cy.get('div.v-alert__content').contains(topic1);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('div.v-alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
            });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addStream(token, stream1, `${comment} ${stream1}`, config1);
        });
        cy.adminToken().then((token) => {
          cy.addStream(token, stream2, `${comment} ${stream2}`, config2);
        });
        cy.visit('/');
        cy.visit('/streams').contains('コンフィグ情報一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('コンフィグ情報の登録');
      });
    });

    beforeEach(() => {
      cy.adminToken().then((token) => {
        cy.clearStreams(token);
      });
      cy.userToken(username, password).then((token) => {
        cy.clearStreams(token);
      });
      cy.visit('/streams').contains('コンフィグ情報一覧');
      cy.get('button[data-cy=btn-create]').click();
      cy.get('form header div').contains('コンフィグ情報の登録');
    });
  });

  describe('コンフィグ情報編集ダイアログ', () => {
    describe('トピック名が重複していない場合', () => {
      it('コメントの変更', () => {
        cy.get('form header div').contains('コンフィグ情報の更新')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
            cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-comment]').clear().type(`${comment} ${stream1}`);
            cy.get('@btnSubmit').click();
          });
        cy.get('[data-cy=dialog-title]').should('not.exist');

        // コメントの変更が一覧表示に反映されていること
        cy.get('table tbody').contains(stream1).parents('tr').first()
          .within(() => {
            cy.contains('a', stream1);
            cy.contains(`${comment} ${stream1}`);
            cy.get('[data-cy=icon-admin]').should('exist');
            cy.get('[data-cy=btn-menu]').should('be.enabled');
            cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
            cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
              cy.wrap(config1).invoke('trim').should('equal', dl.trim());
            });
          });
      });

      describe('設定ファイルの変更', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');

          // 設定ファイルの変更が一覧表示に反映されていること
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.contains(comment);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(config2).invoke('trim').should('equal', dl.trim());
              });
              cy.get('[data-cy=btn-menu]').should('be.enabled').click();
            });
          cy.get('a[data-cy=menu-download]').downloadBlob().then((dl) => {
            cy.wrap(config2).invoke('trim').should('equal', dl.trim());
          });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').attachFile('config2.yml');
              });
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');

          // 設定ファイルの変更が一覧表示に反映されていること
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.contains(comment);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(config2).invoke('trim').should('equal', dl.trim());
              });
              cy.get('[data-cy=btn-menu]').should('be.enabled').click();
            });
          cy.get('a[data-cy=menu-download]').downloadBlob().then((dl) => {
            cy.wrap(config2).invoke('trim').should('equal', dl.trim());
          });
        });

        it('内容のクリア', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@configFile').clear();
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');

          // コメントの変更が一覧表示に反映されていること
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.contains(comment);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-download]').should('have.class', 'v-btn--disabled');
              cy.get('[data-cy=btn-menu]').should('be.enabled').click();
            });
          cy.get('[data-cy=menu-download]').should('have.class', 'v-list-item--disabled');
        });
      });

      describe('キャンセルボタン', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('@comment').invoke('val').should('equal', comment);
              cy.get('@configFile').should('include.value', config1.trim());
              // 入力欄の内容を変更する
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@comment').clear().type(`${comment} ${stream1}`);
              cy.get('@btnCancel').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');

          // ダイアログの再表示で前回入力したものが残っていないこと
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('@comment').invoke('val').should('equal', comment);
              cy.get('@configFile').should('include.value', config1.trim());
            });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
              cy.get('[data-cy=input-comment]').as('comment');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('@comment').invoke('val').should('equal', comment);
              cy.get('@configFile').should('include.value', config1.trim());
              // 入力欄の内容を変更する
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').attachFile('config2.yml');
              });
              cy.fixture('config2.yml').then((cfg) => {
                cy.get('@configFile').should('include.value', cfg.trim());
              });
              cy.get('@comment').clear().type(`${comment} ${stream1}`);
              cy.get('@btnCancel').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');

          // ダイアログの再表示で前回入力したものが残っていないこと
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('input[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('@comment').invoke('val').should('equal', comment);
              cy.get('@configFile').should('include.value', config1.trim());
            });
        });
      });

      beforeEach(() => {
        cy.adminToken().then((token) => {
          cy.clearStreams(token);
        });
        cy.userToken(username, password).then((token) => {
          cy.clearStreams(token);
          cy.addStream(token, stream1, comment, config1);
        });
        cy.visit('/streams').contains('コンフィグ情報一覧');
        cy.get('table tbody').contains(stream1)
          .parents('tr').first()
          .as('rowStream1')
          .within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
        cy.get('.v-subheader[data-cy=menu-header]')
          .parents('.v-list').first().within(() => {
            cy.get('[data-cy=menu-update-config]').click();
          });
        cy.get('form header div').contains('コンフィグ情報の更新');
      });
    });

    describe('トピック名が重複している場合', () => {
      describe('自分が登録したコンフィグ情報とトピック名が重複する場合', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告が表示されること
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').as('inputFile');
                cy.get('@inputFile').attachFile('config2.yml');
              });
              cy.fixture('config2.yml').then((cfg) => {
                cy.get('@configFile').should('include.value', cfg.trim());
              });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.wait(waitForAttachFile);
              cy.get('@inputFile').attachFile('config2.yml');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('重複トピックの強制登録', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じる
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');

              // 設定ファイルの入力を変更することでトピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}a{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(config2).invoke('trim').should('equal', dl.trim());
              });
            });
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment, config1);
            cy.addStream(token, stream2, comment, config2);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新');
        });
      });

      describe('他ユーザが登録したコンフィグ情報とトピック名が重複する場合', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告が表示されること
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').as('inputFile');
                cy.get('@inputFile').attachFile('config2.yml');
              });
              cy.fixture('config2.yml').then((cfg) => {
                cy.get('@configFile').should('include.value', cfg.trim());
              });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.wait(waitForAttachFile);
              cy.get('@inputFile').attachFile('config2.yml');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('重複トピックの強制登録', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じる
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');

              // 設定ファイルの入力を変更することでトピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}a{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(config2).invoke('trim').should('equal', dl.trim());
              });
            });
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
          });
          cy.adminToken().then((token) => {
            cy.addStream(token, stream2, comment, config2);
          });
          cy.userToken(username, password).then((token) => {
            cy.addStream(token, stream1, comment, config1);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新');
        });
      });

      describe('複数のトピックが重複する場合', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              config3.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').contains(topic3);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が変化すること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').contains(topic3);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告が表示されること
              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').as('inputFile');
                cy.get('@inputFile').attachFile('config-a.yml');
              });
              cy.fixture('config-a.yml').then((cfg) => {
                cy.get('@configFile').should('include.value', cfg.trim());
              });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').contains(topic3);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が変化すること
              cy.get('@configFile').type('a');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').contains(topic3);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('重複トピックの強制登録', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');

              // トピック名重複の警告表示されること
              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              config3.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });

              cy.get('@btnSubmit').should('be.disabled');
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').contains(topic3);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じる
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');

              // 設定ファイルの入力を変更することでトピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}a{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(dl).should('include', topic2.trim());
                cy.wrap(dl).should('include', topic3.trim());
              });
            });
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment, config1);
            cy.addStream(token, stream2, comment, config2);
            cy.addStream(token, stream3, comment, config3);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新');
        });
      });

      describe('重複したトピック名をもつコンフィグ情報に対する変更', () => {
        it('直接入力での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '更新');
              // トピック名重複の警告が表示されること
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic1);
              });

              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').should('not.contain.text', topic1);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('ファイル指定での変更', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              // トピック名重複の警告が表示されること
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic1);
              });

              cy.wait(waitForAttachFile);
              cy.get('div.config-file-textarea[data-cy=input-config-file]').within(() => {
                cy.get('input[type=file]').as('inputFile');
                cy.get('@inputFile').attachFile('config2.yml');
              });
              cy.fixture('config2.yml').then((cfg) => {
                cy.get('@configFile').should('include.value', cfg.trim());
              });
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').should('not.contain.text', topic1);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示が非表示となること
              cy.get('@configFile').type('{backspace}a');
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');

              // トピック名重複の警告表示が再表示されること
              cy.wait(waitForAttachFile);
              cy.get('@inputFile').attachFile('config2.yml');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').should('not.contain.text', topic1);
              });

              // 全ての入力をクリアするとトピック名重複の警告表示が非表示となること
              cy.get('@configFile').clear().blur();
              cy.get('@alert').invoke('attr', 'style').should('include', 'display: none');
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
        });

        it('重複トピックの強制登録', () => {
          cy.get('form header div').contains('コンフィグ情報の更新')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').as('name');
              cy.get('@name').should('have.attr', 'readonly');
              cy.get('textarea[data-cy=input-config-file]').as('configFile');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '更新');
              // トピック名重複の警告が表示されること
              cy.get('div.v-alert').as('alert');
              cy.get('@alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@alert').within(() => {
                cy.get('button.v-alert__dismissible').as('dismissAlert');
                cy.get('div.v-alert__content').contains(topic1);
              });

              cy.get('@configFile').clear();
              config2.split(/\r?\n/)
                .filter((line) => (line.trim().length > 0))
                .forEach((line) => {
                  cy.get('@configFile').type(line).type('{enter}');
                });
              cy.get('@alert').within(() => {
                cy.get('div.v-alert__content').contains(topic2);
                cy.get('div.v-alert__content').should('not.contain.text', topic1);
              });
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じる
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');

              // 設定ファイルの入力を変更することでトピック名重複の警告表示が再表示されること
              cy.get('@configFile').type('{backspace}a{backspace}');
              cy.get('div.v-alert').invoke('attr', 'style').should('not.include', 'display: none');
              cy.get('@btnSubmit').should('be.disabled');

              // トピック名重複の警告表示を閉じて登録する
              cy.get('@dismissAlert').click();
              cy.get('@btnSubmit').should('be.enabled');
              cy.get('@btnSubmit').click();
            });
          cy.get('[data-cy=dialog-title]').should('not.exist');
          cy.get('table tbody').contains(stream1).parents('tr').first()
            .within(() => {
              cy.contains('a', stream1);
              cy.get('[data-cy=icon-admin]').should('exist');
              cy.get('[data-cy=btn-menu]').should('be.enabled');
              cy.get('[data-cy=btn-download]').should('not.have.class', 'v-btn--disabled');
              cy.wait(waitForDownload);
              cy.get('a[data-cy=btn-download]').downloadBlob().then((dl) => {
                cy.wrap(config2).invoke('trim').should('equal', dl.trim());
              });
            });
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment, config1);
            cy.addStream(token, stream2, comment, config1);
            cy.addStream(token, stream3, comment, config2);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-update-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の更新');
        });
      });
    });
  });

  describe('コンフィグ情報削除ダイアログ', () => {
    describe('削除の実行', () => {
      describe('設定ファイルが登録されている場合', () => {
        it('削除の実行', () => {
          cy.get('form header div').contains('コンフィグ情報の削除')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').should('have.value', stream1);
              cy.get('[data-cy=input-comment]').should('have.value', comment);
              cy.get('textarea[data-cy=input-config-file]').should('have.value', config1);
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '削除');
              cy.get('[data-cy=input-confirm]').as('confirm');
              cy.get('@confirm').should('include.value', '');
              cy.get('@confirm').type(stream1);
              cy.get('@btnSubmit').click();
            });
          cy.contains('form header div', 'コンフィグ情報の削除').should('not.exist');
          cy.get('table tbody td').contains('データはありません。');
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment, config1);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-delete-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の削除');
        });
      });

      describe('設定ファイルにトピックがない場合', () => {
        it('削除の実行', () => {
          cy.get('form header div').contains('コンフィグ情報の削除')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').should('have.value', stream1);
              cy.get('[data-cy=input-comment]').should('have.value', comment);
              cy.get('textarea[data-cy=input-config-file]').should('have.value', configA);
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '削除');
              cy.get('[data-cy=input-confirm]').as('confirm');
              cy.get('@confirm').should('include.value', '');
              cy.get('@confirm').type(stream1);
              cy.get('@btnSubmit').click();
            });
          cy.contains('form header div', 'コンフィグ情報の削除').should('not.exist');
          cy.get('table tbody td').contains('データはありません。');
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment, configA);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-delete-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の削除');
        });
      });

      describe('設定ファイルが空の場合', () => {
        it('削除の実行', () => {
          cy.get('form header div').contains('コンフィグ情報の削除')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('input[data-cy=input-name]').should('have.value', stream1);
              cy.get('[data-cy=input-comment]').should('have.value', comment);
              cy.get('textarea[data-cy=input-config-file]').should('have.value', '');
              cy.get('@btnSubmit').should('be.disabled').and('include.text', '削除');
              cy.get('[data-cy=input-confirm]').as('confirm');
              cy.get('@confirm').should('include.value', '');
              cy.get('@confirm').type(stream1);
              cy.get('@btnSubmit').click();
            });
          cy.contains('form header div', 'コンフィグ情報の削除').should('not.exist');
          cy.get('table tbody td').contains('データはありません。');
        });

        beforeEach(() => {
          cy.adminToken().then((token) => {
            cy.clearStreams(token);
          });
          cy.userToken(username, password).then((token) => {
            cy.clearStreams(token);
            cy.addStream(token, stream1, comment);
          });
          cy.visit('/streams').contains('コンフィグ情報一覧');
          cy.get('table tbody').contains(stream1)
            .parents('tr').first()
            .as('rowStream1')
            .within(() => {
              cy.get('button[data-cy=btn-menu]').click();
            });
          cy.get('.v-subheader[data-cy=menu-header]')
            .parents('.v-list').first().within(() => {
              cy.get('[data-cy=menu-delete-config]').click();
            });
          cy.get('form header div').contains('コンフィグ情報の削除');
        });
      });
    });

    describe('キャンセルボタン', () => {
      it('ダイアログの再表示で前回の入力がクリアされていること', () => {
        cy.get('form header div').contains('コンフィグ情報の削除')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('input[data-cy=input-name]').should('have.value', stream1);
            cy.get('[data-cy=input-comment]').should('have.value', comment);
            cy.get('textarea[data-cy=input-config-file]').should('have.value', config1);
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '削除');
            cy.get('[data-cy=input-confirm]').as('confirm');
            cy.get('@confirm').should('include.value', '');
            cy.get('@confirm').type(stream1);
            cy.get('@btnCancel').click();
          });
        cy.contains('form header div', 'コンフィグ情報の削除').should('not.exist');
        cy.get('table tbody').contains(stream1)
          .parents('tr').first()
          .as('rowStream1')
          .within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
        cy.get('.v-subheader[data-cy=menu-header]')
          .parents('.v-list').first().within(() => {
            cy.get('[data-cy=menu-delete-config]').click();
          });
        cy.get('form header div').contains('コンフィグ情報の削除')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('input[data-cy=input-name]').should('have.value', stream1);
            cy.get('[data-cy=input-comment]').should('have.value', comment);
            cy.get('textarea[data-cy=input-config-file]').should('have.value', config1);
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '削除');
            cy.get('@confirm').should('include.value', '');
          });
      });

      beforeEach(() => {
        cy.adminToken().then((token) => {
          cy.clearStreams(token);
        });
        cy.userToken(username, password).then((token) => {
          cy.clearStreams(token);
          cy.addStream(token, stream1, comment, config1);
        });
        cy.visit('/streams').contains('コンフィグ情報一覧');
        cy.get('table tbody').contains(stream1)
          .parents('tr').first()
          .as('rowStream1')
          .within(() => {
            cy.get('button[data-cy=btn-menu]').click();
          });
        cy.get('.v-subheader[data-cy=menu-header]')
          .parents('.v-list').first().within(() => {
            cy.get('[data-cy=menu-delete-config]').click();
          });
        cy.get('form header div').contains('コンフィグ情報の削除');
      });
    });
  });

  beforeEach(() => {
    cy.login(username, password);
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
  });
});
