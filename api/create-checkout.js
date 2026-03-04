import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro:     process.env.STRIPE_PRO_PRICE_ID,
  scholar: process.env.STRIPE_SCHOLAR_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { plan, userId, email } = req.body;
  if (!plan || !PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) {
    return res.status(500).json({ error: 'Missing server environment configuration' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.APP_URL}/settings?upgraded=true`,
      cancel_url:  `${process.env.APP_URL}/settings`,
      metadata: { userId, plan },
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
