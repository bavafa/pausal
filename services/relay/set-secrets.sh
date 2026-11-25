#!/usr/bin/env bash
# Copies the relay's keys from the repo's .env to the Vercel project (production) as secrets, without printing them,
# and adds a random RELAY_SALT for hashing visitor addresses. Run by the author: bash services/relay/set-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/dist"
set -a
source ../../../.env
set +a
add() { npx -y vercel@latest env add "$1" --environment production --sensitive --force --yes >/dev/null; echo "set $1"; }
for k in DASHSCOPE_API_KEY DASHSCOPE_BASE_URL TYPESAFE_API_KEY R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_URL; do
  [ -n "${!k:-}" ] || { echo "$k is missing from .env"; exit 1; }
  printf '%s' "${!k}" | add "$k"
done
openssl rand -hex 32 | tr -d '\n' | add RELAY_SALT
echo "Done: 9 variables set on pausal-relay (production)."
