import { DollarSign, Bitcoin, Hash, Coins, Smartphone, CreditCard } from "lucide-react";
import React from "react";

export const currencies = [
  { id: "USD", label: "USD", symbol: "$", icon: DollarSign, color: "text-blue-500", type: "fiat" },
  { id: "EUR", label: "EUR", symbol: "€", icon: DollarSign, color: "text-blue-600", type: "fiat" },
  { id: "GBP", label: "GBP", symbol: "£", icon: DollarSign, color: "text-emerald-600", type: "fiat" },
  { id: "KES", label: "KES", symbol: "KSh", icon: DollarSign, color: "text-emerald-500", type: "fiat" },
  { id: "NGN", label: "NGN", symbol: "₦", icon: DollarSign, color: "text-green-600", type: "fiat" },
  { id: "MXN", label: "MXN", symbol: "$", icon: DollarSign, color: "text-red-600", type: "fiat" },
  { id: "ZAR", label: "ZAR", symbol: "R", icon: DollarSign, color: "text-blue-700", type: "fiat" },
  { id: "GHS", label: "GHS", symbol: "GH₵", icon: DollarSign, color: "text-amber-600", type: "fiat" },
  { id: "BTC", label: "Bitcoin", symbol: "₿", icon: Bitcoin, color: "text-amber-500", type: "crypto", chains: ["Native", "SegWit", "Taproot", "Lightning"] },
  { id: "ETH", label: "Ethereum", symbol: "Ξ", icon: Hash, color: "text-indigo-500", type: "crypto", chains: ["ERC-20", "Arbitrum", "Optimism", "Base", "Polygon"] },
  { id: "USDC", label: "USDC", symbol: "₵", icon: Coins, color: "text-blue-400", type: "crypto", chains: ["ERC-20", "Solana", "Polygon", "Base", "Stellar"] },
  { id: "USDT", label: "USDT", symbol: "₮", icon: Coins, color: "text-emerald-500", type: "crypto", chains: ["TRC-20", "ERC-20", "Solana", "Polygon", "Arbitrum"] },
  { id: "SOL", label: "Solana", symbol: "S", icon: Hash, color: "text-purple-500", type: "crypto", chains: ["Native"] },
];

export const gateways = [
  { id: "MPESA", label: "M-Pesa", icon: Smartphone, color: "text-emerald-500", currencies: ["KES"] },
  { id: "AIRTEL", label: "Airtel Money", icon: Smartphone, color: "text-red-500", currencies: ["KES", "UGX", "GHS"] },
  { id: "MTN", label: "MTN MoMo", icon: Smartphone, color: "text-yellow-500", currencies: ["NGN", "GHS", "UGX"] },
  { id: "PAYSTACK", label: "Paystack", icon: CreditCard, color: "text-blue-600", currencies: ["NGN", "KES", "GHS", "ZAR", "USD"] },
  { id: "STRIPE", label: "Stripe", icon: CreditCard, color: "text-indigo-500", currencies: ["USD", "EUR", "GBP"] },
];

export const getCurrencyData = (id: string) => {
  return currencies.find(c => c.id === id) || currencies[0];
};

export const formatAmount = (amount: number | string, currencyId: string) => {
  const currency = getCurrencyData(currencyId);
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currencyId === "USD") {
    return `${currency.symbol}${val.toLocaleString()}`;
  }
  return `${val} ${currencyId}`;
};
