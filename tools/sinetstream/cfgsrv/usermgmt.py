#!/usr/bin/env python
import requests
from argparse import ArgumentParser
from getpass import getpass
import csv
from logging import getLogger, basicConfig

FIELDNAMES = ["name", "password", "email", "displayName"]
EX_FIELDNAMES = ["name", "password", "email", "displayName", "systemAdmin"]
logger = getLogger(__name__)
basicConfig(format='%(levelname)s: %(message)s')


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("-s", "--server", required=True)
    parser.add_argument("-u", "--user", required=True)
    parser.add_argument("-p", "--password")

    sub_parser = parser.add_subparsers(dest="sub_command", required=True)
    i_parser = sub_parser.add_parser("import")
    i_parser.add_argument(
        "-c", "--csv", required=True, metavar="users.csv", dest="csv"
    )
    i_parser.add_argument(
        "-H", "--no-header", action="store_false", dest="header"
    )
    r_parser = sub_parser.add_parser("remove")
    r_parser.add_argument(
        "-c", "--csv", required=True, metavar="users.csv", dest="csv"
    )
    r_parser.add_argument(
        "-H", "--no-header", action="store_false", dest="header"
    )
    e_parser = sub_parser.add_parser("export")
    e_parser.add_argument(
        "-c", "--csv", required=True, metavar="users.csv", dest="csv"
    )
    e_parser.add_argument(
        "-H", "--no-header", action="store_false", dest="header"
    )
    e_parser.add_argument("-A", "--all", action="store_true", dest="all_users")
    a_parser = sub_parser.add_parser("admin")
    a_parser.add_argument("-U", "--target-user", required=True)
    admin_group = a_parser.add_mutually_exclusive_group(required=True)
    admin_group.add_argument(
        "-A", "--add", action="store_const", const="grant", dest="op"
    )
    admin_group.add_argument(
        "-R", "--remove", action="store_const", const="prohibit", dest="op"
    )
    return parser.parse_args()


def normalize(user):
    if None in user:
        del user[None]
    return dict([(k, v) for k, v in user.items() if v and not v.isspace()])


def insert_user(args, user):
    if "name" not in user or "password" not in user:
        logger.error(f"Invalid parameters: '{str(user)}'")
        return
    headers = {"Authorization": f"Bearer {args.token}"}
    r = requests.post(f"{args.server}/users", headers=headers, json=user)
    if not r.ok:
        logger.error(f"{r.reason}: {str(user)}")


def update_user(args, id, user):
    headers = {"Authorization": f"Bearer {args.token}"}
    del user["name"]
    r = requests.patch(f"{args.server}/users/{id}", headers=headers, json=user)
    if not r.ok:
        logger.error(f"{r.reason}: {str(user)}")


def find_user(args, name):
    headers = {"Authorization": f"Bearer {args.token}"}
    r = requests.get(f"{args.server}/users?name={name}", headers=headers)
    result = r.json()
    return result[0] if len(result) > 0 else None


def find_user_id(args, name):
    user = find_user(args, name)
    return user["id"] if user is not None else None


def upsert_user(args, user):
    if "name" not in user:
        logger.error(f"Invalid parameters: '{str(user)}'")
        return
    id = find_user_id(args, user["name"])
    if id is None:
        insert_user(args, user)
    else:
        update_user(args, id, user)


def import_users(args):
    with open(args.csv) as f:
        reader = csv.DictReader(f, fieldnames=FIELDNAMES)
        if args.header:
            next(reader)
        for user in reader:
            upsert_user(args, normalize(user))


def remove_user(args, name):
    id = find_user_id(args, name)
    if id is None:
        logger.warning(f"'{name}' does not exist.")
        return
    headers = {"Authorization": f"Bearer {args.token}"}
    r = requests.delete(f"{args.server}/users/{id}", headers=headers)
    if not r.ok:
        logger.error(f"{r.reason}: {name}")


def remove_users(args):
    with open(args.csv) as f:
        reader = csv.DictReader(f, fieldnames=FIELDNAMES)
        if args.header:
            next(reader)
        for user in reader:
            if args.user != user["name"]:
                remove_user(args, user["name"])


def get_users(args):
    headers = {"Authorization": f"Bearer {args.token}"}
    addr = (f"{args.server}/users" if args.all_users
            else f"{args.server}/users?isLocalUser=true")
    r = requests.get(addr, headers=headers)
    return r.json()


def export_users(args):
    users = get_users(args)
    with open(args.csv, "w") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=EX_FIELDNAMES,
            extrasaction="ignore",
        )
        if args.header:
            writer.writeheader()
        for user in users:
            writer.writerow(user)


def admin_op(args):
    target = args.target_user
    if target == args.user:
        logger.error("You can't change your own permissions.")
        exit(1)
    user = find_user(args, target)
    if user is None:
        logger.error(f"'{target}' does not exist.")
        exit(1)
    if not user["isLocalUser"]:
        logger.error(
            "Only local users can be granted system administrator privileges."
        )
        exit(1)
    id = user["id"]
    admin = True if args.op == "grant" else False
    headers = {"Authorization": f"Bearer {args.token}"}
    r = requests.patch(
        f"{args.server}/users/{id}",
        headers=headers,
        json={"systemAdmin": admin},
    )
    if not r.ok:
        logger.error(f"{r.reason}: {target}")


def get_token(args):
    r = requests.post(
        f"{args.server}/authentication",
        json={
            "name": args.user,
            "password": args.password,
            "strategy": "local",
        },
    )
    resp = r.json()
    if "accessToken" in resp:
        return resp["accessToken"]
    if "message" in resp:
        raise RuntimeError(resp["message"])
    raise RuntimeError(str(resp))


def mgmt():
    args = parse_args()
    if args.password is None:
        args.password = getpass()
    args.token = get_token(args)

    if args.sub_command == "import":
        import_users(args)
    elif args.sub_command == "remove":
        remove_users(args)
    elif args.sub_command == "export":
        export_users(args)
    elif args.sub_command == "admin":
        admin_op(args)


def main():
    try:
        mgmt()
    except Exception as err:
        logger.error(str(err))
        exit(1)


if __name__ == "__main__":
    main()
