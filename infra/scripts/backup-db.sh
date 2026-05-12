#!/bin/sh
set -eu

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${1:-/backups}"
mkdir -p "$OUTPUT_DIR"

pg_dump "$DATABASE_URL" > "$OUTPUT_DIR/gestor-personal-$TIMESTAMP.sql"
echo "Backup generated at $OUTPUT_DIR/gestor-personal-$TIMESTAMP.sql"
