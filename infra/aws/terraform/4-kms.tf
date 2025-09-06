#############################################
# CertNode  KMS (Signing)  ECC NIST P-256
# File: infra/aws/terraform/4-kms.tf
#############################################

locals {
  kms_sign_alias = "alias/${local.name_prefix}-sign"
  kms_sign_name  = "${local.name_prefix}-kms-sign"
  kms_admin_root = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
}

data "aws_iam_policy_document" "kms_signing" {
  statement {
    sid = "AllowRootAdmin"
    principals {
      type        = "AWS"
      identifiers = [local.kms_admin_root]
    }
    actions = [
      "kms:Create*", "kms:Describe*", "kms:Enable*", "kms:List*", "kms:Put*", "kms:Update*",
      "kms:Revoke*", "kms:Disable*", "kms:Get*", "kms:Delete*",
      "kms:TagResource", "kms:UntagResource", "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion"
    ]
    resources = ["*"]
  }

  statement {
    sid = "AllowEcsTaskToSign"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ecs_task.arn]
    }
    actions   = ["kms:Sign", "kms:GetPublicKey", "kms:DescribeKey"]
    resources = ["*"]
  }

  statement {
    sid = "AllowEcsExecutionToReadPublicKey"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ecs_task_execution.arn]
    }
    actions   = ["kms:GetPublicKey", "kms:DescribeKey"]
    resources = ["*"]
  }
}

resource "aws_kms_key" "sign" {
  description = "CertNode signing key (ECC NIST P-256) for ECDSA signatures"
  key_usage   = "SIGN_VERIFY"
  key_spec    = "ECC_NIST_P256"

  policy = data.aws_iam_policy_document.kms_signing.json

  enable_key_rotation = false
  multi_region        = false

  tags = merge(
    local.common_tags,
    { "Name" = "${local.name_prefix}-kms-sign" },
    var.additional_tags
  )
}

resource "aws_kms_alias" "sign" {
  name          = "alias/${local.name_prefix}-sign"
  target_key_id = aws_kms_key.sign.key_id
}

output "kms_sign_key_id" {
  description = "Key ID of the signing CMK"
  value       = aws_kms_key.sign.key_id
}

output "kms_sign_key_arn" {
  description = "ARN of the signing CMK"
  value       = aws_kms_key.sign.arn
}

output "kms_sign_alias_arn" {
  description = "ARN of the signing CMK alias"
  value       = aws_kms_alias.sign.arn
}
