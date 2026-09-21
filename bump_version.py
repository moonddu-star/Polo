from decimal import Decimal
from pathlib import Path
import re
import subprocess


INDEX = Path(__file__).with_name("index.html")
PATTERN = re.compile(r"(>ver )(\d+\.\d+)(</div>)")
# The host sends no Cache-Control, so a browser holds app.js by URL for as long
# as it likes. The release has to move the URL, or fresh markup pairs with the
# previous script and the page shows the copy before last.
SCRIPT = re.compile(r'(<script src="\./app\.js\?v=)(\d+\.\d+)(">)')


def bump_version() -> None:
    source = INDEX.read_text(encoding="utf-8")
    current_match = PATTERN.search(source)
    if not current_match:
        raise SystemExit("Could not find the footer version in index.html")

    committed = subprocess.run(
        ["git", "show", "HEAD:index.html"],
        cwd=INDEX.parent,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout
    committed_match = PATTERN.search(committed)
    if not committed_match:
        raise SystemExit("Could not find the committed footer version")

    current = Decimal(committed_match.group(2))
    next_version = f"{current + Decimal('0.01'):.2f}"
    updated = PATTERN.sub(
        lambda item: f"{item.group(1)}{next_version}{item.group(3)}",
        source,
        count=1,
    )
    if not SCRIPT.search(updated):
        raise SystemExit("Could not find the versioned app.js script tag")
    updated = SCRIPT.sub(
        lambda item: f"{item.group(1)}{next_version}{item.group(3)}",
        updated,
        count=1,
    )
    INDEX.write_text(updated, encoding="utf-8", newline="")
    print(f"Version bumped: {current} -> {next_version}")


if __name__ == "__main__":
    bump_version()
