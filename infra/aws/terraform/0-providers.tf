#############################################
# CertNode  Core Terraform & Providers
# File: infra/aws/terraform/0-providers.tf
#############################################

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# Use locals so we can evolve vars without touching provider blocks.
locals {
  # Prefer primary_region when set; fall back to aws_region for compatibility.
  _primary_region    = coalesce(try(var.primary_region, null), var.aws_region)
  _cloudfront_region = coalesce(try(var.cloudfront_region, null), "us-east-1")
}

# Default AWS provider anchored to the primary region.
provider "aws" {
  region = local._primary_region
  default_tags {
    tags = merge(local.common_tags, var.additional_tags)
  }
}

# Dedicated us-east-1 alias (ACM/CloudFront/WAF live here).
provider "aws" {
  alias  = "us_east_1"
  region = local._cloudfront_region
  default_tags {
    tags = merge(local.common_tags, var.additional_tags)
  }
}

# ------------------- REMOTE STATE (COMMENTED) -------------------
# Migrate to S3 backend when ready (kept commented for clean bootstrap):
# 1) Create S3 bucket + DynamoDB lock table.
# 2) Uncomment and run: terraform -chdir=infra/aws/terraform init -migrate-state
#
# terraform {
#   backend "s3" {
#     bucket         = "certnode-tfstate-prod"
#     key            = "aws/infra/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "certnode-tf-locks"
#     encrypt        = true
#   }
# }
# ---------------------------------------------------------------
