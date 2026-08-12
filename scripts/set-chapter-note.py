"""
Add, update, or remove a per-chapter "author's note" — the small box
shown between the chapter content and the footer on the reading page
("A note from <author>").

Notes are stored in public/content/author-notes.json, keyed by chapter
(content entry) id, deliberately separate from library.sqlite (see
src/repositories/AuthorNotesRepository.ts for why). This script is the
supported way to write that file; editing it by hand works too, it's
plain JSON, but this validates the chapter id against the published
database and keeps the file sorted/formatted consistently.

Usage:
    python3 scripts/set-chapter-note.py --chapter ID --note TEXT
    python3 scripts/set-chapter-note.py --chapter ID --note-file PATH
    python3 scripts/set-chapter-note.py --chapter ID --clear
    python3 scripts/set-chapter-note.py --list

Common flags:
    --db PATH            Path to library.sqlite, used only to validate
                          --chapter (default: public/content/library.sqlite)
    --output PATH         Where the notes file lives
                          (default: public/content/author-notes.json)
    --chapter ID          content_entries.id to attach the note to
    --note TEXT            Note text, given directly on the command line
    --note-file PATH       Note text, read from a file instead (lets an
                            author write multi-paragraph notes in an editor)
    --clear                Remove the note for --chapter instead of setting one
    --list                  Print every chapter id that currently has a note
    --force                 Skip the database lookup that checks --chapter
                             actually exists (useful if the db isn't built yet)

Examples:
    # Set a note directly:
    python3 scripts/set-chapter-note.py --chapter chapter-001 \\
        --note "Thanks for reading! Chapter 2 goes up Friday."

    # Set a longer note from a file:
    python3 scripts/set-chapter-note.py --chapter chapter-001 \\
        --note-file notes/chapter-001.md

    # Remove a note:
    python3 scripts/set-chapter-note.py --chapter chapter-001 --clear

    # See which chapters currently have notes:
    python3 scripts/set-chapter-note.py --list
"""

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "public/content/library.sqlite"
DEFAULT_OUTPUT = ROOT / "public/content/author-notes.json"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Add, update, or remove a per-chapter author's note.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Path to library.sqlite")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to author-notes.json")
    parser.add_argument("--chapter", type=str, default=None, help="content_entries.id to target")
    parser.add_argument("--note", type=str, default=None, help="Note text")
    parser.add_argument("--note-file", type=Path, default=None, help="Read note text from this file")
    parser.add_argument("--clear", action="store_true", help="Remove the note for --chapter")
    parser.add_argument("--list", action="store_true", help="List chapter ids that currently have a note")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip validating --chapter against the database",
    )
    return parser.parse_args()


def load_notes(output_path):
    if not output_path.exists():
        return {}

    with output_path.open(encoding="utf-8") as handle:
        try:
            data = json.load(handle)
        except json.JSONDecodeError:
            return {}

    return data if isinstance(data, dict) else {}


def write_notes(output_path, notes):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    ordered = {key: notes[key] for key in sorted(notes)}
    output_path.write_text(
        json.dumps(ordered, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def validate_chapter_exists(db_path, chapter_id):
    if not db_path.exists():
        print(
            f"warning: database not found at {db_path}, skipping validation "
            f"for --chapter {chapter_id!r}",
            file=sys.stderr,
        )
        return

    import sqlite3

    with sqlite3.connect(db_path) as conn:
        try:
            row = conn.execute(
                "SELECT id FROM content_entries WHERE id = ? LIMIT 1",
                (chapter_id,),
            ).fetchone()
        except sqlite3.OperationalError as error:
            print(
                f"warning: could not read content_entries from {db_path}: {error}",
                file=sys.stderr,
            )
            return

    if row is None:
        raise RuntimeError(
            f"--chapter {chapter_id!r} was not found in content_entries. "
            "Pass --force to write the note anyway."
        )


def resolve_note_text(args):
    if args.note is not None and args.note_file is not None:
        raise RuntimeError("Pass either --note or --note-file, not both.")

    if args.note_file is not None:
        if not args.note_file.exists():
            raise RuntimeError(f"--note-file not found: {args.note_file}")
        return args.note_file.read_text(encoding="utf-8").strip()

    if args.note is not None:
        return args.note.strip()

    raise RuntimeError("Pass --note or --note-file (or --clear / --list).")


def main():
    args = parse_args()
    notes = load_notes(args.output)

    if args.list:
        if not notes:
            print("No chapters currently have an author's note.")
            return

        print(f"{len(notes)} chapter(s) with a note:")
        for chapter_id, entry in sorted(notes.items()):
            preview = entry.get("note", "").splitlines()[0][:60] if entry.get("note") else ""
            print(f"  - {chapter_id}: {preview}")
        return

    if not args.chapter:
        raise RuntimeError("--chapter is required unless --list is given.")

    if not args.force:
        validate_chapter_exists(args.db, args.chapter)

    if args.clear:
        if args.chapter in notes:
            del notes[args.chapter]
            write_notes(args.output, notes)
            print(f"Removed note for {args.chapter}.")
        else:
            print(f"{args.chapter} had no note; nothing to remove.")
        return

    note_text = resolve_note_text(args)

    if not note_text:
        raise RuntimeError("Note text is empty after stripping whitespace.")

    notes[args.chapter] = {
        "note": note_text,
        "updatedAt": int(time.time() * 1000),
    }
    write_notes(args.output, notes)

    resolved_output = args.output.resolve()
    try:
        display_path = resolved_output.relative_to(ROOT)
    except ValueError:
        display_path = resolved_output

    print("AUTHOR'S NOTE WRITTEN")
    print(f"  file:    {display_path}")
    print(f"  chapter: {args.chapter}")
    print(f"  length:  {len(note_text)} chars")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
