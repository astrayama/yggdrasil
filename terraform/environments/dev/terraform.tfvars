project_id      = "yggdrasil-dev"
region          = "us-central1"
prod_project_id = "yggdrasil-prod"

# Secret values for the dev environment.
# Leave values empty to create the secret shell in Terraform, then add the version later:
#   printf "%s" "<value>" | gcloud secrets versions add <name> --data-file=- --project=yggdrasil-dev
# Supported keys: gemini-api-key, firebase-admin-private-key, firebase-admin-client-email,
#                 ga4-api-secret, stripe-secret-key, stripe-webhook-secret, stripe-publishable-key
secret_values = {}
