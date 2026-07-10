#!/bin/bash
set -euo pipefail

# =============================================================================
# Yggdrasil Dev Deployment Script
# =============================================================================
# Usage: ./scripts/deploy-dev.sh [commit_sha]
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

COMMIT_SHA="${1:-$(git rev-parse --short HEAD)}"
REGION="us-central1"
SHARED_PROJECT="yggdrasil-shared"
SERVICE_NAME="yggdrasil-web"
ARTIFACT_REGISTRY="us-docker.pkg.dev/${SHARED_PROJECT}/docker"

echo "============================================="
echo "  Yggdrasil Dev Deployment"
echo "  Commit SHA: ${COMMIT_SHA}"
echo "============================================="

# Check if authenticated
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
  echo "ERROR: Not authenticated to Google Cloud"
  echo "Run: gcloud auth login"
  exit 1
fi

# Check if image exists
echo "Checking if image exists..."
DIGEST=$(gcloud artifacts docker images list "${ARTIFACT_REGISTRY}/${SERVICE_NAME}" \
  --filter="tags:${COMMIT_SHA}" \
  --format="value(DIGEST)" | head -1)

if [ -z "$DIGEST" ]; then
  echo "ERROR: No image found for SHA ${COMMIT_SHA}"
  echo "Building and pushing..."
  
  cd "$ROOT_DIR"
  gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=SHORT_SHA=${COMMIT_SHA} \
    --project=${SHARED_PROJECT} \
    --region=${REGION}
  
  DIGEST=$(gcloud artifacts docker images list "${ARTIFACT_REGISTRY}/${SERVICE_NAME}" \
    --filter="tags:${COMMIT_SHA}" \
    --format="value(DIGEST)" | head -1)
fi

echo "Image digest: ${DIGEST}"

# Create Cloud Deploy release
RELEASE_NAME="dev-${COMMIT_SHA}-$(date +%s)"
echo "Creating Cloud Deploy release: ${RELEASE_NAME}"

cd "$ROOT_DIR"
gcloud deploy releases create "$RELEASE_NAME" \
  --delivery-pipeline=yggdrasil-pipeline \
  --region=${REGION} \
  --source=skaffold.yaml \
  --images="${ARTIFACT_REGISTRY}/${SERVICE_NAME}=${DIGEST}" \
  --annotations=git-commit=${COMMIT_SHA},git-ref=develop

echo "Release created: ${RELEASE_NAME}"

# Wait for deployment
echo "Waiting for deployment..."
ROLLOUT=$(gcloud deploy rollouts list \
  --delivery-pipeline=yggdrasil-pipeline \
  --release=${RELEASE_NAME} \
  --region=${REGION} \
  --filter="targetId:dev" \
  --format="value(name)" | head -1)

if [ -n "$ROLLOUT" ]; then
  echo "Waiting for rollout: ${ROLLOUT}"
  gcloud deploy rollouts wait "$ROLLOUT" --region=${REGION} --timeout=600s
fi

# Smoke test
echo "Running smoke test..."
URL="https://yggdrasil-web-dev.run.app"
for i in {1..10}; do
  if curl -sf "${URL}/api/health" | grep -q '"status":"ok"'; then
    echo "============================================="
    echo "  Dev deployment successful!"
    echo "  URL: ${URL}"
    echo "============================================="
    exit 0
  fi
  echo "Attempt $i failed, retrying in 10s..."
  sleep 10
done

echo "ERROR: Smoke test failed after 10 attempts"
exit 1
