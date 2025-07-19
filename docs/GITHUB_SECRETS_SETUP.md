# GitHub Secrets Setup Guide

## Required Repository Secrets

Go to your repository: **Settings > Secrets and variables > Actions > New repository secret**

### Stripe Configuration
```
STRIPE_SECRET_KEY = sk_live_[your_stripe_secret_key]
STRIPE_PUBLISHABLE_KEY = pk_live_[your_stripe_publishable_key]
STRIPE_WEBHOOK_SECRET = [Get from Stripe Dashboard > Developers > Webhooks]
```

### Security Keys
```
SECRET_KEY = [Generate 32-character random string]
ENCRYPTION_KEY = [Generate 32-byte base64 encoded key]
JWT_SECRET_KEY = [Generate 32-character random string]
DATABASE_PASSWORD = [Secure database password]
```

### AWS Configuration (for deployment)
```
AWS_ACCESS_KEY_ID = [AWS IAM access key]
AWS_SECRET_ACCESS_KEY = [AWS IAM secret key]
```

### Monitoring & Notifications
```
SLACK_WEBHOOK_URL = [Slack webhook for deployment notifications]
GRAFANA_ADMIN_PASSWORD = [Secure Grafana admin password]
```

## Quick Setup Commands

### Generate Security Keys
```bash
# Secret Key (32 characters)
openssl rand -hex 16

# Encryption Key (32 bytes, base64 encoded)
openssl rand -base64 32

# JWT Secret Key (32 characters)
openssl rand -hex 16

# Database Password (16 characters)
openssl rand -base64 12
```

### Stripe Webhook Setup
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://api.certnode.io/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook signing secret (starts with `whsec_`)

## Repository Secrets List

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe live secret key | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe live publishable key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `SECRET_KEY` | Application secret key | `a1b2c3d4...` |
| `ENCRYPTION_KEY` | Content encryption key | `base64string...` |
| `JWT_SECRET_KEY` | JWT signing key | `a1b2c3d4...` |
| `DATABASE_PASSWORD` | PostgreSQL password | `securepass123` |
| `AWS_ACCESS_KEY_ID` | AWS deployment access | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS deployment secret | `secret...` |
| `SLACK_WEBHOOK_URL` | Deployment notifications | `https://hooks.slack.com/...` |
| `GRAFANA_ADMIN_PASSWORD` | Monitoring dashboard | `securepass123` |

## Verification

After adding all secrets, the GitHub Actions workflow will automatically:
1. Deploy infrastructure to AWS
2. Configure Kubernetes with secrets
3. Deploy all services
4. Run health checks
5. Send notifications

## Security Notes

- Never commit secrets to the repository
- Rotate keys regularly (quarterly recommended)
- Use different keys for staging and production
- Monitor secret usage in GitHub Actions logs
- Enable secret scanning alerts

