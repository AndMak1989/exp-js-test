#!/bin/bash
set -euo pipefail

echo "=== [ApplicationStart] Deploying container release ==="

MANIFEST_FILE="/opt/fleet-release/release-image.txt"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  echo "ERROR: Manifest file $MANIFEST_FILE does not exist!" >&2
  exit 1
fi

IMAGE_URI=$(cat "$MANIFEST_FILE" | tr -d '\r\n')
echo "Target Image URI: $IMAGE_URI"

# Ensure image URI is digest-pinned
if [[ "$IMAGE_URI" != *@sha256:* ]]; then
  echo "ERROR: Image URI must be pinned with @sha256 digest!" >&2
  exit 1
fi

# Fetch IMDSv2 token and region
echo "Retrieving AWS Region via IMDSv2..."
TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
REGION=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/placement/region")
echo "Detected AWS Region: $REGION"

REGISTRY="${IMAGE_URI%%/*}"
echo "Logging in to ECR registry $REGISTRY..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "Pulling Docker image: $IMAGE_URI..."
docker pull "$IMAGE_URI"

echo "Stopping and removing existing fleet-service container (if any)..."
docker rm -f fleet-service >/dev/null 2>&1 || true

echo "Starting new fleet-service container..."
docker run -d \
  --name fleet-service \
  -p 3000:3000 \
  --restart unless-stopped \
  -e AWS_REGION="$REGION" \
  -e PORT=3000 \
  "$IMAGE_URI"

echo "=== [ApplicationStart] Container started successfully ==="
