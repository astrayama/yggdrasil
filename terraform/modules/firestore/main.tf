resource "google_firestore_database" "default" {
  name        = var.database_name
  location_id = var.location_id
  type        = "FIRESTORE_NATIVE"
  project     = var.project_id

  deletion_protection = var.deletion_protection

  point_in_time_recovery_enablement = var.point_in_time_recovery ? "POINT_IN_TIME_RECOVERY_ENABLED" : "POINT_IN_TIME_RECOVERY_DISABLED"

  dynamic "ttl_config" {
    for_each = var.ttl_field != "" ? [1] : []
    content {
      field_name = var.ttl_field
    }
  }
}

resource "google_firestore_backup_schedule" "daily" {
  database  = google_firestore_database.default.name
  schedule  = "every 24 hours"
  retention = "${var.backup_daily_retention}d"
  project   = var.project_id
}

resource "google_firestore_backup_schedule" "weekly" {
  database  = google_firestore_database.default.name
  schedule  = "every 7 days"
  retention = "${var.backup_weekly_retention}w"
  project   = var.project_id
}

resource "google_firestore_index" "default" {
  for_each = { for idx in var.indexes : "${idx.collection_group}-${join("-", [for f in idx.fields : f.field_path])}" => idx }

  project    = var.project_id
  collection = each.value.collection_group

  dynamic "fields" {
    for_each = each.value.fields
    content {
      field_path = fields.value.field_path
      order      = fields.value.order
    }
  }
}

output "database_name" {
  value = google_firestore_database.default.name
}

output "database_id" {
  value = google_firestore_database.default.id
}
