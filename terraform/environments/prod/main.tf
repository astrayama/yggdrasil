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
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}

# ============================================================
# Firestore Database (prod - multi-region with PITR)
# ============================================================
module "firestore" {
  source = "../../modules/firestore"

  project_id   = var.project_id
  region       = var.region
  location_id  = "nam5"

  database_name          = "(default)"
  point_in_time_recovery = true
  deletion_protection    = true  # Prod cannot be deleted
  ttl_field              = "deletedAt"

  backup_daily_retention  = 7
  backup_weekly_retention = 12

  indexes = [
    {
      collection_group = "roots"
      fields = [
        { field_path = "userId", order = "ASCENDING" },
        { field_path = "createdAt", order = "DESCENDING" },
      ]
    },
    {
      collection_group = "roots"
      fields = [
        { field_path = "userId", order = "ASCENDING" },
        { field_path = "updatedAt", order = "DESCENDING" },
      ]
    },
    {
      collection_group = "entries"
      fields = [
        { field_path = "rootId", order = "ASCENDING" },
        { field_path = "createdAt", order = "DESCENDING" },
      ]
    },
    {
      collection_group = "entries"
      fields = [
        { field_path = "rootId", order = "ASCENDING" },
        { field_path = "embedding", order = "ASCENDING" },
      ]
    },
  ]

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cloud Storage (prod - dual region)
# ============================================================
module "storage_assets" {
  source = "../../modules/storage"

  project_id  = var.project_id
  bucket_name = "${var.project_id}-assets"
  location    = "US"

  versioning_enabled         = true
  uniform_bucket_level_access = true

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }
}

module "storage_backups" {
  source = "../../modules/storage"

  project_id  = var.project_id
  bucket_name = "${var.project_id}-backups"
  location    = "US"

  versioning_enabled         = false
  uniform_bucket_level_access = true

  lifecycle_rules = [
    { action_type = "SetStorageClass", storage_class = "NEARLINE",  age_days = 14 },
    { action_type = "SetStorageClass", storage_class = "COLDLINE",  age_days = 60 },
    { action_type = "Delete",          storage_class = "",          age_days = 365 },
  ]

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }
}

# ============================================================
# Service Accounts (prod)
# ============================================================
resource "google_service_account" "cloud_run_web" {
  account_id   = "yggdrasil-web"
  display_name = "Yggdrasil Web Cloud Run Service"
  description  = "Service account for Yggdrasil web Cloud Run service"
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
  description  = "Service account for Yggdrasil Cloud Functions"
  project      = var.project_id
}

resource "google_project_iam_member" "cloud_functions_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/firebase.admin",
    "roles/aiplatform.user",
    "roles/stripe.admin",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# ============================================================
# Cloud Run Service (prod - always warm)
# ============================================================
module "cloud_run" {
  source = "../../modules/cloud-run"

  project_id            = var.project_id
  region                = var.region
  service_name          = "yggdrasil-web"
  container_image       = var.container_image
  service_account_email = google_service_account.cloud_run_web.email

  min_instances = 2  # Prod always warm
  max_instances = 100
  cpu           = "2000m"
  memory        = "2Gi"

  env_vars = [
    { name = "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value = var.project_id },
    { name = "FIREBASE_PROJECT_ID", value = var.project_id },
  ]

  allow_unauthenticated = true
  custom_domains        = [var.domain]

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.apis]
}

# ============================================================
# Monitoring (prod - strict SLOs)
# ============================================================
module "monitoring" {
  source = "../../modules/monitoring"

  project_id   = var.project_id
  service_name = "yggdrasil-web"
  region       = var.region

  slo_availability_target    = 0.999
  slo_latency_target_seconds = 2.0

  alert_email = var.alert_email

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }

  depends_on = [module.cloud_run]
}

# ============================================================
# Logging (prod - extended retention)
# ============================================================
module "logging" {
  source = "../../modules/logging"

  project_id      = var.project_id
  log_bucket_name = "${var.project_id}-logs"
  bigquery_dataset = "logs_analytics"
  log_retention_days = 365

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.apis]
}
