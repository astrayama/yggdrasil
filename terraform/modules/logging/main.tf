resource "google_storage_bucket" "log_bucket" {
  name     = var.log_bucket_name
  location = "US"
  project  = var.project_id

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  labels                      = var.labels

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = var.log_retention_days
    }
  }
}

resource "google_bigquery_dataset" "logs" {
  dataset_id    = var.bigquery_dataset
  friendly_name = "Yggdrasil Logs Analytics"
  description   = "Log analytics dataset for Yggdrasil"
  location      = "US"
  project       = var.project_id

  default_table_expiration_ms = var.log_retention_days * 86400000

  labels = var.labels
}

resource "google_logging_project_sink" "bigquery" {
  name        = "yggdrasil-to-bigquery"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.logs.dataset_id}"
  project     = var.project_id
  filter      = "severity >= INFO AND resource.type IN (\"cloud_run_revision\", \"cloud_function\", \"firestore_database\")"

  bigquery_options {
    use_partitioned_tables = true
  }

  unique_writer_identity = true
}

resource "google_logging_project_sink" "storage" {
  name        = "yggdrasil-to-storage"
  destination = "storage.googleapis.com/${google_storage_bucket.log_bucket.name}"
  project     = var.project_id
  filter      = "severity >= NOTICE AND resource.type IN (\"cloud_run_revision\", \"cloud_function\")"

  unique_writer_identity = true
}

resource "google_project_iam_member" "bq_writer" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = google_logging_project_sink.bigquery.writer_identity
}

resource "google_project_iam_member" "storage_writer" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = google_logging_project_sink.storage.writer_identity
}

resource "google_logging_project_exclusion" "exclusions" {
  for_each = { for exc in var.filter_exclusions : exc.name => exc }

  name        = each.value.name
  description = each.value.description
  filter      = each.value.filter
  project     = var.project_id
}

output "log_bucket_name" {
  value = google_storage_bucket.log_bucket.name
}

output "bigquery_dataset_id" {
  value = google_bigquery_dataset.logs.dataset_id
}
