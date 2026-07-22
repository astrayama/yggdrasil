resource "google_service_account" "default" {
  for_each = { for sa in var.service_accounts : sa.account_id => sa }

  account_id   = each.value.account_id
  display_name = each.value.display_name
  description  = each.value.description
  project      = var.project_id
}

resource "google_project_iam_member" "default" {
  for_each = {
    for binding in flatten([
      for sa in var.service_accounts : [
        for role in sa.roles : {
          key          = "${sa.account_id}-${replace(role, "/", "-")}"
          account_id   = sa.account_id
          role         = role
        }
      ]
    ]) : binding.key => binding
  }

  project = var.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.default[each.value.account_id].email}"
}

resource "google_service_account_iam_member" "github_wif" {
  for_each = var.github_pool_name != "" ? {
    for sa in var.service_accounts : sa.account_id => sa
    if contains(sa.roles, "roles/clouddeploy.releaser") || contains(sa.roles, "roles/run.admin")
  } : {}

  service_account_id = google_service_account.default[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${var.github_pool_name}/attribute.repository/${var.github_org}/${var.github_repos[0]}"
}

output "emails" {
  value = { for k, v in google_service_account.default : k => v.email }
}

output "ids" {
  value = { for k, v in google_service_account.default : k => v.id }
}

output "names" {
  value = { for k, v in google_service_account.default : k => v.name }
}
