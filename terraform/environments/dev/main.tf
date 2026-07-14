provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Prod project lookup (to resolve the Cloud Deploy service agent email for cross-project grants)
data "google_project" "prod" {
  project_id = var.prod_project_id
}

# ============================================================
# Enable required APIs
# ============================================================
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])

  project                    = var.project_id
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ============================================================
# Firestore Database (dev)
# ============================================================
module "firestore" {
  source = "../../modules/firestore"

  project_id   = var.project_id
  region       = var.region
  location_id  = "nam5"

  database_name          = "(default)"
  point_in_time_recovery = true
  deletion_protection    = false
  ttl_field              = "deletedAt"

  backup_daily_retention  = 3
  backup_weekly_retention = 4

  indexes = [
    { collection_group = "roots",  fields = [{ field_path = "userId", order = "ASCENDING" }, { field_path = "createdAt", order = "DESCENDING" }] },
    { collection_group = "roots",  fields = [{ field_path = "userId", order = "ASCENDING" }, { field_path = "updatedAt", order = "DESCENDING" }] },
    { collection_group = "entries", fields = [{ field_path = "rootId", order = "ASCENDING" }, { field_path = "createdAt", order = "DESCENDING" }] },
  ]

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cloud Storage (dev)
# ============================================================
module "storage_assets" {
  source = "../../modules/storage"

  project_id                  = var.project_id
  bucket_name                 = "${var.project_id}-assets"
  location                    = "US"
  versioning_enabled          = true
  uniform_bucket_level_access = true
  cors_origins                = ["*"]
  labels = { environment = "dev", managed_by = "terraform" }
}

module "storage_backups" {
  source = "../../modules/storage"

  project_id                  = var.project_id
  bucket_name                 = "${var.project_id}-backups"
  location                    = "US"
  versioning_enabled          = false
  uniform_bucket_level_access = true

  lifecycle_rules = [
    { action_type = "SetStorageClass", storage_class = "NEARLINE", age_days = 7 },
    { action_type = "SetStorageClass", storage_class = "COLDLINE", age_days = 30 },
    { action_type = "Delete",          storage_class = "",         age_days = 90 },
  ]

  labels = { environment = "dev", managed_by = "terraform" }
}

# ============================================================
# Service Accounts
# ============================================================
resource "google_service_account" "cloud_run_web" {
  account_id   = "yggdrasil-web"
  display_name = "Yggdrasil Web Cloud Run Service"
  project      = var.project_id
}

resource "google_project_iam_member" "cloud_run_web_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/firebase.admin",
    "roles/aiplatform.user",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_web.email}"
}

resource "google_service_account" "cloud_functions" {
  account_id   = "yggdrasil-functions"
  display_name = "Yggdrasil Cloud Functions Service"
  project      = var.project_id
}

resource "google_project_iam_member" "cloud_functions_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/firebase.admin",
    "roles/aiplatform.user",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# ============================================================
# Secret Manager (dev secrets, injected as env vars on Cloud Run / Functions)
# ============================================================
module "secret_manager" {
  source = "../../modules/secret-manager"

  project_id            = var.project_id
  secrets               = var.secret_values
  service_account_emails = [
    google_service_account.cloud_run_web.email,
    google_service_account.cloud_functions.email,
  ]
  labels = { environment = "dev", managed_by = "terraform" }

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cross-project grant: let the prod Cloud Build service account deploy directly
# to this dev project (dev uses direct gcloud run deploy) and act as the dev runtime SA.
# ============================================================
locals {
  prod_cloudbuild_sa = "service-${data.google_project.prod.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_dev_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.prod_cloudbuild_sa}"
}

resource "google_service_account_iam_member" "cloudbuild_dev_sa_user" {
  service_account_id = google_service_account.cloud_run_web.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.prod_cloudbuild_sa}"
}

# Let the prod Cloud Build SA deploy Firebase Cloud Functions + rules to this dev project
resource "google_project_iam_member" "cloudbuild_dev_functions" {
  for_each = toset([
    "roles/cloudfunctions.admin",
    "roles/firebase.admin",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/iam.serviceAccountUser",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${local.prod_cloudbuild_sa}"
}

resource "google_service_account_iam_member" "cloudbuild_dev_functions_sa_user" {
  service_account_id = google_service_account.cloud_functions.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.prod_cloudbuild_sa}"
}

# ============================================================
# Monitoring (dev SLOs)
# ============================================================
module "monitoring" {
  source = "../../modules/monitoring"

  project_id   = var.project_id
  service_name = "yggdrasil-web"
  region       = var.region

  slo_availability_target    = 0.99
  slo_latency_target_seconds = 3.0
  alert_email = var.alert_email

  labels = { environment = "dev", managed_by = "terraform" }
}

# ============================================================
# Logging (dev)
# ============================================================
module "logging" {
  source = "../../modules/logging"

  project_id         = var.project_id
  log_bucket_name    = "${var.project_id}-logs"
  bigquery_dataset   = "logs_analytics"
  log_retention_days = 30

  labels = { environment = "dev", managed_by = "terraform" }

  depends_on = [google_project_service.apis]
}
