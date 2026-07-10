variable "project_id" {
  description = "Prod project ID"
  type        = string
  default     = "yggdrasil-prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "shared_project_id" {
  description = "Shared project ID"
  type        = string
  default     = "yggdrasil-shared"
}

variable "container_image" {
  description = "Container image URL"
  type        = string
  default     = "us-docker.pkg.dev/yggdrasil-shared/docker/yggdrasil-web:latest"
}

variable "alert_email" {
  description = "Alert notification email"
  type        = string
  default     = ""
}

variable "domain" {
  description = "Custom domain for prod"
  type        = string
  default     = "yggdrasil.app"
}
