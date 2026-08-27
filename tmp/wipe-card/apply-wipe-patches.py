#!/usr/bin/env python3
import json, hashlib, sys
from pathlib import Path

def apply_ops(s, ops):
    delta = 0
    for o in ops:
        i1 = o["i1"] + delta
        i2 = o["i2"] + delta
        s = s[:i1] + o["exp"] + s[i2:]
        delta += len(o["exp"]) - (i2 - i1)
    return s

def main(patch_path, slice_dir):
    patches = json.loads(Path(patch_path).read_text())
    for n, spec in patches.items():
        p = Path(slice_dir) / f"{n}.b64"
        got = p.read_text().rstrip("\n\r")
        if len(got) != spec["got_len"]:
            raise SystemExit(f"{n}: got_len {len(got)} != {spec['got_len']}")
        out = apply_ops(got, spec["ops"])
        h = hashlib.sha256(out.encode()).hexdigest()
        if h != spec["exp_sha256"] or len(out) != spec["exp_len"]:
            raise SystemExit(f"{n}: sha/len mismatch {h} {len(out)}")
        p.write_text(out)
        print(n, "fixed", spec["exp_len"], h)
    print("all ok")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
