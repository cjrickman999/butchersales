const axios = require('axios');

/*
 * krogerFetcher.js
 *
 * This module provides helper functions for interacting with Kroger's public
 * product catalog API.  It encapsulates the OAuth2 token flow and exposes a
 * simple search function that returns normalized product data.  Real pricing
 * requires a valid OAuth2 client_id and client_secret, which you must
 * provision from the Kroger Developer Portal.
 *
 * Environment variables:
 *   KROGER_CLIENT_ID       – your Kroger client identifier
 *   KROGER_CLIENT_SECRET   – your Kroger client secret
 *   KROGER_SCOPE           – optional scope; defaults to "product.compact"
 */

const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const KROGER_SCOPE = process.env.KROGER_SCOPE || 'product.compact';

// OAuth2 token endpoint for service‑to‑service authentication.  See
// https://developer.kroger.com for up‑to‑date details.
const TOKEN_ENDPOINT = 'https://api.kroger.com/v1/connect/oauth2/token';
// Base URL for the Products API.
const API_BASE_URL = 'https://api.kroger.com/v1';

/**
 * Request an access token using the client credentials grant.
 *
 * @returns {Promise<string>} A promise that resolves to a bearer token.
 */
async function getAccessToken() {
  if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
    throw new Error('KROGER_CLIENT_ID and KROGER_CLIENT_SECRET must be set');
  }

  // Kroger expects form‑encoded parameters and basic auth credentials.
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: KROGER_SCOPE,
  });

  const response = await axios.post(TOKEN_ENDPOINT, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: KROGER_CLIENT_ID,
      password: KROGER_CLIENT_SECRET,
    },
  });

  return response.data.access_token;
}

/**
 * Search Kroger's product catalog.
 *
 * @param {string} term        The search term (e.g. "ribeye steak").
 * @param {string} locationId  The store/location identifier.  You can obtain
 *                             location IDs via Kroger's Locations API.  If
 *                             omitted, pricing information may not be
 *                             returned.
 * @param {number} limit       Optional limit on the number of returned items.
 * @returns {Promise<Array>}   A promise that resolves to a list of normalized
 *                             product objects with name, size, price and
 *                             promoPrice fields.
 */
async function searchProducts(term, locationId, limit = 10) {
  if (!term) {
    throw new Error('search term is required');
  }

  const token = await getAccessToken();

  // Build query parameters according to the Products API specification.
  const params = {
    'filter.term': term,
    'filter.locationId': locationId,
    'filter.limit': limit,
  };

  const response = await axios.get(`${API_BASE_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });

  const products = response.data.data || [];
  return products.map((product) => {
    const item = product.items && product.items[0];
    const priceInfo = (item && item.price) || {};
    return {
      name: product.description || product.productDescription?.description || '',
      size: item?.size || '',
      price: priceInfo.regular || null,
      promoPrice: priceInfo.promo || null,
      currency: priceInfo.currency || 'USD',
    };
  });
}

module.exports = {
  searchProducts,
};