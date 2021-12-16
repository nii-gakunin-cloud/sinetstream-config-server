<?php
if (!$_SERVER['eppn']) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}

$eppn = $_SERVER['eppn'];

try {
  $vault_addr = get_env_value('VAULT_ADDR', 'http://vault:8200');
  $vault_token = get_env_value('VAULT_TOKEN');
  $dbh = get_db_handler();
  $dbh->beginTransaction();

  $role_name = get_approle($eppn);
  $wrapping_token = generate_secret_id($role_name);
  store_approle_info($eppn, $role_name, $wrapping_token);
  redirect_ui($wrapping_token);

  $dbh->commit();
  exit;
} catch (Exception $e) {
  if (!is_null($dbh)) {
    $dbh->rollBack();
  }
  header("HTTP/1.1 500 Internal Server Error");
  error_log($e);
  exit;
}

function get_db_handler(): PDO
{
  $db_name = get_env_value('POSTGRES_DB', 'sscfg');
  $db_host = get_env_value('POSTGRES_HOST', 'postgres');
  $db_port = get_env_value('POSTGRES_PORT', '5432');

  $dsn = 'pgsql:dbname=' . $db_name . ' host=' . $db_host . ' port=' . $db_port;
  $db_user = get_env_value('POSTGRES_USER', 'sscfg');
  $db_password = get_env_value('POSTGRES_PASSWORD');

  return new PDO($dsn, $db_user, $db_password);
}

function get_approle(string $eppn): string
{
  $res = find_uid_by_name($eppn);
  if (!is_null($res)) {
    return uid_to_approle($res);
  }
  $uid = store_eppn_db($eppn);
  $policy = create_policy($uid);
  $role_name = create_approle($uid, $policy);
  return $role_name;
}

function uid_to_approle(mixed $uid): string
{
  return 'shibboleth-' . strval($uid);
}

function uid_to_policy(mixed $uid): string
{
  return 'user-' . strval($uid);
}

function find_uid_by_name(string $eppn): ?string
{
  global $dbh;
  $sql = 'SELECT id, name FROM users WHERE name = :name AND "isLocalUser" IS NOT TRUE AND deleted IS NOT TRUE';
  $sth = $dbh->prepare($sql);
  $sth->execute(array(':name' => $eppn));
  $red = $sth->fetchAll();
  $sth->closeCursor();
  if (count($red) === 0) {
    return null;
  }
  $uid = $red[0]['id'];
  return $uid;
}

function create_policy(mixed $uid): string
{
  $policy_name = uid_to_policy($uid);
  $sscfg_root = get_env_value('SSCFG_VAULT_PATH', 'kv/sscfg');
  $policy = <<<END
  path "${sscfg_root}/users/${uid}/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
  }

  path "${sscfg_root}/streams/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
  }
  END;
  $path = 'sys/policy/' . $policy_name;
  $params = array(
    'policy' => $policy,
  );
  vault_api($path, 'PUT', $params);
  return $policy_name;
}

function create_approle(mixed $uid, string $policy_name): string
{
  $role_name = uid_to_approle($uid);
  $path = 'auth/approle/role/' . $role_name;
  $params = array(
    'secret_id_num_uses' => 1,
    'secret_id_ttl' => '3m',
    'token_policies' => ['default', $policy_name],
  );
  vault_api($path, 'POST', $params);
  return $role_name;
}

function store_eppn_db(string $eppn): int
{
  global $dbh, $_SERVER;
  $email = array_key_exists('mail', $_SERVER) ? $_SERVER['mail'] : '';
  $display_name = array_key_exists('jaDisplayName', $_SERVER)
    ? $_SERVER['jaDisplayName']
    : (array_key_exists('displayName', $_SERVER) ? $_SERVER['displayName'] : '');
  $avatar = generate_avatar($eppn, $email);

  $sql = 'INSERT INTO users (name, email, "displayName", avatar, "createdAt", "updatedAt", "isLocalUser")'
    . ' VALUES (:name, :email, :display_name, :avatar, now(), now(), FALSE)'
    . ' ON CONFLICT ("name") WHERE NOT deleted DO NOTHING'
    . ' RETURNING id';
  $sth = $dbh->prepare($sql);
  $sth->execute(array(':name' => $eppn, ':email' => $email, ':display_name' => $display_name, ':avatar' => $avatar));
  $result = $sth->fetch();
  $sth->closeCursor();
  return $result[0];
}

function generate_avatar(string $eppn, string $email): string {
  $target = strlen($email) > 0 ? $email :  $eppn;
  $hash = md5($target);
  return "https://www.gravatar.com/avatar/${hash}?d=identicon";
}

function generate_secret_id(string $role_name): string
{
  $vault_wrap_ttl = get_env_value('VAULT_WRAP_TOKEN_TTL', '3m');

  $path = 'auth/approle/role/' . $role_name . '/secret-id';
  $headers = array('X-Vault-Wrap-TTL: ' . $vault_wrap_ttl);
  $resp = vault_api($path, 'POST', null, $headers);
  return $resp->wrap_info->token;
}

function get_role_id($role_name): string
{
  $path = 'auth/approle/role/' . $role_name . '/role-id';
  $resp = vault_api($path, 'GET');
  return $resp->data->role_id;
}

function store_approle_info(string $eppn, string $role_name, string $wrapping_token): void
{
  $role_id = get_role_id($role_name);
  $vault_path =
    get_env_value('VAULT_SSCFG_PATH', 'cubbyhole/sscfg/shibboleth') .  '/' . $wrapping_token;
  $resp = vault_api($vault_path, 'POST', array(
    'eppn' => $eppn,
    'roleId' => $role_id,
  ));
}

function redirect_ui(string $wrapping_token): void
{
  $cookie_name = get_env_value('SSCFG_COOKIE_NAME', 'sscfg_shibboleth');
  setcookie($cookie_name, $wrapping_token, array (
    'expires' => time() + 180,
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/',
  ));

  $ui_url = get_env_value('SSCFG_UI_URL', '/ui/login-shibboleth');
  header("Location: $ui_url");
}

function get_env_value(string $key, ?string $default = null): string
{
    $ret = getenv($key);
    if (!$ret) {
        if (is_null($default)) {
            throw new Exception("You have to set the environment variable '$key'.");
        }
        return $default;
    }
    return $ret;
}

function vault_api(
    string $path,
    string $method = 'GET',
    ?array $params = null,
    ?array $headers = array(),
): mixed
{
  global $vault_addr, $vault_token;
  $url = $vault_addr . '/v1/' . $path;
  $http_header = array(
    'Authorization: Bearer ' . $vault_token,
  );

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
  curl_setopt($ch, CURLOPT_URL, $url);
  if (!is_null($params)) {
    array_push($http_header, 'Content-Type: application/json');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
  }

  curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($http_header, $headers));

  $res = curl_exec($ch);
  $errno = curl_errno($ch);
  curl_close($ch);
  if ($errno) {
    error_log("ERROR: $url : $res ($errno)");
    throw new Exception($res);
  }
  return json_decode($res);
}
