terraform {
  backend "gcs" {
    bucket = "yggdrasil-shared-tf-state"
    prefix = "environments/prod"
  }
}
