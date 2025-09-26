export async function POST(request: Request) {
  try {
    const { tier, email } = await request.json();

    // Map Next.js pricing tiers to your API
    const tierMap: { [key: string]: string } = {
      'starter': 'starter',
      'professional': 'pro',
      'business': 'business'
    };

    const mappedTier = tierMap[tier];
    if (!mappedTier) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Determine billing API base URL
    const host = request.headers.get('host') || '';
    const isLocal = host.includes('localhost');
    const defaultBase = isLocal ? 'http://localhost:3000' : `https://${host}`;
    const billingBase = (process.env.BILLING_API_BASE_URL || defaultBase).replace(/\/$/, '');
    const apiUrl = `${billingBase}/api/create-checkout`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: mappedTier,
        email,
        success_url: `${request.headers.get('origin') || defaultBase}/pricing?success=true`,
        cancel_url: `${request.headers.get('origin') || defaultBase}/pricing?canceled=true`
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Billing API error:', error);
      return Response.json({ error: 'Checkout creation failed' }, { status: 500 });
    }

    const data = await response.json();
    const normalized = {
      ...data,
      url: data.url || data.checkout_url || data.payment_link || null,
    };

    return Response.json(normalized);

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
