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

    // Call your existing billing API
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://certnode.io/api/checkout'
      : 'http://localhost:3000/api/checkout';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: mappedTier,
        email,
        success_url: `${request.headers.get('origin')}/pricing?success=true`,
        cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Billing API error:', error);
      return Response.json({ error: 'Checkout creation failed' }, { status: 500 });
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}