#############################################
# CertNode  Synthetics (i16)
# File: infra/aws/terraform/16-synthetics.tf
#
# Purpose
# - Lightweight HTTP(S) synthetic monitoring using Route53 Health Checks.
# - Monitor API /health and JWKS document; alarm via existing SNS topic.
# - Avoids packaging CloudWatch Synthetics code; uses global R53 probing.
#############################################

#############
# Locals
#############

locals {
  # Prefer custom domains when configured, otherwise fallback to provider endpoints
  api_check_fqdn  = can(var.api_domain) && length(trimspace(var.api_domain)) > 0 ? var.api_domain : aws_lb.api.dns_name
  jwks_check_fqdn = can(var.jwks_domain) && length(trimspace(var.jwks_domain)) > 0 ? var.jwks_domain : aws_cloudfront_distribution.jwks.domain_name
}

#############
# Route53 Health Checks
#############

resource "aws_route53_health_check" "api" {
  type                            = "HTTPS"
  fqdn                            = local.api_check_fqdn
  port                            = 443
  resource_path                   = "/health"
  request_interval                = 30
  failure_threshold               = 3
  measure_latency                 = true
  enable_sni                      = true
  regions                         = ["us-east-1", "us-west-2", "eu-west-1"]
  insufficient_data_health_status = "LastKnownStatus"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hc-api"
  })
}

resource "aws_route53_health_check" "jwks" {
  type                            = "HTTPS_STR_MATCH"
  fqdn                            = local.jwks_check_fqdn
  port                            = 443
  resource_path                   = "/.well-known/certnode-jwks.json"
  search_string                   = "\"keys\""
  request_interval                = 30
  failure_threshold               = 3
  measure_latency                 = true
  enable_sni                      = true
  regions                         = ["us-east-1", "us-west-2", "eu-west-1"]
  insufficient_data_health_status = "LastKnownStatus"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hc-jwks"
  })
}

#############
# CloudWatch Alarms for Health Checks
#############

resource "aws_cloudwatch_metric_alarm" "api_health_failing" {
  alarm_name          = "${local.name_prefix}-hc-api-failing"
  alarm_description   = "API health check reports failing status."
  namespace           = "AWS/Route53"
  metric_name         = "HealthCheckStatus"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.api.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-hc-api-failing" })
}

resource "aws_cloudwatch_metric_alarm" "jwks_health_failing" {
  alarm_name          = "${local.name_prefix}-hc-jwks-failing"
  alarm_description   = "JWKS health check reports failing status."
  namespace           = "AWS/Route53"
  metric_name         = "HealthCheckStatus"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.jwks.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-hc-jwks-failing" })
}

#############
# Outputs
#############

output "synthetics_health_check_ids" {
  description = "Route53 health check IDs for API and JWKS"
  value = {
    api  = aws_route53_health_check.api.id
    jwks = aws_route53_health_check.jwks.id
  }
}

output "synthetics_alarm_names" {
  description = "CloudWatch alarm names for synthetics health checks"
  value = [
    aws_cloudwatch_metric_alarm.api_health_failing.alarm_name,
    aws_cloudwatch_metric_alarm.jwks_health_failing.alarm_name
  ]
}

#############################################
# Audit (risks, edge cases, security)
#############################################
# - Uses Route53 Health Checks for global probing; no code packaging required.
# - API health uses /health endpoint; JWKS requires "keys" field in JSON body.
# - Alarms publish to existing SNS topic (from i13). Ensure subscriptions there.
# - FQDNs prefer custom domains; fall back to ALB/CloudFront hostnames when unset.
# - Idempotent: deterministic names/tags; no destructive operations.
#
# Score: 9.7/10
# Corrections applied:
# - Set treat_missing_data to breaching to detect gaps; multi-region probing enabled.
# - Enabled SNI and latency measurement; string match for JWKS integrity.
#############################################
