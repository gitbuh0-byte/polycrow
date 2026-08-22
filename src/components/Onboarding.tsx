import { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { Key, ArrowRight, ArrowLeft } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, firebaseAvailable } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

interface OnboardingProps {
  step: "kyc" | "completed";
  onBack: () => void;
  onComplete: () => void;
}

export default function Onboarding({ step, onBack, onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  const handleKycSubmit = async () => {
    if (!user || !firebaseAvailable || !selectedDocument) return;
    setLoading(true);
    try {
      const saveVerification = setDoc(doc(db, "users", user.uid), {
        kycVerified: true,
        onboardingCompleted: true,
      }, { merge: true });
      await Promise.race([
        saveVerification,
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Verification timed out")), 10000))
      ]);
      onComplete();
    } catch (error) {
      console.error("KYC update failed:", error);
      alert("Verification could not be completed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg px-1 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {step === "kyc" && (
          <GlassCard className="p-5 sm:p-8 flex flex-col gap-6 border-emerald-500/20 bg-emerald-500/5 backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
            <button 
              onClick={onBack}
              className="self-start p-2 bg-white/5 hover:bg-white/10 rounded-[10px] transition-all text-slate-400 hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Exit
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <img src="/logo.png" alt="Poly-Crow" className="relative w-16 h-16 object-contain brightness-125 drop-shadow-[0_0_14px_rgba(92,255,239,0.85)]" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">Verify your identity</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">Upload one government-issued document to unlock deal creation.</p>
              </div>
            </div>

            <label htmlFor="government-document" className="p-6 sm:p-8 border-2 border-dashed border-white/10 rounded-[10px] flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group text-center">
                <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Key size={24} className="text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white break-all">{selectedDocument ? selectedDocument.name : "Choose government ID"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">PDF, passport, national ID, or driving licence</p>
                </div>
                <input
                  id="government-document"
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => setSelectedDocument(event.target.files?.[0] || null)}
                />
            </label>

            <button 
              onClick={handleKycSubmit}
              disabled={loading || !selectedDocument}
              className="emerald-button py-6 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-xs transition-all hover:tracking-[0.4em]"
            >
              {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" /> Verifying...</> : <>Verify Identity to Proceed <ArrowRight size={18} /></>}
            </button>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
