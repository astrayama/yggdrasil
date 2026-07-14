variable "project_id" {
  description = "Dev project ID"
  type        = string
  default     = "yggdrasil-dev"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "prod_project_id" {
  description = "Prod (control-plane) project ID — needed to grant the prod Cloud Deploy service agent access to this project."
  type        = string
  default     = "yggdrasil-prod"
}

variable "artifact_registry_image" {
  description = "Artifact Registry image used by Cloud Run (informational; the service spec is owned by cloudrun-service.yaml, rendered by Cloud Build)."
  type        = string
  default     = "us-docker.pkg.dev/yggdrasil-prod/docker/yggdrasil-web"
}

variable "secret_values" {
  description = "Map of Secret Manager secret name → value for the dev environment. Empty values create the secret shell only (add the version later via gcloud)."
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "alert_email" {
  description = "Alert notification email"
  type        = string
  default     = ""
}
