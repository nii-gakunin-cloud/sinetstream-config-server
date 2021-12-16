#!/bin/bash
: ${VAULT_ADDR:="http://vault:8200"}
: ${VAULT_TOKEN:?"Vault token is not set to VAULT_TOKEN"}
: ${ADMIN_NAME:=admin}
: ${ADMIN_PASSWORD:=admin-password}
: ${SSCFG_VAULT_PATH:=kv/sscfg}
: ${POLICY_NAME:=sscfg-admin}

set -o pipefail
set -u
set -e

create_db_record () {
  npx knex seed:run
}

create_vault_policy () {
  local token=$1
  local name=$2
  local policy=$(cat <<EOF | sed -z 's/\n/\\n/g' | jq -R . | sed -z 's/\\\\n/\\n/g'
path "${SSCFG_VAULT_PATH}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF
)
  local policy_file=$(mktemp -p $workdir)
  cat <<EOF > $policy_file
{
  "policy": $policy
}
EOF
  local resp=$(curl -s -X PUT --header "X-Vault-Token: $token" -d @$policy_file ${VAULT_ADDR}/v1/sys/policy/${name} | jq .)
}

exist_vault_user () {
  local name=$1
  local token=$VAULT_TOKEN
  resp=$(curl -s -f --header "X-Vault-Token: $token" ${VAULT_ADDR}/v1/auth/userpass/users/$name | jq .)
  echo $resp | jq .errors
}

create_vault_user () {
  local name=$1
  local password=$2
  local token=$VAULT_TOKEN

  ret=$(exist_vault_user $name)
  if [[ $ret = null ]]; then
    return 0
  fi

  create_vault_policy $token $POLICY_NAME

  local payload=$(mktemp -p $workdir)
  cat <<EOF > $payload
{
  "password": "$password",
  "policies": ["default", "$POLICY_NAME"]
}
EOF
  resp=$(curl -s -f -X POST --header "X-Vault-Token: $token" -d @${payload} ${VAULT_ADDR}/v1/auth/userpass/users/$name | jq .)
}

create_admin () {
  create_db_record
  create_vault_user $ADMIN_NAME "$ADMIN_PASSWORD"
}

workdir=$(mktemp -d)
trap 'rm -rf $workdir' EXIT

create_admin
