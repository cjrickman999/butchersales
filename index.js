require('dotenv').config();
const express = require('express');
const krogerFetcher = require('./krogerFetcher');
const walmartFetcher = require('./walmartFetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple root route
app.get('/', (req, res) => {
  res.json({ message: 'Butchersales API is running.' });
});

/*
 * GET /api/prices
 * Example query: /api/prices?item=ribeye&zip=80911
 *
 * This is a placeholder endpoint that returns a mock response.  
 * In the future, implement calls to each grocery store API here.  
 */
app.get('/api/prices', async (req, res) => {
  const { item, zip } = req.query;
  // Validate input
  if (!item) {
    return res.status(400).json({ error: 'Missing required query parameter: item' });
  }

  try {
    // Fetch Kroger results.  Pass a location ID via the KROGER_LOCATION_ID env
    // variable if you have one; otherwise pricing may be unavailable.
    const krogerLocationId = process.env.KROGER_LOCATION_ID;
    const krogerResults = await krogerFetcher.searchProducts(item, krogerLocationId, 5);

    // Convert to our unified format.  For now just pick the first result.
    const krogerEntry = krogerResults.length > 0 ? {
      store: 'kroger',
      price: krogerResults[0].price,
      promoPrice: krogerResults[0].promoPrice,
      unit: krogerResults[0].size,
      name: krogerResults[0].name
    } : {
      store: 'kroger',
      price: null,
      promoPrice: null,
      unit: null,
      name: null
    };

    // Fetch Walmart results.  If zip is provided, pass it along.  The
    // walmartFetcher will return an array of normalized price objects (may
    // be empty if no offerIds are mapped for this item).
    const walmartResults = await walmartFetcher.searchProducts(item, zip);
    const walmartEntries = walmartResults.map((r) => ({
      store: 'walmart',
      price: r.price,
      promoPrice: null,
      unit: r.unit,
      name: r.name,
    }));

    res.json({
      item,
      zip: zip || null,
      prices: [krogerEntry, ...walmartEntries],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve prices', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
