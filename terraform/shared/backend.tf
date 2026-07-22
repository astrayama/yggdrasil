terraform {
  backend "gcs" {
    bucket = "yggdrasil-prod-tf-state"
    prefix = "control-plane"
  }
}
