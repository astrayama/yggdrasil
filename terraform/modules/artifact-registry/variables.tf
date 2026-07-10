variable "region" {
  description = "GCP region for Artifact Registry"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "repository_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "docker"
}

variable "cleanup_keep_tagged" {
  description = "Number of tagged images to keep"
  type        = number
  default     = 10
}

variable "cleanup_delete_untagged_days" {
  description = "Delete untagged images after N days"
  type        = number
  default     = 7
}
