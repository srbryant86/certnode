project     = "certnode"
environment = "staging"
region      = "us-east-1"
vpc_cidr    = "10.40.0.0/16"
nat_enabled = true

# DNS & certs
root_domain     = "certnode.io"      # change if you don't own this
api_domain      = "api.certnode.io"  # ALB  ECS API
jwks_domain     = "jwks.certnode.io" # CloudFront  S3 JWKS
enable_waf      = false              # true if you already have a WAF ACL ARN
waf_web_acl_arn = null               # set when enable_waf = true

# RDS
rds_instance_class       = "db.t4g.small"
rds_engine_version       = "16.3"
rds_allocated_storage_gb = 20
rds_multi_az             = true

# ECS
api_desired_count = 2
api_cpu           = 512
api_memory        = 1024

# JWKS S3/CF TTLs
jwks_min_ttl     = 0
jwks_default_ttl = 60
jwks_max_ttl     = 300
