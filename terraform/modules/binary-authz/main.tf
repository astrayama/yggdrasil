resource "google_kms_key_ring" "attestor" {
  name     = "attestor-keyring"
  location = "global"
  project  = var.project_id
}

resource "google_kms_crypto_key" "attestor" {
  name     = "attestor-key"
  key_ring = google_kms_key_ring.attestor.id
  purpose  = "ASYMMETRIC_SIGNING"

  version_template {
    algorithm        = "EC_SIGN_P256_SHA256"
    protection_level = "SOFTWARE"
  }
}

resource "google_container_analysis_note" "attestor" {
  name    = var.note_name
  project = var.project_id

  attestation_authority {
    hint {
      human_readable_name = "Build Pipeline Attestor"
    }
  }
}

resource "google_binary_authorization_attestor" "default" {
  name    = var.attestor_name
  project = var.project_id

  attestation_authority_note {
    note_reference = google_container_analysis_note.attestor.name

    public_keys {
      id = "kms-key"
      pkix_public_key {
        public_key_pem     = google_kms_crypto_key_attestor_version.attestor_key.public_key_pem
        signature_algorithm = "ECDSA_P256_SHA256"
      }
    }
  }
}

data "google_kms_crypto_key_version" "attestor_key" {
  crypto_key = google_kms_crypto_key.attestor.id
}

resource "google_kms_crypto_key_attestor_version" "attestor_key" {
  crypto_key         = google_kms_crypto_key.attestor.id
  attestor           = google_binary_authorization_attestor.default.name
  crypto_key_version = data.google_kms_crypto_key_version.attestor_key.version
}

resource "google_binary_authorization_policy" "default" {
  project = var.project_id

  dynamic "admission_whitelist_patterns" {
    for_each = var.allowed_registries
    content {
      name_pattern = admission_whitelist_patterns.value
    }
  }

  default_admission_rule {
    enforcement_mode   = var.enforcement_mode
    evaluation_mode    = "REQUIRE_ATTESTATION"
    require_attestations_by = [
      google_binary_authorization_attestor.default.name
    ]
  }
}

output "attestor_name" {
  value = google_binary_authorization_attestor.default.name
}

output "policy_id" {
  value = google_binary_authorization_policy.default.id
}
