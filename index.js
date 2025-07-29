// index.js
const express = require('express');
const cors = require('cors');
const krogerFetcher = require('./krogerFetcher');
const walmartFetcher = require('./walmartFetcher');

const app = express();
app.use(cors());

// Health‑check
app.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

// Location lookup
app.get('/api/locations', async (req, res) => {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: 'Missing zip query parameter' });
  try {
    const locations = await krogerFetcher.getLocations(zip);
    res.json({ zip, locations });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to fetch locations', details: err.message });
  }
});

// Price lookup
app.get('/api/prices', async (req, res) => {
  const { item, zip } = req.query;
  if (!item) return res.status(400).json({ error: 'Missing item query parameter' });
  try {
    // First get your Kroger data
    const krogerData = await krogerFetcher.searchProducts(item, zip);
    // Then Walmart (if configured)
    const walmartData = await walmartFetcher(item, zip);
    res.json({ item, zip: zip || null, prices: [...krogerData, ...walmartData] });
  } catch (err) {
    console.error('Error retrieving prices:', err);
    res.status(500).json({ error: 'Failed to retrieve prices', details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
