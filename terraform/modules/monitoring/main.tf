resource "google_monitoring_notification_channel" "email" {
  count        = var.alert_email != "" ? 1 : 0
  display_name = "Yggdrasil Alerts"
  type         = "email"
  project      = var.project_id

  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_service" "cloud_run" {
  service_id = "yggdrasil-web"
  project    = var.project_id

  basic_service {
    service_labels = {
      service_name = var.service_name
      location     = var.region
    }
    service_type = "CLOUD_RUN"
  }
}

resource "google_monitoring_slo" "availability" {
  service      = google_monitoring_service.cloud_run.service_id
  slo_id       = "${var.service_name}-availability"
  display_name = "Availability SLO"
  project      = var.project_id

  goal                = var.slo_availability_target
  rolling_period_days = 30

  basic_sli {
    availability {
      enabled = true
    }
  }
}

resource "google_monitoring_slo" "latency" {
  service      = google_monitoring_service.cloud_run.service_id
  slo_id       = "${var.service_name}-latency-p99"
  display_name = "Latency P99 SLO"
  project      = var.project_id

  goal                = 0.99
  rolling_period_days = 30

  basic_sli {
    latency {
      enabled   = true
      threshold = "${var.slo_latency_target_seconds}s"
    }
  }
}

resource "google_monitoring_alert_policy" "slo_burn_fast" {
  display_name = "SLO Burn Rate - Fast (1h)"
  combiner     = "OR"
  project      = var.project_id

  conditions {
    display_name = "Fast burn rate > 2% error budget in 1h"
    condition_monitoring_query_language {
      query = <<-EOT
        fetch cloud_run_revision
        | metric 'run.googleapis.com/request_count'
        | filter resource.service_name == '${var.service_name}'
        | align rate(1m)
        | every 1m
        | group_by [resource.service_name], [total: sum(val)]
      EOT
      duration = "600s"
    }
  }

  notification_channels = var.alert_email != "" ? [
    google_monitoring_notification_channel.email[0].name,
  ] : []

  alert_strategy {
    auto_close = "172800s"
  }
}

resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "Error Rate > 1%"
  combiner     = "OR"
  project      = var.project_id

  conditions {
    display_name = "5xx error rate exceeds 1%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.service_name}\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.service_name"]
      }
    }
  }

  notification_channels = var.alert_email != "" ? [
    google_monitoring_notification_channel.email[0].name,
  ] : []
}

resource "google_monitoring_uptime_check_config" "health" {
  display_name = "Yggdrasil Health Check"
  timeout      = "10s"
  period       = "60s"
  project      = var.project_id

  http_check {
    path         = "/api/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host     = "${var.service_name}.run.app"
      project_id = var.project_id
    }
  }

  selected_regions = ["USA", "EUROPE", "ASIA_PACIFIC"]
}

output "service_id" {
  value = google_monitoring_service.cloud_run.service_id
}

output "slo_availability_id" {
  value = google_monitoring_slo.availability.slo_id
}

output "slo_latency_id" {
  value = google_monitoring_slo.latency.slo_id
}
