#!/usr/bin/env bash
# tree-state.sh — one line naming the exact source tree: the commit plus every uncommitted change.
# deploy.sh compares it with .verified (written by `npm run verify` after everything passed).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
{ git -C "$ROOT" rev-parse HEAD; git -C "$ROOT" status --porcelain --untracked-files=all -- . ':!app/.verified' ':!app/build'; git -C "$ROOT" diff HEAD -- . ':!app/.verified'; } | sha1sum | cut -d' ' -f1
