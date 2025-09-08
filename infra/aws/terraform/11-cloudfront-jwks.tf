############################################
# CertNode  CloudFront for JWKS (via S3/OAC)
# File: infra/aws/terraform/11-cloudfront-jwks.tf
############################################

###########
# Inputs
###########

# Public hostname to serve JWKS from (may be enabled later once a cert is issued in us-east-1).
variable "jwks_domain" {
  description = "FQDN for JWKS (e.g., jwks.certnode.io). Used as an alias when enable_alias is true."
  type        = string
  default     = "jwks.certnode.io"
}

# Name of the existing private S3 bucket that holds /.well-known/certnode-jwks.json
# (created in 10-s3-jwks.tf). We data-source it for origin settings.
variable "jwks_bucket_name" {
  description = "Name of the S3 bucket that stores the JWKS object."
  type        = string
  default     = "certnode-jwks" # safe default; override if your bucket uses a different name
}

# OAC created for the JWKS bucket in 10-s3-jwks.tf.
variable "jwks_oac_id" {
  description = "CloudFront Origin Access Control ID bound to the JWKS S3 bucket."
  type        = string
  default     = "" # override with module/output from 10-s3-jwks
}

# When false (default), the distribution is created without aliases and uses the default CF certificate.
# When true, you must also provide acm_certificate_arn (in us-east-1) so the alias can be attached.
variable "enable_alias" {
  description = "Attach jwks_domain as a CloudFront alias. Requires a valid ACM cert in us-east-1."
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ARN of an ISSUED ACM certificate in us-east-1 for jwks_domain. Required if enable_alias=true."
  type        = string
  default     = null
}

variable "jwks_cache_ttl_seconds" {
  description = "Default cache TTL for the JWKS (seconds). Keep short to allow swift rotations."
  type        = number
  default     = 60
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

###########
# Locals
###########

locals {
  # Use stable, restricted headers and short caching for JWKS
  merged_tags = merge(
    {
      Service = "certnode-jwks"
      Managed = "terraform"
    },
    local.common_tags
  )

  # Sanity booleans
  alias_enabled = var.enable_alias && var.acm_certificate_arn != null && length(var.acm_certificate_arn) > 0
}

###########
# Data lookups
###########

data "aws_s3_bucket" "jwks" {
  bucket = var.jwks_bucket_name
}

###########
# Policies (cache + headers)
###########

# Cache policy for JWKS: GET/HEAD/OPTIONS only, tiny TTLs, no cookies/queries considered.
resource "aws_cloudfront_cache_policy" "jwks" {
  name        = "${local.name_prefix}-jwks-cache"
  comment     = "Tight cache policy for JWKS; short TTL; no cookies/queries."
  default_ttl = var.jwks_cache_ttl_seconds
  max_ttl     = max(var.jwks_cache_ttl_seconds, 300)
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }

  # tags not supported on this resource in current provider
}

# Security headers appropriate for a JSON/.well-known asset.
resource "aws_cloudfront_response_headers_policy" "jwks_security" {
  name    = "${local.name_prefix}-jwks-headers"
  comment = "Strict headers for JWKS delivery."

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "no-referrer"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 63072000 # 2 years, preload-ready
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "()"
      override = true
    }
    items {
      header   = "Cross-Origin-Resource-Policy"
      value    = "same-site"
      override = true
    }
    items {
      header   = "Cache-Control"
      value    = "public, max-age=${var.jwks_cache_ttl_seconds}"
      override = true
    }
  }

  # tags not supported on this resource in current provider
}

###########
# CloudFront Distribution
###########

resource "aws_cloudfront_distribution" "jwks" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CertNode JWKS via CloudFront (S3 + OAC)."
  price_class         = var.price_class
  default_root_object = "" # not used; target specific object via client

  # If alias is enabled and a cert is supplied, set the alias. Otherwise keep empty.
  aliases = local.alias_enabled ? [var.jwks_domain] : []

  origin {
    origin_id                = "s3-jwks"
    domain_name              = data.aws_s3_bucket.jwks.bucket_regional_domain_name
    origin_access_control_id = var.jwks_oac_id
    # S3 + OAC uses the origin shield defaults (none). No origin custom headers required.
  }

  default_cache_behavior {
    target_origin_id       = "s3-jwks"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    cache_policy_id            = aws_cloudfront_cache_policy.jwks.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.jwks_security.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use the default CF cert unless caller has provided a valid us-east-1 ACM cert.
  viewer_certificate {
    acm_certificate_arn            = local.alias_enabled ? var.acm_certificate_arn : null
    ssl_support_method             = local.alias_enabled ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = local.alias_enabled ? false : true
  }

  # Logging can be added later; keep minimal and private by default.
  wait_for_deployment = false

  tags = local.merged_tags
}

###########
# Helpful Outputs
###########

output "cloudfront_jwks_distribution_id" {
  description = "ID of the CloudFront distribution serving JWKS."
  value       = aws_cloudfront_distribution.jwks.id
}

output "cloudfront_jwks_domain_name" {
  description = "Domain name of the CloudFront distribution (useful when alias is disabled)."
  value       = aws_cloudfront_distribution.jwks.domain_name
}

output "cloudfront_jwks_alias" {
  description = "Alias configured for JWKS (empty if alias disabled)."
  value       = local.alias_enabled ? var.jwks_domain : ""
}

output "cloudfront_jwks_url_example" {
  description = "Example HTTPS URL for the JWKS document."
  value       = local.alias_enabled ? format("https://%s/.well-known/certnode-jwks.json", var.jwks_domain) : format("https://%s/.well-known/certnode-jwks.json", aws_cloudfront_distribution.jwks.domain_name)
}

output "jwks_cache_policy_id" {
  description = "Cache policy ID used for JWKS."
  value       = aws_cloudfront_cache_policy.jwks.id
}

output "jwks_headers_policy_id" {
  description = "Response headers policy ID used for JWKS."
  value       = aws_cloudfront_response_headers_policy.jwks_security.id
}
