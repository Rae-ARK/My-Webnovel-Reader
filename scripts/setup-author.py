"""
Generate or update src/config/author.config.reader.json from the
distinct `fictions.author` values in the published database.

Usage:
    python3 scripts/setup-author.py [flags]

Common flags:
    --db PATH              Path to library.sqlite (default: public/content/library.sqlite)
    --output PATH           Where to write the config (default: src/config/author.config.reader.json)
    --author NAME           Pick this author without prompting. Must match a
                             distinct value in the database unless --force is given.
    --force                 Allow --author to write a name that isn't in the database.
    --non-interactive        Never prompt. Requires --author when the database has
                             more than one distinct author (fails otherwise).
    --avatar-square PATH     Override avatarSquare (default kept/unchanged otherwise).
    --avatar-full PATH       Override avatarFull.
    --banner PATH            Override banner.
    --bio TEXT               Override bio.
    --joined DATE            Override joined (ISO date string).

Examples:
    # First run, single-author database: auto-fills everything.
    python3 scripts/setup-author.py

    # Multi-author database, scripted/CI use (no prompts):
    python3 scripts/setup-author.py --author "Rae ARK" --non-interactive

    # Update just the bio without touching anything else:
    python3 scripts/setup-author.py --author "Rae ARK" --bio "New bio text" --non-interactive
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "public/content/library.sqlite"
DEFAULT_OUTPUT = ROOT / "src/config/author.config.reader.json"

DEFAULT_AVATAR_SQUARE = "/images/profile-square.png"
DEFAULT_AVATAR_FULL = "/images/profile-full.png"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate/update author.config.reader.json from the published database.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Path to library.sqlite")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Where to write the config")
    parser.add_argument("--author", type=str, default=None, help="Pick this author without prompting")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Allow --author to write a name that isn't among the database's distinct authors",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Never prompt; fail instead if a choice is needed and --author wasn't given",
    )
    parser.add_argument("--avatar-square", type=str, default=None)
    parser.add_argument("--avatar-full", type=str, default=None)
    parser.add_argument("--banner", type=str, default=None)
    parser.add_argument("--bio", type=str, default=None)
    parser.add_argument("--joined", type=str, default=None)
    return parser.parse_args()


def load_distinct_authors(db_path):
    if not db_path.exists():
        raise RuntimeError(
            f"Database not found at {db_path}. Import a novel first "
            f"(see scripts/import-novel.py), then re-run this script."
        )

    import sqlite3

    with sqlite3.connect(db_path) as conn:
        try:
            rows = conn.execute(
                "SELECT DISTINCT author FROM fictions ORDER BY author"
            ).fetchall()
        except sqlite3.OperationalError as error:
            raise RuntimeError(
                f"Could not read the fictions table from {db_path}: {error}"
            ) from error

    return [row[0] for row in rows]


def choose_author(authors, args):
    if args.author:
        if authors and args.author not in authors and not args.force:
            raise RuntimeError(
                f"--author {args.author!r} does not match any distinct author "
                f"in the database ({', '.join(authors) or 'none found'}). "
                "Pass --force to use it anyway."
            )
        return args.author

    if not authors:
        raise RuntimeError(
            "No fictions found in the database yet. Import a novel first, "
            "or pass --author/--force to set a name manually."
        )

    if len(authors) == 1:
        return authors[0]

    if args.non_interactive:
        raise RuntimeError(
            "The database has more than one distinct author "
            f"({', '.join(authors)}) and --non-interactive was given. "
            "Pass --author \"Name\" to pick one without prompting."
        )

    print("More than one distinct author found in the database:")
    for index, name in enumerate(authors, start=1):
        print(f"  {index}. {name}")

    while True:
        choice = input(f"Select an author [1-{len(authors)}]: ").strip()

        if choice.isdigit() and 1 <= int(choice) <= len(authors):
            return authors[int(choice) - 1]

        print("Invalid selection, try again.")


def load_existing_config(output_path):
    if not output_path.exists():
        return {}

    with output_path.open(encoding="utf-8") as handle:
        try:
            return json.load(handle)
        except json.JSONDecodeError:
            return {}


def main():
    args = parse_args()

    authors = load_distinct_authors(args.db)
    name = choose_author(authors, args)

    existing = load_existing_config(args.output)

    config = {
        "name": name,
        "avatarSquare": args.avatar_square or existing.get("avatarSquare", DEFAULT_AVATAR_SQUARE),
        "avatarFull": args.avatar_full or existing.get("avatarFull", DEFAULT_AVATAR_FULL),
    }

    banner = args.banner or existing.get("banner")
    if banner:
        config["banner"] = banner

    bio = args.bio or existing.get("bio")
    if bio:
        config["bio"] = bio

    joined = args.joined or existing.get("joined")
    if joined:
        config["joined"] = joined

    social = existing.get("social")
    if social:
        config["social"] = social

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

    resolved_output = args.output.resolve()
    try:
        display_path = resolved_output.relative_to(ROOT)
    except ValueError:
        display_path = resolved_output

    print("AUTHOR CONFIG WRITTEN")
    print(f"  file:   {display_path}")
    print(f"  name:   {config['name']}")
    if len(authors) > 1:
        print(f"  (chosen from {len(authors)} distinct authors in the database)")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
