resource "google_cloud_deploy_delivery_pipeline" "pipeline" {
  location     = var.region
  name         = var.pipeline_name
  description  = "Yggdrasil progressive delivery pipeline"
  project      = var.project_id

  serial_pipeline {
    stages {
      target_id = "dev"
    }
    stages {
      target_id = "prod"
      profiles  = []

      strategy {
        canary {
          runtime_config {
            cloud_run {
              automatic_traffic_control = true
            }
          }

          canary_deployment {
            percentages = var.canary_percentages
            verify      = true
          }
        }
      }
    }
  }
}

resource "google_cloud_deploy_target" "dev" {
  location     = var.region
  name         = "dev"
  project      = var.project_id
  description  = "Development environment"

  run {
    location = "projects/${var.dev_project_id}/locations/${var.region}"
  }

  depends_on = [google_cloud_deploy_delivery_pipeline.pipeline]
}

resource "google_cloud_deploy_target" "prod" {
  location     = var.region
  name         = "prod"
  project      = var.project_id
  description  = "Production environment"

  run {
    location = "projects/${var.prod_project_id}/locations/${var.region}"
  }

  require_approval = true

  depends_on = [google_cloud_deploy_delivery_pipeline.pipeline]
}

output "pipeline_name" {
  value = google_cloud_deploy_delivery_pipeline.pipeline.name
}

output "pipeline_id" {
  value = google_cloud_deploy_delivery_pipeline.pipeline.id
}
