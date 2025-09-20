#!/usr/bin/env bash
set -euo pipefail
echo "===> Terraform fmt/validate/tflint/tfsec"
pushd infra/aws/terraform >/dev/null || exit 1
terraform fmt -recursive
terraform validate
command -v tflint >/dev/null && tflint || true
command -v tfsec  >/dev/null && tfsec --no-color || true
popd >/dev/null

echo "===> API lint/test"
pushd api >/dev/null || exit 1
if [ -f package.json ]; then
  npm ci
  npx eslint .
  npm test --silent
fi
popd >/dev/null

echo "===> Web check"
test -f web/openapi.json
test -f web/index.html
echo "✅ Lint/checks completed"