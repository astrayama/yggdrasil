terraform {
  backend "gcs" {
    bucket = "yggdrasil-prod-tf-state"
    prefix = "environments/dev"
  }
}
