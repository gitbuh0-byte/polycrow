import { DollarSign, Bitcoin, Hash, Coins } from "lucide-react";
import React from "react";

export const currencies = [
  { id: "USD", label: "USD", symbol: "$", icon: DollarSign, color: "text-blue-500" },
  { id: "BTC", label: "Bitcoin", symbol: "₿", icon: Bitcoin, color: "text-amber-500" },
  { id: "ETH", label: "Ethereum", symbol: "Ξ", icon: Hash, color: "text-indigo-500" },
  { id: "USDC", label: "USDC", symbol: "₵", icon: Coins, color: "text-blue-400" },
  { id: "USDT", label: "USDT", symbol: "₮", icon: Coins, color: "text-emerald-500" },
  { id: "SOL", label: "Solana", symbol: "S", icon: Hash, color: "text-purple-500" },
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
