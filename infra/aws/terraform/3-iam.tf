#############################################
# CertNode  IAM (ECS task & execution roles)
# File: infra/aws/terraform/3-iam.tf
#############################################

# Data sources (kept local for clarity; also defined in 00-data.tf)
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Inputs
variable "kms_signing_alias" {
  description = "KMS alias name (without 'alias/'); used for ES256 signing."
  type        = string
  default     = "certnode-es256"
  validation {
    condition     = !can(regex("^arn:", var.kms_signing_alias)) && !can(regex("^alias/", var.kms_signing_alias))
    error_message = "kms_signing_alias must be a bare alias name (e.g., 'certnode-es256'), not an ARN and not prefixed with 'alias/'."
  }
}

variable "ssm_parameter_prefix" {
  description = "SSM Parameter path prefix the task can read (e.g., '/certnode/dev/'). Leave trailing slash."
  type        = string
  default     = "/certnode/dev/"
  validation {
    condition     = can(regex("^/.+/.+$", var.ssm_parameter_prefix))
    error_message = "ssm_parameter_prefix must start and end with a slash, e.g., '/certnode/dev/'."
  }
}

variable "enable_ssm_read" {
  description = "Enable SSM GetParameter(s) for the configured prefix."
  type        = bool
  default     = true
}

variable "cw_log_group_base" {
  description = "CloudWatch Logs group base name used by the task/agent. We restrict CreateLogStream/PutLogEvents to this group."
  type        = string
  default     = "/aws/ecs/certnode-dev-api"
  validation {
    condition     = can(regex("^/aws/ecs/.+", var.cw_log_group_base))
    error_message = "cw_log_group_base should look like '/aws/ecs/<project>-<env>-api'."
  }
}

# Locals
locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )

  account_id   = data.aws_caller_identity.current.account_id
  partition    = data.aws_partition.current.partition
  region       = var.primary_region

  kms_sign_alias_arn = "arn:${local.partition}:kms:${local.region}:${local.account_id}:alias/${var.kms_signing_alias}"

  logs_group_arn         = "arn:${local.partition}:logs:${data.aws_region.current.name}:${local.account_id}:log-group:${var.cw_log_group_base}"
  logs_group_streams_arn = "${local.logs_group_arn}:log-stream:*"
}

# ECS task trust
data "aws_iam_policy_document" "ecs_tasks_trust" {
  statement {
    sid     = "ECSTasksAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: ECR pull + CW Logs write
data "aws_iam_policy_document" "exec_logs_ecr" {
  statement {
    sid     = "ECRPull"
    effect  = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = ["*"]
  }

  statement {
    sid     = "CWLogsWrite"
    effect  = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      local.logs_group_arn,
      local.logs_group_streams_arn
    ]
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name_prefix}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
  description        = "ECS execution role: ECR image pulls + CloudWatch Logs write"
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "ecs_task_execution_inline" {
  name   = "${local.name_prefix}-exec-logs-ecr"
  role   = aws_iam_role.ecs_task_execution.id
  policy = data.aws_iam_policy_document.exec_logs_ecr.json
}

# Task role: KMS ES256 Sign/GetPublicKey (+ optional SSM reads)
data "aws_iam_policy_document" "task_kms_sign" {
  statement {
    sid     = "KMSSignGetPubKeyES256"
    effect  = "Allow"
    actions = [
      "kms:GetPublicKey",
      "kms:Sign"
    ]
    resources = [local.kms_sign_alias_arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/${var.kms_signing_alias}"]
    }
    condition {
      test     = "StringEquals"
      variable = "kms:SigningAlgorithm"
      values   = ["ECDSA_SHA_256"]
    }
    condition {
      test     = "StringEquals"
      variable = "kms:MessageType"
      values   = ["RAW"]
    }
  }
}

data "aws_iam_policy_document" "task_ssm_read" {
  statement {
    sid     = "SSMReadPrefix"
    effect  = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = [
      "arn:${local.partition}:ssm:${data.aws_region.current.name}:${local.account_id}:parameter${var.ssm_parameter_prefix}*"
    ]
  }
}

data "aws_iam_policy_document" "task_combined" {
  source_policy_documents = compact([
    data.aws_iam_policy_document.task_kms_sign.json,
    var.enable_ssm_read ? data.aws_iam_policy_document.task_ssm_read.json : null
  ])
}

resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
  description        = "ECS task role: KMS ES256 Sign/GetPublicKey (+ optional SSM prefix reads)"
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "ecs_task_inline" {
  name   = "${local.name_prefix}-task-kms-ssm"
  role   = aws_iam_role.ecs_task.id
  policy = data.aws_iam_policy_document.task_combined.json
}

# Outputs
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role (ECR/Logs)."
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role (KMS signing, SSM reads)."
  value       = aws_iam_role.ecs_task.arn
}