variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repos" {
  description = "List of GitHub repositories"
  type        = list(string)
}

variable "pool_id" {
  description = "Workload Identity Pool ID"
  type        = string
  default     = "github-actions-pool"
}

variable "provider_id" {
  description = "Workload Identity Pool Provider ID"
  type        = string
  default     = "github-provider"
}
