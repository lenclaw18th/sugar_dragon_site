import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function subscribeToKit(email, readerUrl, pdfUrl) {
  const formId = process.env.KIT_FORM_ID;
  const buyerTagId = process.env.KIT_TAG_BUYER;

  const subscribeRes = await fetch(
    `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.KIT_API_KEY,
        email,
        fields: {
          reader_url: readerUrl,
          pdf_url: pdfUrl,
        },
      }),
    }
  );

  if (!subscribeRes.ok) {
    throw new Error(`Kit subscribe failed: ${subscribeRes.status}`);
  }

  await fetch(
    `https://api.convertkit.com/v3/tags/${buyerTagId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.KIT_API_KEY,
        email,
      }),
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email =
      session.customer_details?.email || session.customer_email;
    const titleId = session.metadata?.titleId || 'book1';

    if (!email) {
      console.error('No email on session:', session.id);
      return res.status(200).json({ received: true });
    }

    const token = jwt.sign(
      { email, titleId },
      process.env.JWT_SECRET,
      { expiresIn: '3y' }
    );

    const siteUrl = process.env.SITE_URL;
    const readerUrl = `${siteUrl}/read/${titleId}?t=${token}`;
    const pdfUrl = `${siteUrl}/api/download-pdf?t=${token}`;

    try {
      await subscribeToKit(email, readerUrl, pdfUrl);
    } catch (err) {
      console.error('Kit subscription error:', err.message);
    }
  }

  return res.status(200).json({ received: true });
}
