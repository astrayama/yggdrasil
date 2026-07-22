output "artifact_registry_repository" {
  value = module.artifact_registry.repository_id
}

output "binary_authz_attestor" {
  value = module.binary_authz.attestor_name
}

output "binary_authz_enforcement" {
  value = "DRY_RUN_AUDIT_LOG_ONLY (flip to ENFORCED_BLOCK_AND_AUDIT_LOG after first signed release)"
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

output "wif_provider_full" {
  description = "Set this as the GitHub secret WIF_PROVIDER"
  value       = "projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
}
