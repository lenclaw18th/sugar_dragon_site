export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const formId = process.env.KIT_FORM_ID;
  const waitlistTagId = process.env.KIT_TAG_WAITLIST;

  try {
    const subscribeRes = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.KIT_API_KEY,
          email,
        }),
      }
    );

    if (!subscribeRes.ok) {
      throw new Error(`Kit subscribe failed: ${subscribeRes.status}`);
    }

    await fetch(
      `https://api.convertkit.com/v3/tags/${waitlistTagId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.KIT_API_KEY,
          email,
        }),
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist signup error:', err.message);
    return res.status(500).json({ error: 'Could not add to waitlist' });
  }
}
