#!/bin/bash
: ${VAULT_TOKEN:?"Vault token is not set to VAULT_TOKEN"}
: ${VAULT_ADDR:="http://vault:8200"}

setup_vault () {
  curl -X POST --data @test/misc/vault-setup-secret.json \
    -H "X-Vault-Token: $VAULT_TOKEN" ${VAULT_ADDR}/v1/sys/mounts/kv
  curl -X POST --data @test/misc/vault-setup-auth1.json \
    -H "X-Vault-Token: $VAULT_TOKEN" ${VAULT_ADDR}/v1/sys/auth/approle
  curl -X POST --data @test/misc/vault-setup-auth2.json \
    -H "X-Vault-Token: $VAULT_TOKEN" ${VAULT_ADDR}/v1/sys/auth/userpass
}

setup_postgresql () {
  /usr/local/bin/npx knex migrate:latest
}

create_admin () {
  misc/create-admin.sh
}

setup () {
  setup_vault
  setup_postgresql
  create_admin
}

setup