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

output "cloud_run_service_url" {
  value = module.cloud_run.service_url
}

output "cloud_run_service_name" {
  value = module.cloud_run.service_name
}

output "cloud_run_web_sa" {
  value = google_service_account.cloud_run_web.email
}

output "cloud_functions_sa" {
  value = google_service_account.cloud_functions.email
}

output "monitoring_service_id" {
  value = module.monitoring.service_id
}

output "log_bucket" {
  value = module.logging.log_bucket_name
}
