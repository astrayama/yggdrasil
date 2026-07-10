#!/bin/bash
set -euo pipefail

# =============================================================================
# Terraform Setup Script
# =============================================================================
# This script initializes the Terraform state bucket and runs initial apply
# =============================================================================

PROJECT_ID="yggdrasil-shared"
REGION="us-central1"
STATE_BUCKET="yggdrasil-shared-tf-state"

echo "============================================="
echo "  Yggdrasil Terraform Setup"
echo "============================================="

# Check if authenticated
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
  echo "ERROR: Not authenticated to Google Cloud"
  echo "Run: gcloud auth login"
  exit 1
fi

# Create state bucket if it doesn't exist
echo "Checking if state bucket exists..."
if ! gsutil ls -b "gs://${STATE_BUCKET}" > /dev/null 2>&1; then
  echo "Creating state bucket: ${STATE_BUCKET}"
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -b on "gs://${STATE_BUCKET}"
  gsutil versioning set on "gs://${STATE_BUCKET}"
  echo "State bucket created!"
else
  echo "State bucket already exists."
fi

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  clouddeploy.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  binaryauthorization.googleapis.com \
  containeranalysis.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudkms.googleapis.com \
  iam.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="${PROJECT_ID}"

# Apply shared infrastructure
echo "Applying shared infrastructure..."
cd "$(dirname "$0")/../terraform/shared"
terraform init
terraform apply -auto-approve

# Get outputs
echo "Getting shared infrastructure outputs..."
WORKLOAD_IDENTITY_POOL=$(terraform output -raw workload_identity_pool 2>/dev/null || echo "")
WORKLOAD_IDENTITY_PROVIDER=$(terraform output -raw workload_identity_provider 2>/dev/null || echo "")
SERVICE_ACCOUNT_EMAILS=$(terraform output -json service_account_emails 2>/dev/null || echo "{}")

echo "============================================="
echo "  Shared Infrastructure Applied!"
echo ""
echo "  Workload Identity Pool: ${WORKLOAD_IDENTITY_POOL}"
echo "  Workload Identity Provider: ${WORKLOAD_IDENTITY_PROVIDER}"
echo ""
echo "  Next steps:"
echo "  1. Create GitHub secrets:"
echo "     - WIF_PROVIDER: ${WORKLOAD_IDENTITY_PROVIDER}"
echo "     - GITHUB_DEPLOYER_SA: ${SERVICE_ACCOUNT_EMAILS}"
echo "     - TERRAFORM_SA: ${SERVICE_ACCOUNT_EMAILS}"
echo ""
echo "  2. Apply dev infrastructure:"
echo "     cd terraform/environments/dev && terraform apply"
echo ""
echo "  3. Apply prod infrastructure:"
echo "     cd terraform/environments/prod && terraform apply"
echo "============================================="
