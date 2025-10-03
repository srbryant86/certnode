import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessType,
      monthlyVolume,
      painPoint,
      company,
      name,
      email,
      phone,
      recommendedTier,
      recommendedPrice,
      receipts
    } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Log the lead
    console.log('New sales lead captured:', {
      businessType,
      monthlyVolume,
      painPoint,
      company,
      name,
      email,
      phone,
      recommendedTier,
      recommendedPrice,
      receipts,
      timestamp: new Date().toISOString()
    });

    // Send email notification to sales team
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .label { font-weight: bold; color: #1f2937; }
    .value { color: #4b5563; margin-bottom: 10px; }
    .recommendation { background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🎯 New Sales Lead from AI Agent</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Captured ${new Date().toLocaleString()}</p>
    </div>

    <div class="content">
      <div class="section">
        <h2 style="margin-top: 0; color: #2563eb;">📞 Contact Information</h2>
        <div class="value"><span class="label">Name:</span> ${name}</div>
        <div class="value"><span class="label">Email:</span> <a href="mailto:${email}">${email}</a></div>
        <div class="value"><span class="label">Company:</span> ${company || '<em>Not provided</em>'}</div>
        <div class="value"><span class="label">Phone:</span> ${phone || '<em>Not provided</em>'}</div>
      </div>

      <div class="section">
        <h2 style="margin-top: 0; color: #7c3aed;">💼 Business Details</h2>
        <div class="value"><span class="label">Business Type:</span> ${businessType || '<em>Not provided</em>'}</div>
        <div class="value"><span class="label">Monthly Volume/GMV:</span> ${monthlyVolume || '<em>Not provided</em>'}</div>
        <div class="value"><span class="label">Main Pain Point:</span> ${painPoint || '<em>Not provided</em>'}</div>
        ${receipts ? `<div class="value"><span class="label">Estimated Receipts/Month:</span> ${receipts.toLocaleString()}</div>` : ''}
      </div>

      <div class="section">
        <h2 style="margin-top: 0; color: #10b981;">🤖 AI Recommendation</h2>
        <div class="recommendation">
          <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
            ${recommendedTier || 'Not determined'}
          </div>
          <div style="font-size: 16px; color: #2563eb; font-weight: bold;">
            ${recommendedPrice || 'Not determined'}
          </div>
        </div>
      </div>

      <div class="section">
        <h2 style="margin-top: 0; color: #f59e0b;">✅ Next Steps</h2>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Follow up within 24 hours</li>
          <li>Schedule demo if requested</li>
          <li>Send detailed pricing breakdown</li>
          <li>Add to CRM system</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">CertNode AI Sales Assistant</p>
      <p style="margin: 5px 0 0 0; font-size: 12px;">Automated lead qualification and routing</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'CertNode AI Agent <onboarding@resend.dev>', // Will need to update with verified domain
        to: ['contact@certnode.io'],
        subject: `🎯 New Lead: ${company || name} - ${recommendedTier || 'Tier TBD'}`,
        html: emailHtml,
        replyTo: email
      });

      console.log('Email sent successfully to contact@certnode.io');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully'
    });

  } catch (error) {
    console.error('Error processing sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to process lead' },
      { status: 500 }
    );
  }
}
