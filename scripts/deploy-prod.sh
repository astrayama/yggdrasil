#!/bin/bash
set -euo pipefail

# =============================================================================
# Yggdrasil Production Deployment Script
# =============================================================================
# Usage: ./scripts/deploy-prod.sh <commit_sha> [--skip-canary]
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

COMMIT_SHA="${1:-}"
SKIP_CANARY=false

if [ -z "$COMMIT_SHA" ]; then
  echo "ERROR: Commit SHA is required"
  echo "Usage: $0 <commit_sha> [--skip-canary]"
  exit 1
fi

if [ "${2:-}" = "--skip-canary" ]; then
  SKIP_CANARY=true
fi

REGION="us-central1"
SHARED_PROJECT="yggdrasil-shared"
SERVICE_NAME="yggdrasil-web"
ARTIFACT_REGISTRY="us-docker.pkg.dev/${SHARED_PROJECT}/docker"

echo "============================================="
echo "  Yggdrasil Production Deployment"
echo "  Commit SHA: ${COMMIT_SHA}"
echo "  Skip Canary: ${SKIP_CANARY}"
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
  echo "Please ensure the image was built and pushed first."
  exit 1
fi

echo "Image digest: ${DIGEST}"

# Verify Binary Authorization attestation
echo "Verifying Binary Authorization attestation..."
gcloud container binauthz attestations list \
  --artifact-url="${ARTIFACT_REGISTRY}/${SERVICE_NAME}@${DIGEST}" \
  --attestor="projects/${SHARED_PROJECT}/attestors/build-attestor" \
  --format="value(attestation)" | grep -q . || (echo "ERROR: No attestation found!" && exit 1)

echo "Attestation verified!"

# Create Cloud Deploy release
RELEASE_NAME="prod-${COMMIT_SHA}-$(date +%s)"
echo "Creating Cloud Deploy release: ${RELEASE_NAME}"

cd "$ROOT_DIR"
gcloud deploy releases create "$RELEASE_NAME" \
  --delivery-pipeline=yggdrasil-pipeline \
  --region=${REGION} \
  --source=skaffold.yaml \
  --images="${ARTIFACT_REGISTRY}/${SERVICE_NAME}=${DIGEST}" \
  --annotations=git-commit=${COMMIT_SHA},git-ref=main,deployed-by=$(whoami)

echo "Release created: ${RELEASE_NAME}"

# Wait for deployment
if [ "$SKIP_CANARY" = true ]; then
  echo "Skipping canary, deploying 100% immediately..."
  gcloud deploy rollouts advance \
    --delivery-pipeline=yggdrasil-pipeline \
    --release=${RELEASE_NAME} \
    --region=${REGION} \
    --phase-id=stable
else
  echo "Waiting for canary deployment..."
  for phase in canary-5 canary-25 canary-50 stable; do
    ROLLOUT=$(gcloud deploy rollouts list \
      --delivery-pipeline=yggdrasil-pipeline \
      --release=${RELEASE_NAME} \
      --region=${REGION} \
      --filter="targetId:prod AND phaseId:$phase" \
      --format="value(name)" | head -1)
    
    if [ -n "$ROLLOUT" ]; then
      echo "Waiting for phase: $phase"
      gcloud deploy rollouts wait "$ROLLOUT" --region=${REGION} --timeout=1800s
      
      if [[ "$phase" != "stable" ]]; then
        echo "Phase $phase complete, verifying..."
        sleep 60
      fi
    fi
  done
fi

# Smoke test
echo "Running production smoke test..."
URL="https://yggdrasil.app"
for i in {1..10}; do
  if curl -sf "${URL}/api/health" | grep -q '"status":"ok"'; then
    echo "============================================="
    echo "  Production deployment successful!"
    echo "  URL: ${URL}"
    echo "  Release: ${RELEASE_NAME}"
    echo "============================================="
    exit 0
  fi
  echo "Attempt $i failed, retrying in 15s..."
  sleep 15
done

echo "ERROR: Smoke test failed after 10 attempts"
exit 1
