output "project_id" {
  value = var.project_id
}

output "firestore_database" {
  value = module.firestore.database_name
}

output "storage_assets_bucket" {
  value = module.storage_assets.bucket_name
}

output "storage_backups_bucket" {
  value = module.storage_backups.bucket_name
}

output "cloud_run_web_sa" {
  value = google_service_account.cloud_run_web.email
}

output "cloud_functions_sa" {
  value = google_service_account.cloud_functions.email
}

output "secret_names" {
  value = module.secret_manager.secret_names
}

output "note" {
  value       = "Cloud Run service 'yggdrasil-web' is created/updated by Cloud Build (cloudrun-service.yaml) — not by Terraform."
  description = "Service URL is available after the first Cloud Build deploy."
}
