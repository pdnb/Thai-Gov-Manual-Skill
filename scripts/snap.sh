#!/usr/bin/env bash
# Dev-DB snapshots for a Laravel + MySQL project, so a mutating screenshot scenario can be resumed/re-run.
# usage: snap.sh <project-dir> save|load NAME     (snapshots kept in <project-dir>/storage/manual-snaps)
# NEVER point this at production: `load` overwrites the database named in .env.
set -e
PROJ="$1"; ACT="$2"; NAME="$3"
ENV="$PROJ/.env"
get() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'; }
[ "$(get APP_ENV)" = "production" ] && { echo "refusing: APP_ENV=production"; exit 1; }
BIN="$(get DB_DUMP_BINARY_PATH)"
DUMP="mysqldump"; CLI="mysql"
[ -n "$BIN" ] && { DUMP="$BIN/mysqldump"; CLI="$BIN/mysql"; }
ARGS=(-h"$(get DB_HOST)" -P"$(get DB_PORT)" -u"$(get DB_USERNAME)" -p"$(get DB_PASSWORD)")
DB=$(get DB_DATABASE)
DIR="$PROJ/storage/manual-snaps"; mkdir -p "$DIR"
case "$ACT" in
  save) "$DUMP" "${ARGS[@]}" --single-transaction --routines --no-tablespaces "$DB" > "$DIR/$NAME.sql" 2>/dev/null; echo "saved $NAME";;
  load) "$CLI" "${ARGS[@]}" "$DB" < "$DIR/$NAME.sql" 2>/dev/null; (cd "$PROJ" && php artisan cache:clear -q); echo "loaded $NAME";;
  *) echo "usage: snap.sh <project-dir> save|load NAME"; exit 1;;
esac
