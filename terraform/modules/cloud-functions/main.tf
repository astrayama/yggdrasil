resource "google_cloudfunctions2_function" "default" {
  name        = var.function_name
  location    = var.region
  project     = var.project_id
  description = var.description
  labels      = var.labels

  build_config {
    runtime     = var.runtime
    entry_point = var.entry_point
    source {
      storage_source {
        bucket = var.source_bucket
        object = var.source_object
      }
    }
  }

  service_config {
    max_instance_count    = var.max_instances
    available_memory      = var.available_memory
    timeout_seconds       = var.timeout_seconds
    service_account_email = var.service_account_email
    environment_variables = var.env_vars
    all_traffic_on_latest_revision = true
  }

  dynamic "event_trigger" {
    for_each = var.trigger_event_type != "" ? [1] : []
    content {
      trigger_region = var.region
      event_type     = var.trigger_event_type
      resource       = var.trigger_resource
      retry_policy   = "RETRY_POLICY_RETRY"
      service_account_email = var.service_account_email
    }
  }
}

output "function_name" {
  value = google_cloudfunctions2_function.default.name
}

output "function_uri" {
  value = google_cloudfunctions2_function.default.service_config[0].uri
}

output "function_id" {
  value = google_cloudfunctions2_function.default.id
}
