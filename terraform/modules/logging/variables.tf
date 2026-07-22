variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "log_bucket_name" {
  description = "Cloud Storage bucket for log retention"
  type        = string
}

variable "bigquery_dataset" {
  description = "BigQuery dataset for log analytics"
  type        = string
  default     = "logs_analytics"
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 365
}

variable "filter_exclusions" {
  description = "Log filter exclusions"
  type = list(object({
    name        = string
    description = string
    filter      = string
  }))
  default = [
    {
      name        = "exclude-health-checks"
      description = "Exclude health check logs"
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.message:\"health check\" AND severity<WARNING"
    },
    {
      name        = "exclude-static-assets"
      description = "Exclude static asset requests"
      filter      = "resource.type=\"cloud_run_revision\" AND (jsonPayload.request.url:\"/_next/static/\" OR jsonPayload.request.url:\"/static/\") AND severity<WARNING"
    },
  ]
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
