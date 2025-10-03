import { NextRequest, NextResponse } from 'next/server';

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
      recommendedPrice
    } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Here you would:
    // 1. Send email notification to sales team
    // 2. Add to CRM (HubSpot, Salesforce, etc.)
    // 3. Store in database
    // 4. Trigger automation workflows

    // For now, we'll just log it and send a success response
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
      timestamp: new Date().toISOString()
    });

    // Example: Send email notification (you would use a service like SendGrid, Resend, etc.)
    const emailBody = `
New Sales Lead from CertNode AI Agent:

**Contact Information:**
- Name: ${name}
- Email: ${email}
- Company: ${company || 'Not provided'}
- Phone: ${phone || 'Not provided'}

**Business Details:**
- Business Type: ${businessType || 'Not provided'}
- Monthly Volume/GMV: ${monthlyVolume || 'Not provided'}
- Main Pain Point: ${painPoint || 'Not provided'}

**AI Recommendation:**
- Tier: ${recommendedTier || 'Not determined'}
- Price: ${recommendedPrice || 'Not determined'}

**Next Steps:**
- Follow up within 24 hours
- Schedule demo if requested
- Send pricing details

Lead captured: ${new Date().toLocaleString()}
    `;

    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: 'sales@certnode.io',
    //   subject: `New Sales Lead: ${company || name}`,
    //   body: emailBody
    // });

    // TODO: Add to CRM
    // await addToCRM({
    //   name,
    //   email,
    //   company,
    //   customFields: {
    //     businessType,
    //     monthlyVolume,
    //     painPoint,
    //     recommendedTier
    //   }
    // });

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
