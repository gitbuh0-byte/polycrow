import { useTranslation } from "react-i18next";
import { GlassCard } from "../components/ui/GlassCard";
import React, { useState } from "react";
import { Shield, Clock, Users, DollarSign, Send, ArrowLeft, Bitcoin, Hash, Trash2, Coins } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { currencies, getCurrencyData } from "../lib/currencyUtils";

interface CreateAgreementProps {
  onCreated: () => void;
}

export default function CreateAgreement({ onCreated }: CreateAgreementProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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

  const currentCurrency = getCurrencyData(form.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + parseInt(form.duration));

      await addDoc(collection(db, "agreements"), {
        title: form.title,
        description: form.description,
        stakes: parseFloat(form.stakes),
        currency: form.currency,
        dealCode: generateDealCode(),
        participants: [user.uid], // Initially only creator
        invitedParticipants: [form.participantEmail],
        status: "pending",
        isFunded: { [user.uid]: true }, // Creator funds it immediately in this simulation
        timerEnd: expirationDate.toISOString(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      
      onCreated();
    } catch (error) {
      console.error("Error creating agreement:", error);
    } finally {
      setLoading(false);
    }
  };

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
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-4 mb-2 flex items-center gap-2">
                Payment Method / Asset Type
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 ml-2">
                  <currentCurrency.icon size={12} className={currentCurrency.color} />
                  <span className="text-[9px] text-slate-900 dark:text-white capitalize">{currentCurrency.label}</span>
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {currencies.map((currency) => (
                  <button 
                    key={currency.id}
                    type="button"
                    onClick={() => setForm({...form, currency: currency.id})}
                    className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all ${
                      form.currency === currency.id 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                      : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400"
                    }`}
                  >
                    <currency.icon size={20} className={form.currency === currency.id ? currency.color : "text-slate-400"} />
                    <span className="text-[10px] font-bold">{currency.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-4 mb-2 flex items-center gap-2">
                {t("stakes")} ({form.currency})
                <currentCurrency.icon size={14} className={currentCurrency.color} />
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
              <p className="text-[10px] text-slate-400 mt-2 ml-4">
                Selected: <span className="font-bold text-slate-900 dark:text-white">{currentCurrency.label} ({form.currency})</span>
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
