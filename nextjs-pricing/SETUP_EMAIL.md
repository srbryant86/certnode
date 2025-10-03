# Email Notification Setup for AI Sales Agent

The AI Sales Agent sends email notifications to `contact@certnode.io` when a lead is captured.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "CertNode Sales Agent"
4. Select "Sending access"
5. Copy the API key (starts with `re_`)

### 3. Add API Key to Environment Variables

**For local development:**
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` and add your API key:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

**For Vercel deployment:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - Key: `RESEND_API_KEY`
   - Value: Your Resend API key
   - Environment: Production, Preview, Development (select all)
4. Redeploy your application

### 4. (Optional) Set Up Custom Domain

By default, emails are sent from `onboarding@resend.dev`. To use your own domain:

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `certnode.io`
4. Add the DNS records shown to your domain registrar
5. Wait for verification (usually a few minutes)
6. Update the `from` field in `app/api/sales-lead/route.ts`:
   ```typescript
   from: 'CertNode AI Agent <sales@certnode.io>',
   ```

### 5. Test the Integration

1. Open your deployed site
2. Click the floating chat widget
3. Go through the conversation flow
4. Provide your email, name, and company
5. Check `contact@certnode.io` for the notification email

## Email Template

The notification email includes:
- **Contact Information**: Name, email, company, phone
- **Business Details**: Business type, monthly volume, pain point, estimated receipts
- **AI Recommendation**: Recommended tier and pricing
- **Next Steps**: Follow-up checklist

The email is formatted with HTML and styled for easy reading.

## Free Tier Limits

Resend's free tier includes:
- 3,000 emails per month
- 100 emails per day
- No credit card required

This should be more than sufficient for sales lead notifications.

## Troubleshooting

**Emails not sending?**
- Check that `RESEND_API_KEY` is set in your environment
- View Vercel logs to see any error messages
- Verify your API key is active in Resend dashboard
- Check Resend's [Emails](https://resend.com/emails) page to see delivery status

**Need help?**
- [Resend Documentation](https://resend.com/docs)
- [Next.js + Resend Guide](https://resend.com/docs/send-with-nextjs)
