/// <reference types='../support' />
import { skipOn } from '@cypress/skip-test';

describe('共同利用者に関するテスト', () => {
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();

  const user1 = 'test-001';
  const userEmail1 = 'test-001@example.org';
  const userDisplay1 = 'テストユーザ 001';
  const user2 = 'test-002';
  const userEmail2 = 'test-002@example.org';
  const userDisplay2 = 'テストユーザ 002';
  const badUser = 'test-xxx';

  const stream1 = 'test-stream-001';
  let streamId1: number;

  describe('共同利用者の一覧画面', () => {
    it('共同利用者一覧', () => {
      cy.get('table tbody').contains(username).parents('tr').first()
        .within(() => {
          cy.get('[data-cy=members-col-name]').contains(username);
          cy.get('td').contains(email);
          cy.get('td').contains(displayName);
          cy.get('[data-cy=members-col-admin]')
            .should('have.class', 'v-icon').and('have.class', 'mdi-check');
          cy.get('button[data-cy=btn-member-edit]').should('not.exist');
          cy.get('button[data-cy=btn-member-delete]').should('not.exist');
        });
      cy.get('table tbody').contains(user1).parents('tr').first()
        .within(() => {
          cy.get('[data-cy=members-col-name]').contains(user1);
          cy.get('td').contains(userEmail1);
          cy.get('td').contains(userDisplay1);
          cy.get('[data-cy=members-col-admin]')
            .should('have.class', 'v-icon').and('have.class', 'mdi-check');
          cy.get('button[data-cy=btn-member-edit]').should('exist');
          cy.get('button[data-cy=btn-member-delete]').should('exist');
        });
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

    it('一覧画面の検索', () => {
      cy.get('table tbody').within(() => {
        cy.contains(username);
        cy.contains(user1);
        cy.contains(user2);
      });
      cy.get('header input[data-cy=search]').as('search');
      cy.get('@search').type('テスト');
      cy.get('table tbody').within(() => {
        cy.contains(user1);
        cy.contains(user2);
        cy.get('td').should('not.include.text', displayName);
      });
      cy.get('@search').clear().type('test@');
      cy.get('table tbody').within(() => {
        cy.contains(username);
        cy.get('td').should('not.include.text', userDisplay1);
        cy.get('td').should('not.include.text', userDisplay2);
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addMember(token, true, streamId1, user1);
        cy.addMember(token, false, streamId1, user2);
      });
      cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
    });
  });

  describe('共同利用者の登録ダイアログ', () => {
    describe('一人だけを登録する場合', () => {
      it('登録の実行', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user1);
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnSubmit').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        // 登録した共同利用者が一覧表示に反映されることを確認する
        cy.get('table tbody').contains(user1).parents('tr').first()
          .within(() => {
            cy.get('[data-cy=members-col-name]').contains(user1);
            cy.get('td').contains(userEmail1);
            cy.get('td').contains(userDisplay1);
            cy.get('[data-cy=members-col-admin]').should('not.exist');
            cy.get('button[data-cy=btn-member-edit]').should('exist');
            cy.get('button[data-cy=btn-member-delete]').should('exist');
          });
      });

      it('既に登録されている利用者を指定した場合', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user2);
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnSubmit').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        // 登録した共同利用者が一覧表示に反映されることを確認する
        cy.get('table tbody').contains(user2).parents('tr').first()
          .within(() => {
            cy.get('[data-cy=members-col-name]').contains(user2);
            cy.get('td').contains(userEmail2);
            cy.get('td').contains(userDisplay2);
            cy.get('[data-cy=members-col-admin]')
              .should('have.class', 'v-icon').and('have.class', 'mdi-check');
            cy.get('button[data-cy=btn-member-edit]').should('exist');
            cy.get('button[data-cy=btn-member-delete]').should('exist');
          });
      });

      it('usersに存在しない利用者を指定した場合', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(badUser);
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@members').parents('div.v-textarea').first().within(() => {
              cy.get('div.v-messages').should('have.class', 'error--text')
                .get('div.v-messages__message')
                .should('include.text', '登録されていない利用者が指定されています')
                .and('include.text', badUser);
            });
          });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.addMember(token, true, streamId1, user2);
        });
        cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('共同利用者の登録');
      });
    });

    describe('複数名を登録する場合', () => {
      it('登録の実行', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user1).type(' , ').type(user2)
              .type(' , ');
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnSubmit').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        // 登録した共同利用者が一覧表示に反映されることを確認する
        cy.get('table tbody').contains(user1).parents('tr').first()
          .within(() => {
            cy.get('[data-cy=members-col-name]').contains(user1);
            cy.get('td').contains(userEmail1);
            cy.get('td').contains(userDisplay1);
            cy.get('[data-cy=members-col-admin]').should('not.exist');
            cy.get('button[data-cy=btn-member-edit]').should('exist');
            cy.get('button[data-cy=btn-member-delete]').should('exist');
          });
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

      it('既に登録されている利用者が含まれている場合', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members')
              .type(username).type(',')
              .type(user1)
              .type(' , ')
              .type(user2);
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnSubmit').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        // 登録した共同利用者が一覧表示に反映されることを確認する
        cy.get('table tbody').contains(user1).parents('tr').first()
          .within(() => {
            cy.get('[data-cy=members-col-name]').contains(user1);
            cy.get('td').contains(userEmail1);
            cy.get('td').contains(userDisplay1);
            cy.get('[data-cy=members-col-admin]').should('not.exist');
            cy.get('button[data-cy=btn-member-edit]').should('exist');
            cy.get('button[data-cy=btn-member-delete]').should('exist');
          });
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

      it('usersに存在しない利用者を指定した場合', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members')
              .type(user1).type(' , ')
              .type(badUser)
              .type(',')
              .type(user2);
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@members').parents('div.v-textarea').first().within(() => {
              cy.get('div.v-messages').should('have.class', 'error--text')
                .get('div.v-messages__message')
                .should('include.text', '登録されていない利用者が指定されています')
                .and('include.text', badUser);
            });
          });
      });

      beforeEach(() => {
        cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('共同利用者の登録');
      });
    });

    describe('キャンセルボタン', () => {
      it('ダイアログの再表示で前回の入力が残っていないこと', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user1).type(' , ').type(user2)
              .type(' , ');
            cy.get('@btnSubmit').should('be.enabled');
            cy.get('@btnCancel').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('@members').should('have.value', '');
          });
      });

      it('ダイアログの再表示で前回のエラー状態が残っていないこと', () => {
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('textarea[data-cy=input-members]').as('members');
            cy.get('@members').type(user1).type(' , ').type(badUser)
              .type(' , ');
            cy.get('@btnSubmit').should('be.disabled');
            cy.get('@members').parents('div.v-textarea').first().within(() => {
              cy.get('div.v-messages').should('have.class', 'error--text')
                .get('div.v-messages__message')
                .should('include.text', '登録されていない利用者が指定されています')
                .and('include.text', badUser);
            });
            cy.get('@btnCancel').click();
          });
        cy.contains('共同利用者の登録').should('not.exist');

        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('共同利用者の登録')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('@btnSubmit').should('be.disabled').and('include.text', '登録');
            cy.get('@members').should('have.value', '');
            cy.get('@members').parents('div.v-textarea').first().within(() => {
              cy.get('div.v-messages').should('not.have.class', 'error--text');
            });
          });
      });

      beforeEach(() => {
        cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
        cy.get('button[data-cy=btn-create]').click();
        cy.get('form header div').contains('共同利用者の登録');
      });
    });
  });

  describe('共同利用者の更新ダイアログ', () => {
    describe('データ管理者権限の変更', () => {
      skipOn('ci', () => {
        it('権限の除去', () => {
          cy.get('table tbody').contains(user1).parents('tr').first()
            .within(() => {
              cy.get('button[data-cy=btn-member-edit]').click();
            });
          cy.get('form header div').contains('データ管理者権限の変更')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '変更');
              cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-name]').should('have.value', user1);
              cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-display-name]').should('have.value', userDisplay1);
              cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-email]').should('have.value', userEmail1);
              cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
                .should('eq', 'true');
              cy.get('input[data-cy=input-admin]').parent().click();
              cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
                .should('eq', 'false');
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ管理者権限の変更').should('not.exist');

          // データ管理者権限が変更されたことを確認する
          cy.get('table tbody').contains(user1).parents('tr').first()
            .within(() => {
              cy.get('[data-cy=members-col-name]').contains(user1);
              cy.get('td').contains(userEmail1);
              cy.get('td').contains(userDisplay1);
              cy.get('[data-cy=members-col-admin]').should('not.exist');
              cy.get('button[data-cy=btn-member-edit]').should('exist');
              cy.get('button[data-cy=btn-member-delete]').should('exist');
            });
        });

        it('権限の付与', () => {
          cy.get('table tbody').contains(user2).parents('tr').first()
            .within(() => {
              cy.get('button[data-cy=btn-member-edit]').click();
            });
          cy.get('form header div').contains('データ管理者権限の変更')
            .parents('div.v-dialog').first()
            .within(() => {
              cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
              cy.get('@btnSubmit').should('be.enabled').and('include.text', '変更');
              cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-name]').should('have.value', user2);
              cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-display-name]').should('have.value', userDisplay2);
              cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
              cy.get('[data-cy=input-email]').should('have.value', userEmail2);
              cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
                .should('eq', 'false');
              cy.get('input[data-cy=input-admin]').parent().click();
              cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
                .should('eq', 'true');
              cy.get('@btnSubmit').click();
            });
          cy.contains('データ管理者権限の変更').should('not.exist');

          // データ管理者権限が変更されたことを確認する
          cy.get('table tbody').contains(user2).parents('tr').first()
            .within(() => {
              cy.get('[data-cy=members-col-name]').contains(user2);
              cy.get('td').contains(userEmail2);
              cy.get('td').contains(userDisplay2);
              cy.get('[data-cy=members-col-admin]').should('exist');
              cy.get('button[data-cy=btn-member-edit]').should('exist');
              cy.get('button[data-cy=btn-member-delete]').should('exist');
            });
        });
      });
    });

    describe('キャンセルボタン', () => {
      it('権限がある場合', () => {
        cy.get('table tbody').contains(user1).parents('tr').first()
          .within(() => {
            cy.get('button[data-cy=btn-member-edit]').click();
          });
        cy.get('form header div').contains('データ管理者権限の変更')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '変更');
            cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-name]').should('have.value', user1);
            cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-display-name]').should('have.value', userDisplay1);
            cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-email]').should('have.value', userEmail1);
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'true');
            cy.get('input[data-cy=input-admin]').parent().click();
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'false');
            cy.get('@btnCancel').click();
          });
        cy.contains('データ管理者権限の変更').should('not.exist');

        cy.get('table tbody').contains(user1).parents('tr').first()
          .within(() => {
            cy.get('button[data-cy=btn-member-edit]').click();
          });
        cy.get('form header div').contains('データ管理者権限の変更')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('[data-cy=input-name]').should('have.value', user1);
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'true');
          });
      });

      it('権限の付与', () => {
        cy.get('table tbody').contains(user2).parents('tr').first()
          .within(() => {
            cy.get('button[data-cy=btn-member-edit]').click();
          });
        cy.get('form header div').contains('データ管理者権限の変更')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
            cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
            cy.get('@btnSubmit').should('be.enabled').and('include.text', '変更');
            cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-name]').should('have.value', user2);
            cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-display-name]').should('have.value', userDisplay2);
            cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
            cy.get('[data-cy=input-email]').should('have.value', userEmail2);
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'false');
            cy.get('input[data-cy=input-admin]').parent().click();
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'true');
            cy.get('@btnCancel').click();
          });
        cy.contains('データ管理者権限の変更').should('not.exist');

        cy.get('table tbody').contains(user2).parents('tr').first()
          .within(() => {
            cy.get('button[data-cy=btn-member-edit]').click();
          });
        cy.get('form header div').contains('データ管理者権限の変更')
          .parents('div.v-dialog').first()
          .within(() => {
            cy.get('[data-cy=input-name]').should('have.value', user2);
            cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked')
              .should('eq', 'false');
          });
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addMember(token, true, streamId1, user1);
        cy.addMember(token, false, streamId1, user2);
      });
      cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
    });
  });

  describe('共同利用者の削除ダイアログ', () => {
    it('データ管理者の削除', () => {
      cy.get('table tbody').contains(user1).parents('tr').first()
        .within(() => {
          cy.get('button[data-cy=btn-member-delete]').click();
        });
      cy.get('form header div').contains('共同利用者の削除')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
          cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-name]').should('have.value', user1);
          cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-display-name]').should('have.value', userDisplay1);
          cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-email]').should('have.value', userEmail1);
          cy.get('[data-cy=input-admin]').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@btnSubmit').click();
        });
      cy.contains('共同利用者の削除').should('not.exist');

      // 共同利用者の削除が一覧表示に反映されることを確認する
      cy.get('table tbody tr td [data-cy=members-col-name] span')
        .should('not.include.text', user1);
    });

    it('共同利用者の削除', () => {
      cy.get('table tbody').contains(user2).parents('tr').first()
        .within(() => {
          cy.get('button[data-cy=btn-member-delete]').click();
        });
      cy.get('form header div').contains('共同利用者の削除')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
          cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-name]').should('have.value', user2);
          cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-display-name]').should('have.value', userDisplay2);
          cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-email]').should('have.value', userEmail2);
          cy.get('[data-cy=input-admin]').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked').should('eq', 'false');
          cy.get('@btnSubmit').click();
        });
      cy.contains('共同利用者の削除').should('not.exist');

      // 共同利用者の削除が一覧表示に反映されることを確認する
      cy.get('table tbody tr td [data-cy=members-col-name] span')
        .should('not.include.text', user2);
    });

    it('キャンセルボタン', () => {
      cy.get('table tbody').contains(user1).parents('tr').first()
        .within(() => {
          cy.get('button[data-cy=btn-member-delete]').click();
        });
      cy.get('form header div').contains('共同利用者の削除')
        .parents('div.v-dialog').first()
        .within(() => {
          cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
          cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
          cy.get('@btnSubmit').should('be.enabled').and('include.text', '削除');
          cy.get('[data-cy=input-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-name]').should('have.value', user1);
          cy.get('[data-cy=input-display-name]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-display-name]').should('have.value', userDisplay1);
          cy.get('[data-cy=input-email]').should('have.attr', 'readonly');
          cy.get('[data-cy=input-email]').should('have.value', userEmail1);
          cy.get('[data-cy=input-admin]').invoke('attr', 'disabled').should('eq', 'disabled');
          cy.get('[data-cy=input-admin]').invoke('attr', 'aria-checked').should('eq', 'true');
          cy.get('@btnCancel').click();
        });
      cy.contains('共同利用者の削除').should('not.exist');

      // 共同利用者が一覧表示から削除されていないことを確認する
      cy.get('table tbody').contains(user1).parents('tr').first()
        .within(() => {
          cy.get('[data-cy=members-col-name]').contains(user1);
          cy.get('td').contains(userEmail1);
          cy.get('td').contains(userDisplay1);
          cy.get('[data-cy=members-col-admin]').should('exist');
          cy.get('button[data-cy=btn-member-edit]').should('exist');
          cy.get('button[data-cy=btn-member-delete]').should('exist');
        });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.addMember(token, true, streamId1, user1);
        cy.addMember(token, false, streamId1, user2);
      });
      cy.visit(`/streams/${streamId1}/members`).contains(`共同利用者一覧: ${stream1}`);
    });
  });

  beforeEach(() => {
    cy.login(username, password);
    cy.userToken(username, password).then((token) => {
      cy.clearStreams(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.addStream(token, stream1).then((resp: any) => {
        streamId1 = resp.body.id;
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
      const userInfo = { email: userEmail1, displayName: userDisplay1 };
      if (uid == null) {
        cy.addUser({ name: user1, password, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
    cy.findUserId(user2).then((uid) => {
      const userInfo = { email: userEmail2, displayName: userDisplay2 };
      if (uid == null) {
        cy.addUser({ name: user2, password, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
  });
});
