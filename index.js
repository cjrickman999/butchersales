require('dotenv').config();
const express = require('express');
const axios = require('axios');

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
  // TODO: validate query params and fetch data from store APIs using helper functions
  // Example response format
  res.json({
    item: item || null,
    zip: zip || null,
    prices: [
      {
        store: 'kroger',
        price: null,
        unit: null,
        availability: null
      },
      {
        store: 'albertsons',
        price: null,
        unit: null,
        availability: null
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
