package main

deny[msg] {
  input.resource.type == "aws_s3_bucket"
  not input.resource.values.versioning.enabled
  msg := "S3 bucket must enable versioning"
}

deny[msg] {
  input.resource.type == "aws_s3_bucket_public_access_block"
  input.resource.values.block_public_acls == false
  msg := "S3 public ACLs must be blocked"
}

deny[msg] {
  input.resource.type == "aws_iam_policy"
  some s
  upper(input.resource.values.policy) == "*"
  msg := "Wildcard IAM not allowed"
}

