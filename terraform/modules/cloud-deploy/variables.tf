variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "pipeline_name" {
  description = "Cloud Deploy pipeline name"
  type        = string
  default     = "yggdrasil-pipeline"
}

variable "dev_project_id" {
  description = "Dev project ID for deployment target"
  type        = string
}

variable "prod_project_id" {
  description = "Prod project ID for deployment target"
  type        = string
}

variable "canary_percentages" {
  description = "Canary deployment percentages for prod"
  type        = list(number)
  default     = [5, 25, 50]
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "yggdrasil-web"
}
