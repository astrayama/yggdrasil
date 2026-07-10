variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_accounts" {
  description = "Service accounts to create"
  type = list(object({
    account_id   = string
    display_name = string
    description  = string
    roles        = list(string)
  }))
}

variable "github_pool_name" {
  description = "Workload Identity Pool name for GitHub binding"
  type        = string
  default     = ""
}

variable "github_org" {
  description = "GitHub organization for WIF binding"
  type        = string
  default     = ""
}

variable "github_repos" {
  description = "GitHub repositories for WIF binding"
  type        = list(string)
  default     = []
}
