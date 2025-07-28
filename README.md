# Butchersales API

This is a basic Node.js/Express backend that will aggregate and return price data for meat and butcher‑counter items from multiple grocery stores.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and replace the placeholder values with your actual API credentials and preferred port number.

3. **Run the server locally**

   ```bash
   npm start
   ```

   The server will start on the port specified in your `.env` file (default is `3000`). Navigate to `http://localhost:3000/` to verify that it’s running.

## Adding Grocery Store Integrations

The current `/api/prices` endpoint returns a mock response. To integrate real data:

1. **Sign up for each store’s developer program** (e.g. Kroger, Albertsons, Walmart, Target, Sam’s Club, Costco) and obtain API keys or OAuth credentials.
2. **Create helper functions** in separate modules (e.g. `services/kroger.js`) that authenticate and fetch product prices from each API. Use `axios` for HTTP requests and handle pagination and rate limits according to each provider’s documentation.
3. **Parse and normalize responses** so each store returns the same fields (e.g. `store`, `price`, `unit`, `availability`).
4. **Update the `/api/prices` route** to call these helper functions concurrently, aggregate results, and return them in a single JSON response.
5. **Add error handling and caching** where appropriate.

Once the API is in place, your Next.js front‑end can fetch data from `/api/prices` and display price comparisons to end users.
