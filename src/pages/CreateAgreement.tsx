import { useTranslation } from "react-i18next";
import { GlassCard } from "../components/ui/GlassCard";
import React, { useState } from "react";
import { Shield, Clock, Users, DollarSign, Send, ArrowLeft, Bitcoin, Hash, Trash2, Coins, CheckCircle2 } from "lucide-react";
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { currencies, getCurrencyData, formatAmount } from "../lib/currencyUtils";
import { CurrencyDropdown } from "../components/ui/CurrencyDropdown";
import { getUSDExchangeRates, ExchangeRates, convertToUSD, convertFromUSD } from "../lib/marketRates";

interface CreateAgreementProps {
  onCreated: () => void;
}

export default function CreateAgreement({ onCreated }: CreateAgreementProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [prevCurrency, setPrevCurrency] = useState("USD");
  const [form, setForm] = useState({
    title: "",
    description: "",
    stakes: "",
    duration: "24", // hours
    participantEmail: "",
    currency: "USD",
  });

  const generateDealCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const inviteLink = createdId ? `${window.location.origin}/?joinDeal=${createdId}` : "";
  const currentCurrency = getCurrencyData(form.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);
    
    try {
      const stakeNum = parseFloat(form.stakes);
      if (isNaN(stakeNum) || stakeNum <= 0) {
        alert("Please enter a valid stake amount greater than 0.");
        setLoading(false);
        return;
      }

      // Check balance
      const cid = form.currency;
      const currentBalance = Math.max(0, profile.balances?.[cid] || 0);

      if (currentBalance < (stakeNum - 0.00000001)) {
        alert(`Insufficient ${cid} balance. (Available: ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(cid) as any)?.type === "crypto" ? 8 : 2 })})`);
        setLoading(false);
        return;
      }

      // Deduct balance
      const updateData: any = {
        [`balances.${cid}`]: increment(-stakeNum)
      };

      await updateDoc(doc(db, "users", user.uid), updateData);

      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + parseInt(form.duration));

      const docRef = await addDoc(collection(db, "agreements"), {
        title: form.title,
        description: form.description,
        stakes: stakeNum,
        currency: form.currency,
        dealCode: generateDealCode(),
        participants: [user.uid], // Initially only creator
        invitedParticipants: [form.participantEmail],
        status: "pending",
        isFunded: { [user.uid]: true }, // Creator funded it
        timerEnd: expirationDate.toISOString(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // Add transaction record
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "escrow_lock",
        amount: stakeNum,
        asset: cid,
        agreementId: docRef.id,
        status: "completed",
        timestamp: serverTimestamp()
      });

      setCreatedId(docRef.id);
    } catch (error) {
      console.error("Error creating agreement:", error);
      alert("Failed to create agreement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getUSDExchangeRates().then(setRates);
  }, []);

  // Real-time conversion logic
  React.useEffect(() => {
    if (rates && form.stakes && form.currency !== prevCurrency) {
      if (prevCurrency === "USD") {
        const amountNum = parseFloat(form.stakes);
        if (!isNaN(amountNum)) {
          const newAmount = convertFromUSD(amountNum, form.currency, rates);
          setForm(prev => ({
            ...prev,
            stakes: newAmount.toLocaleString(undefined, { 
              maximumFractionDigits: (getCurrencyData(form.currency) as any)?.type === "crypto" ? 8 : 2,
              useGrouping: false 
            })
          }));
        }
      }
      setPrevCurrency(form.currency);
    }
  }, [form.currency, rates, form.stakes, prevCurrency]);

  if (createdId) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <CheckCircle2 size={48} className="text-black" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white">Escrow Initialized</h2>
          <p className="text-slate-500">The secure channel is open. Invite your partner to commit their stakes.</p>
        </div>

        <GlassCard className="w-full p-8 space-y-6">
          <div className="relative">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-4 mb-2 block text-left">Invitation Link</label>
            <div className="flex gap-2">
              <input 
                readOnly
                value={inviteLink}
                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-emerald-600 dark:text-emerald-400"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("Link copied to clipboard!");
                }}
                className="bg-emerald-500 text-black font-bold px-6 rounded-xl text-xs uppercase"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5 text-left">
                <span className="text-[8px] uppercase font-bold text-slate-500 block mb-1">Audit ID</span>
                <span className="text-xs font-mono text-slate-900 dark:text-white">#{createdId.substring(0, 8)}</span>
             </div>
             <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5 text-left">
                <span className="text-[8px] uppercase font-bold text-slate-500 block mb-1">Invited Partner</span>
                <span className="text-xs font-medium text-slate-900 dark:text-white truncate block">{form.participantEmail}</span>
             </div>
          </div>
        </GlassCard>

        <button 
          onClick={onCreated}
          className="text-emerald-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all"
        >
          Return to Dashboard <ArrowLeft size={16} className="rotate-180" />
        </button>
      </div>
    );
  }

  const stakeUSD = rates && form.stakes ? convertToUSD(parseFloat(form.stakes), form.currency, rates) : 0;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white">{t("create_agreement")}</h2>
        <p className="text-slate-500 dark:text-white/40">Define the terms, lock the stakes, and let the smart-escrow system handle the rest.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <GlassCard className="flex flex-col gap-8">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/40 ml-4 mb-2 block">{t("title")}</label>
              <input 
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Ex: Weekly Fitness Challenge"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-black/20 dark:focus:border-white/20 transition-all text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/40 ml-4 mb-2 block">Description</label>
              <textarea 
                required
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Detail the rules of the agreement..."
                rows={4}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-black/20 dark:focus:border-white/20 transition-all resize-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-4 mb-4 flex items-center justify-between">
                <span>Payment Method / Asset Type</span>
                <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
                  <button 
                    type="button"
                    onClick={() => {
                      const firstFiat = currencies.find(c => (c as any).type === "fiat")?.id || "USD";
                      setForm({...form, currency: firstFiat});
                    }}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${currencies.find(c => c.id === form.currency)?.type === "fiat" ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  >
                    Fiat
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const firstCrypto = currencies.find(c => (c as any).type === "crypto")?.id || "BTC";
                      setForm({...form, currency: firstCrypto});
                    }}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${currencies.find(c => c.id === form.currency)?.type === "crypto" ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  >
                    Crypto
                  </button>
                </div>
              </label>
              
              <CurrencyDropdown 
                type={currencies.find(c => c.id === form.currency)?.type as "fiat" | "crypto" || "fiat"}
                value={form.currency}
                onChange={(val) => setForm({...form, currency: val})}
                baseAmount={parseFloat(form.stakes) || 0}
              />
            </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-4 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t("stakes")} 
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 ml-1 text-slate-900 dark:text-white uppercase tracking-widest">
                      <currentCurrency.icon size={12} className={currentCurrency.color} />
                      {form.currency}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400">
                    Wallet: {(() => {
                      const cid = form.currency;
                      const fromBalances = profile?.balances?.[cid] || 0;
                      const bal = (cid === "BTC") ? (fromBalances + (profile?.balanceCrypto || 0)) : (cid === "USD" ? (fromBalances + (profile?.balance || 0)) : fromBalances);
                      
                      const isC = currencies.find(c => c.id === cid)?.type === 'crypto';
                      return isC 
                        ? `${bal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${cid}` 
                        : formatAmount(bal, cid);
                    })()}
                  </span>
                </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <currentCurrency.icon size={20} className={currentCurrency.color} />
                </div>
                <input 
                  required
                  type="number"
                  step="any"
                  value={form.stakes}
                  onChange={e => setForm({...form, stakes: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-emerald-500/30 transition-all font-mono text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 ml-4 flex items-center justify-between">
                <span>
                  Selected: 
                  <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/10 ml-2">
                    <currentCurrency.icon size={12} className={currentCurrency.color} />
                    {currentCurrency.label} ({form.currency})
                  </span>
                </span>
                {rates && form.currency !== "USD" && (
                   <span className="font-bold text-emerald-500">
                     ≈ ${stakeUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                   </span>
                )}
              </p>
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/40 ml-4 mb-2 block">Invite Participant (Email)</label>
            <div className="relative">
              <Users size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
              <input 
                required
                type="email"
                value={form.participantEmail}
                onChange={e => setForm({...form, participantEmail: e.target.value})}
                placeholder="partner@example.com"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-black/20 dark:focus:border-white/20 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-2 ml-4">They will receive an invitation to join the escrow.</p>
          </div>
        </GlassCard>

        <button 
          disabled={loading}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-display font-bold text-lg py-5 rounded-3xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20"
        >
          {loading ? "Processing..." : (
            <>
              <Shield size={20} />
              Commit to Escrow
            </>
          )}
        </button>
      </form>
    </div>
  );
}
