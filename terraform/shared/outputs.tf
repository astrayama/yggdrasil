output "artifact_registry_repository" {
  value = module.artifact_registry.repository_id
}

output "cloud_build_worker_pool" {
  value = module.cloud_build.worker_pool_name
}

output "cloud_deploy_pipeline" {
  value = module.cloud_deploy.pipeline_name
}

output "binary_authz_attestor" {
  value = module.binary_authz.attestor_name
}

output "workload_identity_pool" {
  value = module.workload_identity.pool_name
}

output "workload_identity_provider" {
  value = module.workload_identity.provider_name
}

output "service_account_emails" {
  value = module.iam.emails
}

output "secret_ids" {
  value     = module.secret_manager.secret_ids
  sensitive = true
}
