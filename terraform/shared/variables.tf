variable "project_id" {
  description = "Shared project ID"
  type        = string
  default     = "yggdrasil-shared"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "piero"
}

variable "github_repos" {
  description = "GitHub repositories"
  type        = list(string)
  default     = ["yggdrasil"]
}

variable "dev_project_id" {
  description = "Dev project ID"
  type        = string
  default     = "yggdrasil-dev"
}

variable "prod_project_id" {
  description = "Prod project ID"
  type        = string
  default     = "yggdrasil-prod"
}

variable "secret_values" {
  description = "Secret values (set via terraform.tfvars or environment)"
  type        = map(string)
  sensitive   = true
  default     = {}
}
