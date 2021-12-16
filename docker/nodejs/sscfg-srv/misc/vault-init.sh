#!/bin/bash
: ${VAULT_ADDR:="http://vault:8200"}
: ${SECRET_SHARES:=5}
: ${SECRET_THRESHOLD:=3}
: ${SSCFG_POLICY:=sscfg}
: ${SSCFG_TOKEN_NAME:=sscfg}
: ${SSCFG_TOKEN_PERIOD:=720h}
: ${SSCFG_VAULT_PATH:=kv/sscfg}
: ${DOT_ENV:=.env}

set -o pipefail
set -u
set -e

initialized () {
  curl -f -s ${VAULT_ADDR}/v1/sys/init | jq .initialized
}

vault_init () {
  local data_file=$(mktemp -p $workdir)
  cat <<EOF > $data_file
{
  "secret_shares": $SECRET_SHARES,
  "secret_threshold": $SECRET_THRESHOLD 
}
EOF

  ret=$(curl -s -f -X PUT -d @${data_file} ${VAULT_ADDR}/v1/sys/init | jq .)
  echo $ret
}

unseal () {
  local keys=$1
  for ((i=0; i < $SECRET_THRESHOLD; i++)); do
    ret=$(echo $keys | jq .[$i])
    ret=$(curl -s -f -X PUT -d "{\"key\": $ret}" ${VAULT_ADDR}/v1/sys/unseal | jq .)
  done
}

show_unseal_keys () {
  local keys=$1
  for ((i=0; i < $SECRET_SHARES; i++)); do
    ret=$(echo $keys | jq -r .[$i])
    echo "Unseal Key $((i + 1)): $ret"
  done
  echo
}

show_root_token () {
  local token=$1
  echo "Initial Root Token: $token"
}

enable_auth () {
  local token=$1
  local auth=$2
  ret=$(curl -s -f -X POST --header "X-Vault-Token: $token" -d "{\"type\": \"$auth\"}" ${VAULT_ADDR}/v1/sys/auth/$auth | jq .)
}

enable_secret () {
  local token=$1
  local secret=$2
  local options=$3
  ret=$(curl -s -f -X POST --header "X-Vault-Token: $token" -d "{\"type\": \"$secret\", \"options\": $options}" ${VAULT_ADDR}/v1/sys/mounts/$secret | jq .)
}

create_sscfg_policy () {
  local token=$1
  local policy=$(cat <<EOF | sed -z 's/\n/\\n/g' | jq -R . | sed -z 's/\\\\n/\\n/g'

path "sys/policy/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/userpass/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/approle/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

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
  local resp=$(curl -s -X PUT --header "X-Vault-Token: $token" -d @$policy_file ${VAULT_ADDR}/v1/sys/policy/${SSCFG_POLICY} | jq .)
}

create_sscfg_token () {
  local token=$1
  local payload=$(mktemp -p $workdir)
  cat <<EOF > $payload
{
  "policies": ["default", "$SSCFG_POLICY"],
  "period": "$SSCFG_TOKEN_PERIOD",
  "display_name": "$SSCFG_TOKEN_NAME"
}
EOF
  ret=$(curl -s -f -X POST --header "X-Vault-Token: $token" -d @$payload ${VAULT_ADDR}/v1/auth/token/create-orphan | jq .)
  local new_token=$(echo $ret | jq -r .auth.client_token)
  echo $new_token
}

create_dot_env () {
  local token=$1
  if [[ ! -f ${DOT_ENV} ]]; then
    echo "VAULT_TOKEN=$token" > $DOT_ENV
  elif grep -q -e '^VAULT_TOKEN=' $DOT_ENV ; then
    sed -r -i -e "/VAULT_TOKEN/s/^VAULT_TOKEN=.*/VAULT_TOKEN=$token/" $DOT_ENV
  else
    echo "VAULT_TOKEN=$token" >> $DOT_ENV
  fi
}

setup () {
  local resp=$(vault_init)
  unseal_keys=$(echo $resp | jq .keys_base64)
  show_unseal_keys "$unseal_keys"
  root_token=$(echo $resp | jq -r .root_token)
  show_root_token $root_token
  unseal "$unseal_keys"

  enable_auth $root_token 'approle'
  enable_auth $root_token 'userpass'
  enable_secret $root_token 'kv' '{"version": "1"}'

  create_sscfg_policy $root_token
  local token=$(create_sscfg_token $root_token)
  create_dot_env $token
}

ret=$(initialized)
if [[ $ret = true ]]; then
  exit 0
fi

workdir=$(mktemp -d)
trap 'rm -rf $workdir' EXIT

setup
