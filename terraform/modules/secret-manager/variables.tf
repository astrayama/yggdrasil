variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "secrets" {
  description = "Map of secret names to their values"
  type        = map(string)
  sensitive   = true
}

variable "rotation_period_days" {
  description = "Secret rotation period in days. Set to 0 to disable rotation (default). When > 0 you must also set rotation_function."
  type        = number
  default     = 0
}

variable "rotation_function" {
  description = "Fully-qualified Cloud Function resource name to act as the rotation rotator. Required when rotation_period_days > 0."
  type        = string
  default     = ""
}

variable "service_account_emails" {
  description = "List of service account emails to grant access"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
