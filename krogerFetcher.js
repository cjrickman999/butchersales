const axios = require('axios');
require('dotenv').config();

/**
 * Obtain an OAuth2 token from Kroger using client‑credentials.
 */
async function getToken() {
  const resp = await axios.post(
    'https://api.kroger.com/v1/connect/oauth2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KROGER_CLIENT_ID,
      client_secret: process.env.KROGER_CLIENT_SECRET,
      scope: process.env.KROGER_SCOPE || 'product.compact location.compact',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return resp.data.access_token;
}

/**
 * Search Kroger products by keyword and optional locationId.
 */
async function searchProducts(keyword, locationId, limit = 5) {
  if (!keyword) throw new Error('Keyword is required');
  const token = await getToken();
  const resp = await axios.get('https://api.kroger.com/v1/products', {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      'filter.term': keyword,
      'filter.locationId': locationId,
      limit,
    },
  });
  return resp.data.data.map(p => ({
    locationId: p.locationId,
    name: p.description,
    upc: p.items[0]?.upc,
    size: p.items[0]?.size,
    price: p.items[0]?.price.regular,
    promoPrice: p.items[0]?.price.promo || null,
    currency: p.items[0]?.price.currency,
  }));
}

/**
 * Fetch a list of Kroger store locations for a given ZIP code.
 */
async function getLocations(zip) {
  if (!zip) throw new Error('ZIP code is required');
  const token = await getToken();
  const resp = await axios.get(
    'https://api.kroger.com/v1/locations',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: { 'filter.zipCode': zip },
    }
  );
  return resp.data.data.map(loc => ({
    locationId: loc.locationId,
    name: loc.name,
    address: loc.address,
    distance: loc.distance,
  }));
}

module.exports = {
  getToken,
  searchProducts,
  getLocations,
};
