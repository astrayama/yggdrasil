variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "attestor_name" {
  description = "Binary Authorization attestor name"
  type        = string
  default     = "build-attestor"
}

variable "note_name" {
  description = "Container Analysis note name"
  type        = string
  default     = "build-attestor-note"
}

variable "kms_keyring_id" {
  description = "Cloud KMS keyring ID"
  type        = string
}

variable "kms_key_id" {
  description = "Cloud KMS key ID"
  type        = string
}

variable "enforcement_mode" {
  description = "Enforcement mode (ENFORCED_BLOCK_AND_AUDIT_LOG or DRY_RUN_AUDIT_LOG_ONLY)"
  type        = string
  default     = "ENFORCED_BLOCK_AND_AUDIT_LOG"
}

variable "allowed_registries" {
  description = "List of allowed registry patterns"
  type        = list(string)
  default     = [
    "us-docker.pkg.dev/yggdrasil-shared/docker/*",
  ]
}
