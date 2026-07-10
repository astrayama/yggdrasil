provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ============================================================
# Enable required APIs
# ============================================================
resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "clouddeploy.googleapis.com",
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "binaryauthorization.googleapis.com",
    "containeranalysis.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudkms.googleapis.com",
    "iam.googleapis.com",
    "sts.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}

# ============================================================
# Artifact Registry (shared across all environments)
# ============================================================
module "artifact_registry" {
  source = "../../modules/artifact-registry"

  project_id = var.project_id
  region     = var.region

  cleanup_keep_tagged          = 10
  cleanup_delete_untagged_days = 7

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cloud Build Worker Pool
# ============================================================
module "cloud_build" {
  source = "../../modules/cloud-build"

  project_id      = var.project_id
  region          = var.region
  worker_pool_name = "cloud-build-pool"
  machine_type    = "E2_MEDIUM"

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cloud Deploy Pipeline
# ============================================================
module "cloud_deploy" {
  source = "../../modules/cloud-deploy"

  project_id     = var.project_id
  region         = var.region
  pipeline_name  = "yggdrasil-pipeline"
  dev_project_id = var.dev_project_id
  prod_project_id = var.prod_project_id

  canary_percentages = [5, 25, 50]
  service_name       = "yggdrasil-web"

  depends_on = [google_project_service.apis]
}

# ============================================================
# Binary Authorization + Cloud KMS
# ============================================================
module "binary_authz" {
  source = "../../modules/binary-authz"

  project_id     = var.project_id
  attestor_name  = "build-attestor"
  note_name      = "build-attestor-note"
  kms_keyring_id = "attestor-keyring"
  kms_key_id     = "attestor-key"

  enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

  allowed_registries = [
    "us-docker.pkg.dev/${var.project_id}/docker/*",
  ]

  depends_on = [google_project_service.apis]
}

# ============================================================
# Secret Manager (shared secrets)
# ============================================================
module "secret_manager" {
  source = "../../modules/secret-manager"

  project_id = var.project_id
  secrets    = var.secret_values

  rotation_period_days = 90

  service_account_emails = [
    "github-deployer@${var.project_id}.iam.gserviceaccount.com",
  ]

  labels = {
    managed_by = "terraform"
    project    = "shared"
  }

  depends_on = [google_project_service.apis]
}

# ============================================================
# Workload Identity Federation
# ============================================================
module "workload_identity" {
  source = "../../modules/workload-identity"

  project_id = var.project_id
  github_org = var.github_org
  github_repos = var.github_repos

  pool_id    = "github-actions-pool"
  provider_id = "github-provider"

  depends_on = [google_project_service.apis]
}

# ============================================================
# IAM Service Accounts
# ============================================================
module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id

  service_accounts = [
    {
      account_id   = "github-deployer"
      display_name = "GitHub Actions Deployer"
      description  = "Used by GitHub Actions via WIF to deploy to Cloud Deploy"
      roles = [
        "roles/clouddeploy.releaser",
        "roles/clouddeploy.admin",
        "roles/run.admin",
        "roles/iam.serviceAccountUser",
        "roles/artifactregistry.writer",
        "roles/secretmanager.secretAccessor",
        "roles/storage.objectViewer",
        "roles/binaryauthorization.attestorsVerifier",
      ]
    },
    {
      account_id   = "cloud-build-deployer"
      display_name = "Cloud Build Deployer"
      description  = "Used by Cloud Build for deploying containers"
      roles = [
        "roles/clouddeploy.releaser",
        "roles/run.admin",
        "roles/artifactregistry.writer",
        "roles/secretmanager.secretAccessor",
      ]
    },
  ]

  github_pool_name = module.workload_identity.pool_name
  github_org       = var.github_org
  github_repos     = var.github_repos

  depends_on = [module.workload_identity]
}
