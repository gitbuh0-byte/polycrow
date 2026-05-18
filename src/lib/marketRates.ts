
export interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetched = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function getUSDExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (cachedRates && (now - lastFetched < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    // Attempt to fetch real fiat rates
    console.log("Fetching fiat rates...");
    const fiatResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!fiatResponse.ok) throw new Error("Fiat API failed");
    const fiatData = await fiatResponse.json();
    
    // Attempt to fetch real crypto rates
    console.log("Fetching crypto rates...");
    const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,solana&vs_currencies=usd');
    if (!cryptoResponse.ok) throw new Error("Crypto API failed");
    const cryptoData = await cryptoResponse.json();

    const rates: ExchangeRates = {
      ...fiatData.rates,
      BTC: 1 / cryptoData.bitcoin.usd,
      ETH: 1 / cryptoData.ethereum.usd,
      USDT: 1 / cryptoData.tether.usd,
      USDC: 1 / (cryptoData['usd-coin']?.usd || 1),
      SOL: 1 / cryptoData.solana.usd,
    };

    console.log("Rates updated successfully:", rates);

    // Mapping some custom IDs to standard ones if needed
    rates['MPESA'] = rates['KES'] || 130; // Fallback if KES not in data
    rates['AIRTEL'] = rates['KES'] || 130;
    rates['MTN'] = rates['UGX'] || 3800; // Simplified
    rates['PAYSTACK'] = rates['NGN'] || 1500;

    cachedRates = rates;
    lastFetched = now;
    return rates;
  } catch (error) {
    console.error("Failed to fetch market rates, using fallback", error);
    return {
      USD: 1,
      KES: 130,
      NGN: 1500,
      MXN: 17,
      ZAR: 19,
      BTC: 0.000015,
      ETH: 0.0003,
      USDT: 1,
      USDC: 1,
      SOL: 0.01,
      MPESA: 130,
      AIRTEL: 130,
      MTN: 3800,
      PAYSTACK: 1500
    };
  }
}

export function convertFromUSD(amount: number, targetCurrency: string, rates: ExchangeRates): number {
  const rate = rates[targetCurrency] || 1;
  return amount * rate;
}

export function convertToUSD(amount: number, fromCurrency: string, rates: ExchangeRates): number {
  const rate = rates[fromCurrency] || 1;
  return amount / rate;
}
