resource "google_storage_bucket" "default" {
  name                        = var.bucket_name
  location                    = var.location
  project                     = var.project_id
  storage_class               = var.storage_class
  uniform_bucket_level_access = var.uniform_bucket_level_access
  labels                      = var.labels

  versioning {
    enabled = var.versioning_enabled
  }

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rules
    content {
      action {
        type          = lifecycle_rule.value.action_type
        storage_class = lifecycle_rule.value.storage_class != "" ? lifecycle_rule.value.storage_class : null
      }
      condition {
        age = lifecycle_rule.value.age_days
      }
    }
  }

  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

output "bucket_name" {
  value = google_storage_bucket.default.name
}

output "bucket_url" {
  value = google_storage_bucket.default.url
}

output "bucket_id" {
  value = google_storage_bucket.default.id
}
