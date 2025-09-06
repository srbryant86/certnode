#############################################
# CertNode  IAM for ECS tasks & execution
# File: infra/aws/terraform/3-iam.tf
#############################################

// Providers are defined centrally in 0-providers.tf.

# Inputs (KMS is optional now; 4-kms.tf will supply the key or alias later)
variable "kms_sign_key_arn" {
  description = "KMS key ARN used for ES256 signing; leave empty until 4-kms.tf creates it."
  type        = string
  default     = ""
}

// Use module-level locals: name_prefix/common_tags exist in 1-variables.tf.
locals {
  tags = merge(local.common_tags, var.additional_tags)
}

# ---------- Execution role (ECR pull + CloudWatch Logs) ----------
data "aws_iam_policy_document" "ecs_execution_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${local.name_prefix}-task-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_execution_trust.json
  tags               = local.tags
}

# Minimal ECR+Logs needed by the ECS **execution** role
data "aws_iam_policy_document" "ecs_execution_min" {
  statement {
    sid    = "ECRPull"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecs_execution_min" {
  name   = "${local.name_prefix}-ecs-exec-min"
  policy = data.aws_iam_policy_document.ecs_execution_min.json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_min" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_execution_min.arn
}

# ---------- Task role (app-level AWS access; tight by default) ----------
data "aws_iam_policy_document" "ecs_task_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_trust.json
  tags               = local.tags
}

# Least-privilege defaults:
# - Allow read-only SSM Parameter Store (namespaced under /${project}/${environment}/*)
# - (Optional) Allow KMS GetPublicKey + Sign on a specific key if kms_sign_key_arn is provided.
data "aws_iam_policy_document" "ecs_task_base" {
  statement {
    sid    = "SSMReadScoped"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
      "ssm:DescribeParameters"
    ]
    resources = [
      "arn:aws:ssm:${var.primary_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*"
    ]
  }
}

# Optional KMS permissions (added only if kms_sign_key_arn != "")
data "aws_iam_policy_document" "kms_sign" {
  count = length(var.kms_sign_key_arn) > 0 ? 1 : 0

  statement {
    sid       = "KMSPublicKey"
    effect    = "Allow"
    actions   = ["kms:GetPublicKey"]
    resources = [var.kms_sign_key_arn]
  }

  statement {
    sid       = "KMSSignOnly"
    effect    = "Allow"
    actions   = ["kms:Sign"]
    resources = [var.kms_sign_key_arn]

    # ES256 constraints (ECDSA w/ SHA-256) and disallow raw material
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:SigningAlgorithm"
      values   = ["ECDSA_SHA_256"]
    }
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}

# Merge base + optional KMS into one policy document
data "aws_iam_policy_document" "ecs_task_combined" {
  source_json = data.aws_iam_policy_document.ecs_task_base.json

  dynamic "statement" {
    for_each = length(var.kms_sign_key_arn) > 0 ? toset(["kms"]) : toset([])
    content {
      sid       = "KMSSignAttach"
      effect    = "Allow"
      actions   = ["kms:GetPublicKey", "kms:Sign"]
      resources = [var.kms_sign_key_arn]
      condition {
        test     = "ForAnyValue:StringEquals"
        variable = "kms:SigningAlgorithm"
        values   = ["ECDSA_SHA_256"]
      }
    }
  }
}

resource "aws_iam_policy" "ecs_task_combined" {
  name   = "${local.name_prefix}-task-min"
  policy = data.aws_iam_policy_document.ecs_task_combined.json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_min" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_task_combined.arn
}

# ---------- Outputs ----------
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role (ECR/Logs)."
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role (SSM read; optional KMS Sign/GetPublicKey)."
  value       = aws_iam_role.ecs_task.arn
}
