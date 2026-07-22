provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {
  project_id = var.project_id
}

# ============================================================
# Enable required APIs (CI control plane)
# ============================================================
resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "clouddeploy.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "binaryauthorization.googleapis.com",
    "containeranalysis.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudkms.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])

  project                    = var.project_id
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ============================================================
# Artifact Registry (single source of images for dev + prod)
# ============================================================
module "artifact_registry" {
  source = "../modules/artifact-registry"

  project_id = var.project_id
  region     = var.region

  cleanup_keep_tagged          = 10
  cleanup_delete_untagged_days = 7

  depends_on = [google_project_service.apis]
}

# Grant both runtime SAs reader access to Artifact Registry so Cloud Run in dev + prod can pull.
# (Prod SA lives in this project; dev SA lives in yggdrasil-dev — cross-project IAM.)
resource "google_project_iam_member" "runtime_ar_readers" {
  for_each = toset([var.dev_runtime_sa_email, var.prod_runtime_sa_email])

  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${each.value}"

  depends_on = [module.artifact_registry]
}

# ============================================================
# Cloud Deploy delivery pipeline (optional, for future prod canary)
# ============================================================
# Disabled in the default flow: dev + prod both deploy directly via Cloud Build
# (see cloudbuild.yaml). Re-enable by uncommenting and adding a prod skaffold source.
# module "cloud_deploy" {
#   source = "../modules/cloud-deploy"
#   ...
# }

# Cloud Deploy's own service agent (kept for the optional canary path).
locals {
  clouddeploy_sa = "service-${data.google_project.current.number}@gcp-sa-clouddeploy.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "clouddeploy_prod_run_admin" {
  count   = 0 # disabled until Cloud Deploy is wired
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.clouddeploy_sa}"
}

# ============================================================
# Binary Authorization + Cloud KMS (DRYRUN until first signed release validated)
# ============================================================
module "binary_authz" {
  source = "../modules/binary-authz"

  project_id     = var.project_id
  attestor_name  = "build-attestor"
  note_name      = "build-attestor-note"
  kms_keyring_id = "attestor-keyring"
  kms_key_id     = "attestor-key"

  enforcement_mode = "DRY_RUN_AUDIT_LOG_ONLY"

  allowed_registries = [
    "us-docker.pkg.dev/${var.project_id}/docker/*",
  ]

  depends_on = [google_project_service.apis]
}

# ============================================================
# Workload Identity Federation (GitHub Actions OIDC)
# ============================================================
module "workload_identity" {
  source = "../modules/workload-identity"

  project_id    = var.project_id
  github_org    = var.github_org
  github_repos  = var.github_repos
  pool_id       = "github-actions-pool"
  provider_id   = "github-provider"

  depends_on = [google_project_service.apis]
}

# ============================================================
# CI service accounts
# ============================================================
module "iam" {
  source = "../modules/iam"

  project_id = var.project_id

  service_accounts = [
    {
      account_id   = "github-deployer"
      display_name = "GitHub Actions Deployer"
      description  = "Assumed by GitHub Actions via WIF to trigger Cloud Build and Terraform"
      roles = [
        "roles/cloudbuild.builds.editor",
        "roles/clouddeploy.releaser",
        "roles/clouddeploy.admin",
        "roles/run.admin",
        "roles/iam.serviceAccountUser",
        "roles/artifactregistry.writer",
        "roles/secretmanager.secretAccessor",
        "roles/storage.objectAdmin",
        "roles/binaryauthorization.attestorsViewer",
      ]
    },
    {
      account_id   = "cloud-build-deployer"
      display_name = "Cloud Build Deployer"
      description  = "Used by Cloud Build to create Cloud Deploy releases and sign images"
      roles = [
        "roles/clouddeploy.releaser",
        "roles/run.admin",
        "roles/iam.serviceAccountUser",
        "roles/artifactregistry.writer",
        "roles/secretmanager.secretAccessor",
        "roles/cloudkms.signerVerifier",
        "roles/binaryauthorization.attestorsAdmin",
      ]
    },
  ]

  github_pool_name = module.workload_identity.pool_name
  github_org       = var.github_org
  github_repos     = var.github_repos

  depends_on = [module.workload_identity]
}

# Cloud Build's runtime service account (the default Compute Engine builder) needs to push images,
# sign with KMS, create releases, and deploy. Bind the project-level Cloud Build SA.
locals {
  cloudbuild_sa = "${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_perms" {
  for_each = toset([
    "roles/artifactregistry.writer",
    "roles/clouddeploy.releaser",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/cloudkms.signerVerifier",
    "roles/binaryauthorization.attestorsAdmin",
    "roles/logging.logWriter",
    # Allow Cloud Build to deploy Firebase Cloud Functions + rules in the prod project
    "roles/cloudfunctions.admin",
    "roles/firebase.admin",
    "roles/serviceusage.serviceUsageConsumer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${local.cloudbuild_sa}"

  depends_on = [module.artifact_registry, module.binary_authz]
}
