resource "google_secret_manager_secret" "default" {
  for_each = var.secrets

  secret_id = each.key
  project   = var.project_id
  labels    = var.labels

  replication {
    auto {}
  }

  # Rotation requires a configured rotator (e.g. a Cloud Function). It is opt-in: set
  # rotation_period_days > 0 AND rotation_function together, otherwise rotation is omitted.
  dynamic "rotation" {
    for_each = var.rotation_period_days > 0 && var.rotation_function != "" ? [1] : []
    content {
      rotation_period    = "${var.rotation_period_days * 24}s"
      next_rotation_time = timeadd(timestamp(), "${var.rotation_period_days * 24}h")
      rotation_function  = var.rotation_function
    }
  }
}

resource "google_secret_manager_secret_version" "default" {
  for_each = { for k, v in var.secrets : k => v if v != "" }

  secret      = google_secret_manager_secret.default[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "sa_access" {
  for_each = {
    for pair in setproduct(toset(var.service_account_emails), toset(keys(var.secrets))) :
    "${pair[0]}-${pair[1]}" => {
      sa         = pair[0]
      secret_key = pair[1]
    }
  }

  secret_id = google_secret_manager_secret.default[each.value.secret_key].secret_id
  project   = var.project_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value.sa}"
}

output "secret_ids" {
  value = { for k, v in google_secret_manager_secret.default : k => v.id }
}

output "secret_names" {
  value = { for k, v in google_secret_manager_secret.default : k => v.secret_id }
}
