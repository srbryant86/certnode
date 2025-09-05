#############################################
# CertNode  Terraform Data Sources
# File: infra/aws/terraform/00-data.tf
#############################################

data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

