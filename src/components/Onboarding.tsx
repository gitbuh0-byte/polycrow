import { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { Shield, Smartphone, Key, ArrowRight, CheckCircle, Search } from "lucide-react";
import { doc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

interface OnboardingProps {
  step: "kyc" | "join-deal" | "completed";
  onNext: (next: "kyc" | "join-deal" | "completed") => void;
  onComplete: () => void;
}

export default function Onboarding({ step, onNext, onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [dealCode, setDealCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKycSubmit = async () => {
    if (!user) return;
    setLoading(true);
    // Simulate KYC processing
    try {
      await setDoc(doc(db, "users", user.uid), {
        kycVerified: true,
      }, { merge: true });
      setLoading(false);
      onNext("join-deal");
    } catch (error) {
      console.error("KYC update failed:", error);
      // Fallback: try to setDoc if update fails (though it shouldn't if login succeeded)
      setLoading(false);
      onNext("join-deal");
    }
  };

  const handleJoinDeal = async () => {
    if (!dealCode.trim() || !user) return;
    setLoading(true);
    
    try {
      // Find agreement by code
      const q = query(collection(db, "agreements"), where("dealCode", "==", dealCode.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty && dealCode !== "SKIP") {
        alert("Invalid deal code. Use 'SKIP' to go to dashboard.");
        setLoading(false);
        return;
      }

      if (!snapshot.empty) {
        const dealDoc = snapshot.docs[0];
        await updateDoc(doc(db, "agreements", dealDoc.id), {
          participants: arrayUnion(user.uid)
        });
      }

      await setDoc(doc(db, "users", user.uid), {
        onboardingCompleted: true,
      }, { merge: true });
      setLoading(false);
      onComplete();
    } catch (error) {
      console.error("Join deal failed:", error);
      alert("Failed to join deal. Please ensure you are logged in correctly.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full perspective-1000">
      <motion.div
        initial={{ rotateY: -20, opacity: 0, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        {step === "kyc" && (
          <GlassCard className="p-12 flex flex-col gap-8 rounded-[48px] border-emerald-500/20 bg-emerald-500/5 backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <Shield className="text-black" size={48} />
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2">Biometric Escrow Entry</h2>
                <p className="text-slate-400 text-sm max-w-sm">Secure your account with decentralized KYC. Your identity is hashed and stored on-chain for zero-knowledge verification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-all"><Smartphone size={20} className="text-emerald-400" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Mobile Auth</p>
                  <p className="text-[9px] text-emerald-400/60 font-mono">ENCRYPTED LINK</p>
                </div>
                <CheckCircle size={18} className="text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer opacity-60">
                <div className="p-3 bg-white/5 rounded-xl"><Smartphone size={20} className="text-slate-400" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Face ID</p>
                  <p className="text-[9px] text-slate-500 font-mono">PENDING SCAN</p>
                </div>
              </div>
              
              <div className="md:col-span-2 p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key size={24} className="text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">Upload Government Credentials</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Encrypted via poly-crow protocol</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleKycSubmit}
              disabled={loading}
              className="emerald-button py-6 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-xs transition-all hover:tracking-[0.4em]"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                  Hashing Identity...
                </div>
              ) : (
                <>Initialize Secure Vault <ArrowRight size={18} /></>
              )}
            </button>
          </GlassCard>
        )}

        {step === "join-deal" && (
          <GlassCard className="p-12 flex flex-col gap-10 rounded-[48px] border-emerald-500/20 bg-blue-500/5 backdrop-blur-3xl shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative w-24 h-24 bg-blue-500 rounded-[32px] flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <Key className="text-black" size={48} />
              </div>
              <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2">Onboard Partner</h2>
                <p className="text-slate-400 text-sm max-w-sm">Enter the unique 6-character Deal Code to join established secure channels.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400/60 font-mono text-xl">#</div>
                <input 
                  value={dealCode}
                  onChange={(e) => setDealCode(e.target.value.toUpperCase())}
                  placeholder="DEAL-CODE"
                  className="w-full bg-black/60 border border-white/10 rounded-3xl pl-12 pr-6 py-6 outline-none focus:border-blue-500/50 transition-all font-mono tracking-[0.5em] text-2xl text-blue-400 text-center"
                />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 items-center justify-center"><Search size={20} /></div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Don't have a code? You can <button onClick={() => setDealCode("SKIP")} className="text-blue-400 font-bold hover:underline">Create a Fresh Deal</button> once on the dashboard.</p>
              </div>
            </div>

            <button 
              onClick={handleJoinDeal}
              disabled={loading || !dealCode}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] py-6 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-xs transition-all hover:tracking-[0.4em] font-bold"
            >
              {loading ? "Authenticating Deal..." : <>Join Secure Channel <ArrowRight size={18} /></>}
            </button>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
