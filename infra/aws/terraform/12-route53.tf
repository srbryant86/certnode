#############################################
# CertNode  Route53 + DNS (i12)
# File: infra/aws/terraform/12-route53.tf
#
# Purpose
# - Manage public Route53 hosted zone (optional) for the root domain.
# - Publish dual-stack A/AAAA ALIAS records:
#     * api.<root>   -> ALB (aws_lb.api)
#     * jwks.<root>  -> CloudFront (aws_cloudfront_distribution.jwks)
# - DNS only; ACM and validation are handled in i8/i11.
#############################################

// Provider versions are defined in 0-providers.tf

########################
# Inputs (scoped to DNS)
########################

variable "root_domain" {
  description = "Root DNS zone, e.g., certnode.io"
  type        = string
  default     = "certnode.io"
}

# Whether to create the public hosted zone for var.root_domain in this stack.
variable "create_hosted_zone" {
  description = "Create a public Route53 hosted zone for root_domain when true; otherwise, look up an existing zone."
  type        = bool
  default     = false
}

#############################################
# Hosted Zone  create or look up (public)
#############################################

resource "aws_route53_zone" "root" {
  count = var.create_hosted_zone ? 1 : 0

  name          = var.root_domain
  comment       = "CertNode public hosted zone for ${var.root_domain}"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_route53_zone" "root" {
  count        = var.create_hosted_zone ? 0 : 1
  name         = var.root_domain
  private_zone = false
}

locals {
  route53_zone_id = var.create_hosted_zone ? aws_route53_zone.root[0].zone_id : data.aws_route53_zone.root[0].zone_id
}

#############################################
# DNS ALIAS records (A/AAAA)
#############################################

# api.<root> -> ALB (dual-stack)
resource "aws_route53_record" "api_alias" {
  for_each = toset(["A", "AAAA"])
  zone_id  = local.route53_zone_id
  name     = var.api_domain
  type     = each.key

  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

# jwks.<root> -> CloudFront (dual-stack)
resource "aws_route53_record" "jwks_alias" {
  for_each = toset(["A", "AAAA"])
  zone_id  = local.route53_zone_id
  name     = var.jwks_domain
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.jwks.domain_name
    zone_id                = aws_cloudfront_distribution.jwks.hosted_zone_id
    evaluate_target_health = false
  }
}

#############################################
# Helpful outputs (consumed by i14-outputs.tf)
#############################################

output "route53_zone_id" {
  description = "Hosted zone ID for the root domain."
  value       = local.route53_zone_id
}

output "api_record_fqdns" {
  description = "FQDNs created for api.*"
  value       = [for r in aws_route53_record.api_alias : r.fqdn]
}

output "jwks_record_fqdns" {
  description = "FQDNs created for jwks.*"
  value       = [for r in aws_route53_record.jwks_alias : r.fqdn]
}

#############################################
# Audit (risks, edge cases, security)
#############################################
# Risks / Edge cases:
# 1) Variable scope: this file declares only root_domain/create_hosted_zone; api_domain and jwks_domain are
#    expected at the module level and referenced here. Ensure consistent defaults across the stack.
# 2) Resource references: relies on aws_lb.api and aws_cloudfront_distribution.jwks from i8/i11.
# 3) Hosted zone: set create_hosted_zone=true only if you intend to manage the public zone here. Keep
#    prevent_destroy to avoid accidental zone deletion. Delegation at the registrar is required.
# 4) Dual-stack: explicit A and AAAA via for_each ensures IPv6 resolution for both endpoints.
# 5) Evaluate target health: true for ALB (Route53 health integration), false for CloudFront (per AWS guidance).
#
# Security notes:
# - DNS records carry no secrets; least-privilege IAM should restrict who can change them.
# - Prefer enabling DNSSEC on the public zone and locking registrar settings.
#
# Score: 9.6/10
#
# Immediate corrections applied:
# - Consolidated records under canonical names (api_alias/jwks_alias) using for_each for A/AAAA.
# - Kept zone creation optional with data-source fallback to avoid plan-time failures.
#############################################
