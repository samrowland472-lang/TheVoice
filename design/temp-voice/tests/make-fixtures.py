#!/usr/bin/env python3
"""Generate the binary fixtures the browser upload tests need.

Committing a .wav and a .png would mean carrying binaries in git for files
that are fully described by twenty lines of arithmetic. Run this once before
the browser tests: `python3 tests/make-fixtures.py`.
"""
import math
import pathlib
import struct
import zlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / "fixtures"
OUT.mkdir(exist_ok=True)

# A one-second 330 Hz tone as a 16-bit mono WAV — long enough to decode and
# mix, small enough to keep in a test run.
SR = 22050
samples = b"".join(
    struct.pack("<h", int(math.sin(2 * math.pi * 330 * i / SR) * 11000))
    for i in range(SR)
)
header = (
    b"RIFF" + struct.pack("<I", 36 + len(samples)) + b"WAVEfmt "
    + struct.pack("<IHHIIHH", 16, 1, 1, SR, SR * 2, 2, 16)
    + b"data" + struct.pack("<I", len(samples))
)
(OUT / "tone.wav").write_bytes(header + samples)


def chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


# A 4x4 solid red PNG. The colour matters: the upload test counts red pixels
# on the canvas to prove the image was really decoded and drawn.
W = H = 4
raw = b"".join(b"\x00" + bytes([220, 40, 40] * W) for _ in range(H))
png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(raw))
    + chunk(b"IEND", b"")
)
(OUT / "logo.png").write_bytes(png)

(OUT / "notes.txt").write_text("Imported script line one.\nLine two.\n")
(OUT / "broken.json").write_text("{ not valid json")

print("fixtures written to", OUT)
