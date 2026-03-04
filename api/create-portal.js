import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) {
    return res.status(500).json({ error: 'Missing server environment configuration' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/settings`,
  });
  res.json({ url: session.url });
}
