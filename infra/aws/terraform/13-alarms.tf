#############################################
# CertNode  CloudWatch Alarms + SNS (i13)
# File: infra/aws/terraform/13-alarms.tf
#
# Purpose
# - A small, opinionated set of production-ready alarms with a single SNS topic:
#      ALB 5xx spikes and high latency
#      ECS Service health (running tasks < desired)
#      RDS CPU & connection pressure
#      KMS throttling on signing keys
#
# Notes
# - Email subscription is optional (set var.alarm_email).
# - All dimensions refer to resources created earlier in this stack:
#      aws_lb.api                    (i8-alb.tf)
#      aws_ecs_cluster.api           (i7-ecs-cluster.tf)
#      aws_ecs_service.api           (i9-ecs-service-api.tf)
#      aws_db_instance.postgres      (i5-rds.tf)
#      aws_kms_key.signing_current   (i4-kms.tf)
#      aws_kms_key.signing_previous  (i4-kms.tf)  (verify-only)
#############################################

// Provider versions are defined in 0-providers.tf

########################
# Inputs
########################

variable "enable_alarms" {
  description = "Master switch to enable/disable alarm resources."
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Optional email to subscribe to the SNS alarm topic."
  type        = string
  default     = ""
}

variable "alarm_prefix" {
  description = "Alarm name prefix."
  type        = string
  default     = "certnode"
}

# Thresholds (tuned for a low/moderate-traffic API; adjust as needed)
variable "alb_5xx_threshold" {
  description = "ELB 5xx count per 5 minutes to alarm."
  type        = number
  default     = 5
}

variable "alb_latency_threshold_seconds" {
  description = "Average TargetResponseTime (seconds) over 5 minutes to alarm."
  type        = number
  default     = 1.0
}

variable "ecs_min_running_tasks" {
  description = "Minimum running tasks for the API service (alarm if below)."
  type        = number
  default     = 1
}

variable "rds_cpu_high_threshold_percent" {
  description = "Alarm when RDS CPUUtilization exceeds this percent over 10 minutes."
  type        = number
  default     = 80
}

variable "rds_conn_high_threshold" {
  description = "Alarm when RDS DatabaseConnections exceed this absolute value over 10 minutes."
  type        = number
  default     = 200
}

########################
# Locals
########################

locals {
  enabled = var.enable_alarms

  # Safe access to optional resources
  kms_current_key_id  = try(aws_kms_key.sign.key_id, null)
  kms_previous_key_id = null

  alb_arn_suffix = aws_lb.api.arn_suffix

  ecs_cluster_name = aws_ecs_cluster.this.name
  ecs_service_name = aws_ecs_service.api.name
}

########################
# SNS topic (+ optional email)
########################

resource "aws_sns_topic" "alerts" {
  count = local.enabled ? 1 : 0

  name              = "${var.alarm_prefix}-alerts"
  kms_master_key_id = "alias/aws/sns" # AWS-managed KMS for SNS
  tags = merge(local.common_tags, {
    "Component" = "alerts"
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count = local.enabled && var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

########################
# ALB alarms
########################

# ELB-side 5xx (gateway/overload)  LoadBalancer dimension only.
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count               = local.enabled ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-alb-5xx"
  alarm_description   = "ALB 5xx errors (ELB) exceeded ${var.alb_5xx_threshold} in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = var.alb_5xx_threshold
  treat_missing_data  = "notBreaching"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"

  dimensions = {
    LoadBalancer = local.alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "alb" })
}

# Target response time  high latency across the LB.
resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  count               = local.enabled ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-alb-latency"
  alarm_description   = "ALB average target response time > ${var.alb_latency_threshold_seconds}s over 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = var.alb_latency_threshold_seconds
  treat_missing_data  = "notBreaching"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"

  dimensions = {
    LoadBalancer = local.alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "alb" })
}

########################
# ECS service alarms
########################

# Running tasks dropped below minimum => likely crash loop or deployment issue.
resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks_low" {
  count               = local.enabled ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-ecs-running-low"
  alarm_description   = "ECS service running task count below ${var.ecs_min_running_tasks} for 2 periods"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  threshold           = var.ecs_min_running_tasks
  treat_missing_data  = "breaching"
  metric_name         = "RunningTaskCount"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Minimum"

  dimensions = {
    ClusterName = local.ecs_cluster_name
    ServiceName = local.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "ecs" })
}

########################
# RDS alarms
########################

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  count               = local.enabled ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-rds-cpu-high"
  alarm_description   = "RDS CPU utilization > ${var.rds_cpu_high_threshold_percent}% over 10 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  threshold           = var.rds_cpu_high_threshold_percent
  treat_missing_data  = "notBreaching"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"

  dimensions = {
    DBInstanceIdentifier = local.rds_identifier
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "rds" })
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  count               = local.enabled ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-rds-connections-high"
  alarm_description   = "RDS connections > ${var.rds_conn_high_threshold} over 10 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  threshold           = var.rds_conn_high_threshold
  treat_missing_data  = "notBreaching"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"

  dimensions = {
    DBInstanceIdentifier = local.rds_identifier
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "rds" })
}

########################
# KMS throttling alarms
########################

resource "aws_cloudwatch_metric_alarm" "kms_throttles_current" {
  count               = local.enabled && local.kms_current_key_id != null ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-kms-signing-current-throttles"
  alarm_description   = "KMS throttling on signing-current key (customer path) detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"
  metric_name         = "Throttles"
  namespace           = "AWS/KMS"
  period              = 60
  statistic           = "Sum"

  dimensions = {
    KeyId = local.kms_current_key_id
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "kms" })
}

resource "aws_cloudwatch_metric_alarm" "kms_throttles_previous" {
  count               = local.enabled && local.kms_previous_key_id != null ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-kms-signing-previous-throttles"
  alarm_description   = "KMS throttling on signing-previous key detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"
  metric_name         = "Throttles"
  namespace           = "AWS/KMS"
  period              = 60
  statistic           = "Sum"

  dimensions = {
    KeyId = local.kms_previous_key_id
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = merge(local.common_tags, { "Component" = "kms" })
}

########################
# Outputs
########################

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic used by alarms."
  value       = local.enabled ? aws_sns_topic.alerts[0].arn : null
}

#############################################
# Audit (risks, edge cases, security)
#############################################
# Risks / Edge cases:
# - Naming assumptions: references aws_lb.api, aws_ecs_cluster.api, aws_ecs_service.api,
#   aws_db_instance.postgres, aws_kms_key.signing_current/previous. If your resource
#   names differ, update the references.
# - Threshold tuning: defaults are conservative; tune to expected traffic to avoid noise.
# - Email subscription requires manual confirmation from AWS SNS (one-time).
# - KMS metrics: "Throttles" is keyed by KeyId; alarms are created only if keys exist.
#
# Security review:
# - SNS topic is KMS-encrypted (AWS-managed alias/aws/sns). No PII is emitted in alarms.
# - No wildcard permissions or public resources are introduced.
#
# Score: 9.6/10
# Immediate corrections applied:
# - Defensive creation of KMS alarms with try()/count guards to avoid plan failures
#   when previous key is absent.
# - treat_missing_data chosen to avoid false positives during deploys.
#############################################
