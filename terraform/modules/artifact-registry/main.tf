resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"
  description   = "Docker images for Yggdrasil"
  project       = var.project_id

  cleanup_policies {
    id     = "keep-recent-tagged"
    action = "KEEP"
    most_recent {
      keep_count = var.cleanup_keep_tagged
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state    = "UNTAGGED"
      older_than   = "${var.cleanup_delete_untagged_days}d"
    }
  }

  cleanup_policies {
    id     = "keep-recent-untagged"
    action = "KEEP"
    most_recent {
      keep_count = 5
    }
  }
}

output "repository_id" {
  value = google_artifact_registry_repository.docker.repository_id
}

output "repository_name" {
  value = google_artifact_registry_repository.docker.name
}

output "location" {
  value = google_artifact_registry_repository.docker.location
}
