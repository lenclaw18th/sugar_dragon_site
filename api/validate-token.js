import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { t } = req.query;
  if (!t) {
    return res.status(400).json({ valid: false, error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(t, process.env.JWT_SECRET);
    return res.status(200).json({
      valid: true,
      titleId: payload.titleId,
    });
  } catch (err) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
}
