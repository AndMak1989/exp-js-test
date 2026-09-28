#!/bin/bash
set -euo pipefail

echo "=== [ValidateService] Verifying application health endpoint ==="

HEALTH_URL="http://127.0.0.1:3000/health"
MAX_RETRIES=15
RETRY_DELAY=2

for ((i=1; i<=MAX_RETRIES; i++)); do
  echo "Checking $HEALTH_URL (attempt $i of $MAX_RETRIES)..."
  if curl --fail --silent --show-error "$HEALTH_URL"; then
    echo ""
    echo "=== [ValidateService] Health check PASSED! ==="
    exit 0
  fi
  sleep "$RETRY_DELAY"
done

echo "ERROR: [ValidateService] Health check FAILED after $MAX_RETRIES attempts!" >&2
exit 1
