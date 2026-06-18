const DEFAULT_ASIN = '1066676003';
const DEFAULT_UK_URL = `https://www.amazon.co.uk/dp/${DEFAULT_ASIN}`;

const COUNTRY_MARKETPLACES = {
  AU: 'www.amazon.com.au',
  BE: 'www.amazon.com.be',
  BR: 'www.amazon.com.br',
  CA: 'www.amazon.ca',
  CN: 'www.amazon.cn',
  DE: 'www.amazon.de',
  EG: 'www.amazon.eg',
  ES: 'www.amazon.es',
  FR: 'www.amazon.fr',
  GB: 'www.amazon.co.uk',
  IE: 'www.amazon.ie',
  IN: 'www.amazon.in',
  IT: 'www.amazon.it',
  JP: 'www.amazon.co.jp',
  MX: 'www.amazon.com.mx',
  NL: 'www.amazon.nl',
  PL: 'www.amazon.pl',
  SA: 'www.amazon.sa',
  SE: 'www.amazon.se',
  SG: 'www.amazon.sg',
  TR: 'www.amazon.com.tr',
  US: 'www.amazon.com',
};

function firstHeaderValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function visitorCountry(req) {
  const country =
    firstHeaderValue(req.headers['x-vercel-ip-country']) ||
    firstHeaderValue(req.headers['cf-ipcountry']) ||
    '';

  return country.toUpperCase();
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const asin = process.env.AMAZON_BOOK_ASIN || DEFAULT_ASIN;
  const ukUrl = process.env.AMAZON_BOOK_UK_URL || DEFAULT_UK_URL;
  const marketplace = COUNTRY_MARKETPLACES[visitorCountry(req)];
  const destination = marketplace
    ? `https://${marketplace}/dp/${encodeURIComponent(asin)}`
    : ukUrl;

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'x-vercel-ip-country, cf-ipcountry');
  return res.redirect(307, destination);
}
