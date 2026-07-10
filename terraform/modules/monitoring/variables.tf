variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name for monitoring"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "slo_availability_target" {
  description = "SLO availability target (e.g., 0.999 for 99.9%)"
  type        = number
  default     = 0.999
}

variable "slo_latency_target_seconds" {
  description = "SLO latency P99 target in seconds"
  type        = number
  default     = 2.0
}

variable "notification_channels" {
  description = "List of notification channel IDs"
  type        = list(string)
  default     = []
}

variable "alert_email" {
  description = "Email for alert notifications"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
