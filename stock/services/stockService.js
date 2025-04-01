import axios from "axios";
export const getStockPrice = async (symbol, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
      );

      console.log(`API response for ${symbol}:`, response.data);

      if (!response.data || !response.data['Global Quote'] || !response.data['Global Quote']['05. price']) {
        throw new Error(`Invalid API response for ${symbol}`);
      }

      return parseFloat(response.data['Global Quote']['05. price']); 
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol}:`, error.message);

      if (i === retries - 1) {
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); 
    }
  }
};
