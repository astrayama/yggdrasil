resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  project  = var.project_id
  labels   = var.labels

  template {
    service_account = var.service_account_email
    max_instance_request_concurrency = 80

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    volumes {
      name = "secrets"
      secret {
        secret = "stripe-secret-key"
        items {
          version = "latest"
          path    = "stripe-secret-key"
        }
      }
    }

    volumes {
      name = "vertex-secrets"
      secret {
        secret = "vertex-ai-api-key"
        items {
          version = "latest"
          path    = "vertex-ai-api-key"
        }
      }
    }

    containers {
      image = var.container_image
      ports {
        container_port = var.port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        startup_cpu_boost = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = tostring(var.port)
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.value.name
          value = env.value.value
        }
      }

      volume_mounts {
        name       = "secrets"
        mount_path = "/secrets/stripe"
      }

      volume_mounts {
        name       = "vertex-secrets"
        mount_path = "/secrets/vertex"
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = var.port
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 30
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = var.port
        }
        initial_delay_seconds = 30
        period_seconds        = 60
        timeout_seconds       = 5
        failure_threshold     = 3
      }
    }

    annotations = {
      "run.googleapis.com/ingress"           = "all"
      "run.googleapis.com/execution-environment" = "gen2"
      "run.googleapis.com/cpu-throttling"    = "false"
      "run.googleapis.com/startup-cpu-boost" = "true"
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_name" {
  value = google_cloud_run_v2_service.default.name
}

output "service_url" {
  value = google_cloud_run_v2_service.default.uri
}

output "service_id" {
  value = google_cloud_run_v2_service.default.id
}
