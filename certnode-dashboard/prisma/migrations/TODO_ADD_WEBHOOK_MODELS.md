# Webhook Models - Database Schema Addition

**Status:** NOT YET APPLIED - Add these models to `schema.prisma`

## Required Models

Add these two models to `prisma/schema.prisma`:

```prisma
model Webhook {
  id           String   @id @default(cuid())
  enterpriseId String
  enterprise   Enterprise @relation(fields: [enterpriseId], references: [id], onDelete: Cascade)

  url          String   // Webhook URL to call
  secret       String   // HMAC secret for signatures
  events       String[] // Events to subscribe to: receipt.created, fraud.detected, etc.
  enabled      Boolean  @default(true)

  description  String?  // Optional description

  deliveries   WebhookDelivery[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([enterpriseId])
  @@index([enabled])
  @@map("webhooks")
}

model WebhookDelivery {
  id           String   @id @default(cuid())
  webhookId    String
  webhook      Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  event        String   // Event type that triggered this
  payload      Json     // The webhook payload sent

  success      Boolean  // Was delivery successful?
  statusCode   Int?     // HTTP status code
  responseBody String?  // Response from webhook URL
  error        String?  // Error message if failed

  attemptNumber Int     // Retry attempt number (1-3)
  deliveredAt   DateTime

  createdAt    DateTime @default(now())

  @@index([webhookId])
  @@index([event])
  @@index([success])
  @@index([deliveredAt])
  @@map("webhook_deliveries")
}
```

## To Apply Migration

```bash
# 1. Add the models above to schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_webhook_models

# 3. Generate Prisma client
npx prisma generate
```

## After Migration

The webhook service (`lib/webhooks/webhook-service.ts`) will work once these models are added.

## Webhook Events

Supported events:
- `receipt.created` - New receipt generated
- `receipt.verified` - Verification completed
- `fraud.detected` - Fraud score above threshold
- `content.flagged` - AI content detected
- `compliance.alert` - Compliance threshold exceeded
- `graph.linked` - Receipt added to graph
