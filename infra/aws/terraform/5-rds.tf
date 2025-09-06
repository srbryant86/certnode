#############################################
# CertNode  RDS (PostgreSQL)  private, encrypted, least-priv
# File: infra/aws/terraform/5-rds.tf
#############################################

# Minimal knobs (override if discovery doesn't match your environment)
variable "vpc_id" {
  description = "VPC ID hosting the DB. Leave empty to discover by tags (Project/Environment)."
  type        = string
  default     = ""
}
variable "db_subnet_ids" {
  description = "Private subnet IDs for the DB subnet group. Leave empty to discover by tags."
  type        = list(string)
  default     = []
}
variable "allow_sg_ids" {
  description = "Security group IDs that may connect to the DB port."
  type        = list(string)
  default     = []
}

locals {
  rds_identifier          = "${local.name_prefix}-db"
  rds_engine              = "postgres"
  rds_engine_version      = "16.3" # pin a stable minor in your region
  rds_instance_class      = "db.t4g.small"
  rds_allocated_storage   = 20
  rds_max_allocated_gb    = 100
  rds_backup_retention    = 7
  rds_multi_az            = false
  rds_deletion_protect    = false
  rds_publicly_accessible = false
}

# --- Discover VPC/Subnets by tags (fallbacks) ---
data "aws_vpcs" "project" {
  filter {
    name   = "tag:Project"
    values = [var.project]
  }
  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }
}
# Expect "Tier=private" on private subnets from VPC module
data "aws_subnets" "private" {
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
    values = ["private"]
  }
}

locals {
  effective_vpc_id     = var.vpc_id != "" ? var.vpc_id : (length(data.aws_vpcs.project.ids) > 0 ? tolist(data.aws_vpcs.project.ids)[0] : "")
  effective_subnet_ids = length(var.db_subnet_ids) > 0 ? var.db_subnet_ids : data.aws_subnets.private.ids
}

# --- KMS CMK dedicated to RDS/PI ---
resource "aws_kms_key" "db" {
  description             = "${local.name_prefix} RDS CMK"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}-kms-db" })
}
resource "aws_kms_alias" "db" {
  name          = "alias/${local.name_prefix}-db"
  target_key_id = aws_kms_key.db.id
}

# --- Networking: subnet group + SG ---
resource "aws_db_subnet_group" "db" {
  name       = "${local.rds_identifier}-subnets"
  subnet_ids = local.effective_subnet_ids
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-db-subnets" })
}

resource "aws_security_group" "db" {
  name        = "${local.name_prefix}-rds"
  description = "RDS access (${local.name_prefix})"
  vpc_id      = local.effective_vpc_id
  tags        = merge(local.common_tags, { Name = "${local.name_prefix}-rds" })
}

# Allow from explicit SGs only (optional; add ECS/service SG IDs via var)
resource "aws_vpc_security_group_ingress_rule" "allow_from_sgs" {
  for_each                     = toset(var.allow_sg_ids)
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "Allow Postgres from ${each.value}"
}

# Egress open (instances initiate outbound to S3/logging endpoints, etc.)
resource "aws_vpc_security_group_egress_rule" "egress_all" {
  security_group_id = aws_security_group.db.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Allow all egress"
}

# Parameter group (adjust as needed)
resource "aws_db_parameter_group" "pg" {
  name        = "${local.name_prefix}-pg16"
  family      = "postgres16"
  description = "PG params for ${local.name_prefix}"
  # example:
  # parameter { name = "rds.force_ssl" value = "1" apply_method = "pending-reboot" }
  tags = local.common_tags
}

# Optional generated password if you don't pass one via variables (kept out of git)
resource "random_password" "master" {
  length  = 20
  special = false
}

# --- RDS Instance ---
resource "aws_db_instance" "db" {
  identifier     = local.rds_identifier
  engine         = local.rds_engine
  engine_version = local.rds_engine_version
  instance_class = local.rds_instance_class

  username = "appuser"
  password = random_password.master.result

  allocated_storage     = local.rds_allocated_storage
  max_allocated_storage = local.rds_max_allocated_gb
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.db.arn

  db_subnet_group_name       = aws_db_subnet_group.db.name
  vpc_security_group_ids     = [aws_security_group.db.id]
  parameter_group_name       = aws_db_parameter_group.pg.name
  publicly_accessible        = local.rds_publicly_accessible
  multi_az                   = local.rds_multi_az
  deletion_protection        = local.rds_deletion_protect
  backup_retention_period    = local.rds_backup_retention
  copy_tags_to_snapshot      = true
  auto_minor_version_upgrade = true
  apply_immediately          = true # safe for create; consider false in prod

  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.db.arn

  skip_final_snapshot = true # dev-friendly; set false + snapshot id in prod
  tags                = local.common_tags
}

# --- Outputs ---
output "rds_endpoint" {
  description = "RDS endpoint hostname"
  value       = aws_db_instance.db.address
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.db.port
}

output "rds_security_group_id" {
  description = "RDS SG ID"
  value       = aws_security_group.db.id
}

output "rds_subnet_group" {
  description = "Subnet group name"
  value       = aws_db_subnet_group.db.name
}
