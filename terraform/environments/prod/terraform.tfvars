project_id = "yggdrasil-prod"
region     = "us-central1"

# Secret values for the prod environment.
# Leave values empty to create the secret shell in Terraform, then add the version later:
#   printf "%s" "<value>" | gcloud secrets versions add <name> --data-file=- --project=yggdrasil-prod
# Supported keys: gemini-api-key, firebase-admin-private-key, firebase-admin-client-email,
#                 ga4-api-secret, stripe-secret-key, stripe-webhook-secret, stripe-publishable-key
secret_values = {}
