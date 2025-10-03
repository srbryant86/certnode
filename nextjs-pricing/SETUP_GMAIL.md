# Using Google Workspace for Email Notifications

Since you already pay for Google Workspace, use Gmail SMTP instead of Resend.

## Setup Instructions

### 1. Create an App Password in Google Workspace

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select **Mail** and **Other (Custom name)**
5. Enter "CertNode Sales Agent"
6. Click **Generate**
7. Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

### 2. Install Nodemailer

```bash
cd nextjs-pricing
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 3. Update Environment Variables

Add to Vercel (or `.env.local` for local dev):

```
GMAIL_USER=contact@certnode.io
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

(Remove spaces from the app password)

### 4. Update `app/api/sales-lead/route.ts`

Replace the Resend implementation with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

export async function POST(request: NextRequest) {
  // ... existing code ...

  // Send email via Gmail
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"CertNode AI Agent" <${process.env.GMAIL_USER}>`,
        to: 'contact@certnode.io',
        replyTo: email,
        subject: `🎯 New Lead: ${company || name} - ${recommendedTier || 'Tier TBD'}`,
        html: emailHtml,
      });

      console.log('Email sent successfully via Gmail');
    } catch (emailError) {
      console.error('Error sending email via Gmail:', emailError);
    }
  } else {
    console.log('Email notification skipped - Gmail not configured');
  }

  // ... rest of code ...
}
```

## Benefits of Using Google Workspace

✅ **No additional cost** - you already pay for it
✅ **Higher deliverability** - emails from your own domain
✅ **Professional sender** - `contact@certnode.io` instead of `onboarding@resend.dev`
✅ **No usage limits** - Google Workspace has generous email quotas
✅ **Centralized management** - all emails in your Gmail/Workspace account

## Gmail Sending Limits

- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day per user
- More than enough for sales lead notifications

## Alternative: Gmail API (More Complex, Higher Limits)

For even higher sending limits, you can use the Gmail API instead of SMTP:

1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Use `googleapis` npm package

But for sales lead notifications, SMTP is perfectly sufficient.
