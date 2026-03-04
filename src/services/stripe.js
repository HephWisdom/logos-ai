import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createCheckoutSession(plan, userId, email) {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, userId, email }),
  });
  const { sessionId } = await res.json();
  const stripe = await stripePromise;
  await stripe.redirectToCheckout({ sessionId });
}

export async function createPortalSession(customerId) {
  const res = await fetch('/api/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
