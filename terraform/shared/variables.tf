variable "project_id" {
  description = "Control-plane (prod) project ID. CI services (Artifact Registry, Cloud Build, Cloud Deploy, KMS, Binary Authz, WIF) live here."
  type        = string
  default     = "yggdrasil-prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "piero"
}

variable "github_repos" {
  description = "GitHub repositories allowed to assume the WIF SA"
  type        = list(string)
  default     = ["yggdrasil"]
}

variable "dev_project_id" {
  description = "Dev app project ID (Cloud Deploy target)"
  type        = string
  default     = "yggdrasil-dev"
}

variable "prod_project_id" {
  description = "Prod app project ID (Cloud Deploy target). Same as project_id."
  type        = string
  default     = "yggdrasil-prod"
}

variable "dev_runtime_sa_email" {
  description = "Dev Cloud Run runtime service account email. Granted Artifact Registry reader so the dev service can pull images."
  type        = string
  default     = "yggdrasil-web@yggdrasil-dev.iam.gserviceaccount.com"
}

variable "prod_runtime_sa_email" {
  description = "Prod Cloud Run runtime service account email."
  type        = string
  default     = "yggdrasil-web@yggdrasil-prod.iam.gserviceaccount.com"
}
