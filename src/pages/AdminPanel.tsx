import { GlassCard } from "../components/ui/GlassCard";
import { Users, ShieldCheck, Database, LayoutPanelLeft, MoreHorizontal, Activity, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { db, firebaseAvailable } from "../lib/firebase";

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [agreements, setAgreements] = useState<any[]>([]);

  useEffect(() => {
    if (!firebaseAvailable) return;

    const q = query(collection(db, "agreements"), limit(10));
    return onSnapshot(q, (snapshot) => {
      setAgreements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin Panel Agreements error:", error);
    });
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-display font-bold">Admin Command</h2>
          <p className="text-white/40">Real-time platform oversight and escrow intervention console.</p>
        </div>
        <button 
          onClick={onExit}
          className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-500/20 transition-all"
        >
          Exit Secure Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Users, label: "Total Users", val: "1,240", delta: "+4.2%" },
          { icon: Activity, label: "Volume", val: "$428k", delta: "+18%" },
          { icon: ShieldCheck, label: "Active Escrows", val: "156", delta: "-2%" },
          { icon: AlertCircle, label: "Disputes", val: "3", delta: "+1" },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                {(() => {
                  const StatIcon = stat.icon;
                  return <StatIcon size={20} className="text-white/60" />;
                })()}
              </div>
              <span className="text-[10px] font-bold text-green-400">{stat.delta}</span>
            </div>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-display font-bold">{stat.val}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="overflow-hidden p-0 border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <LayoutPanelLeft size={20} className="text-indigo-400" /> Recent System Activity
          </h3>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <MoreHorizontal size={20} className="text-white/40" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] uppercase font-bold text-white/40 tracking-widest">
                <th className="px-6 py-4">Agreement ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Stakes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-white/40">#{agreement.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-bold">{agreement.title}</td>
                  <td className="px-6 py-4 text-sm">${agreement.stakes}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      {agreement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      INTERVENE
                    </button>
                  </td>
                </tr>
              ))}
              {agreements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/20">No active system logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
