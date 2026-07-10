variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "function_name" {
  description = "Cloud Functions name"
  type        = string
}

variable "description" {
  description = "Function description"
  type        = string
  default     = ""
}

variable "runtime" {
  description = "Runtime (e.g., nodejs20)"
  type        = string
  default     = "nodejs20"
}

variable "entry_point" {
  description = "Function entry point"
  type        = string
}

variable "source_bucket" {
  description = "GCS bucket for function source"
  type        = string
}

variable "source_object" {
  description = "GCS object for function source"
  type        = string
}

variable "service_account_email" {
  description = "Service account email"
  type        = string
}

variable "timeout_seconds" {
  description = "Function timeout in seconds"
  type        = number
  default     = 60
}

variable "available_memory" {
  description = "Available memory"
  type        = string
  default     = "256M"
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 100
}

variable "env_vars" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "trigger_event" {
  description = "Event trigger (e.g., google.firestore.document.create)"
  type        = string
  default     = ""
}

variable "trigger_resource" {
  description = "Event trigger resource"
  type        = string
  default     = ""
}

variable "trigger_event_type" {
  description = "Event type"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
