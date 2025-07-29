const axios = require('axios');
const qs = require('querystring');

/*
 * walmartFetcher.js
 *
 * This module implements helpers for interacting with Walmart's
 * Pricing and Availability Realtime API. Walmart requires a two‑step
 * authentication process:
 *   1. Obtain an OAuth token using the client credentials grant.  The
 *      token endpoint is documented in Walmart’s I/O portal and
 *      requires your consumer ID (client_id) and client secret.  See
 *      the `OAuth Token` section of the docs for details【751545410025271†screenshot】.
 *   2. Call the price‑availability endpoint with a list of offerIds
 *      (one per product), optionally passing a zipCode or storeId.
 *
 * You must supply the following environment variables in order to
 * authenticate:
 *   WALMART_CONSUMER_ID   – your “wm_consumer.id” (client_id)
 *   WALMART_CLIENT_SECRET – your IAM‑generated secret
 *   WALMART_OFFER_ID_MAP  – optional JSON string mapping product
 *                           search terms to Walmart offerIds
 *
 * If `WALMART_OFFER_ID_MAP` is not provided or a given item has no
 * mapping, the fetcher will return an empty result.  You should
 * populate this mapping once you know the offerIds for the meat
 * products you plan to compare.  See README for more.
 */

const {
  WALMART_CONSUMER_ID,
  WALMART_CLIENT_SECRET,
  WALMART_OFFER_ID_MAP,
} = process.env;

// Base URL for Walmart's API proxy service
const API_BASE = 'https://developer.api.walmart.com/api-proxy/service';

/**
 * Parses the WALMART_OFFER_ID_MAP environment variable into a simple
 * mapping from lowercase product names to arrays of offerIds.
 */
function parseOfferIdMap() {
  try {
    return WALMART_OFFER_ID_MAP ? JSON.parse(WALMART_OFFER_ID_MAP) : {};
  } catch (err) {
    console.warn('Failed to parse WALMART_OFFER_ID_MAP – ensure it contains valid JSON.');
    return {};
  }
}

/**
 * Obtain an OAuth access token from Walmart using the client
 * credentials grant.  See the Walmart I/O docs for required
 * parameters【751545410025271†screenshot】.
 *
 * Returns an access token string.
 */
async function getAccessToken() {
  if (!WALMART_CONSUMER_ID || !WALMART_CLIENT_SECRET) {
    throw new Error('Missing WALMART_CONSUMER_ID or WALMART_CLIENT_SECRET environment variable');
  }
  const tokenEndpoint = `${API_BASE}/identity/oauth/v1/token`;
  const headers = {
    'WM_CONSUMER.ID': WALMART_CONSUMER_ID,
    'Content-Type': 'application/x-www-form-urlencoded',
    'cache-control': 'no-cache',
  };
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: WALMART_CONSUMER_ID,
    client_secret: WALMART_CLIENT_SECRET,
  });
  const resp = await axios.post(tokenEndpoint, data, { headers });
  // Response fields may be named either access_token or accessToken
  return resp.data.accessToken || resp.data.access_token;
}

/**
 * Look up offerIds for a given item name.  Uses the
 * WALMART_OFFER_ID_MAP environment variable if present.  Returns an
 * array of offerIds (may be empty).
 */
function getOfferIds(itemName) {
  const mapping = parseOfferIdMap();
  const key = itemName.trim().toLowerCase();
  const ids = mapping[key];
  if (Array.isArray(ids)) {
    return ids;
  }
  return [];
}

/**
 * Call Walmart’s price availability API for the specified offerIds
 * and zipCode.  Returns the raw response.
 */
async function fetchPriceAvailability(offerIds, zipCode) {
  const token = await getAccessToken();
  const url = `${API_BASE}/affil/catalog-api/v2/product/items/price-availability/`;
  const headers = {
    'WM_CONSUMER.ID': WALMART_CONSUMER_ID,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const body = {
    offerIds,
    // Provide zipCode if available; storeIds could also be used
    ...(zipCode ? { zipCode } : {}),
  };
  const resp = await axios.post(url, body, { headers });
  return resp.data;
}

/**
 * Main search function called by the API route.  Given an item name
 * and zipCode, it looks up offerIds via the environment mapping,
 * queries the Walmart price API, and transforms the results into a
 * normalized array of price objects.  If no offerIds are found the
 * returned array will be empty.
 */
async function searchProducts(itemName, zipCode) {
  const offerIds = getOfferIds(itemName);
  if (offerIds.length === 0) {
    // No mapping – skip Walmart for this item
    return [];
  }
  try {
    const data = await fetchPriceAvailability(offerIds, zipCode);
    const result = [];
    // Normalization: each item in response may include currentPrice and availability
    if (Array.isArray(data.items)) {
      data.items.forEach((it) => {
        const priceObj = {
          store: 'Walmart',
          name: it.itemName || itemName,
          unit: it.unitOfMeasure || '',
          price: it.currentPrice?.currentValue?.currencyAmount ?? null,
          unitPrice: it.currentPrice?.unitValue?.currencyAmount ?? null,
          currency: it.currentPrice?.currencyCode || 'USD',
          availability: it.availabilityStatus || '',
        };
        result.push(priceObj);
      });
    }
    return result;
  } catch (error) {
    console.error('Error calling Walmart API:', error.message);
    return [];
  }
}

module.exports = {
  searchProducts,
};