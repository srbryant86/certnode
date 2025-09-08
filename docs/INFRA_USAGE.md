# CertNode Infrastructure Scripts Usage

## Prerequisites
- AWS IAM role configured for OIDC (GitHub Actions) and/or a local AWS profile.
- S3 bucket and DynamoDB table for Terraform remote state.
- Record handy defaults in git config:

```
git config certnode.aws.region us-east-1
git config certnode.tfstate.bucket certnode-tfstate-dev
git config certnode.tfstate.table  certnode-tflock
```

## 1) Preflight (tools + AWS)
```
./scripts/preflight.ps1 -Env staging -Profile certnode-dev
```

## 2) Apply (remote state)
```
./scripts/tf-apply.ps1 -Env staging -Profile certnode-dev
```

## 3) Smoke tests (DNS/TLS/JWKS)
```
./scripts/smoke-infra.ps1 -Env staging
```

## Ephemeral stacks
```
./scripts/tf-ephemeral.ps1 -Name pr-123 -Profile certnode-dev
```

Environment variables used by CI
- `AWS_IAM_ROLE_ARN`: OIDC deploy role ARN
- `TF_STATE_BUCKET`: S3 state bucket name
- `TF_STATE_TABLE`: DynamoDB lock table name

