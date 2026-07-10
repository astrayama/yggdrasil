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
  description = "Secret rotation period in days"
  type        = number
  default     = 90
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
