variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "database_name" {
  description = "Firestore database name"
  type        = string
  default     = "(default)"
}

variable "location_id" {
  description = "Firestore location ID"
  type        = string
  default     = "nam5"
}

variable "point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "ttl_field" {
  description = "TTL field name"
  type        = string
  default     = "deletedAt"
}

variable "backup_daily_retention" {
  description = "Daily backup retention in days"
  type        = number
  default     = 7
}

variable "backup_weekly_retention" {
  description = "Weekly backup retention in weeks"
  type        = number
  default     = 12
}

variable "indexes" {
  description = "Firestore indexes"
  type = list(object({
    collection_group = string
    fields           = list(object({
      field_path = string
      order      = string
    }))
  }))
  default = []
}
