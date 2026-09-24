#!/usr/bin/env python3
"""CLI for the pure SEO-008F publisher. Default mode is non-activating."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from publisher import PRODUCERS, load_inventory, publish_release


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser()
    for producer in PRODUCERS:
        value.add_argument(f"--{producer}", required=True, dest=producer.replace("-", "_"))
    value.add_argument("--staging", required=True)
    value.add_argument("--public", required=True)
    value.add_argument("--private", required=True)
    value.add_argument("--publisher-revision", required=True)
    value.add_argument("--activate", action="store_true", help="Atomically activate after full validation; omitted means dry-run")
    value.add_argument("--revoke", action="append", default=[])
    return value


def main() -> int:
    args = parser().parse_args()
    inventories = {producer: load_inventory(getattr(args, producer.replace("-", "_")), producer) for producer in PRODUCERS}
    metadata = publish_release(inventories, staging=args.staging, public=args.public, private=args.private, publisher_revision=args.publisher_revision, activate=args.activate, revocations=args.revoke)
    print(json.dumps({"release_id": metadata["release_id"], "mode": metadata["mode"], "root_sha256": metadata["root_sha256"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
