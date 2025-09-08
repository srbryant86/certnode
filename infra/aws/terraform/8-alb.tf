#############################################
# CertNode  Application Load Balancer (ALB)
# File: infra/aws/terraform/8-alb.tf
#
# Hardened ALB for ECS/Fargate API service:
# - Public ALB in public subnets
# - Target group (IP type) for Fargate tasks
# - Health check on /health
# - HTTP(80) -> HTTPS(443) redirect when cert is provided
# - Conditional 443 listener (TLS 1.2/1.3 strong policy)
# - Optional WAFv2 association (REGIONAL)
# - Drop invalid headers, deletion protection
# - Dual-stack (IPv4/IPv6), HTTP/2 enabled
#
# This file is self-contained: variables required here are defined below.
# It relies on "locals.name_prefix" and "locals.common_tags" from 1-variables.tf.
#############################################

########################
# Required Inputs
########################

# VPC where the ALB and target group live.
# Note: vpc_id is already defined in 5-rds.tf; reuse that input here.

# Public subnets for the ALB (must be in at least two AZs).
variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB."
  type        = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "Provide at least two public subnets in distinct AZs."
  }
}

# Optional: ACM certificate ARN in the ALB's region. If empty, only HTTP:80 forward is created.
variable "api_acm_certificate_arn" {
  description = "ACM certificate ARN for api.<domain>. If empty, HTTPS listener is not created and HTTP:80 forwards to target group."
  type        = string
  default     = ""
}

# Optional: for tagging / clarity only.
variable "api_domain" {
  description = "API domain name (tagging/documentation)."
  type        = string
  default     = "api.certnode.io"
  validation {
    condition     = can(regex("^[a-z0-9.-]+$", var.api_domain))
    error_message = "api_domain must be a valid DNS-like string."
  }
}

# Optional: associate an existing WAFv2 Web ACL (REGIONAL) to the ALB.
variable "enable_waf" {
  description = "If true and waf_web_acl_arn is set, associate WAFv2 Web ACL with ALB."
  type        = bool
  default     = true
}

variable "waf_web_acl_arn" {
  description = "WAFv2 Web ACL ARN (REGIONAL). Leave empty to skip association."
  type        = string
  default     = ""
}

# Optional: ALB access logs (S3). If bucket not provided, access logs are disabled.
variable "alb_logs_s3_bucket" {
  description = "S3 bucket name for ALB access logs (must have proper policy). Leave empty to disable."
  type        = string
  default     = ""
}

variable "alb_logs_s3_prefix" {
  description = "S3 prefix for ALB access logs."
  type        = string
  default     = "alb/"
}

########################
# Security Group
########################

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "ALB security group"
  vpc_id      = var.vpc_id

  # Ingress 80 (HTTP)  world
  ingress {
    description      = "HTTP from anywhere (redirect to HTTPS if cert is present)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  # Ingress 443 (HTTPS)  world
  ingress {
    description      = "HTTPS from anywhere"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  # Egress  anywhere (to targets)
  egress {
    description      = "Egress to targets / Internet as needed"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-alb-sg"
    Component = "alb"
    Domain    = var.api_domain
    Terraform = "true"
  })
}

########################
# Discover Public Subnets (by tags) and choose inputs
########################

# If callers don't pass public_subnet_ids, fall back to tag discovery.
data "aws_subnets" "public" {
  filter {
    name   = "tag:Project"
    values = [var.project]
  }
  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }
  filter {
    name   = "tag:Tier"
    values = ["public"]
  }
}

locals {
  effective_public_subnet_ids = length(var.public_subnet_ids) > 0 ? var.public_subnet_ids : data.aws_subnets.public.ids
}

########################
# Load Balancer
########################

resource "aws_lb" "api" {
  name                       = substr("${local.name_prefix}-alb", 0, 32) # ALB names are limited
  load_balancer_type         = "application"
  internal                   = false
  ip_address_type            = "dualstack"
  security_groups            = [aws_security_group.alb.id]
  subnets                    = local.effective_public_subnet_ids
  idle_timeout               = 60
  enable_deletion_protection = true
  drop_invalid_header_fields = true
  enable_http2               = true

  dynamic "access_logs" {
    for_each = length(var.alb_logs_s3_bucket) > 0 ? [1] : []
    content {
      bucket  = var.alb_logs_s3_bucket
      prefix  = var.alb_logs_s3_prefix
      enabled = true
    }
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-alb"
    Component = "alb"
    Domain    = var.api_domain
  })
}

########################
# Target Group (for ECS Fargate IP targets)
########################

resource "aws_lb_target_group" "api" {
  name        = substr("${local.name_prefix}-tg", 0, 32)
  vpc_id      = var.vpc_id
  protocol    = "HTTP"
  port        = 80
  target_type = "ip" # Fargate requires IP target type

  deregistration_delay = 10
  slow_start           = 0
  stickiness {
    type            = "lb_cookie"
    enabled         = false
    cookie_duration = 60
  }

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/health"
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-tg"
    Component = "alb"
  })
}

########################
# Listeners
########################

# HTTP :80  redirect to HTTPS when a certificate is provided.
resource "aws_lb_listener" "http_redirect" {
  count             = length(var.api_acm_certificate_arn) > 0 ? 1 : 0
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-l-http-redirect" })
}

# HTTP :80  forward directly (only when HTTPS is not configured yet).
resource "aws_lb_listener" "http_forward" {
  count             = length(var.api_acm_certificate_arn) == 0 ? 1 : 0
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-l-http-forward" })
}

# HTTPS :443  forward to API target group (created only if ACM cert provided).
resource "aws_lb_listener" "https" {
  count             = length(var.api_acm_certificate_arn) > 0 ? 1 : 0
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.api_acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-l-https" })
}

########################
# Optional: WAF Association (REGIONAL)
########################

resource "aws_wafv2_web_acl_association" "alb" {
  count        = (var.enable_waf && length(var.waf_web_acl_arn) > 0) ? 1 : 0
  resource_arn = aws_lb.api.arn
  web_acl_arn  = var.waf_web_acl_arn
}
