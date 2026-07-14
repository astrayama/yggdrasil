variable "project_id" {
  description = "Prod project ID (also hosts the CI control plane)"
  type        = string
  default     = "yggdrasil-prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "artifact_registry_image" {
  description = "Artifact Registry image used by Cloud Run (informational; the service spec is owned by cloudrun-service.yaml, rendered by Cloud Build)."
  type        = string
  default     = "us-docker.pkg.dev/yggdrasil-prod/docker/yggdrasil-web"
}

variable "secret_values" {
  description = "Map of Secret Manager secret name → value for the prod environment. Empty values create the secret shell only."
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "alert_email" {
  description = "Alert notification email"
  type        = string
  default     = ""
}
