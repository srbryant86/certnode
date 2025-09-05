###############################
# CertNode  Terraform Vars
# File: infra/aws/terraform/1-variables.tf
###############################

# Regional controls
variable "primary_region" {
  description = "Primary AWS region used by most resources."
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d+$", var.primary_region))
    error_message = "primary_region must look like us-east-1, eu-west-1, etc."
  }
}

# Compatibility shim: legacy references (kept to avoid breaking early files)
variable "aws_region" {
  description = "Deprecated alias for primary region; prefer primary_region."
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d+$", var.aws_region))
    error_message = "aws_region must look like us-east-1, eu-west-1, etc."
  }
}

# CloudFront/ACM must be us-east-1; expose explicitly for clarity.
variable "cloudfront_region" {
  description = "Region used for CloudFront/ACM/WAF artifacts (must be us-east-1)."
  type        = string
  default     = "us-east-1"
  validation {
    condition     = var.cloudfront_region == "us-east-1"
    error_message = "cloudfront_region must be us-east-1."
  }
}

# Naming & environment
variable "project" {
  description = "Short, DNS-safe project slug used in names/tags."
  type        = string
  default     = "certnode"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,20}$", var.project))
    error_message = "project must be 321 chars, lowercase alnum + hyphens, starting with a letter."
  }
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

# Global tagging
variable "additional_tags" {
  description = "Extra tags merged into all resources."
  type        = map(string)
  default     = {}
}

# VPC layout
variable "az_count" {
  description = "How many AZs to use (23 recommended)."
  type        = number
  default     = 3
  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "az_count must be 2 or 3."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.20.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR."
  }
}

variable "enable_nat_per_az" {
  description = "Create one NAT Gateway per AZ (true) or a single shared NAT (false)."
  type        = bool
  default     = true
}

# Common naming & deterministic tags (extend as needed)
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
}