import jwt from 'jsonwebtoken';

const PDF_URLS = {
  book1: process.env.BOOK1_PDF_URL,
};

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { t } = req.query;
  if (!t) {
    return res
      .status(401)
      .setHeader('Content-Type', 'text/html')
      .send(errorPage('No access token. Please use the link from your purchase email.'));
  }

  let payload;
  try {
    payload = jwt.verify(t, process.env.JWT_SECRET);
  } catch (err) {
    return res
      .status(401)
      .setHeader('Content-Type', 'text/html')
      .send(errorPage('Your download link has expired or is invalid. Please check your purchase email.'));
  }

  const pdfUrl = PDF_URLS[payload.titleId];
  if (!pdfUrl) {
    return res.status(404).end();
  }

  return res.redirect(302, pdfUrl);
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download unavailable</title>
  <style>
    body { font-family: Nunito, sans-serif; background: #FFF8E7; color: #3D1A2A;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; padding: 1rem; text-align: center; }
    h1 { font-family: Georgia, serif; font-size: 1.5rem; margin-bottom: 1rem; }
    a { color: #C23060; }
  </style>
</head>
<body>
  <div>
    <h1>Download unavailable</h1>
    <p>${message}</p>
    <p><a href="/">Visit sugardragonbooks.com</a></p>
  </div>
</body>
</html>`;
}
