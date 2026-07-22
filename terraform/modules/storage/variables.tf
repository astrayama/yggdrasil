variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "bucket_name" {
  description = "Storage bucket name"
  type        = string
}

variable "location" {
  description = "Storage bucket location"
  type        = string
}

variable "storage_class" {
  description = "Default storage class"
  type        = string
  default     = "STANDARD"
}

variable "versioning_enabled" {
  description = "Enable object versioning"
  type        = bool
  default     = true
}

variable "uniform_bucket_level_access" {
  description = "Enable uniform bucket level access"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "Lifecycle rules"
  type = list(object({
    action_type  = string
    storage_class = string
    age_days     = number
  }))
  default = [
    { action_type = "SetStorageClass", storage_class = "NEARLINE",  age_days = 30 },
    { action_type = "SetStorageClass", storage_class = "COLDLINE",  age_days = 90 },
    { action_type = "SetStorageClass", storage_class = "ARCHIVE",   age_days = 365 },
    { action_type = "Delete",          storage_class = "",          age_days = 730 },
  ]
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
