##############################################
# CertNode  S3 bucket for JWKS (private, KMS, versioned)
# File: infra/aws/terraform/10-s3-jwks.tf
##############################################

# -------- Locals --------------------------------------------------------------
locals {
  jwks_key     = ".well-known/certnode-jwks.json"
  manifest_key = ".well-known/manifest.json"

  # Bucket name must be globally unique; include account + region.
  bucket_name = lower("${local.name_prefix}-jwks-${data.aws_caller_identity.this.account_id}-${data.aws_region.this.name}")

  # Use AWS-managed KMS for S3 by default. (Safe, no extra key management)
  kms_key_id = "alias/aws/s3"
}

data "aws_caller_identity" "this" {}
data "aws_region" "this" {}

# -------- Bucket + security controls ------------------------------------------
resource "aws_s3_bucket" "jwks" {
  bucket              = local.bucket_name
  force_destroy       = false
  object_lock_enabled = true # enable WORM later via governance/retention if desired

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-jwks"
    Role = "jwks-store"
  })
}

# Enforce bucket-owner ownership (no ACLs necessary/allowed)
resource "aws_s3_bucket_ownership_controls" "jwks" {
  bucket = aws_s3_bucket.jwks.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "jwks" {
  bucket                  = aws_s3_bucket.jwks.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# Versioning (required for object lock & safe rotation)
resource "aws_s3_bucket_versioning" "jwks" {
  bucket = aws_s3_bucket.jwks.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Default encryption (KMS)
resource "aws_s3_bucket_server_side_encryption_configuration" "jwks" {
  bucket = aws_s3_bucket.jwks.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = local.kms_key_id
    }
    bucket_key_enabled = true
  }
}

# Keep previous JWKS/manifest versions for 90 days (tunable)
resource "aws_s3_bucket_lifecycle_configuration" "jwks" {
  bucket = aws_s3_bucket.jwks.id

  rule {
    id     = "retain-noncurrent-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# -------- Bucket policy --------------------------------------------------------
# - Deny non-TLS access.
# - Allow CloudFront (OAC) to GET only from this account's distributions (added in i11).
# - Allow ECS task role to PUT the exact JWKS + manifest objects only.
data "aws_iam_policy_document" "jwks" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_s3_bucket.jwks.arn,
      "${aws_s3_bucket.jwks.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Read for CloudFront OAC (distribution created in i11).
  # Restrict to our account's distributions; further tightening to a specific ID happens in i11.
  statement {
    sid    = "AllowCloudFrontReadJWKS"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    resources = [
      "${aws_s3_bucket.jwks.arn}/${local.jwks_key}",
      "${aws_s3_bucket.jwks.arn}/${local.manifest_key}"
    ]
    condition {
      test     = "ArnLike"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudfront::${data.aws_caller_identity.this.account_id}:distribution/*"]
    }
  }

  # Write permission for the ECS task role (created in i3).
  statement {
    sid    = "AllowEcsTaskToPublishJWKS"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectTagging"
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ecs_task.arn] # from i3
    }
    resources = [
      "${aws_s3_bucket.jwks.arn}/${local.jwks_key}",
      "${aws_s3_bucket.jwks.arn}/${local.manifest_key}"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}

resource "aws_s3_bucket_policy" "jwks" {
  bucket = aws_s3_bucket.jwks.id
  policy = data.aws_iam_policy_document.jwks.json

  depends_on = [
    aws_s3_bucket_public_access_block.jwks,
    aws_s3_bucket_ownership_controls.jwks
  ]
}

# -------- Helpful outputs for wiring (consumed by i11/i12/i14) ----------------
output "jwks_bucket_name" {
  value       = aws_s3_bucket.jwks.bucket
  description = "S3 bucket for JWKS + manifest"
}

output "jwks_object_key" {
  value       = local.jwks_key
  description = "Path of the JWKS object within the bucket"
}

output "jwks_manifest_key" {
  value       = local.manifest_key
  description = "Path of the manifest object within the bucket"
}
