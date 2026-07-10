resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = var.pool_id
  display_name              = "GitHub Actions Pool"
  description               = "Workload Identity Pool for GitHub Actions"
  project                   = var.project_id
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.provider_id
  display_name                       = "GitHub Provider"
  description                        = "GitHub OIDC provider for CI/CD"
  project                            = var.project_id

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"

    attribute_mapping = {
      "google.subject"       = "assertion.sub"
      "attribute.actor"      = "assertion.actor"
      "attribute.repository" = "assertion.repository"
      "attribute.ref"        = "assertion.ref"
      "attribute.workflow"   = "assertion.workflow"
      "attribute.aud"        = "assertion.aud"
    }

    attribute_condition = "assertion.repository_owner == '${var.github_org}'"
  }
}

output "pool_id" {
  value = google_iam_workload_identity_pool.github.name
}

output "pool_name" {
  value = google_iam_workload_identity_pool.github.workload_identity_pool_id
}

output "provider_id" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "provider_name" {
  value = google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id
}
