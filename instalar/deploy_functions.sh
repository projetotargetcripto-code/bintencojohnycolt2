#!/usr/bin/env bash
set -euo pipefail

# Deploy all edge functions from the local functions directory.
# Requires supabase CLI to be installed and authenticated.

FUNC_DIR="$(dirname "$0")/functions"
export SUPABASE_FUNCTIONS_PATH="$FUNC_DIR"

for fn in "$FUNC_DIR"/*; do
  if [ -d "$fn" ]; then
    name="$(basename "$fn")"
    echo "Deploying $name..."
    supabase functions deploy "$name"
  fi

done

