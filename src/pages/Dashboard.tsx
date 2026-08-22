import { useTranslation } from "react-i18next";
import { GlassCard } from "../components/ui/GlassCard";
import { Plus, Clock, Users, ArrowUpRight, TrendingUp, AlertTriangle, Trash2, MessageCircle, User as UserIcon, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, or, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { formatAmount, getCurrencyData } from "../lib/currencyUtils";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import { getUSDExchangeRates, ExchangeRates, convertToUSD } from "../lib/marketRates";

interface DashboardProps {
  onSelectAgreement: (id: string) => void;
  onCreateAgreement: () => void;
  onVerifyAccount: () => void;
}

export default function Dashboard({ onSelectAgreement, onCreateAgreement, onVerifyAccount }: DashboardProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  const calculateTargetDate = (agreement: any) => {
    if (agreement.status === "pending" && agreement.createdAt) {
      // Pending state expires in 10 minutes from creation
      const createdAt = agreement.createdAt.toDate ? agreement.createdAt.toDate() : new Date(agreement.createdAt);
      return new Date(createdAt.getTime() + 10 * 60 * 1000);
    }
    
    // For active or other states, use the stored timerEnd
    if (agreement.timerEnd) {
      return new Date(agreement.timerEnd);
    }

    // Fallback mock
    return new Date(Date.now() + 48 * 60 * 60000);
  };

  const handleDeleteDeal = async (id: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "agreements", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    getUSDExchangeRates().then(setRates);

    const q = query(
      collection(db, "agreements"),
      or(
        where("participants", "array-contains", user.uid),
        where("invitedParticipants", "array-contains", user.email)
      )
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const agreementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgreements(agreementsData);
      setLoading(false);

      // Auto-cleanup expired agreements
      agreementsData.forEach(async (agreement: any) => {
        const expiryTime = calculateTargetDate(agreement).getTime();
        if (Date.now() > expiryTime) {
          if (agreement.status === "pending") {
             console.log(`Auto-deleting expired pending agreement: ${agreement.id}`);
             await deleteDoc(doc(db, "agreements", agreement.id));
          } else if (agreement.status === "active") {
             console.log(`Auto-completing expired active agreement: ${agreement.id}`);
             await updateDoc(doc(db, "agreements", agreement.id), {
               status: "completed",
               completedAt: serverTimestamp()
             });
          }
        }
      });
    }, (error) => {
      console.error("Dashboard Snapshot error:", error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const stats = {
    activeEscrow: agreements
      .filter(a => a.status === "active")
      .reduce((sum, a) => sum + (a.stakes || 0), 0),
    successfulDeals: agreements.filter(a => a.status === "completed").length,
    slashedDeals: agreements.filter(a => a.status === "slashed").length
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white">{t("welcome")}</h2>
        <p className="text-slate-500 dark:text-white/40 max-w-lg">Monitor your secure agreements and manage your high-stakes escrow participation in real-time.</p>
      </div>

      {!profile?.kycVerified && (
        <GlassCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[10px] bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Verify your account</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete verification before creating or funding deals.</p>
            </div>
          </div>
          <button onClick={onVerifyAccount} className="poly-button-primary px-5 py-3 text-xs uppercase tracking-widest whitespace-nowrap">
            Verify account <ArrowUpRight size={15} />
          </button>
        </GlassCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col gap-4 border-none bg-gradient-to-br from-emerald-500/20 to-blue-500/10">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 py-1 px-3 bg-emerald-500/10 rounded-full">Active Status</span>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest">{t("escrow_active")}</p>
            <p className="text-4xl font-display font-bold text-slate-900 dark:text-white">{formatAmount(stats.activeEscrow, "USD")}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 bg-white dark:bg-white/5 border-black/5 dark:border-white/5">
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 w-fit">
            <ArrowUpRight className="text-slate-500 dark:text-slate-400" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Successful</p>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stats.successfulDeals}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 bg-white dark:bg-white/5 border-black/5 dark:border-white/5">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 w-fit">
            <AlertTriangle className="text-red-500 dark:text-red-400" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest opacity-60">Slashed Deals</p>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stats.slashedDeals}</p>
          </div>
        </GlassCard>
      </div>

      {/* Recent Agreements Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{t("my_agreements")}</h3>
          <button className="text-xs text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            View Audit Logs <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <GlassCard key={i} className="h-48 animate-pulse bg-white/5 rounded-[32px]">
                <div />
              </GlassCard>
            ))
          ) : agreements.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4 border-2 border-dashed border-white/5 rounded-[32px]">
              <p className="text-slate-500 font-medium">No agreements found. Start one today.</p>
              <button 
                onClick={onCreateAgreement}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-black font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-400"
              >
                <Plus size={20} /> {t("create_agreement")}
              </button>
            </div>
          ) : agreements.map((agreement) => (
            <GlassCard 
              key={agreement.id} 
              className="group cursor-pointer bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-[32px] p-8 border border-black/5 dark:border-white/5"
              onClick={() => onSelectAgreement(agreement.id)}
            >
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full border ${
                    agreement.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    agreement.status === "pending" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-500 border-black/5 dark:border-white/10"
                  }`}>
                    {agreement.status}
                  </span>
                  <div className="flex -space-x-2">
                    {agreement.participants.map((p: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#05070a] flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {p.substring(0, 1).toUpperCase()}
                      </div>
                    ))}
                    {!agreement.isFunded?.[user?.uid] && agreement.status === "pending" && (
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-[#05070a] flex items-center justify-center text-[10px] font-bold text-rose-500 animate-pulse">
                        $!
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors truncate text-slate-900 dark:text-white">{agreement.title}</h4>
                    {agreement.createdBy === user?.uid && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm("Are you sure you want to delete this deal? Stakes will be returned if not active.")) {
                            handleDeleteDeal(agreement.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{agreement.description}</p>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${agreement.status === "active" ? "w-full bg-emerald-500" : "w-1/2 bg-blue-500 animate-pulse"}`} 
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {agreement.status === "active" ? "FULLY FUNDED" : "AWAITING DEPOSITS"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t("stakes")}</span>
                    <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                      {formatAmount(agreement.stakes, agreement.currency || "USD")}
                    </span>
                    {rates && agreement.currency !== "USD" && (
                      <span className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-widest">
                        ≈ ${convertToUSD(parseFloat(agreement.stakes), agreement.currency, rates).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </span>
                    )}
                  </div>
                  <CountdownTimer 
                    variant="compact" 
                    targetDate={calculateTargetDate(agreement)}
                    onExpire={agreement.status === "pending" ? () => handleDeleteDeal(agreement.id) : undefined}
                  />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Invites / Contacts Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Recent Contacts</h3>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Network Oversight</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agreements.length > 0 ? (
            Array.from(new Set(agreements.flatMap(a => [a.createdBy, ...(a.participants || [])]).filter(id => id && id !== user?.uid))).slice(0, 4).map((contactId: any) => (
              <GlassCard key={contactId} className="flex flex-col gap-4 p-6 hover:bg-slate-50 dark:hover:bg-white/10 transition-all border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <UserIcon size={24} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">Protocol Participant</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">UID: {contactId?.substring(0, 8)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => {
                        const relatedDeal = agreements.find(a => a.participants.includes(contactId) || a.createdBy === contactId);
                        if (relatedDeal) onSelectAgreement(relatedDeal.id);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                  >
                    <MessageCircle size={14} /> Chat
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                    Profile
                  </button>
                </div>
              </GlassCard>
            ))
          ) : (
            <div className="col-span-full p-10 border border-dashed border-black/5 dark:border-white/5 rounded-3xl text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">No active contacts in current secure network.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
