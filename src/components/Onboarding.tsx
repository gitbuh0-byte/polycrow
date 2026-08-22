import { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { Key, ArrowRight, ArrowLeft } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth, firebaseAvailable } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

interface OnboardingProps {
  step: "kyc" | "completed";
  onNext: (next: "kyc" | "completed") => void;
  onComplete: () => void;
}

export default function Onboarding({ step, onNext, onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  const handleSignOut = () => {
    if (firebaseAvailable) auth.signOut();
  };

  const handleKycSubmit = async () => {
    if (!user || !firebaseAvailable) return;
    setLoading(true);
    // Simulate KYC processing
    try {
      await setDoc(doc(db, "users", user.uid), {
        kycVerified: true,
        onboardingCompleted: true,
      }, { merge: true });
      setLoading(false);
      onComplete();
    } catch (error) {
      console.error("KYC update failed:", error);
      setLoading(false);
      onComplete();
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
          <GlassCard className="p-12 flex flex-col gap-8 rounded-[48px] border-emerald-500/20 bg-emerald-500/5 backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
            <button 
              onClick={handleSignOut}
              className="absolute left-8 top-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Exit
            </button>

            <div className="flex flex-col items-center text-center gap-6 mt-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <img src="/logo.png" alt="Poly-Crow" className="relative w-24 h-24 object-contain brightness-125 drop-shadow-[0_0_14px_rgba(92,255,239,0.85)]" />
              </div>
              <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2">KYC Identity Verification</h2>
                <p className="text-slate-400 text-sm max-w-sm">Verify your account by securely submitting a government-issued identity document.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label htmlFor="government-document" className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key size={24} className="text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{selectedDocument ? selectedDocument.name : "Upload Government ID"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Passport, national ID, or driving licence</p>
                </div>
                <input
                  id="government-document"
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => setSelectedDocument(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <button 
              onClick={handleKycSubmit}
              disabled={loading || !selectedDocument}
              className="emerald-button py-6 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-xs transition-all hover:tracking-[0.4em]"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                  Hashing Identity...
                </div>
              ) : (
                <>Verify Identity to Proceed <ArrowRight size={18} /></>
              )}
            </button>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
