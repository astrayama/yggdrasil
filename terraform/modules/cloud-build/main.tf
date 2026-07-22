resource "google_cloudbuild_worker_pool" "default" {
  name     = var.worker_pool_name
  location = var.region
  project  = var.project_id

  worker_config {
    disk_size = 100
    machine_type = var.machine_type
  }
}

output "worker_pool_id" {
  value = google_cloudbuild_worker_pool.default.id
}

output "worker_pool_name" {
  value = google_cloudbuild_worker_pool.default.name
}
