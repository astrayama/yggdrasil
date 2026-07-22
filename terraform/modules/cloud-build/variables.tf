variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "worker_pool_name" {
  description = "Cloud Build worker pool name"
  type        = string
  default     = "cloud-build-pool"
}

variable "machine_type" {
  description = "Worker pool machine type"
  type        = string
  default     = "E2_MEDIUM"
}
