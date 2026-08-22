import React, { useState } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  ChevronRight, 
  Bitcoin, 
  DollarSign, 
  Smartphone, 
  Copy, 
  Check,
  Zap,
  ArrowRight,
  ArrowLeft,
  History,
  Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { currencies, gateways, formatAmount, getCurrencyData, CurrencyMark } from "../lib/currencyUtils";
import { CurrencyDropdown } from "../components/ui/CurrencyDropdown";
import { getUSDExchangeRates, ExchangeRates, convertFromUSD, convertToUSD } from "../lib/marketRates";

export default function Wallet() {
  const { profile, user } = useAuth();
  const [activeView, setActiveView] = useState<"overview" | "deposit" | "withdraw" | "convert" | "history">("overview");
  const [sourceAsset, setSourceAsset] = useState("BTC");
  const [targetAsset, setTargetAsset] = useState("USD");
  const [selectedAsset, setSelectedAsset] = useState("USD");
  const [selectedGateway, setSelectedGateway] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("Binance");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const getAssetBalance = (id: string) => {
    const total = profile?.balances?.[id] || 0;
    return Math.max(0, total);
  };

  const totals = React.useMemo(() => {
    if (!rates || !profile) return { fiat: 0, crypto: 0 };
    
    let fiatTotal = 0;
    let cryptoTotal = 0;

    currencies.forEach(c => {
      const bal = getAssetBalance(c.id);
      if (c.type === "fiat") {
        fiatTotal += convertToUSD(bal, c.id, rates);
      } else {
        // For total crypto, we'll keep it in BTC units for the main vault display
        const inUSD = convertToUSD(bal, c.id, rates);
        const btcPriceInUSD = 1 / (rates["BTC"] || 0.000015);
        cryptoTotal += inUSD / btcPriceInUSD;
      }
    });

    return { fiat: fiatTotal, crypto: cryptoTotal };
  }, [profile, rates]);

  React.useEffect(() => {
    getUSDExchangeRates().then(setRates);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Wallet Transactions History error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const assetData = getCurrencyData(selectedAsset);
  const isCrypto = (assetData as any)?.type === "crypto";
  const amountCurrency = activeView === "convert" ? sourceAsset : selectedAsset;

  const handleCopyAddress = (address?: string) => {
    const defaultAddr = selectedChain === "TRC-20" ? "TXYZ789abc456def7890" : 
                       selectedChain === "ERC-20" ? "0xABC123def4567890" : 
                       selectedAsset === "BTC" ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" :
                       "0xSOL789abc456def7890";
    navigator.clipboard.writeText(address || defaultAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async () => {
    if (!user || !amount) return;
    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        alert("Please enter a valid amount greater than 0.");
        setLoading(false);
        return;
      }

      const balancesField = `balances.${selectedAsset}`;
      const updateData: any = {
        [balancesField]: increment(activeView === "withdraw" ? -amountNum : amountNum)
      };

      // Sync legacy fields for USD/BTC
      if (selectedAsset === "USD") {
        updateData["balance"] = increment(activeView === "withdraw" ? -amountNum : amountNum);
      } else if (selectedAsset === "BTC") {
        updateData["balanceCrypto"] = increment(activeView === "withdraw" ? -amountNum : amountNum);
      }
      
      if (activeView === "withdraw") {
        const currentBalance = getAssetBalance(selectedAsset);
        if (currentBalance < (amountNum - 0.00000001)) {
          alert(`Insufficient ${selectedAsset} balance for withdrawal. (Available: ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: isCrypto ? 8 : 2 })})`);
          setLoading(false);
          return;
        }
        await updateDoc(doc(db, "users", user.uid), updateData);

        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          type: "withdrawal",
          amount: amountNum,
          asset: selectedAsset,
          destination: destinationAddress || selectedGateway || "System Withdrawal",
          status: "completed",
          timestamp: serverTimestamp()
        });

        alert(`Successfully initiated ${activeView} of ${amount} ${selectedAsset} to ${destinationAddress || selectedGateway || "selected destination"}`);
      } else {
        await updateDoc(doc(db, "users", user.uid), updateData);

        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          type: "deposit",
          amount: amountNum,
          asset: selectedAsset,
          source: selectedGateway || "Direct Deposit",
          status: "completed",
          timestamp: serverTimestamp()
        });

        alert(`Successfully processed ${activeView} of ${amount} ${selectedAsset}`);
      }
      
      setActiveView("overview");
      setAmount("");
      setDestinationAddress("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!user || !amount || !rates) return;
    setLoading(true);
    
    const amountToConvert = parseFloat(amount);
    if (isNaN(amountToConvert) || amountToConvert <= 0) {
      alert("Please enter a valid amount greater than 0.");
      setLoading(false);
      return;
    }

    const sourceBalance = getAssetBalance(sourceAsset);

    if (sourceBalance < (amountToConvert - 0.00000001)) {
      alert(`Insufficient ${sourceAsset} balance for conversion. (Available: ${sourceBalance.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(sourceAsset) as any)?.type === "crypto" ? 8 : 2 })})`);
      setLoading(false);
      return;
    }

    try {
      const inUSD = convertToUSD(amountToConvert, sourceAsset, rates);
      const targetAmount = convertFromUSD(inUSD, targetAsset, rates);

      // 0.5% fee
      const targetAmountAfterFee = targetAmount * 0.995;
      
      const updateData: any = {
        [`balances.${sourceAsset}`]: increment(-amountToConvert),
        [`balances.${targetAsset}`]: increment(targetAmountAfterFee)
      };

      // Sync legacy fields
      if (sourceAsset === "USD") updateData["balance"] = increment(-amountToConvert);
      if (targetAsset === "USD") updateData["balance"] = increment(targetAmountAfterFee);
      if (sourceAsset === "BTC") updateData["balanceCrypto"] = increment(-amountToConvert);
      if (targetAsset === "BTC") updateData["balanceCrypto"] = increment(targetAmountAfterFee);

      await updateDoc(doc(db, "users", user.uid), updateData);

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "swap",
        sourceAmount: amountToConvert,
        sourceAsset: sourceAsset,
        targetAmount: targetAmountAfterFee,
        targetAsset: targetAsset,
        fee: targetAmount * 0.005,
        status: "completed",
        timestamp: serverTimestamp()
      });

      alert(`Successfully swapped ${amountToConvert} ${sourceAsset} for ${targetAmountAfterFee.toLocaleString()} ${targetAsset} (0.5% fee applied)`);
      setActiveView("overview");
      setAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-7 sm:gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">Financial Hub</h2>
          <p className="text-slate-500 dark:text-white/40">Manage your liquidity across fiat and digital asset classes.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 w-full md:w-auto">
          <div className="hidden sm:flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Market Rates
             </div>
             <p className="text-[10px] text-slate-500 font-mono">
               1 BTC = ${(1 / (rates?.BTC || 0.000015)).toLocaleString()} USD
             </p>
          </div>
          <button 
            onClick={() => setActiveView("history")}
            className="wallet-toolbar-action flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[10px] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-300"
          >
            <History size={16} className="shrink-0" /> <span className="truncate">Transaction History</span>
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))}
            className="wallet-toolbar-action flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[10px] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={16} className="shrink-0" /> <span className="truncate">Exit Hub</span>
          </button>
        </div>
      </div>

      {activeView === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
            {/* Fiat Wallet */}
            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 p-4 sm:p-8 flex flex-col gap-7 sm:gap-10">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <WalletIcon className="text-black" size={24} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Fiat Treasury</span>
              </div>
              
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Fiat Value (USD)</p>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white break-words">
                  {formatAmount(totals.fiat, "USD")}
                </h3>
                {profile?.balances && Object.keys(profile.balances).some(k => getCurrencyData(k).type === "fiat" && k !== "USD" && profile.balances[k] > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(profile.balances)
                      .filter(([k, v]) => getCurrencyData(k).type === "fiat" && (v as number) > 0)
                      .map(([k, v]) => (
                        <span key={k} className="text-[8px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md">
                          {v.toLocaleString()} {k}
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setSelectedAsset("USD");
                    setActiveView("deposit");
                  }}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  <ArrowDownLeft size={16} className="flex-shrink-0" /> <span className="truncate">Deposit</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedAsset("USD");
                    setActiveView("withdraw");
                  }}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest hover:bg-black/10 transition-all"
                >
                  <ArrowUpRight size={16} className="flex-shrink-0" /> <span className="truncate">Withdraw</span>
                </button>
              </div>
            </GlassCard>

            {/* Crypto Wallet */}
            <GlassCard className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 p-4 sm:p-8 flex flex-col gap-7 sm:gap-10">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                  <Bitcoin className="text-black" size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400">Digital Asset Vault</span>
                  <button 
                    onClick={() => handleCopyAddress()}
                    className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    bc1qxy...0wlh
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Aggregate Crypto Value</p>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white break-words">
                  {totals.crypto.toLocaleString(undefined, { maximumFractionDigits: 8 })} 
                  <span className="text-xl sm:text-2xl text-slate-400 font-sans ml-2">BTC</span>
                </h3>
                <p className="text-xs text-amber-600/60 dark:text-amber-400/60 mt-1 uppercase font-bold tracking-widest">≈ ${( totals.crypto * (1 / (rates?.BTC || 0.000015)) ).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
                
                {profile?.balances && Object.keys(profile.balances).some(k => getCurrencyData(k).type === "crypto" && k !== "BTC" && profile.balances[k] > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(profile.balances)
                      .filter(([k, v]) => getCurrencyData(k).type === "crypto" && (v as number) > 0)
                      .map(([k, v]) => (
                        <span key={k} className="text-[8px] font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md">
                          {(v as number).toLocaleString(undefined, { maximumFractionDigits: 4 })} {k}
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setSelectedAsset("BTC");
                    setActiveView("deposit");
                  }}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all"
                >
                  <ArrowDownLeft size={16} className="flex-shrink-0" /> <span className="truncate">Deposit</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedAsset("BTC");
                    setActiveView("withdraw");
                  }}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest hover:bg-black/10 transition-all"
                >
                  <ArrowUpRight size={16} className="flex-shrink-0" /> <span className="truncate">Withdraw</span>
                </button>
                <button 
                  onClick={() => setActiveView("convert")}
                  className="col-span-2 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-widest hover:bg-amber-500/10 transition-all"
                >
                  <Repeat size={16} className="flex-shrink-0" /> <span className="truncate">Instant Liquidate to Fiat</span>
                </button>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {(activeView === "deposit" || activeView === "withdraw") && (
        <div className="max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
          <GlassCard className="p-10 flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveView("overview")} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeView} Funds</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Secure Gateway Processor</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-4 mb-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Select Asset</label>
                </div>
                <CurrencyDropdown 
                  type="all"
                  value={selectedAsset}
                  onChange={(val) => {
                    setSelectedAsset(val);
                    const data = getCurrencyData(val);
                    if ((data as any)?.chains?.length > 0) {
                      setSelectedChain((data as any).chains[0]);
                    } else {
                      setSelectedChain("");
                    }
                    // Filter gateways
                    const gateway = gateways.find(g => g.currencies.includes(val));
                    if (gateway) setSelectedGateway(gateway.id);
                  }}
                />
              </div>

              {!isCrypto && (activeView === "deposit" || activeView === "withdraw") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Payment Method / Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    {gateways
                      .filter(g => g.currencies.includes(selectedAsset))
                      .map(g => {
                        const GatewayIcon = g.icon;
                        return (
                        <button 
                          key={g.id}
                          onClick={() => setSelectedGateway(g.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selectedGateway === g.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400"}`}
                        >
                          <GatewayIcon size={18} className={selectedGateway === g.id ? g.color : ""} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{g.label}</span>
                        </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {isCrypto && (activeView === "deposit" || activeView === "withdraw") && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Select Source/Destination Platform</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Binance", "Noones", "Paxful", "Coinbase"].map(platform => (
                        <button 
                          key={platform}
                          onClick={() => setSelectedPlatform(platform)}
                          className={`py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${selectedPlatform === platform ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Select Network / Chain</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {assetData && (assetData as any).chains && (assetData as any).chains.map((chain: string) => (
                        <button 
                          key={chain}
                          onClick={() => setSelectedChain(chain)}
                          className={`py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${selectedChain === chain ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                        >
                          {chain}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeView === "deposit" ? (
                    selectedChain && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4">
                         <div className="flex flex-col gap-1 overflow-hidden">
                            <span className="text-[8px] uppercase font-bold text-emerald-500">Your {selectedAsset} Address ({selectedChain})</span>
                            <span className="text-xs font-mono text-slate-900 dark:text-white truncate">
                              {selectedChain === "TRC-20" ? "TXYZ789abc456def7890" : 
                               selectedChain === "ERC-20" ? "0xABC123def4567890" : 
                               selectedAsset === "BTC" ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" :
                               "0xSOL789abc456def7890"}
                            </span>
                         </div>
                         <button 
                           type="button"
                           onClick={() => handleCopyAddress()}
                           className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex-shrink-0"
                         >
                           {copied ? <Check size={16} /> : <Copy size={16} />}
                         </button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Recipient {selectedAsset} Address</label>
                      <input 
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder={`Paste recipient's ${selectedAsset} (${selectedChain}) address`}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-emerald-500/30 font-mono text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">
                  Enter Amount {activeView === "withdraw" && `(Balance: ${getAssetBalance(selectedAsset).toLocaleString(undefined, { maximumFractionDigits: isCrypto ? 8 : 2 })})`}
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 z-10 min-w-[3rem] flex items-center pointer-events-none">
                    <CurrencyMark currencyId={amountCurrency} size={18} className={getCurrencyData(amountCurrency).color} />
                  </div>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-5 pl-24 pr-6 outline-none focus:border-emerald-500/30 font-mono text-lg text-slate-900 dark:text-white relative"
                  />
                </div>
              </div>

              <button 
                onClick={handleAction}
                disabled={loading || !amount || (activeView === "withdraw" && isCrypto && !destinationAddress)}
                className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all uppercase tracking-widest text-sm"
              >
                {loading ? "Initializing Transaction..." : `Confirm ${activeView}`}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {activeView === "convert" && (
        <div className="max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
          <GlassCard className="p-10 flex flex-col gap-10">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveView("overview")} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Convert Assets</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Instant Market Swap</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Source Asset (Choose any)</label>
                <CurrencyDropdown 
                  type="all"
                  value={sourceAsset}
                  onChange={setSourceAsset}
                />
              </div>

              <div className="p-8 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 relative">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">You Pay / Liquidate</span>
                <div className="flex items-center justify-between">
                  <input 
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white w-full outline-none"
                  />
                  <div className="flex items-center gap-3 px-4 py-2 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/10">
                    {(() => {
                      const data = getCurrencyData(sourceAsset);
                      if (!data) return null;
                      const Icon = data.icon;
                      return <Icon size={20} className={data.color} />;
                    })()}
                    <span className="font-bold">{sourceAsset}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Balance: {getAssetBalance(sourceAsset).toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(sourceAsset) as any)?.type === "crypto" ? 8 : 2 })} {sourceAsset}
                  </div>
                  {rates && (
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      1 {sourceAsset} ≈ ${(1 / rates[sourceAsset]).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center -my-6 relative z-10">
                <button 
                   onClick={() => {
                     const temp = sourceAsset;
                     setSourceAsset(targetAsset);
                     setTargetAsset(temp);
                   }}
                   className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border-4 border-[#f8fafc] dark:border-[#05070a] flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all text-emerald-500"
                >
                  <Repeat size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Target Asset (Choose any)</label>
                <CurrencyDropdown 
                  type="all"
                  value={targetAsset}
                  onChange={setTargetAsset}
                />
              </div>

              <div className="p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 relative">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 block">You Receive (EST)</span>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white break-words overflow-hidden">
                    {(() => {
                      if (!rates || !amount) return "0.00";
                      const inUSD = convertToUSD(parseFloat(amount), sourceAsset, rates);
                      const received = convertFromUSD(inUSD, targetAsset, rates);
                      return received.toLocaleString(undefined, { maximumFractionDigits: 2 });
                    })()}
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    {(() => {
                      const data = getCurrencyData(targetAsset);
                      if (!data) return <DollarSign size={20} />;
                      const Icon = data.icon;
                      return <Icon size={20} className={data.color} />;
                    })()}
                    <span className="font-bold">{targetAsset}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  <Zap size={10} /> Slippage: 0.1% • Price Guaranteed 02s
                </div>
              </div>
            </div>

            <button 
              onClick={handleConvert}
              disabled={loading || !amount}
              className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all uppercase tracking-widest text-sm"
            >
              {loading ? "Finalizing Swap..." : "Confirm Exchange"}
            </button>
          </GlassCard>
        </div>
      )}
      {activeView === "history" && (
        <div className="max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveView("overview")}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Audit Logs & Ledger</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
               <Clock size={16} />
               <span className="text-xs font-bold uppercase tracking-widest">Live Updates</span>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date / Time</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset(s)</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                        No transactions found in your ledger.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-all group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {tx.timestamp?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {tx.timestamp?.toDate().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {tx.type === "deposit" && (
                              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <ArrowDownLeft size={14} />
                              </div>
                            )}
                            {tx.type === "withdrawal" && (
                              <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500">
                                <ArrowUpRight size={14} />
                              </div>
                            )}
                            {tx.type === "swap" && (
                              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                                <Repeat size={14} />
                              </div>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                              {tx.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {tx.type === "swap" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{tx.sourceAsset}</span>
                              <ArrowRight size={10} className="text-slate-400" />
                              <span className="text-xs font-bold text-emerald-500">{tx.targetAsset}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{tx.asset}</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          {tx.type === "swap" ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                {tx.targetAmount?.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(tx.targetAsset) as any)?.type === "crypto" ? 8 : 2 })}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                from {tx.sourceAmount?.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(tx.sourceAsset) as any)?.type === "crypto" ? 8 : 2 })}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-sm font-mono font-bold ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {tx.type === 'deposit' ? '+' : '-'}{tx.amount?.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(tx.asset) as any)?.type === "crypto" ? 8 : 2 })}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold uppercase tracking-widest rounded-lg border border-emerald-500/20">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
