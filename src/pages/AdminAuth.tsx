import React, { useState } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { ShieldCheck, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AdminAuthProps {
  onBack: () => void;
  onLogin: (credentials: { email: string; pass: string }) => Promise<boolean>;
}

export default function AdminAuth({ onBack, onLogin }: AdminAuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const success = await onLogin({ email, pass: password });
      if (!success) {
        setError("Invalid administrative credentials.");
      }
    } catch (err) {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-red-500/5 rounded-full blur-[150px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Protocol</span>
        </button>

        <GlassCard className="p-10 border-red-500/20 bg-white/5">
          <div className="flex flex-col items-center gap-6 mb-10">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Admin Override</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Level 4 Clearance Required</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Admin Identifier</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@polycrow.protocol"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-red-500/30 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-red-500/30 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <button 
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Authorize Access"}
            </button>
          </form>
        </GlassCard>

        <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          All access attempts are logged and monitored.
        </p>
      </motion.div>
    </div>
  );
}
