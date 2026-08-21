#!/usr/bin/env python3
"""Rebuilds the merged single-file JS + the artifact fragment + standalone HTML
from the modular js/*.js source files, so the /home/user/SWCCS/js modules stay
the single source of truth."""
import re

import os
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = f"{ROOT}/js"
SCRATCH = os.path.join(ROOT, "build")

FILES = [
    "background.js", "visualizer.js", "audio-engine.js", "pitch.js", "wav-encode.js",
    "clip-library.js", "voice-effects.js", "chapters.js", "modulation.js", "animation.js", "music.js", "songcraft.js", "project.js", "billing.js", "account.js", "tts-browser.js", "tts-neural.js",
    "tts-elevenlabs.js", "recorder.js", "app.js",
]

COLOR_REPLACEMENTS = []  # source files now own their final colors directly


ALIAS_RE = re.compile(r"^import\s*\{[^}]*\bas\b[^}]*\}\s*from", re.MULTILINE)


def build_merged_js():
    parts = []
    for fname in FILES:
        with open(f"{SRC}/{fname}", encoding="utf-8") as f:
            content = f.read()
        # Bundling strips import statements, so an aliased import
        # (`{ signIn as supabaseSignIn }`) leaves the alias undefined in the
        # single-file build while still working in the modular one. Fail loudly
        # rather than shipping a build that breaks only after bundling.
        if ALIAS_RE.search(content):
            raise SystemExit(
                f"{fname}: aliased import (`... as ...`) breaks the bundled build. "
                "Export the final name from the source module instead."
            )
        content = re.sub(r"^import\s*\{[\s\S]*?\}\s*from\s*'[^']*';\s*$", "", content, flags=re.MULTILINE)
        content = re.sub(r"^export\s+(function|const|async function)", r"\1", content, flags=re.MULTILINE)
        parts.append(f"// ---- {fname} ----\n" + content.strip())
    merged = "\n\n".join(parts)
    for old, new in COLOR_REPLACEMENTS:
        merged = merged.replace(old, new)
    with open(f"{SCRATCH}/merged.js", "w", encoding="utf-8") as f:
        f.write(merged)
    print("merged.js written:", len(merged), "bytes")


DECL_RE = re.compile(
    r"^(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)", re.M
)


def assert_no_duplicate_declarations():
    """Modules each have their own scope; the bundle does not.

    Two files can both define `pitchShift` and work perfectly as modules,
    then produce a bundle that dies at parse time with "Identifier already
    declared" — taking the whole app down, not just that feature. Catch it
    at build time instead of in the browser."""
    import collections

    seen = collections.defaultdict(list)
    for fname in FILES:
        with open(f"{SRC}/{fname}", encoding="utf-8") as f:
            src = f.read()
        src = re.sub(r"^import[\s\S]*?from\s*'[^']*';\s*$", "", src, flags=re.M)
        for match in DECL_RE.finditer(src):
            seen[match.group(1)].append(fname)

    dupes = {name: files for name, files in seen.items() if len(files) > 1}
    if dupes:
        lines = [f"  {name}: {', '.join(files)}" for name, files in sorted(dupes.items())]
        raise SystemExit(
            "duplicate top-level declarations would break the bundled build:\n"
            + "\n".join(lines)
        )


os.makedirs(SCRATCH, exist_ok=True)


def build_shell():
    """Derive the bundler's shell from index.html + style.css.

    The shell used to be a hand-kept copy of the page. Two files holding the
    same markup drift the moment a section is added to one and not the other,
    and the divergence only shows up in the standalone build — so generate it
    instead of maintaining it."""
    page = open(f"{ROOT}/index.html", encoding="utf-8").read()
    css = open(f"{ROOT}/style.css", encoding="utf-8").read()

    link = '<link rel="stylesheet" href="style.css">'
    if link not in page:
        raise SystemExit("index.html no longer links style.css the way the build expects")
    page = page.replace(link, "<style>\n" + css.rstrip() + "\n</style>")

    # Strip the document wrapper: the fragment build has the Artifact tool
    # supply it, and the standalone build rebuilds it around the merged JS.
    for tag in ("<!DOCTYPE html>", '<html lang="en">', "<head>", "</head>",
                "<body>", "</body>", "</html>"):
        page = page.replace(tag, "")

    entry = '<script type="module" src="js/app.js"></script>'
    if entry not in page:
        raise SystemExit("index.html no longer loads js/app.js the way the build expects")
    # The merged JS is appended straight after this open tag.
    page = page[: page.index(entry)] + '<script type="module">\n'

    with open(f"{SCRATCH}/shell_top.html", "w", encoding="utf-8") as f:
        f.write(page.strip() + "\n")
    print("shell_top.html generated from index.html + style.css")


def build_html():
    shell = open(f"{SCRATCH}/shell_top.html", encoding="utf-8").read()
    merged_js = open(f"{SCRATCH}/merged.js", encoding="utf-8").read()

    # Artifact fragment (no doctype/html/head/body — the Artifact tool wraps it)
    fragment = shell + merged_js + "\n</script>\n"
    with open(f"{SCRATCH}/speakscape.html", "w", encoding="utf-8") as f:
        f.write(fragment)

    # Standalone file (full document, opens directly in any browser)
    marker = "</style>\n"
    idx = shell.index(marker) + len(marker)
    head_content = shell[:idx]
    body_content = shell[idx:]  # includes trailing open <script type="module">
    standalone = (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
        + head_content
        + "</head>\n<body>\n"
        + body_content
        + merged_js
        + "\n</script>\n</body>\n</html>\n"
    )
    with open(f"{SCRATCH}/speakscape-standalone.html", "w", encoding="utf-8") as f:
        f.write(standalone)
    print("speakscape.html + speakscape-standalone.html written")


if __name__ == "__main__":
    assert_no_duplicate_declarations()
    build_shell()
    build_merged_js()
    build_html()
